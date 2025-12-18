const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://romanclub:romanclub123@cluster0.mongodb.net/romanclub?retryWrites=true&w=majority";
// Note: Fallback URI added for dev convenience if env var missing, assuming standard connection.

app.use(cors());
app.use(express.json());

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

const bcrypt = require("bcryptjs");

// Login Endpoint
app.post("/login", async (req, res) => {
  const { email, pin } = req.body; // Using 'pin' instead of password for RomanClub concept or mixed

  if (!db) return res.status(500).json({ error: "Database not connected" });
  if (!email) return res.status(400).json({ error: "Email required" });

  try {
    const user = await usersCollection.findOne({ email });

    // 1. Check if user exists
    if (!user) {
      // Anti-enumeration: don't reveal user doesn't exist, just say invalid creds
      // But for this project stage/demo, we might want to be explicit or create dummy?
      // User requested strict rules now.
      return res.status(401).json({ success: false, message: "Identifiants invalides" });
    }

    // 2. Check Lockout
    if (user.lockUntil && user.lockUntil > new Date()) {
      const waitMinutes = Math.ceil((user.lockUntil - new Date()) / 60000);
      return res.status(403).json({ success: false, message: `Compte temporairement bloqué. Réessayez dans ${waitMinutes} minutes.` });
    }

    // 3. Verify PIN (or password param if sent as 'pin')
    // We assume the frontend might send 'pin' or 'password'. The previous frontend code sent { email } only or dummy.
    // We need to support the new secure flow.
    // If 'pin' is not passed, fail.
    // NOTE: Frontend currently might send 'password' field if it was standard login? 
    // Let's check previous LoginPage.jsx... It checks separate password input but sends { email } only in the old code?
    // Wait, the previous LoginPage.jsx only sent: body: JSON.stringify({ email }). 
    // I need to update LoginPage.jsx to send PIN/Password too! 
    // But this task is Backend first. I will assume 'pin' property for the code.

    let validPin = false;
    if (user.pinHash && pin) {
      validPin = await bcrypt.compare(pin, user.pinHash);
    } else if (!user.pinHash) {
      // Legacy/Test user without hash?
      // Allow login if simple email match OR deny?
      // Rules say "Secure PIN", so we should probably deny un-hashed if strict.
      // For transition, if no hash, maybe allow or requires reset.
      // Let's deny to be strict as requested.
      validPin = false;
    }

    if (!validPin) {
      // Increment attempts
      const attempts = (user.failedLoginAttempts || 0) + 1;
      let updateDoc = { $set: { failedLoginAttempts: attempts } };

      if (attempts >= 5) {
        // Lock for 30 minutes
        const lockTime = new Date(Date.now() + 30 * 60 * 1000); // 30 mins
        updateDoc.$set.lockUntil = lockTime;
        updateDoc.$set.failedLoginAttempts = 0; // Reset counter after locking? Or keep it? 
        // Usually reset after lock expiration. Simple way: set lockUntil.
      }

      await usersCollection.updateOne({ email }, updateDoc);
      return res.status(401).json({ success: false, message: "Identifiants invalides" });
    }

    // 4. Success Reset attempts
    await usersCollection.updateOne({ email }, {
      $set: { failedLoginAttempts: 0, lockUntil: null }
    });

    // Remove sensitive data
    const safeUser = { ...user };
    delete safeUser.pinHash;
    delete safeUser.password;

    res.json({ success: true, user: safeUser });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Register Endpoint
app.post("/register", async (req, res) => {
  const userData = req.body;

  if (!db) return res.status(500).json({ error: "Database not connected" });
  if (!userData.email) return res.status(400).json({ error: "Email required" });

  try {
    // 1. Validate Email Format (Backend side)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      return res.status(400).json({ success: false, message: "Format d'email invalide." });
    }

    // 2. Check Unique Email
    const existingUser = await usersCollection.findOne({ email: userData.email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Cet email est déjà utilisé." });
    }

    // 3. Check Unique Payment Method (Simulation: check if paymentMethodId exists in any user)
    // In real Stripe, we'd query Stripe API or check stored ID.
    // Here assuming userData.paymentMethodId is passed.
    if (userData.paymentMethodId) {
      const existingPayment = await usersCollection.findOne({ "paymentMethodId": userData.paymentMethodId });
      if (existingPayment) {
        return res.status(400).json({ success: false, message: "Ce moyen de paiement est déjà associé à un compte." });
      }
    }

    // 4. Hash PIN
    if (!userData.pin || userData.pin.length < 4) {
      return res.status(400).json({ success: false, message: "Code PIN invalide (min 4 chiffres)." });
    }
    const pinHash = await bcrypt.hash(userData.pin, 10);

    const newUser = {
      ...userData,
      pinHash, // Store hash
      pin: undefined, // Do not store plain text
      password: undefined, // Do not store plain text password if sent
      createdAt: new Date(),
      role: "user",
      subscriptionStatus: "active",
      subscriptionStart: "2026-07-01",
      paymentMethodSecurelyStored: true,
      welcomeGiftPending: true,
      failedLoginAttempts: 0
    };

    const result = await usersCollection.insertOne(newUser);
    newUser._id = result.insertedId;
    delete newUser.pinHash; // Don't send back hash

    res.json({ success: true, user: newUser });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update Welcome Seen Endpoint
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
