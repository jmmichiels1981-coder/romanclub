import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./login.css";

function RegisterPage() {
    const navigate = useNavigate();
    // Use environment variable or default to localhost
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

    const [step, setStep] = useState(1); // 1=Form, 2=Payment, 3=Confirmation
    const [formData, setFormData] = useState({
        nom: "",
        prenom: "",
        email: "",
        dateNaissance: "",
        sexe: "", // "Homme" or "Femme"
        pays: "France",
        password: "",
        confirmPassword: "",
        pin: "",
        confirmPin: ""
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSexeChange = (val) => {
        setFormData(prev => ({ ...prev, sexe: val }));
    };

    // Step 1 -> Step 2
    const handleFormSubmit = (e) => {
        e.preventDefault();

        // Validation
        if (!formData.sexe) {
            alert("Veuillez sélectionner votre sexe.");
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            alert("Les mots de passe ne correspondent pas.");
            return;
        }
        if (formData.pin !== formData.confirmPin) {
            alert("Les codes PIN ne correspondent pas.");
            return;
        }
        if (formData.pin.length !== 4 || isNaN(formData.pin)) {
            alert("Le code PIN doit être composé de 4 chiffres.");
            return;
        }

        // Go to payment step
        setStep(2);
    };

    // Step 2 -> Step 3 (Simulate Payment Success & Calling Backend)
    const handlePaymentSuccess = async () => {
        // Here we call the backend to actually register the user
        const payload = {
            nom: formData.nom,
            prenom: formData.prenom,
            email: formData.email,
            date_naissance: formData.dateNaissance,
            sexe: formData.sexe,
            pays: formData.pays,
            password: formData.password,
            pin: formData.pin
        };

        try {
            const response = await fetch(`${API_URL}/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            // Handle response carefully (ensure JSON)
            const contentType = response.headers.get("content-type");
            let data = {};
            if (contentType && contentType.includes("application/json")) {
                data = await response.json();
            }

            if (response.ok && data.success) {
                // Auto-login locally if needed or just show confirmation
                localStorage.setItem("user", JSON.stringify(data.user));
                localStorage.setItem("userLoggedIn", "true");
                setStep(3);
            } else {
                alert("Erreur: " + (data.message || "Échec de l'inscription"));
            }
        } catch (error) {
            console.error("Registration error:", error);
            // Fallback for simulation if backend is down
            alert("Mode simulation (Backend inaccessible)");
            setStep(3);
        }
    };

    if (step === 3) {
        return (
            <div className="login-container">
                <div className="login-card" style={{ textAlign: 'center', alignItems: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
                    <h1 className="brand-title" style={{ color: '#ff7700', marginBottom: '1.5rem' }}>Inscription confirmée</h1>

                    <p style={{ color: '#fff', marginBottom: '0.5rem' }}>Votre inscription à RomanClub est désormais active.</p>
                    <p style={{ color: '#ccc', marginBottom: '0.5rem' }}>Votre moyen de paiement a été enregistré en toute sécurité.</p>
                    <p style={{ color: '#ccc', marginBottom: '2rem' }}>Aucun prélèvement ne sera effectué avant le 1er juillet 2026.</p>

                    <button
                        className="login-btn"
                        onClick={() => navigate("/lecture")}
                    >
                        Accéder à ma Bibliothèque
                    </button>
                </div>
            </div>
        );
    }

    const [paymentMethod, setPaymentMethod] = useState("card"); // "card" or "sepa"

    // Helper to get country code for IBAN label
    const getIbanLabel = () => {
        const map = {
            "France": "FR",
            "Belgique": "BE",
            "Luxembourg": "LU",
            "Suisse": "CH",
            "Canada": "CA",
            "Monaco": "MC"
        };
        return map[formData.pays] || "FR";
    };

    if (step === 2) {
        return (
            <div className="login-container">
                <div className="login-header">
                    <img src="/logo.png" alt="Roman Club Logo" className="login-logo" />
                    <h1 className="brand-title">ROMAN CLUB</h1>
                    <p className="page-subtitle">INSCRIPTION - PAIEMENT</p>
                </div>

                <div className="login-card" style={{ maxWidth: '500px' }}>

                    <div className="info-box">
                        L’utilisation de l’application est entièrement gratuite jusqu’au 30 juin 2026.<br />
                        Aucun prélèvement ne sera effectué avant le 1er juillet 2026.<br />
                        Votre inscription vous permet simplement d’activer votre accès dès maintenant, sans aucun frais immédiat.<br />
                        Vous serez bien entendu averti avant tout renouvellement ou prélèvement.
                    </div>

                    <div className="input-group">
                        <label className="payment-label">Mode de paiement</label>
                        <div className="payment-tabs">
                            <div
                                className={`payment-tab ${paymentMethod === 'card' ? 'active' : ''}`}
                                onClick={() => setPaymentMethod('card')}
                            >
                                Carte bancaire<br />(Visa/Mastercard)
                            </div>
                            <div
                                className={`payment-tab ${paymentMethod === 'sepa' ? 'active' : ''}`}
                                onClick={() => setPaymentMethod('sepa')}
                            >
                                Prélèvement SEPA
                            </div>
                        </div>
                    </div>

                    {paymentMethod === 'card' && (
                        <>
                            <div className="input-group">
                                <label className="input-label">Informations de carte bancaire</label>
                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <input type="text" placeholder="Numéro de carte" className="login-input" style={{ flex: 2 }} />
                                    <input type="text" placeholder="MM/AA" className="login-input" style={{ flex: 1 }} />
                                    <input type="text" placeholder="CVC" className="login-input" style={{ flex: 1 }} />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <div className="input-group" style={{ flex: 1 }}>
                                    <label className="input-label">Nom</label>
                                    <input type="text" readOnly value={formData.nom} className="login-input" style={{ color: '#888' }} />
                                </div>
                                <div className="input-group" style={{ flex: 1 }}>
                                    <label className="input-label">Prénom</label>
                                    <input type="text" readOnly value={formData.prenom} className="login-input" style={{ color: '#888' }} />
                                </div>
                            </div>
                        </>
                    )}

                    {paymentMethod === 'sepa' && (
                        <>
                            <div className="input-group">
                                <label className="input-label">IBAN ({getIbanLabel()})</label>
                                <input type="text" placeholder={`${getIbanLabel()}XX XXXX XXXX XXXX XXXX XXXX XXX`} className="login-input" />
                            </div>

                            <div className="mandate-row">
                                <input type="checkbox" className="mandate-checkbox" id="mandate" />
                                <label htmlFor="mandate" className="mandate-text">
                                    En cochant cette case, j’autorise RomanClub à prélever le montant de mon abonnement via prélèvement SEPA.<br />
                                    Aucun prélèvement ne sera effectué avant le 1er juillet 2026.<br />
                                    Je peux annuler ce mandat ou demander un remboursement selon les conditions de ma banque.
                                </label>
                            </div>
                        </>
                    )}

                    <div className="btns-row">
                        <button
                            className="btn-secondary"
                            onClick={() => setStep(1)}
                        >
                            Retour
                        </button>
                        <button className="login-btn" style={{ marginTop: 0, flex: 2 }} onClick={handlePaymentSuccess}>
                            CRÉER MON COMPTE
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="login-container">
            <div className="login-header">
                <img src="/logo.png" alt="Roman Club Logo" className="login-logo" />
                <h1 className="brand-title">ROMAN CLUB</h1>
                <p className="page-subtitle">INSCRIPTION - ÉTAPE 1/2</p>
            </div>

            <div className="login-card">
                <form onSubmit={handleFormSubmit} style={{ width: '100%' }}>

                    <div className="input-group">
                        <label className="input-label">Nom</label>
                        <input
                            type="text"
                            name="nom"
                            className="login-input"
                            placeholder="Votre nom"
                            required
                            value={formData.nom}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="input-group" style={{ marginTop: '1rem' }}>
                        <label className="input-label">Prénom</label>
                        <input
                            type="text"
                            name="prenom"
                            className="login-input"
                            placeholder="Votre prénom"
                            required
                            value={formData.prenom}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="input-group" style={{ marginTop: '1rem' }}>
                        <label className="input-label">Email</label>
                        <input
                            type="email"
                            name="email"
                            className="login-input"
                            placeholder="votre@email.com"
                            pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
                            title="Veuillez entrer une adresse email valide"
                            required
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="input-group" style={{ marginTop: '1rem' }}>
                        <label className="input-label">Date de naissance</label>
                        <input
                            type="date"
                            name="dateNaissance"
                            className="login-input"
                            required
                            value={formData.dateNaissance}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="input-group" style={{ marginTop: '1rem' }}>
                        <label className="input-label">Sexe</label>
                        <div className="gender-selector">
                            <button
                                type="button"
                                className={`gender-btn ${formData.sexe === 'Homme' ? 'active' : ''}`}
                                onClick={() => handleSexeChange('Homme')}
                            >
                                Homme
                            </button>
                            <button
                                type="button"
                                className={`gender-btn ${formData.sexe === 'Femme' ? 'active' : ''}`}
                                onClick={() => handleSexeChange('Femme')}
                            >
                                Femme
                            </button>
                        </div>
                    </div>

                    <div className="input-group" style={{ marginTop: '1rem' }}>
                        <label className="input-label">Pays</label>
                        <select
                            name="pays"
                            className="login-input"
                            value={formData.pays}
                            onChange={handleChange}
                        >
                            <option value="France">France - Gratuit jusqu'au 30/06/2026 ensuite 15€/mois àpd du 01/07/2026</option>
                            <option value="Belgique">Belgique - Gratuit jusqu'au 30/06/2026 ensuite 15€/mois àpd du 01/07/2026</option>
                            <option value="Luxembourg">Luxembourg - Gratuit jusqu'au 30/06/2026 ensuite 15€/mois àpd du 01/07/2026</option>
                            <option value="Suisse">Suisse - Gratuit jusqu'au 30/06/2026 ensuite 14CHF/mois àpd du 01/07/2026</option>
                            <option value="Canada">Canada - Gratuit jusqu'au 30/06/2026 ensuite 25CAD/mois àpd du 01/07/2026</option>
                            <option value="Monaco">Monaco - Gratuit jusqu'au 30/06/2026 ensuite 15€/mois àpd du 01/07/2026</option>
                        </select>
                    </div>

                    <div className="input-group" style={{ marginTop: '1rem' }}>
                        <label className="input-label">Mot de passe</label>
                        <input
                            type="password"
                            name="password"
                            className="login-input"
                            placeholder="Créez votre mot de passe"
                            required
                            value={formData.password}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="input-group" style={{ marginTop: '1rem' }}>
                        <label className="input-label">Répéter mot de passe</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            className="login-input"
                            placeholder="Confirmez votre mot de passe"
                            required
                            value={formData.confirmPassword}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="input-group" style={{ marginTop: '1rem' }}>
                        <label className="input-label">Code PIN (4 chiffres)</label>
                        <input
                            type="text"
                            name="pin"
                            maxLength={4}
                            placeholder="Ex: 1234"
                            className="login-input"
                            required
                            value={formData.pin}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="input-group" style={{ marginTop: '1rem' }}>
                        <label className="input-label">Confirmer code PIN</label>
                        <input
                            type="text"
                            name="confirmPin"
                            maxLength={4}
                            placeholder="Répétez le code PIN"
                            className="login-input"
                            required
                            value={formData.confirmPin}
                            onChange={handleChange}
                        />
                    </div>

                    <button type="submit" className="login-btn" style={{ marginTop: '2rem' }}>
                        CONTINUER
                    </button>
                </form>

                <div className="helper-links">
                    <div className="create-account-link">
                        Déjà inscrit ? <Link to="/connexion" className="orange-link">Se connecter</Link>
                    </div>
                    <div className="footer-links" style={{ marginTop: '1.5rem' }}>
                        <Link to="/">← Retour à l'accueil</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RegisterPage;
