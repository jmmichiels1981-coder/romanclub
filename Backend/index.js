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

// Login Endpoint
app.post("/login", async (req, res) => {
  const { email } = req.body;

  if (!db) return res.status(500).json({ error: "Database not connected" });
  if (!email) return res.status(400).json({ error: "Email required" });

  try {
    let user = await usersCollection.findOne({ email });

    if (!user) {
      // For this demo/task flow, if user doesn't exist, create them
      // In a real app, you'd fail login. But user wants to test the flow.
      user = {
        email,
        welcomeSeen: false,
        createdAt: new Date()
      };
      const result = await usersCollection.insertOne(user);
      user._id = result.insertedId;
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error("Login error:", error);
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
