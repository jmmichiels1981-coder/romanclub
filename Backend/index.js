const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const Stripe = require("stripe");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey_romanclub_2025"; // Fallback for dev

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

// Middleware d'authentification JWT
const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Authorization header required" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Token required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { userId, email, role }
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

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
// LOGIN (WITH JWT)
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

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role || "user" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ success: true, user: safeUser, token });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// =======================
// SETTINGS / USER ENDPOINTS (PROTECTED)
// =======================

// 1. GET User Data
app.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await usersCollection.findOne({ _id: new ObjectId(req.user.userId) });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Format data for frontend settings
    const userData = {
      prenom: user.prenom,
      nom: user.nom,
      email: user.email,
      dateInscription: user.createdAt, // Or format it if needed
      subscriptionStatus: user.subscriptionStatus || "active",
      paymentMethodType: user.paymentMethodType || "card",
      paymentMethodId: user.paymentMethodId,
      stripeCustomerId: user.stripeCustomerId
    };

    res.json(userData);
  } catch (error) {
    console.error("GET /me error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// 2. UPDATE Email
app.put("/me/email", requireAuth, async (req, res) => {
  const { newEmail } = req.body;
  if (!newEmail) return res.status(400).json({ error: "New email required" });

  try {
    const user = await usersCollection.findOne({ _id: new ObjectId(req.user.userId) });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Check if email already exists
    const existing = await usersCollection.findOne({ email: newEmail });
    if (existing) return res.status(400).json({ error: "Email already in use" });

    // Update Stripe Customer if exists
    if (user.stripeCustomerId) {
      await stripe.customers.update(user.stripeCustomerId, { email: newEmail });
    }

    // Update MongoDB
    await usersCollection.updateOne(
      { _id: user._id },
      { $set: { email: newEmail } }
    );

    res.json({ success: true, message: "Email updated successfully" });
  } catch (error) {
    console.error("Update email error:", error);
    res.status(500).json({ error: "Update failed" });
  }
});

// 3. GET Stripe Invoices
app.get("/billing/invoices", requireAuth, async (req, res) => {
  try {
    const user = await usersCollection.findOne({ _id: new ObjectId(req.user.userId) });
    if (!user || !user.stripeCustomerId) {
      return res.json({ invoices: [] }); // Or error if strict
    }

    // Fetch invoices from Stripe
    const invoices = await stripe.invoices.list({
      customer: user.stripeCustomerId,
      limit: 10,
    });

    // Format for frontend
    const formattedInvoices = invoices.data.map(inv => ({
      id: inv.id,
      date: inv.created, // timestamp
      amount: inv.total, // in cents
      currency: inv.currency,
      status: inv.status,
      pdf: inv.invoice_pdf
    }));

    res.json({ invoices: formattedInvoices });
  } catch (error) {
    console.error("Fetch invoices error:", error);
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
});

// 4. Create Setup Intent (for Payment Method Update)
app.post("/billing/create-setup-intent", requireAuth, async (req, res) => {
  try {
    const user = await usersCollection.findOne({ _id: new ObjectId(req.user.userId) });
    if (!user || !user.stripeCustomerId) return res.status(400).json({ error: "No customer ID" });

    const setupIntent = await stripe.setupIntents.create({
      customer: user.stripeCustomerId,
      payment_method_types: ['card', 'sepa_debit'],
    });

    res.json({ clientSecret: setupIntent.client_secret });
  } catch (error) {
    console.error("Create SetupIntent error:", error);
    res.status(500).json({ error: "Setup failed" });
  }
});

// 5. Finalize Update Payment Method
app.post("/billing/update-payment-method", requireAuth, async (req, res) => {
  const { paymentMethodId, paymentMethodType } = req.body;
  if (!paymentMethodId) return res.status(400).json({ error: "Payment Method ID required" });

  try {
    const user = await usersCollection.findOne({ _id: new ObjectId(req.user.userId) });
    if (!user || !user.stripeCustomerId) return res.status(400).json({ error: "User context invalid" });

    // Update Stripe Customer Default Payment Method
    await stripe.customers.update(user.stripeCustomerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    // Update MongoDB
    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          paymentMethodId: paymentMethodId,
          paymentMethodType: paymentMethodType || 'card',
          updatedAt: new Date()
        }
      }
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Update PM error:", error);
    res.status(500).json({ error: "Update failed" });
  }
});

// 6. Global Info (count books)
app.get("/books/count", requireAuth, async (req, res) => {
  try {
    // Assuming 'books' collection exists or using a dummy logic if not yet populated
    // If books collection doesn't exist, we can default to 0
    const booksCount = await db.collection("books").countDocuments({}) || 0;

    // For now, if 0, maybe return a hardcoded realistic number as placeholder if collection is empty 
    // but user requested "calculé côté backend".
    // We'll stick to actual count.

    res.json({ count: booksCount });
  } catch (error) {
    console.error("Count books error:", error);
    res.status(500).json({ error: "Error counting books" });
  }
});


// =======================
// STATIC FILES & SPA FALLBACK
// =======================
const path = require("path");

// Serve static files from the React frontend app
const frontendPath = path.join(__dirname, "../Frontend/dist");
app.use(express.static(frontendPath));

// API routes are defined above.
// Anything else that doesn't match an API route is sent to the React frontend.
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});


// =======================
// EXISTING ENDPOINTS (UNCHANGED LOGIC)
// =======================

// REGISTER (STRIPE INTEGRE)
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

// UPDATE WELCOME SEEN
app.post("/update-welcome", async (req, res) => {
  const { email } = req.body;

  if (!db) return res.status(500).json({ error: "Database not connected" });
  if (!email) return res.status(400).json({ error: "Email required" });

  try {
    await usersCollection.updateOne(
      { email },
      { $set: { welcomeSeen: true } }
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// CONTACT FORM
app.post("/contact", async (req, res) => {
  const contactData = req.body;

  // Simple validation
  if (!contactData.email || !contactData.message) {
    return res.status(400).json({ success: false, message: "Email et message requis" });
  }

  try {
    const messageDoc = {
      ...contactData,
      recipient: "contact@app-romanclub.com", // The requested recipient address
      createdAt: new Date(),
      status: "unread"
    };

    // Store in dedicated collection
    const contactsCollection = db.collection("contacts");
    await contactsCollection.insertOne(messageDoc);

    // Simulation d'envoi d'email
    console.log(`📩 Nouveau message contact reçu de ${contactData.email} pour contact@app-romanclub.com`);

    res.json({ success: true });
  } catch (error) {
    console.error("Contact error:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// STRIPE WEBHOOK
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
