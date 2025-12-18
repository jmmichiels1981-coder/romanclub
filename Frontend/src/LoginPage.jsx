import { Link, useNavigate } from "react-router-dom";
import "./login.css";

function LoginPage() {
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        // Simulate successful login
        localStorage.setItem("userLoggedIn", "true");
        // Redirect to homepage (or dashboard) where the Welcome Modal will trigger
        navigate("/");
    };

    return (
        <div className="login-container">
            <div className="login-header">
                <img src="/logo.png" alt="RomanClub Logo" className="login-logo" />
                <h1 className="brand-title">ARTISANFLOW PAR ROMAN CLUB</h1>
                <p className="page-subtitle">CONNEXION</p>
            </div>

            <div className="login-card">
                <form onSubmit={handleLogin} style={{ width: '100%' }}>
                    <div className="input-group">
                        <label className="input-label">Email</label>
                        <input
                            type="email"
                            placeholder="votre@email.fr"
                            className="login-input"
                            required
                        />
                    </div>

                    <div className="input-group" style={{ marginTop: '1rem' }}>
                        <label className="input-label">Mot de passe</label>
                        <input
                            type="password"
                            placeholder="......."
                            className="login-input"
                            required
                        />
                    </div>

                    <div className="input-group" style={{ marginTop: '1rem' }}>
                        <label className="input-label">Code PIN [4 chiffres]</label>
                        <input
                            type="text"
                            placeholder="...."
                            maxLength={4}
                            className="login-input"
                            required
                        />
                    </div>

                    <button type="submit" className="login-btn">
                        SE CONNECTER
                    </button>
                </form>

                <div className="helper-links">
                    <div>
                        <Link to="/forgot-password" className="orange-link">Mot de passe oublié ?</Link>
                        <span style={{ margin: "0 0.5rem", color: "#444" }}>|</span>
                        <Link to="/forgot-pin" className="orange-link">Code PIN oublié ?</Link>
                    </div>

                    <div className="create-account-link">
                        Pas encore de compte ? <Link to="/inscription" className="orange-link">Créer un compte</Link>
                    </div>

                    <div className="footer-links">
                        <Link to="/">← Retour à l'accueil</Link>
                        <span style={{ color: "#444" }}>|</span>
                        <Link to="/mentions">Mentions légales</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;
