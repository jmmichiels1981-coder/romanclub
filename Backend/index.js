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

app.use(cors());

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
app.post("/register", async (req, res) => {
  const userData = req.body;

  if (!db) return res.status(500).json({ error: "Database not connected" });
  if (!userData.email) return res.status(400).json({ error: "Email required" });

  try {
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

    const pinHash = await bcrypt.hash(userData.pin, 10);

    const newUser = {
      ...userData,
      pinHash,
      createdAt: new Date(),
      role: "user",
      subscriptionStatus: "pending",
      failedLoginAttempts: 0,
    };

    const result = await usersCollection.insertOne(newUser);
    newUser._id = result.insertedId;
    delete newUser.pinHash;

    res.json({ success: true, user: newUser });

  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// =======================
// UPDATE WELCOME SEEN
// =======================
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

// =======================
// STRIPE – CREATE SUBSCRIPTION (ÉTAPE 2)
// =======================
app.post("/create-subscription", async (req, res) => {
  const { email, country } = req.body;

  if (!email || !country) {
    return res.status(400).json({ error: "Email and country required" });
  }

  try {
    let priceId;
    switch (country) {
      case "Suisse":
        priceId = process.env.STRIPE_PRICE_CHF;
        break;
      case "Canada":
        priceId = process.env.STRIPE_PRICE_CAD;
        break;
      default:
        priceId = process.env.STRIPE_PRICE_EUR;
    }

    const customer = await stripe.customers.create({ email });

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      trial_end: Math.floor(new Date("2026-07-01").getTime() / 1000),
    });

    res.json({
      success: true,
      subscriptionId: subscription.id,
      customerId: customer.id,
    });

  } catch (error) {
    console.error("Stripe subscription error:", error);
    res.status(500).json({ error: "Stripe subscription failed" });
  }
});

// =======================
// STRIPE WEBHOOK (ÉTAPE 3)
// =======================
app.post("/webhook", bodyParser.raw({ type: "application/json" }), (req, res) => {
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

  switch (event.type) {
    case "customer.subscription.created":
      console.log("✅ Abonnement Stripe créé");
      break;

    case "invoice.paid":
      console.log("💰 Facture payée");
      break;

    case "invoice.payment_failed":
      console.log("❌ Paiement échoué");
      break;

    default:
      console.log(`ℹ️ Événement Stripe reçu : ${event.type}`);
  }

  res.json({ received: true });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
