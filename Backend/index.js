const express = require("express");
const { MongoClient } = require("mongodb");

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

let db;

// Connexion MongoDB
async function connectDB() {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db("romanclub");
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
