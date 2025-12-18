import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import "./index.css";
import Reader from "./Reader";
import Roman from "./Roman";
import LoginPage from "./LoginPage";

/* ======================
   HOME PAGE
   ====================== */

function HomePage() {
  return (
    <div className="container">
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
        <Link to="/inscription" className="btn btn-primary">
          S’INSCRIRE GRATUITEMENT
        </Link>

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

function App() {
  return (
    <Router>
      <WelcomeModal />
      <Routes>
        <Route path="/" element={<HomePage />} />

        {/* Routes structurelles (contenu branché plus tard) */}
        <Route path="/roman" element={<Roman />} />
        <Route path="/lecture" element={<Reader />} />

        {/* Pages annexes */}
        <Route path="/inscription" element={<PlaceholderPage title="Inscription" />} />
        <Route path="/connexion" element={<LoginPage />} />
        <Route path="/admin" element={<PlaceholderPage title="Admin" />} />
        <Route path="/contact" element={<PlaceholderPage title="Contact" />} />
        <Route path="/mentions" element={<PlaceholderPage title="Mentions légales" />} />
      </Routes>
    </Router>
  );
}

export default App;
