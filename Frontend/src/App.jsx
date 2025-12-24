import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import "./index.css";
import Reader from "./Reader";
import Roman from "./Roman";
import LoginPage from "./LoginPage";
import WelcomeGiftModal from "./WelcomeGiftModal";
import RegisterPage from "./RegisterPage";
import DashboardPage from "./DashboardPage";
import WelcomeModal from "./WelcomeModal";

/* ======================
   HOME PAGE
   ====================== */

function HomePage() {
  const navigate = useNavigate(); // Need this for redirection
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false); // New state for login welcome

  const handleLoginClick = (e) => {
    e.preventDefault();
    const hasWelcomeSeen = localStorage.getItem("welcomeSeen");
    // Logic: Always show if not seen? Or just show it. User said: "page de message de première connexion apparait"
    // I'll assume standard 'first time' logic or forced logic.
    // User wording: "quand le client clique sur se connecter, la page de message de première connexion apparait"
    // Implicitly: if not seen before? Or always? Usually "Première connexion" implies once. 
    // I will check localStorage.
    if (hasWelcomeSeen === "true") {
      navigate("/connexion");
    } else {
      setShowWelcomeModal(true);
    }
  };

  const handleCloseWelcomeModal = () => {
    // Mark as seen is handled inside modal? 
    // Current WelcomeModal handles its own state update and closing?
    // Wait, WelcomeModal was modifying 'user' object in localStorage.
    // But here user is not logged in yet!
    // I should update WelcomeModal to handle this "pre-login" scenario or use a simpler logic here.
    // Actually, WelcomeModal logic relies on `user` object being present (lines 10-24 in WelcomeModal).
    // If I show it BEFORE login, `user` is null.
    // I need to modify WelcomeModal to support "Guest Mode" or "Pre-login Mode".
    // Let's just pass a prop `onClose` to WelcomeModal that overrides default behavior?
    // Or just handle the simple "OK" click.

    localStorage.setItem("welcomeSeen", "true"); // Simple key for pre-login
    setShowWelcomeModal(false);
    navigate("/connexion");
  };

  const handleInscriptionClick = (e) => {
    e.preventDefault();
    const hasSeenGift = localStorage.getItem("welcomeGiftSeen");

    if (hasSeenGift === "true") {
      navigate("/inscription");
    } else {
      setShowGiftModal(true);
    }
  };

  const handleCloseGiftModal = () => {
    localStorage.setItem("welcomeGiftSeen", "true");
    setShowGiftModal(false);
    navigate("/inscription");
  };

  return (
    <div className="container">
      {showGiftModal && <WelcomeGiftModal onClose={handleCloseGiftModal} />}
      {showWelcomeModal && <WelcomeModal onClose={handleCloseWelcomeModal} manualTrigger={true} />}
      <img src="/logo.png" alt="RomanClub Logo" className="logo" />
      <h1>ROMANCLUB</h1>
      <p className="subtitle">
        Un club de lecture numérique dédié aux auteurs émergents.
      </p>

      <div className="badges">
        <span className="badge">
          Accès gratuit à tous les romans jusqu’au 30 juin 2026
        </span>
        <span className="badge">
          Aucun prélèvement avant le 1er juillet 2026
        </span>
      </div>

      <div className="main-text">
        Chaque mois, RomanClub publie quatre romans numériques inédits :
        <br />
        un polar, une romance, un roman de science-fiction et un roman feel-good.
      </div>

      <div className="actions">
        <a href="/inscription" onClick={handleInscriptionClick} className="btn btn-primary">
          S’INSCRIRE GRATUITEMENT
        </a>

        <a href="/connexion" onClick={handleLoginClick} className="btn btn-secondary">
          SE CONNECTER
        </a>
      </div>

      <footer className="footer">
        <Link to="/admin">Admin</Link> •
        <Link to="/contact">Contact</Link> •
        <Link to="/mentions">Mentions légales</Link>
      </footer>
    </div>
  );
}

/* ======================
   PLACEHOLDER
   ====================== */

function PlaceholderPage({ title }) {
  return (
    <div className="container">
      <h1>{title}</h1>
      <Link
        to="/"
        style={{ color: "var(--primary-color)", marginTop: "2rem" }}
      >
        Retour à l'accueil
      </Link>
    </div>
  );
}

/* ======================
   APP
   ====================== */



import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe("pk_test_51STHOn7NHZXHRYC2Firv50CpKpG0B3JQyGJY4M5TEmVhdwMxyOJot435PWRH6vXwAYRKdrq44vwEPU9MZw5A2OfD00coVyymF4");

import ContactPage from "./ContactPage";
import ForgotPinPage from "./ForgotPinPage";
import AdminLoginPage from "./AdminLoginPage";
import AdminDashboardPage from "./AdminDashboardPage";
import AdminBooksPage from "./AdminBooksPage";
import AdminClientsPage from "./AdminClientsPage";
import AdminStatsPage from "./AdminStatsPage";
import AdminMessagesPage from "./AdminMessagesPage";

import AdminSecurityPage from "./AdminSecurityPage";
import AdminNewsletterPage from "./AdminNewsletterPage";

function App() {
  return (
    <Elements stripe={stripePromise}>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />

          {/* Routes structurelles */}
          <Route path="/roman" element={<Roman />} />
          <Route path="/lecture/:bookId" element={<Reader />} />

          {/* Pages annexes */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/inscription" element={<RegisterPage />} />
          <Route path="/connexion" element={<LoginPage />} />
          <Route path="/forgot-pin" element={<ForgotPinPage />} />
          <Route path="/admin" element={<AdminLoginPage />} />
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/dashboard/books" element={<AdminBooksPage />} />
          <Route path="/admin/dashboard/clients" element={<AdminClientsPage />} />
          <Route path="/admin/dashboard/stats" element={<AdminStatsPage />} />
          <Route path="/admin/dashboard/messages" element={<AdminMessagesPage />} />

          <Route path="/admin/dashboard/security" element={<AdminSecurityPage />} />
          <Route path="/admin/dashboard/newsletter" element={<AdminNewsletterPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/mentions" element={<PlaceholderPage title="Mentions légales" />} />
        </Routes>
      </Router>
    </Elements>
  );
}

export default App;
