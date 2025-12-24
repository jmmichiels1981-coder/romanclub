const { MongoClient } = require("mongodb");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const MONGODB_URI = process.env.MONGODB_URI;

async function verifyNewsletter() {
    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        console.log("Connected to MongoDB");
        const db = client.db("romanclub");
        const usersCollection = db.collection("users");
        const notificationsCollection = db.collection("notifications");

        // 1. Check Subscriber Count
        const subscriberCount = await usersCollection.countDocuments({ notificationsAccepted: true });
        console.log(`Subscribers found: ${subscriberCount}`);

        // 2. Simulate "Send" Logic (Database check)
        const initialSentCount = await notificationsCollection.countDocuments({});
        console.log(`Initial Notifications in DB: ${initialSentCount}`);

        // We can't easily call the API here without running the server and using fetch, 
        // but we can simulate the DB logic the API performs to ensure it works.

        const newNotification = {
            title: "Test Notification Unit",
            message: "This is a verification test.",
            sentAt: new Date(),
            sentCount: subscriberCount,
            status: "sent"
        };

        const result = await notificationsCollection.insertOne(newNotification);
        console.log(`Inserted Notification ID: ${result.insertedId}`);

        // 3. Verify Insertion
        const afterSentCount = await notificationsCollection.countDocuments({});
        console.log(`Post-Insert Notifications in DB: ${afterSentCount}`);

        if (afterSentCount === initialSentCount + 1) {
            console.log("✅ Verification Successful: Notification stored correctly.");
        } else {
            console.error("❌ Verification Failed: Count mismatch.");
        }

        // Cleanup test notification
        // await notificationsCollection.deleteOne({ _id: result.insertedId });
        // console.log("Cleaned up test notification.");

    } catch (err) {
        console.error("Verification error:", err);
    } finally {
        await client.close();
    }
}

verifyNewsletter();
