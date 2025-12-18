const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const Stripe = require("stripe");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.use(cors({
  origin: ["https://app-romanclub.com", "http://localhost:5173", "http://localhost:3000"],
  credentials: true
}));

// IMPORTANT: on ne doit PAS parser en JSON la route /webhook (Stripe a besoin du RAW body)
// Donc on ajoute un middleware conditionnel :
app.use((req, res, next) => {
  if (req.originalUrl === "/webhook") {
    next();
  } else {
    express.json()(req, res, next);
  }
});

let db;
let usersCollection;

// Connexion MongoDB
async function connectDB() {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db("romanclub");
    usersCollection = db.collection("users");
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
}

connectDB();

app.get("/", (req, res) => {
  res.send("RomanClub backend is running");
});

app.get("/health", (req, res) => {
  if (db) {
    res.json({ status: "ok", db: "connected" });
  } else {
    res.status(500).json({ status: "error", db: "not connected" });
  }
});

// =======================
// LOGIN
// =======================
app.post("/login", async (req, res) => {
  const { email, pin } = req.body;

  if (!db) return res.status(500).json({ error: "Database not connected" });
  if (!email) return res.status(400).json({ error: "Email required" });

  try {
    const user = await usersCollection.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: "Identifiants invalides" });
    }

    if (user.lockUntil && user.lockUntil > new Date()) {
      const waitMinutes = Math.ceil((user.lockUntil - new Date()) / 60000);
      return res.status(403).json({
        success: false,
        message: `Compte temporairement bloqué. Réessayez dans ${waitMinutes} minutes.`,
      });
    }

    const validPin = user.pinHash && pin
      ? await bcrypt.compare(pin, user.pinHash)
      : false;

    if (!validPin) {
      const attempts = (user.failedLoginAttempts || 0) + 1;
      let updateDoc = { $set: { failedLoginAttempts: attempts } };

      if (attempts >= 5) {
        updateDoc.$set.lockUntil = new Date(Date.now() + 30 * 60 * 1000);
        updateDoc.$set.failedLoginAttempts = 0;
      }

      await usersCollection.updateOne({ email }, updateDoc);
      return res.status(401).json({ success: false, message: "Identifiants invalides" });
    }

    await usersCollection.updateOne(
      { email },
      { $set: { failedLoginAttempts: 0, lockUntil: null } }
    );

    const safeUser = { ...user };
    delete safeUser.pinHash;

    res.json({ success: true, user: safeUser });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// =======================
// REGISTER (INCHANGÉ)
/// =======================
// =======================
// REGISTER (STRIPE INTEGRE)
// =======================
app.post("/register", async (req, res) => {
  const userData = req.body; // Expects { ..., paymentMethodId, paymentMethodType }

  if (!db) return res.status(500).json({ error: "Database not connected" });
  if (!userData.email) return res.status(400).json({ error: "Email required" });

  try {
    // 1. Validation de base
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      return res.status(400).json({ success: false, message: "Format d'email invalide." });
    }

    const existingUser = await usersCollection.findOne({ email: userData.email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Cet email est déjà utilisé." });
    }

    if (!userData.pin || userData.pin.length < 4) {
      return res.status(400).json({ success: false, message: "Code PIN invalide (min 4 chiffres)." });
    }

    // 2. Logique Stripe (Bloquante)
    // On doit avoir un paymentMethodId venant du frontend
    if (!userData.paymentMethodId) {
      return res.status(400).json({ success: false, message: "Moyen de paiement manquant." });
    }

    // Déterminer le prix selon le pays
    let priceId;
    switch (userData.pays) {
      case "Suisse":
        priceId = process.env.STRIPE_PRICE_CHF;
        break;
      case "Canada":
        priceId = process.env.STRIPE_PRICE_CAD;
        break;
      default:
        priceId = process.env.STRIPE_PRICE_EUR;
    }

    // Création du Customer Stripe
    const customer = await stripe.customers.create({
      email: userData.email,
      name: `${userData.prenom} ${userData.nom}`,
      payment_method: userData.paymentMethodId,
      invoice_settings: {
        default_payment_method: userData.paymentMethodId,
      },
    });

    // Création de l'abonnement avec période d'essai
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      trial_end: Math.floor(new Date("2026-07-01").getTime() / 1000),
      expand: ['latest_invoice.payment_intent'],
    });

    // Si on arrive ici, Stripe a validé (sinon une erreur aurait été levée)

    // 3. Création User en base
    const pinHash = await bcrypt.hash(userData.pin, 10);

    const newUser = {
      ...userData,
      pinHash, // Store hash only
      pin: undefined,
      password: undefined,
      paymentMethodId: undefined, // Don't verify/store raw if not needed, we have stripe IDs now
      createdAt: new Date(),
      role: "user",

      // Stripe Data
      stripeCustomerId: customer.id,
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: "active", // Considéré actif car trial/validé
      subscriptionStart: "2026-07-01",
      paymentMethodSecurelyStored: true,

      welcomeGiftPending: true,
      failedLoginAttempts: 0,
      welcomeSeen: false // Init logic for welcome modal
    };

    const result = await usersCollection.insertOne(newUser);
    newUser._id = result.insertedId;
    delete newUser.pinHash;

    res.json({ success: true, user: newUser });

  } catch (error) {
    console.error("Registration/Stripe error:", error);
    // Gestion fine des erreurs Stripe
    if (error.type === 'StripeCardError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (error.raw && error.raw.message) {
      return res.status(400).json({ success: false, message: error.raw.message });
    }

    res.status(500).json({ success: false, message: "Erreur lors de l'inscription (Stripe ou Serveur)." });
  }
});

// =======================
// STRIPE WEBHOOK (ÉTAPE 3)
// =======================
app.post("/webhook", bodyParser.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("⚠️ Webhook signature verification failed.", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case "customer.subscription.created":
        // Update user status and save IDs
        const subscription = event.data.object;
        const stripeCustomerId = subscription.customer;
        const stripeSubscriptionId = subscription.id;

        // We need email to find user if stripeCustomerId is not yet saved
        // Retrieve customer from Stripe to get email
        const customer = await stripe.customers.retrieve(stripeCustomerId);
        const email = customer.email;

        if (email) {
          await usersCollection.updateOne(
            { email: email },
            {
              $set: {
                subscriptionStatus: "active",
                stripeCustomerId: stripeCustomerId,
                stripeSubscriptionId: stripeSubscriptionId,
                updatedAt: new Date()
              }
            }
          );
          console.log(`✅ User ${email} activated with Sub ID ${stripeSubscriptionId}`);
        }
        break;

      case "invoice.paid":
        // Update payment status
        const invoicePaid = event.data.object;
        await usersCollection.updateOne(
          { stripeCustomerId: invoicePaid.customer },
          {
            $set: {
              lastPaymentStatus: "paid",
              updatedAt: new Date()
            }
          }
        );
        console.log(`💰 Payment confirmed for Customer ${invoicePaid.customer}`);
        break;

      case "invoice.payment_failed":
        // Update status to payment_issue
        const invoiceFailed = event.data.object;
        await usersCollection.updateOne(
          { stripeCustomerId: invoiceFailed.customer },
          {
            $set: {
              subscriptionStatus: "payment_issue",
              updatedAt: new Date()
            }
          }
        );
        console.log(`❌ Payment failed for Customer ${invoiceFailed.customer}`);
        break;

      default:
        console.log(`ℹ️ Unhandled Stripe event: ${event.type}`);
    }
  } catch (err) {
    console.error("Webhook processing error:", err);
    // Don't fail the webhook response to Stripe, log it locally
  }

  res.json({ received: true });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
