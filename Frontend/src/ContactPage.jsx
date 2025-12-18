import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./login.css"; // Reusing existing styles for consistency

function ContactPage() {
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        nom: "",
        prenom: "",
        email: "",
        sujet: "",
        message: ""
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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
                alert("Votre message a bien été envoyé !");
                navigate("/");
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
                <h1 className="brand-title">CONTACT</h1>
                <p className="page-subtitle">Nous sommes à votre écoute</p>
            </div>

            <div className="login-card">
                <form onSubmit={handleSubmit} style={{ width: '100%' }}>
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
                            onChange={handleChange}
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
                        {loading ? "ENVOI..." : "ENVOYER LE MESSAGE"}
                    </button>

                    <div className="footer-links" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                        <Link to="/">← Retour à l'accueil</Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ContactPage;
