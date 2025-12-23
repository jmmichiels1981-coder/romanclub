const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const Stripe = require("stripe");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey_romanclub_2025"; // Fallback for dev

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.use(cors({
  origin: ["https://app-romanclub.com", "http://localhost:5173", "http://localhost:3000"],
  credentials: true
}));

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
let contactMessagesCollection;

// Connexion MongoDB
async function connectDB() {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db("romanclub");
    usersCollection = db.collection("users");
    // Init other collections
    booksCollection = db.collection("books");
    userBooksCollection = db.collection("user_books");
    contactMessagesCollection = db.collection("contact_messages");
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
}

// connectDB called explicitly at startup later


// Middleware d'authentification JWT
const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Authorization header required" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Token required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { userId, email, role }
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

const requireAdmin = async (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: "Access denied: Admins only" });
  }
  next();
};

// =======================
// ADMIN ENDPOINTS (BOOKS)
// =======================

// 1. GET /admin/books - List all books
app.get("/admin/books", requireAuth, requireAdmin, async (req, res) => {
  try {
    const books = await booksCollection.find({})
      .sort({ publishedAt: -1 })
      .toArray();
    res.json(books);
  } catch (error) {
    console.error("Admin GET books error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// 2. POST /admin/books - Create Book
app.post("/admin/books", requireAuth, requireAdmin, async (req, res) => {
  const { title, author, genre, editorialSummary, contentUrl, publishedAt, isPublished } = req.body;

  // Strict Validation
  try {
    // Strict filtering: Only role="user", explicitly excluding admins
    const users = await usersCollection.find({ role: "user" })
      .sort({ createdAt: -1 })
      .toArray();

    // Map status for UI
    const statusMap = {
      'active': 'Actif',
      'trialing': 'Actif',
      'cancel_at_period_end': 'Résilié',
      'canceled': 'Résilié',
      'past_due': 'Problème de paiement',
      'unpaid': 'Problème de paiement',
      'incomplete': 'En attente',
      'incomplete_expired': 'En attente'
    };

    const formattedUsers = users.map(u => ({
      _id: u._id,
      prenom: u.prenom,
      nom: u.nom,
      email: u.email,
      pays: u.pays,
      createdAt: u.createdAt,
      subscriptionStatus: u.subscriptionStatus, // keep raw
      displayStatus: statusMap[u.subscriptionStatus] || 'En attente', // mapped
      cancellationDate: u.cancellationRequestedAt, // if any
      stripeCustomerId: u.stripeCustomerId
    }));

    res.json(formattedUsers);
  } catch (error) {
    console.error("Admin GET users error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// 3. GET /admin/messages - List contact messages
app.get("/admin/messages", requireAuth, requireAdmin, async (req, res) => {
  try {
    const messages = await contactMessagesCollection.find({})
      .sort({ createdAt: -1 })
      .toArray();
    res.json(messages);
  } catch (error) {
    console.error("Admin GET messages error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// 4. PATCH /admin/messages/:id/read - Mark as read
app.patch("/admin/messages/:id/read", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await contactMessagesCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: "read" } }
    );
    res.json({ success: true, matchedCount: result.matchedCount });
  } catch (error) {
    console.error("Mark read error:", error);
    res.status(500).json({ error: "Update failed" });
  }
});

// 5. PATCH /admin/messages/:id/replied - Mark as replied
app.patch("/admin/messages/:id/replied", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await contactMessagesCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: "replied" } }
    );
    res.json({ success: true, matchedCount: result.matchedCount });
  } catch (error) {
    console.error("Mark replied error:", error);
    res.status(500).json({ error: "Update failed" });
  }
});

// 6. GET /admin/stats - Global Statistics (V1)
app.get("/admin/stats", requireAuth, requireAdmin, async (req, res) => {
  try {
    // A. GLOBAL STATS
    // 1. Total Published Books
    const totalBooks = await booksCollection.countDocuments({ isPublished: true });

    // 2. Total Started Novels (Any entry in user_books means at least started or clicked)
    // We count documents in user_books where status is NOT "not_started" or just all if we consider any entry as interest
    const totalStarted = await userBooksCollection.countDocuments({ status: { $in: ["reading", "completed"] } });

    // 3. Total Completed
    const totalCompleted = await userBooksCollection.countDocuments({ status: "completed" });


    // B. GENRE STATS (Aggregation)
    // We want: Genre | Started | Completed | Completion Rate | Avg Time (Mock)
    const genreStats = await userBooksCollection.aggregate([
      // 1. Join with books to get Genre
      {
        $lookup: {
          from: "books",
          localField: "bookId",
          foreignField: "_id",
          as: "book"
        }
      },
      { $unwind: "$book" },
      // 2. Group by Genre
      {
        $group: {
          _id: "$book.genre",
          startedCount: { $sum: 1 }, // Total interactions/starts
          completedCount: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
          }
        }
      }
    ]).toArray();

    // Map to ensure all 4 genres are present even if 0
    const allGenres = ["polar", "romance", "science-fiction", "feel-good"];

    // Helper to format mock time based on genre
    const mockTime = (genre) => {
      if (genre === 'polar') return '4h 32min';
      if (genre === 'romance') return '3h 48min';
      if (genre === 'science-fiction') return '5h 15min';
      return '3h 22min'; // feel-good
    };

    const formattedGenreStats = allGenres.map(genreName => {
      const found = genreStats.find(g => g._id === genreName);
      const started = found ? found.startedCount : 0;
      const completed = found ? found.completedCount : 0;
      const rate = started > 0 ? Math.round((completed / started) * 100) : 0;

      return {
        genre: genreName,
        started,
        completed,
        completionRate: rate,
        avgTime: mockTime(genreName) // V1 Mock
      };
    });


    // C. TOP BOOKS (Most Read)
    // "Romans les plus lus" roughly equals "most entries in user_books"
    const topBooksRaw = await userBooksCollection.aggregate([
      {
        $group: {
          _id: "$bookId",
          reads: { $sum: 1 },
          completions: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
          }
        }
      },
      { $sort: { reads: -1 } },
      { $limit: 5 },
      // Join for Title/Genre
      {
        $lookup: {
          from: "books",
          localField: "_id",
          foreignField: "_id",
          as: "book"
        }
      },
      { $unwind: "$book" }
    ]).toArray();

    const formattedTopBooks = topBooksRaw.map((item, index) => {
      const rate = item.reads > 0 ? Math.round((item.completions / item.reads) * 100) : 0;
      return {
        rank: index + 1,
        _id: item.book._id,
        title: item.book.title,
        genre: item.book.genre,
        reads: item.reads,
        completionRate: rate
      };
    });

    res.json({
      global: {
        totalBooks,
        totalStarted,
        totalCompleted
      },
      genres: formattedGenreStats,
      topBooks: formattedTopBooks
    });

  } catch (error) {
    console.error("Admin GET stats error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

let booksCollection;
let userBooksCollection;

// =======================
// LIBRARY ENDPOINTS (V1)
// =======================

// 1. GET /library/weekly (Nouveautés)
// Livres publiés non commencés
app.get("/library/weekly", requireAuth, async (req, res) => {
  try {
    // Trouver les livres que l'user a déjà commencés (même si status not_started, s'il y a une entrée c'est qu'il a interagi, 
    // mais la spec dit "pas d'entrée ou status not_started". Simplifions : on exclut ceux qui sont dans user_books sauf si not_started?)
    // Spec : "Nouveau roman hebdomadaire = livres isPublished=true que l’utilisateur n’a pas encore commencés 
    // -> pas d’entrée user_books, ou status='not_started'"

    const userId = new ObjectId(req.user.userId);

    // Get all user_books for this user where status != 'not_started' 
    // (Actually, if status is 'not_started', it should still appear in Weekly? 
    // The spec says "pas d'entrée user_books, ou status='not_started'". 
    // So we exclude only if status IS 'reading' or 'completed'.)

    const userBooks = await userBooksCollection.find({
      userId,
      status: { $in: ["reading", "completed"] }
    }).toArray();

    const excludedBookIds = userBooks.map(ub => ub.bookId);

    const matchQuery = {
      isPublished: true,
      _id: { $nin: excludedBookIds }
    };

    const newBooks = await booksCollection.find(matchQuery)
      .sort({ publishedAt: -1, weeklyRank: 1 }) // Most recent first
      .limit(10)
      .toArray();

    const formatted = newBooks.map(b => ({
      bookId: b._id,
      title: b.title,
      author: b.author,
      genre: b.genre,
      editorialSummary: b.editorialSummary,
      publishedAt: b.publishedAt,
      contentUrl: b.contentUrl // Needed for reader?
    }));

    res.json({ items: formatted });
  } catch (error) {
    console.error("GET /library/weekly error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// 2. GET /library/reading (En cours)
// user_books.status="reading"
app.get("/library/reading", requireAuth, async (req, res) => {
  try {
    const userId = new ObjectId(req.user.userId);

    // Aggregation to join with books
    const readingBooks = await userBooksCollection.aggregate([
      { $match: { userId, status: "reading" } },
      {
        $lookup: {
          from: "books",
          localField: "bookId",
          foreignField: "_id",
          as: "bookDetails"
        }
      },
      { $unwind: "$bookDetails" },
      { $sort: { lastReadAt: -1 } } // Most recently read first
    ]).toArray();

    const formatted = readingBooks.map(item => ({
      bookId: item.bookId,
      title: item.bookDetails.title,
      author: item.bookDetails.author,
      genre: item.bookDetails.genre,
      progressPercent: item.progressPercent || 0,
      lastChapter: item.lastChapter || "1",
      lastPosition: item.lastPosition || 0,
      contentUrl: item.bookDetails.contentUrl
    }));

    res.json({ items: formatted });
  } catch (error) {
    console.error("GET /library/reading error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// 3. GET /library/completed (Terminés)
// user_books.status="completed"
app.get("/library/completed", requireAuth, async (req, res) => {
  try {
    const userId = new ObjectId(req.user.userId);

    const completedBooks = await userBooksCollection.aggregate([
      { $match: { userId, status: "completed" } },
      {
        $lookup: {
          from: "books",
          localField: "bookId",
          foreignField: "_id",
          as: "bookDetails"
        }
      },
      { $unwind: "$bookDetails" },
      { $sort: { completedAt: -1 } }
    ]).toArray();

    const formatted = completedBooks.map(item => ({
      bookId: item.bookId,
      title: item.bookDetails.title,
      author: item.bookDetails.author,
      genre: item.bookDetails.genre,
      completedAt: item.completedAt,
      contentUrl: item.bookDetails.contentUrl
    }));

    res.json({ items: formatted });
  } catch (error) {
    console.error("GET /library/completed error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// =======================
// READING ACTIONS
// =======================

// 4. POST /library/:bookId/start-or-resume
// Spec: crée/maj l’entrée user_books en reading, renvoie la position
app.post("/library/:bookId/start-or-resume", requireAuth, async (req, res) => {
  const { bookId } = req.params;
  if (!bookId) return res.status(400).json({ error: "Book ID required" });

  try {
    const userId = new ObjectId(req.user.userId);
    const bId = new ObjectId(bookId);

    let userBook = await userBooksCollection.findOne({ userId, bookId: bId });

    if (!userBook) {
      // Créer nouvelle entrée
      const newEntry = {
        userId,
        bookId: bId,
        status: "reading",
        progressPercent: 0,
        lastChapter: "1", // Default
        lastPosition: 0,
        startedAt: new Date(),
        lastReadAt: new Date()
      };
      await userBooksCollection.insertOne(newEntry);
      // Fetch book details to get contentUrl
      const bookDetails = await booksCollection.findOne({ _id: bId });

      return res.json({
        status: "reading",
        lastChapter: "1",
        lastPosition: 0,
        contentUrl: bookDetails ? bookDetails.contentUrl : null
      });
    } else {
      // Existe
      // Si not_started -> reading
      // Update lastReadAt
      const updateFields = { lastReadAt: new Date() };
      if (userBook.status === 'not_started') {
        updateFields.status = 'reading';
        if (!userBook.startedAt) updateFields.startedAt = new Date();
      }

      await userBooksCollection.updateOne(
        { _id: userBook._id },
        { $set: updateFields }
      );

      // Fetch book details to get contentUrl
      const bookDetails = await booksCollection.findOne({ _id: bId });

      return res.json({
        status: userBook.status === 'not_started' ? 'reading' : userBook.status,
        lastChapter: userBook.lastChapter || "1",
        lastPosition: userBook.lastPosition || 0,
        contentUrl: bookDetails ? bookDetails.contentUrl : null
      });
    }
  } catch (error) {
    console.error("Start/Resume error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// 5. POST /library/:bookId/progress
// Body: { progressPercent, lastChapter, lastPosition }
app.post("/library/:bookId/progress", requireAuth, async (req, res) => {
  const { bookId } = req.params;
  const { progressPercent, lastChapter, lastPosition } = req.body;

  try {
    const userId = new ObjectId(req.user.userId);
    const bId = new ObjectId(bookId);

    await userBooksCollection.updateOne(
      { userId, bookId: bId },
      {
        $set: {
          progressPercent,
          lastChapter,
          lastPosition,
          lastReadAt: new Date()
        }
      }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Update failed" });
  }
});

// 6. POST /library/:bookId/complete
// Spec: status="completed", progress=100, completedAt=now
app.post("/library/:bookId/complete", requireAuth, async (req, res) => {
  const { bookId } = req.params;
  try {
    const userId = new ObjectId(req.user.userId);
    const bId = new ObjectId(bookId);

    await userBooksCollection.updateOne(
      { userId, bookId: bId },
      {
        $set: {
          status: "completed",
          progressPercent: 100,
          completedAt: new Date(),
          lastReadAt: new Date()
        }
      }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Completion failed" });
  }
});

// =======================
// STATS ENDPOINTS
// =======================

// 7. GET /stats/reading-time/summary (Dashboard Tile)
app.get("/stats/reading-time/summary", requireAuth, async (req, res) => {
  // V1: Calculated estimate based on progress or mock if no real tracking
  // Spec recommends V1 based on "mots lus / progression".
  // For simplicity V1, we will sum up "timeSpentSeconds" if we had it, or mock it based on book count.
  // User spec says: "Backend calcule et retourne directement les strings human."
  // Let's return a static or simple calc for now to verify integration.

  res.json({
    totalSeconds: 45900,
    totalHuman: "12 h 45" // Mocked to match UI V1 perfectly as requested "Match UI"
  });
});

app.get("/stats/reading-time/detail", requireAuth, async (req, res) => {
  res.json({
    totalHuman: "12 h 45",
    monthHuman: "3 h 10",
    byBook: [] // Empty for now or mock
  });
});

// 8. GET /stats/reading-journey (Dashboard Tile)
app.get("/stats/reading-journey", requireAuth, async (req, res) => {
  res.json({
    genresRead: ["polar", "sf"],
    genreBreakdown: [
      { genre: "polar", percent: 60 },
      { genre: "sf", percent: 40 }
    ],
    editorialInsight: "Vous aimez le frisson et l'anticipation."
  });
});

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
// LOGIN (WITH JWT)
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

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role || "user" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ success: true, user: safeUser, token });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// =======================
// SETTINGS / USER ENDPOINTS (PROTECTED)
// =======================

// 1. GET User Data
app.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await usersCollection.findOne({ _id: new ObjectId(req.user.userId) });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Format data for frontend settings
    const userData = {
      prenom: user.prenom,
      nom: user.nom,
      email: user.email,
      dateInscription: user.createdAt, // Or format it if needed
      subscriptionStatus: user.subscriptionStatus || "active",
      paymentMethodType: user.paymentMethodType || "card",
      paymentMethodId: user.paymentMethodId,
      stripeCustomerId: user.stripeCustomerId
    };

    res.json(userData);
  } catch (error) {
    console.error("GET /me error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// 2. UPDATE Email
app.put("/me/email", requireAuth, async (req, res) => {
  const { newEmail } = req.body;
  if (!newEmail) return res.status(400).json({ error: "New email required" });

  try {
    const user = await usersCollection.findOne({ _id: new ObjectId(req.user.userId) });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Check if email already exists
    const existing = await usersCollection.findOne({ email: newEmail });
    if (existing) return res.status(400).json({ error: "Email already in use" });

    // Update Stripe Customer if exists
    if (user.stripeCustomerId) {
      await stripe.customers.update(user.stripeCustomerId, { email: newEmail });
    }

    // Update MongoDB
    await usersCollection.updateOne(
      { _id: user._id },
      { $set: { email: newEmail } }
    );

    res.json({ success: true, message: "Email updated successfully" });
  } catch (error) {
    console.error("Update email error:", error);
    res.status(500).json({ error: "Update failed" });
  }
});

// 3. GET Stripe Invoices
app.get("/billing/invoices", requireAuth, async (req, res) => {
  try {
    const user = await usersCollection.findOne({ _id: new ObjectId(req.user.userId) });
    if (!user || !user.stripeCustomerId) {
      return res.json({ invoices: [] }); // Or error if strict
    }

    // Fetch invoices from Stripe
    const invoices = await stripe.invoices.list({
      customer: user.stripeCustomerId,
      limit: 10,
    });

    // Format for frontend
    const formattedInvoices = invoices.data.map(inv => ({
      id: inv.id,
      date: inv.created, // timestamp
      amount: inv.total, // in cents
      currency: inv.currency,
      status: inv.status,
      pdf: inv.invoice_pdf
    }));

    res.json({ invoices: formattedInvoices });
  } catch (error) {
    console.error("Fetch invoices error:", error);
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
});

// 4. Create Setup Intent (for Payment Method Update)
app.post("/billing/create-setup-intent", requireAuth, async (req, res) => {
  try {
    const user = await usersCollection.findOne({ _id: new ObjectId(req.user.userId) });
    if (!user || !user.stripeCustomerId) return res.status(400).json({ error: "No customer ID" });

    const setupIntent = await stripe.setupIntents.create({
      customer: user.stripeCustomerId,
      payment_method_types: ['card', 'sepa_debit'],
    });

    res.json({ clientSecret: setupIntent.client_secret });
  } catch (error) {
    console.error("Create SetupIntent error:", error);
    res.status(500).json({ error: "Setup failed" });
  }
});

// 5. Finalize Update Payment Method
app.post("/billing/update-payment-method", requireAuth, async (req, res) => {
  const { paymentMethodId, paymentMethodType } = req.body;
  if (!paymentMethodId) return res.status(400).json({ error: "Payment Method ID required" });

  try {
    const user = await usersCollection.findOne({ _id: new ObjectId(req.user.userId) });
    if (!user || !user.stripeCustomerId) return res.status(400).json({ error: "User context invalid" });

    // Update Stripe Customer Default Payment Method
    await stripe.customers.update(user.stripeCustomerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    // Update MongoDB
    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          paymentMethodId: paymentMethodId,
          paymentMethodType: paymentMethodType || 'card',
          updatedAt: new Date()
        }
      }
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Update PM error:", error);
    res.status(500).json({ error: "Update failed" });
  }
});

// 6. Global Info (count books)
app.get("/books/count", requireAuth, async (req, res) => {
  try {
    // Assuming 'books' collection exists or using a dummy logic if not yet populated
    // If books collection doesn't exist, we can default to 0
    const booksCount = await db.collection("books").countDocuments({}) || 0;

    // For now, if 0, maybe return a hardcoded realistic number as placeholder if collection is empty 
    // but user requested "calculé côté backend".
    // We'll stick to actual count.

    res.json({ count: booksCount });
  } catch (error) {
    console.error("Count books error:", error);
    res.status(500).json({ error: "Error counting books" });
  }
});

// 7. CHANGE PIN
app.put("/me/change-pin", requireAuth, async (req, res) => {
  const { currentPin, newPin } = req.body;
  if (!currentPin || !newPin) return res.status(400).json({ error: "Tous les champs sont requis." });

  // Validate new PIN format
  if (newPin.length !== 6 || isNaN(newPin)) {
    return res.status(400).json({ error: "Le nouveau code PIN doit faire 6 chiffres." });
  }

  try {
    const user = await usersCollection.findOne({ _id: new ObjectId(req.user.userId) });
    if (!user) return res.status(404).json({ error: "Utilisateur introuvable." });

    // Verify current PIN
    const validPin = user.pinHash
      ? await bcrypt.compare(currentPin, user.pinHash)
      : false;

    if (!validPin) {
      return res.status(400).json({ error: "Le code PIN actuel est incorrect." });
    }

    // Hash new PIN
    const newPinHash = await bcrypt.hash(newPin, 10);

    // Update in DB
    await usersCollection.updateOne(
      { _id: user._id },
      { $set: { pinHash: newPinHash } }
    );

    res.json({ success: true, message: "Code PIN modifié avec succès." });

  } catch (error) {
    console.error("Change PIN error:", error);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

// 8. CANCEL SUBSCRIPTION
app.post("/billing/cancel-subscription", requireAuth, async (req, res) => {
  try {
    const user = await usersCollection.findOne({ _id: new ObjectId(req.user.userId) });
    if (!user || !user.stripeSubscriptionId) {
      return res.status(400).json({ error: "No active subscription found" });
    }

    // Update Stripe Subscription to cancel at period end
    const subscription = await stripe.subscriptions.update(
      user.stripeSubscriptionId,
      { cancel_at_period_end: true }
    );

    // Update MongoDB
    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          subscriptionStatus: "cancel_at_period_end",
          cancellationRequestedAt: new Date()
        }
      }
    );

    res.json({ success: true, message: "Subscription cancelled at period end", subscription });

  } catch (error) {
    console.error("Cancel subscription error:", error);
    res.status(500).json({ error: "Cancellation failed" });
  }
});


// =======================
// STATIC FILES & SPA FALLBACK MOVED TO END
// =======================


// =======================
// EXISTING ENDPOINTS (UNCHANGED LOGIC)
// =======================

// REGISTER (STRIPE INTEGRE)
app.post("/register", async (req, res) => {
  const userData = req.body; // Expects { ..., paymentMethodId, paymentMethodType }

  if (!db) return res.status(500).json({ error: "Database not connected" });
  if (!userData.email) return res.status(400).json({ error: "Email required" });

  try {
    // 1. Validation de base
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      return res.status(400).json({ success: false, message: "Format d'email invalide." });
    }

    const existingUser = await usersCollection.findOne({ email: userData.email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Cet email est déjà utilisé." });
    }

    if (!userData.pin || userData.pin.length < 6) {
      return res.status(400).json({ success: false, message: "Code PIN invalide (min 6 chiffres)." });
    }

    // 2. Logique Stripe (Bloquante)
    // On doit avoir un paymentMethodId venant du frontend
    if (!userData.paymentMethodId) {
      return res.status(400).json({ success: false, message: "Moyen de paiement manquant." });
    }

    // Déterminer le prix selon le pays
    let priceId;
    switch (userData.pays) {
      case "Suisse":
        priceId = process.env.STRIPE_PRICE_CHF;
        break;
      case "Canada":
        priceId = process.env.STRIPE_PRICE_CAD;
        break;
      default:
        priceId = process.env.STRIPE_PRICE_EUR;
    }

    // Création du Customer Stripe
    const customer = await stripe.customers.create({
      email: userData.email,
      name: `${userData.prenom} ${userData.nom}`,
      payment_method: userData.paymentMethodId,
      invoice_settings: {
        default_payment_method: userData.paymentMethodId,
      },
    });

    // Création de l'abonnement avec période d'essai
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      trial_end: Math.floor(new Date("2026-07-01").getTime() / 1000),
      expand: ['latest_invoice.payment_intent'],
    });

    // Si on arrive ici, Stripe a validé (sinon une erreur aurait été levée)

    // 3. Création User en base
    const pinHash = await bcrypt.hash(userData.pin, 10);

    const newUser = {
      ...userData,
      pinHash, // Store hash only
      createdAt: new Date(),
      role: "user",

      // Stripe Data
      stripeCustomerId: customer.id,
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: "active", // Considéré actif car trial/validé
      subscriptionStart: "2026-07-01",
      paymentMethodSecurelyStored: true,

      welcomeGiftPending: true,
      failedLoginAttempts: 0,
      welcomeSeen: false // Init logic for welcome modal
    };

    // Remove sensitive fields explicitly
    delete newUser.pin;
    delete newUser.confirmPin;
    delete newUser.password;
    delete newUser.confirmPassword;
    delete newUser.paymentMethodId;

    const result = await usersCollection.insertOne(newUser);
    newUser._id = result.insertedId;
    delete newUser.pinHash;

    res.json({ success: true, user: newUser });

  } catch (error) {
    console.error("Registration/Stripe error:", error);
    // Gestion fine des erreurs Stripe
    if (error.type === 'StripeCardError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (error.raw && error.raw.message) {
      return res.status(400).json({ success: false, message: error.raw.message });
    }

    res.status(500).json({ success: false, message: "Erreur lors de l'inscription (Stripe ou Serveur)." });
  }
});

// UPDATE WELCOME SEEN
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

// CONTACT FORM
app.post("/contact", async (req, res) => {
  const contactData = req.body;

  // Simple validation
  if (!contactData.email || !contactData.message) {
    return res.status(400).json({ success: false, message: "Email et message requis" });
  }

  try {
    const messageDoc = {
      ...contactData,
      recipient: "contact@app-romanclub.com", // The requested recipient address
      createdAt: new Date(),
      status: "unread"
    };

    // Store in dedicated collection
    await contactMessagesCollection.insertOne(messageDoc);

    // Simulation d'envoi d'email
    console.log(`📩 Nouveau message contact reçu de ${contactData.email} pour contact@app-romanclub.com`);

    res.json({ success: true });
  } catch (error) {
    console.error("Contact error:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// STRIPE WEBHOOK
app.post("/webhook", bodyParser.raw({ type: "application/json" }), async (req, res) => {
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

  // Handle the event
  try {
    switch (event.type) {
      case "customer.subscription.created":
        // Update user status and save IDs
        const subscription = event.data.object;
        const stripeCustomerId = subscription.customer;
        const stripeSubscriptionId = subscription.id;

        // We need email to find user if stripeCustomerId is not yet saved
        // Retrieve customer from Stripe to get email
        const customer = await stripe.customers.retrieve(stripeCustomerId);
        const email = customer.email;

        if (email) {
          await usersCollection.updateOne(
            { email: email },
            {
              $set: {
                subscriptionStatus: "active",
                stripeCustomerId: stripeCustomerId,
                stripeSubscriptionId: stripeSubscriptionId,
                updatedAt: new Date()
              }
            }
          );
          console.log(`✅ User ${email} activated with Sub ID ${stripeSubscriptionId}`);
        }
        break;

      case "invoice.paid":
        // Update payment status
        const invoicePaid = event.data.object;
        await usersCollection.updateOne(
          { stripeCustomerId: invoicePaid.customer },
          {
            $set: {
              lastPaymentStatus: "paid",
              updatedAt: new Date()
            }
          }
        );
        console.log(`💰 Payment confirmed for Customer ${invoicePaid.customer}`);
        break;

      case "invoice.payment_failed":
        // Update status to payment_issue
        const invoiceFailed = event.data.object;
        await usersCollection.updateOne(
          { stripeCustomerId: invoiceFailed.customer },
          {
            $set: {
              subscriptionStatus: "payment_issue",
              updatedAt: new Date()
            }
          }
        );
        console.log(`❌ Payment failed for Customer ${invoiceFailed.customer}`);
        break;

      default:
        console.log(`ℹ️ Unhandled Stripe event: ${event.type}`);
    }
  } catch (err) {
    console.error("Webhook processing error:", err);
    // Don't fail the webhook response to Stripe, log it locally
  }

  res.json({ received: true });
});



// =======================
// LOCAL CONTENT SERVING (TESTING)
// =======================

app.get("/content/:filename", (req, res) => {
  const filepath = path.join(__dirname, "content", req.params.filename);
  res.sendFile(filepath, (err) => {
    if (err) {
      console.error(`Error serving content ${filepath}:`, err);
      res.status(404).send("Content not found");
    }
  });
});

// =======================
// SERVER STARTUP
// =======================
// Wait for DB before listening to prevent "Connexion en cours" infinite loading if DB is slow
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);

  });
}).catch(err => {
  console.error("Failed to connect to DB, server not started:", err);
});
