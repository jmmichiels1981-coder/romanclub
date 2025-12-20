import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./login.css";

function LoginPage() {
    const [email, setEmail] = useState("");
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

    const [pin, setPin] = useState("");

    const [isLoading, setIsLoading] = useState(false);

    // Load saved email on mount
    useEffect(() => {
        const savedEmail = localStorage.getItem("savedEmail");
        if (savedEmail) {
            setEmail(savedEmail);
        }
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, pin })
            });

            const data = await response.json();

            if (data.success) {
                // Store user info and token
                localStorage.setItem("user", JSON.stringify(data.user));
                localStorage.setItem("userLoggedIn", "true");
                localStorage.setItem("authToken", data.token); // Store JWT token
                localStorage.setItem("savedEmail", email);
                navigate("/dashboard");
            } else {
                alert("Erreur de connexion : " + (data.message || "Identifiants incorrects"));
                setIsLoading(false);
            }
        } catch (error) {
            console.error("Login error:", error);
            // Fallback for demo if backend not running locally
            alert("Erreur de connexion au serveur.");
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-header">
                <img src="/logo.png" alt="RomanClub Logo" className="login-logo" />
                <h1 className="brand-title">ROMAN CLUB</h1>
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
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                        />
                    </div >



                    <div className="input-group" style={{ marginTop: '1rem' }}>
                        <label className="input-label">Code PIN [4 chiffres]</label>
                        <input
                            type="text"
                            placeholder="...."
                            maxLength={4}
                            className="login-input"
                            required
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>

                    <button type="submit" className="login-btn" disabled={isLoading} style={{ opacity: isLoading ? 0.7 : 1 }}>
                        {isLoading ? "CONNEXION EN COURS..." : "SE CONNECTER"}
                    </button>
                </form >

                <div className="helper-links">
                    <div>
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
            </div >
        </div >
    );
}

export default LoginPage;
