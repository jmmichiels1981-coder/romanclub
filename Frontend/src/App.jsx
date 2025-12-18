import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import "./index.css";
import Reader from "./Reader";
import Roman from "./Roman";
import LoginPage from "./LoginPage";
import WelcomeGiftModal from "./WelcomeGiftModal";
import RegisterPage from "./RegisterPage";
import DashboardPage from "./DashboardPage";

/* ======================
   HOME PAGE
   ====================== */

function HomePage() {
  const navigate = useNavigate(); // Need this for redirection
  const [showGiftModal, setShowGiftModal] = useState(false);

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

        <Link to="/connexion" className="btn btn-secondary">
          SE CONNECTER
        </Link>
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

import WelcomeModal from "./WelcomeModal";

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe("pk_test_51STHOn7NHZXHRYC2Firv50CpKpG0B3JQyGJY4M5TEmVhdwMxyOJot435PWRH6vXwAYRKdrq44vwEPU9MZw5A2OfD00coVyymF4");

import ContactPage from "./ContactPage";

function App() {
  return (
    <Elements stripe={stripePromise}>
      <Router>
        <WelcomeModal />
        <Routes>
          <Route path="/" element={<HomePage />} />

          {/* Routes structurelles */}
          <Route path="/roman" element={<Roman />} />
          <Route path="/lecture" element={<Reader />} />

          {/* Pages annexes */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/inscription" element={<RegisterPage />} />
          <Route path="/connexion" element={<LoginPage />} />
          <Route path="/admin" element={<PlaceholderPage title="Admin" />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/mentions" element={<PlaceholderPage title="Mentions légales" />} />
        </Routes>
      </Router>
    </Elements>
  );
}

export default App;
