const { MongoClient } = require("mongodb");
require("dotenv").config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const DB_NAME = "romanclub";

const BOOKS_DATA = [
    {
        title: "L'Ombre du Silence",
        author: "Marc Levy",
        genre: "polar",
        editorialSummary: "Une enquête palpitante au cœur des secrets d'État. L'inspecteur Rieux reprend du service.",
        contentUrl: "https://example.com/books/1", // Placeholder
        publishedAt: new Date("2024-12-15T00:00:00Z"),
        isPublished: true,
        weeklyRank: 1
    },
    {
        title: "Amour et Algorithmes",
        author: "Sophie D.",
        genre: "romance",
        editorialSummary: "Quand l'IA décide de trouver l'âme sœur. Une comédie romantique moderne.",
        contentUrl: "https://example.com/books/2",
        publishedAt: new Date("2024-12-18T00:00:00Z"),
        isPublished: true,
        weeklyRank: 2
    },
    {
        title: "Le Dernier Horizon",
        author: "Pierre B.",
        genre: "sf",
        editorialSummary: "Une odyssée vers l'inconnu. Le vaisseau Espérance ne répond plus.",
        contentUrl: "https://example.com/books/3",
        publishedAt: new Date("2024-12-10T00:00:00Z"),
        isPublished: true,
        weeklyRank: 3
    },
    {
        title: "Les Petits Matins",
        author: "Camille P.",
        genre: "feelgood",
        editorialSummary: "Un roman qui fait du bien, entre chocolat chaud et nouveau départ.",
        contentUrl: "https://example.com/books/4",
        publishedAt: new Date("2025-01-05T00:00:00Z"),
        isPublished: true, // Future published, might be filtered out depending on logic, keeping simple for now
        weeklyRank: 4
    },
    {
        title: "Enquête à Venise",
        author: "Jean Dupont",
        genre: "polar",
        editorialSummary: "Meurtre sur le grand canal.",
        contentUrl: "https://example.com/books/5",
        publishedAt: new Date("2024-11-01T00:00:00Z"),
        isPublished: true,
        weeklyRank: 5
    }
];

async function seed() {
    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        console.log("Connected to MongoDB");
        const db = client.db(DB_NAME);
        const booksCollection = db.collection("books");

        // Optional: clear existing books to avoid dupes during dev
        await booksCollection.deleteMany({});
        console.log("Cleared existing books");

        // Insert
        const result = await booksCollection.insertMany(BOOKS_DATA);
        console.log(`Inserted ${result.insertedCount} books`);

        // Create Indexes
        await booksCollection.createIndex({ isPublished: 1, publishedAt: -1 });
        console.log("Created indexes for books");

        // Allow creating user_books index here too just in case
        const userBooksCollection = db.collection("user_books");
        // { userId: 1, bookId: 1 } unique
        await userBooksCollection.createIndex({ userId: 1, bookId: 1 }, { unique: true });
        // { userId: 1, status: 1 }
        await userBooksCollection.createIndex({ userId: 1, status: 1 });
        console.log("Created indexes for user_books");

    } catch (err) {
        console.error("Seed error:", err);
    } finally {
        await client.close();
    }
}

seed();
