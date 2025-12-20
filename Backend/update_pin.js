const { MongoClient } = require("mongodb");
const bcrypt = require("bcryptjs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI missing");
    process.exit(1);
}

const TARGET_EMAIL = "jmmichiels1981@gmail.com";
const NEW_PIN = "123456";

async function updatePin() {
    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        console.log("Connected to MongoDB");
        const db = client.db("romanclub");
        const usersCollection = db.collection("users");

        const user = await usersCollection.findOne({ email: TARGET_EMAIL });

        if (!user) {
            console.log(`❌ User ${TARGET_EMAIL} not found.`);
            // Create the user if missing? User said "mon compte test", implying it exists.
            // But if it doesn't, maybe I should create it?
            // Safer to just report.
            // Wait, if I'm running this against a fresh seed, it might not exist.
            // Let's assume it exists or I should create it if critical.
            // I'll just log warning.
            return;
        }

        const newPinHash = await bcrypt.hash(NEW_PIN, 10);

        await usersCollection.updateOne(
            { email: TARGET_EMAIL },
            { $set: { pinHash: newPinHash } }
        );

        console.log(`✅ PIN for ${TARGET_EMAIL} updated to ${NEW_PIN} (hashed).`);

    } catch (err) {
        console.error("Error updating PIN:", err);
    } finally {
        await client.close();
    }
}

updatePin();
