const { MongoClient } = require("mongodb");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("❌ Erreur : MONGODB_URI est manquant dans le fichier .env");
    process.exit(1);
}

const TEST_USERS = [
    {
        email: "alice@test.com",
        prenom: "Alice",
        nom: "Dupont",
        password: "hashed_password_placeholder", // Not needed for this test
        role: "user",
        notificationsAccepted: true,
        createdAt: new Date(),
        subscriptionStatus: "active"
    },
    {
        email: "bob@test.com",
        prenom: "Bob",
        nom: "Martin",
        role: "user",
        notificationsAccepted: true,
        createdAt: new Date(),
        subscriptionStatus: "active"
    },
    {
        email: "charlie@test.com",
        prenom: "Charlie",
        nom: "Durand",
        role: "user",
        notificationsAccepted: false,
        createdAt: new Date(),
        subscriptionStatus: "active"
    }
];

async function seedUsers() {
    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        console.log("Connected to MongoDB");
        const db = client.db("romanclub");
        const usersCollection = db.collection("users");

        // Optional: clear non-admin users to avoid clutter? 
        // Better to just insert if not exist or upsert.
        // For simplicity, let's just insert checking email.

        for (const user of TEST_USERS) {
            const exists = await usersCollection.findOne({ email: user.email });
            if (!exists) {
                await usersCollection.insertOne(user);
                console.log(`Inserted user: ${user.email} (Notif: ${user.notificationsAccepted})`);
            } else {
                // Update notif status to ensure we have mixed state
                await usersCollection.updateOne(
                    { email: user.email },
                    { $set: { notificationsAccepted: user.notificationsAccepted } }
                );
                console.log(`Updated user: ${user.email} (Notif: ${user.notificationsAccepted})`);
            }
        }

    } catch (err) {
        console.error("Seed users error:", err);
    } finally {
        await client.close();
    }
}

seedUsers();
