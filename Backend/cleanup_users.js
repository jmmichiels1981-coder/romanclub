const { MongoClient } = require("mongodb");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const MONGODB_URI = process.env.MONGODB_URI;

async function cleanupUsers() {
    let client;
    try {
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        const db = client.db("romanclub");
        const usersCollection = db.collection("users");

        console.log("Connected to MongoDB. Starting cleanup...");

        // 1. Check for users with deprecated fields
        const query = {
            $or: [
                { pin: { $exists: true } },
                { confirmPin: { $exists: true } },
                { password: { $exists: true } },
                { confirmPassword: { $exists: true } },
                { paymentMethodId: { $exists: true } } // Also mentioned as 'undefined' in code but maybe persisted as null
            ]
        };

        const count = await usersCollection.countDocuments(query);
        console.log(`Found ${count} users with deprecated fields.`);

        if (count > 0) {
            // 2. Update to unset these fields
            const result = await usersCollection.updateMany(
                {}, // Apply to all users to be safe, or use query
                {
                    $unset: {
                        pin: "",
                        confirmPin: "",
                        password: "",
                        confirmPassword: "",
                        paymentMethodId: "", // cleaning this up too as per code intent
                    }
                }
            );
            console.log(`Cleanup complete. Modified ${result.modifiedCount} documents.`);
        } else {
            console.log("No users needed cleanup.");
        }

        // 3. Verify
        const verifyCount = await usersCollection.countDocuments(query);
        console.log(`Verification: ${verifyCount} users still have deprecated fields.`);

    } catch (err) {
        console.error("Error during cleanup:", err);
    } finally {
        if (client) await client.close();
    }
}

cleanupUsers();
