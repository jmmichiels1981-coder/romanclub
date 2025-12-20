const { MongoClient } = require("mongodb");
const bcrypt = require("bcryptjs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const MONGODB_URI = process.env.MONGODB_URI;

const ADMIN_EMAIL = "jmmichiels1981@gmail.com";
const ADMIN_PIN = "140181";

async function seedAdmin() {
    let client;
    try {
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        const db = client.db("romanclub");
        const usersCollection = db.collection("users");

        console.log("Connected to MongoDB. Seeding Admin...");

        // 1. Check if admin exists
        const existingAdmin = await usersCollection.findOne({ email: ADMIN_EMAIL });

        const pinHash = await bcrypt.hash(ADMIN_PIN, 10);

        const adminData = {
            email: ADMIN_EMAIL,
            pinHash: pinHash,
            role: "admin",
            nom: "Admin",
            prenom: "RomanClub",
            createdAt: new Date(),
            subscriptionStatus: "active", // Fake active for admin access if needed
            welcomeSeen: true
        };

        if (existingAdmin) {
            console.log("Admin user already exists. Updating PIN and Role...");
            // Avoid setting fields to undefined in $set if they are also being unset
            // Just use $set for valid fields and $unset for invalid ones.
            await usersCollection.updateOne(
                { email: ADMIN_EMAIL },
                {
                    $set: {
                        pinHash: pinHash,
                        role: "admin",
                        nom: "Admin",
                        prenom: "RomanClub"
                    },
                    $unset: {
                        pin: "",
                        confirmPin: "",
                        password: "",
                        confirmPassword: "",
                        paymentMethodId: ""
                    }
                }
            );
        } else {
            console.log("Creating new Admin user...");
            await usersCollection.insertOne(adminData);
        }

        console.log(`✅ Admin seeded: ${ADMIN_EMAIL} / PIN: ******`);

    } catch (err) {
        console.error("Error seeding admin:", err);
    } finally {
        if (client) await client.close();
    }
}

seedAdmin();
