import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./login.css"; // Reuse login styles

function ForgotPinPage() {
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        nom: "",
        prenom: "",
        email: "",
        // Sujet is fixed
        sujet: "oubli de code Pin",
        message: ""
    });

    const [hasTypedMessage, setHasTypedMessage] = useState(false);
    const placeholderText = "Merci de mentionner obligatoirement votre date de naissance, votre sexe et votre Pays.";

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === "message" && !hasTypedMessage && value.length > 0) {
            setHasTypedMessage(true);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/contact`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                alert("Votre demande de réinitialisation a bien été envoyée ! Pour des raisons de sécurités nous traitons manuellement votre demande. Votre code pin vous sera transmis dans un délais de 12 à 24h maximum.");
                navigate("/connexion");
            } else {
                alert("Une erreur est survenue, veuillez réessayer.");
            }
        } catch (error) {
            console.error("Contact error:", error);
            alert("Erreur de connexion au serveur.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-header">
                <img src="/logo.png" alt="Roman Club Logo" className="login-logo" />
                <h1 className="brand-title">ROMAN CLUB</h1>
                <p className="page-subtitle">CODE PIN OUBLIÉ</p>
            </div>

            <div className="login-card">
                <form onSubmit={handleSubmit} style={{ width: '100%' }}>

                    {/* INFO TEXT */}
                    <div style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#ccc', fontSize: '0.9rem' }}>
                        Pour des raisons de sécurité, nous devons vérifier votre identité avant de réinitialiser votre code PIN.
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div className="input-group" style={{ flex: 1 }}>
                            <label className="input-label">Nom</label>
                            <input
                                type="text"
                                name="nom"
                                className="login-input"
                                required
                                value={formData.nom}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="input-group" style={{ flex: 1 }}>
                            <label className="input-label">Prénom</label>
                            <input
                                type="text"
                                name="prenom"
                                className="login-input"
                                required
                                value={formData.prenom}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="input-group" style={{ marginTop: '1rem' }}>
                        <label className="input-label">Email</label>
                        <input
                            type="email"
                            name="email"
                            className="login-input"
                            required
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="input-group" style={{ marginTop: '1rem' }}>
                        <label className="input-label">Sujet</label>
                        <input
                            type="text"
                            name="sujet"
                            className="login-input"
                            required
                            value={formData.sujet}
                            readOnly
                            style={{ opacity: 0.7, cursor: 'not-allowed', backgroundColor: '#333' }}
                        />
                    </div>

                    <div className="input-group" style={{ marginTop: '1rem' }}>
                        <label className="input-label">Message</label>
                        <textarea
                            name="message"
                            className="login-input"
                            rows="5"
                            style={{ resize: 'vertical' }}
                            required
                            placeholder={placeholderText}
                            value={formData.message}
                            onChange={handleChange}
                        />
                    </div>

                    <button
                        type="submit"
                        className="login-btn"
                        style={{ marginTop: '2rem', opacity: loading ? 0.7 : 1 }}
                        disabled={loading}
                    >
                        {loading ? "ENVOI..." : "ENVOYER LA DEMANDE"}
                    </button>

                    <div className="footer-links" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                        <Link to="/connexion">← Retour à la connexion</Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ForgotPinPage;
