import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStripe, useElements, CardNumberElement, CardExpiryElement, CardCvcElement, IbanElement } from "@stripe/react-stripe-js";
import WelcomeModal from './WelcomeModal';
import './dashboard.css';

// =========================================
// SUB-COMPONENTS (Views)
// =========================================

const LibraryView = () => (
    <div className="dashboard-detail-view fade-in">
        <h2 className="view-title">Ma Bibliothèque</h2>
        <div className="empty-state">
            <p>Votre bibliothèque se remplira au fil de vos lectures.</p>
        </div>
    </div>
);

const ReadingTimeView = () => (
    <div className="dashboard-detail-view fade-in">
        <h2 className="view-title" style={{ color: '#4caf50' }}>Temps de lecture</h2>
        <div className="stat-highlight">
            <p>Vous avez lu <strong>12 h 45</strong> sur RomanClub</p>
        </div>
    </div>
);

const ReadingPathView = () => (
    <div className="dashboard-detail-view fade-in">
        <h2 className="view-title" style={{ color: '#ffca28' }}>Mon parcours de lecture</h2>
        <div className="path-section">
            <p>L'analyse de vos goûts s'affinera avec le temps.</p>
        </div>
    </div>
);

// --- Settings Sub-Views ---

const SettingsInvoicesView = ({ invoices, onBack }) => (
    <div className="dashboard-detail-view fade-in">
        <button className="btn-back-settings" onClick={onBack}>← Retour aux paramètres</button>
        <h2 className="view-title">Mes factures</h2>
        <div className="invoices-list">
            {invoices.length === 0 ? (
                <div className="info-box-small">
                    ℹ️ Aucune facture n'est disponible pendant la période de gratuité (avant le 01/07/2026).
                </div>
            ) : (
                <table className="invoices-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Montant</th>
                            <th>Statut</th>
                            <th>PDF</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoices.map(inv => (
                            <tr key={inv.id}>
                                <td>{new Date(inv.date * 1000).toLocaleDateString()}</td>
                                <td>{(inv.amount / 100).toFixed(2)} {inv.currency.toUpperCase()}</td>
                                <td>{inv.status}</td>
                                <td>
                                    <a href={inv.pdf} target="_blank" rel="noopener noreferrer" style={{ color: '#2196f3' }}>
                                        Télécharger
                                    </a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    </div>
);

const SettingsBooksView = ({ booksCount, onBack }) => (
    <div className="dashboard-detail-view fade-in">
        <button className="btn-back-settings" onClick={onBack}>← Retour aux paramètres</button>
        <h2 className="view-title">Mon compte RomanClub</h2>
        <div className="stat-highlight">
            <p>Vous avez accès à <strong>{booksCount}</strong> romans dans votre bibliothèque numérique.</p>
        </div>
    </div>
);


const SettingsView = ({ userProfile, setUserProfile, authToken, API_URL, stripe, elements, fetchUserData }) => {
    // Local state
    const [viewMode, setViewMode] = useState('main'); // 'main', 'invoices', 'books'

    // Email Edit State
    const [editingEmail, setEditingEmail] = useState(false);
    const [newEmail, setNewEmail] = useState(userProfile.email || "");
    const [emailStatus, setEmailStatus] = useState("");

    // Payment Edit State
    const [editingPayment, setEditingPayment] = useState(false);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState("");
    const [newPaymentType, setNewPaymentType] = useState('card'); // 'card' | 'sepa'

    // Data State
    const [invoices, setInvoices] = useState([]);
    const [booksCount, setBooksCount] = useState(0);

    useEffect(() => {
        if (viewMode === 'invoices' || viewMode === 'main') { // Optimize: fetch if likely to be needed or on mount
            // Actually, fetch on mount of SettingsView to have data ready for the counter or pre-load
            // Or separate logic. Let's fetch once on mount.
        }
    }, [viewMode]);

    useEffect(() => {
        const fetchSettingsData = async () => {
            if (!authToken) return;
            try {
                // Invoices
                const resInv = await fetch(`${API_URL}/billing/invoices`, {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });
                const dataInv = await resInv.json();
                setInvoices(dataInv.invoices || []);

                // Books Count
                const resBooks = await fetch(`${API_URL}/books/count`, {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });
                const dataBooks = await resBooks.json();
                setBooksCount(dataBooks.count);

            } catch (error) {
                console.error("Fetch settings data error:", error);
            }
        };
        fetchSettingsData();
    }, [authToken, API_URL]);


    // --- Handlers ---

    const handleUpdateEmail = async (e) => {
        e.preventDefault();
        if (!newEmail) return;
        setEmailStatus("Mise à jour...");

        try {
            const res = await fetch(`${API_URL}/me/email`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ newEmail })
            });
            const data = await res.json();
            if (res.ok) {
                setUserProfile(prev => ({ ...prev, email: newEmail }));
                setEditingEmail(false);
                setEmailStatus("Email mis à jour avec succès.");
                setTimeout(() => setEmailStatus(""), 3000);
            } else {
                setEmailStatus("Erreur: " + (data.error || "Échec"));
            }
        } catch (error) {
            setEmailStatus("Erreur de connexion.");
        }
    };

    const handleCancelEmail = () => {
        setEditingEmail(false);
        setNewEmail(userProfile.email || "");
        setEmailStatus("");
    };

    const handleUpdatePaymentMethod = async (e) => {
        e.preventDefault();
        setPaymentLoading(true);
        setPaymentStatus("");

        if (!stripe || !elements) return;

        try {
            // 1. Create Setup Intent
            const resSetup = await fetch(`${API_URL}/billing/create-setup-intent`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            const dataSetup = await resSetup.json();

            if (!dataSetup.clientSecret) throw new Error("Erreur init paiement");

            let setupError, setupIntent;

            // 2. Confirm Setup Intent via Stripe Elements
            if (newPaymentType === 'card') {
                const cardElement = elements.getElement(CardNumberElement);
                const result = await stripe.confirmCardSetup(dataSetup.clientSecret, {
                    payment_method: {
                        card: cardElement,
                        billing_details: { email: userProfile.email, name: `${userProfile.prenom} ${userProfile.nom}` }
                    }
                });
                setupError = result.error;
                setupIntent = result.setupIntent;
            } else {
                const ibanElement = elements.getElement(IbanElement);
                const result = await stripe.confirmSepaDebitSetup(dataSetup.clientSecret, {
                    payment_method: {
                        sepa_debit: ibanElement,
                        billing_details: { email: userProfile.email, name: `${userProfile.prenom} ${userProfile.nom}` }
                    }
                });
                setupError = result.error;
                setupIntent = result.setupIntent;
            }

            if (setupError) throw new Error(setupError.message);

            // 3. Finalize on Backend
            const resUpdate = await fetch(`${API_URL}/billing/update-payment-method`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    paymentMethodId: setupIntent.payment_method,
                    paymentMethodType: newPaymentType
                })
            });

            if (resUpdate.ok) {
                setPaymentStatus("Moyen de paiement mis à jour.");
                setEditingPayment(false);
                fetchUserData(); // Refresh profile
            } else {
                throw new Error("Erreur sauvegarde backend.");
            }

        } catch (error) {
            console.error(error);
            setPaymentStatus("Erreur: " + error.message);
        } finally {
            setPaymentLoading(false);
        }
    };

    const elementStyle = {
        base: { fontSize: '16px', color: '#fff', '::placeholder': { color: '#aab7c4' } },
        invalid: { color: '#fa755a' }
    };

    // --- Render Logic ---

    if (viewMode === 'invoices') return <SettingsInvoicesView invoices={invoices} onBack={() => setViewMode('main')} />;
    if (viewMode === 'books') return <SettingsBooksView booksCount={booksCount} onBack={() => setViewMode('main')} />;

    // Main Settings View
    return (
        <div className="dashboard-detail-view fade-in">
            <h2 className="view-title" style={{ color: '#2196f3' }}>Paramètres</h2>

            {/* 1. Account Data */}
            <section className="settings-section">
                <h3>Mon Compte</h3>
                <div className="settings-card">
                    <div className="setting-row"><span className="label">Nom :</span> {userProfile.nom}</div>
                    <div className="setting-row"><span className="label">Prénom :</span> {userProfile.prenom}</div>

                    <div className="setting-row email-row">
                        <span className="label">Email :</span>
                        {editingEmail ? (
                            <form className="email-edit-form" onSubmit={handleUpdateEmail}>
                                <input
                                    type="email"
                                    value={newEmail}
                                    onChange={e => setNewEmail(e.target.value)}
                                    className="edit-input"
                                    required
                                />
                                <div className="edit-actions">
                                    <button type="submit" className="btn-small-confirm">Enregistrer</button>
                                    <button type="button" onClick={handleCancelEmail} className="btn-small-cancel">Annuler</button>
                                </div>
                            </form>
                        ) : (
                            <div className="email-display">
                                <span>{userProfile.email}</span>
                                <button onClick={() => { setEditingEmail(true); setNewEmail(userProfile.email); }} className="btn-text-action">
                                    Modifier
                                </button>
                            </div>
                        )}
                    </div>
                    {emailStatus && <div className="status-message-small">{emailStatus}</div>}

                    <div className="setting-row"><span className="label">Inscrit le :</span> {userProfile.dateInscription ? new Date(userProfile.dateInscription).toLocaleDateString() : '-'}</div>
                    <div className="setting-row">
                        <span className="label">Statut :</span>
                        <span className={`status-pill ${userProfile.subscriptionStatus === 'active' ? 'done' : 'ongoing'}`}>
                            {userProfile.subscriptionStatus === 'active' ? 'Abonné actif' : 'Inactif'}
                        </span>
                    </div>
                </div>
            </section>

            {/* 2. Payment Method */}
            <section className="settings-section">
                <h3>Moyen de paiement</h3>
                <div className="settings-card">
                    <div className="setting-row">
                        <span className="label">Actuel :</span>
                        <span>{userProfile.paymentMethodType === 'sepa' || userProfile.paymentMethodType === 'sepa_debit' ? 'Prélèvement SEPA' : 'Carte Bancaire'}</span>
                    </div>
                    <div className="setting-row">
                        <span className="label">Identifiant :</span>
                        <span style={{ fontFamily: 'monospace' }}>•••• {userProfile.paymentMethodId ? userProfile.paymentMethodId.slice(-4) : '****'}</span>
                    </div>

                    {!editingPayment ? (
                        <button className="btn-secondary" onClick={() => setEditingPayment(true)} style={{ marginTop: '10px' }}>
                            Modifier mon moyen de paiement
                        </button>
                    ) : (
                        <form className="payment-update-form" onSubmit={handleUpdatePaymentMethod}>
                            <h4>Nouveau moyen de paiement</h4>
                            <div className="payment-tabs-mini">
                                <span
                                    className={newPaymentType === 'card' ? 'active' : ''}
                                    onClick={() => setNewPaymentType('card')}
                                >Carte</span>
                                <span
                                    className={newPaymentType === 'sepa' ? 'active' : ''}
                                    onClick={() => setNewPaymentType('sepa')}
                                >SEPA</span>
                            </div>

                            <div className="payment-element-container" style={{ background: '#333', padding: '10px', borderRadius: '4px', marginBottom: '10px' }}>
                                {newPaymentType === 'card' ? (
                                    <CardNumberElement options={{ style: elementStyle, showIcon: true }} />
                                ) : (
                                    <IbanElement options={{ supportedCountries: ['SEPA'], style: elementStyle }} />
                                )}
                            </div>
                            {newPaymentType === 'card' && (
                                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                    <div style={{ flex: 1, background: '#333', padding: '10px', borderRadius: '4px' }}>
                                        <CardExpiryElement options={{ style: elementStyle }} />
                                    </div>
                                    <div style={{ flex: 1, background: '#333', padding: '10px', borderRadius: '4px' }}>
                                        <CardCvcElement options={{ style: elementStyle }} />
                                    </div>
                                </div>
                            )}

                            <div className="form-actions">
                                <button type="submit" className="btn-primary" disabled={paymentLoading}>
                                    {paymentLoading ? 'Validation...' : 'Enregistrer'}
                                </button>
                                <button type="button" className="btn-text-cancel" onClick={() => setEditingPayment(false)}>Annuler</button>
                            </div>
                        </form>
                    )}
                    {paymentStatus && <div className="status-message-small">{paymentStatus}</div>}
                </div>
            </section>

            {/* 3. Navigation Links (Invoices / Books) */}
            <section className="settings-section">
                <h3>Informations & Facturation</h3>
                <div className="settings-nav-buttons">
                    <button className="settings-nav-btn" onClick={() => setViewMode('invoices')}>
                        <span className="icon">📄</span>
                        <span>Mes factures</span>
                        <span className="arrow">→</span>
                    </button>

                    <button className="settings-nav-btn" onClick={() => setViewMode('books')}>
                        <span className="icon">📚</span>
                        <span>Mes livres</span>
                        <span className="arrow">→</span>
                    </button>
                </div>
            </section>

            <div className="settings-actions" style={{ marginTop: '2rem', borderTop: '1px solid #333', paddingTop: '1rem' }}>
                <p className="hint-text">Pour résilier votre abonnement, veuillez contacter le support.</p>
            </div>
        </div>
    );
};

// =========================================
// MAIN COMPONENT
// =========================================

const DashboardPage = () => {
    const navigate = useNavigate();
    const stripe = useStripe();
    const elements = useElements();
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

    const [view, setView] = useState('dashboard');
    const [authToken] = useState(localStorage.getItem("authToken"));

    // User Data State
    const [userProfile, setUserProfile] = useState({});

    // Initial Data Load
    useEffect(() => {
        if (!authToken) {
            navigate("/connexion");
            return;
        }
        fetchUserData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authToken]);

    const fetchUserData = async () => {
        try {
            const resMe = await fetch(`${API_URL}/me`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });

            if (resMe.status === 401) {
                handleLogout();
                return;
            }

            const dataMe = await resMe.json();
            setUserProfile(dataMe);

        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("userLoggedIn");
        localStorage.removeItem("user");
        localStorage.removeItem("authToken");
        navigate("/");
    };

    return (
        <div className="dashboard-container">
            <WelcomeModal />
            <header className="dashboard-header">
                <div className="header-left">
                    <img src="/logo.png" alt="Logo" className="header-logo" />
                    <h1>Tableau de bord</h1>
                </div>
                <div className="header-right">
                    <span className="user-welcome">Bienvenue, {userProfile.prenom || "Lecteur"}</span>
                    <button className="btn-logout" onClick={handleLogout}>Déconnexion</button>
                </div>
            </header>

            <main className="dashboard-main">
                {view === 'dashboard' ? (
                    <div className="tiles-grid fade-in">
                        {/* Orange Tile - Library */}
                        <div className="dash-tile tile-orange" onClick={() => setView('library')}>
                            <div className="tile-icon">📚</div>
                            <h2>Ma bibliothèque</h2>
                            <p>Accéder à vos romans</p>
                        </div>

                        {/* Green Tile - Reading Time */}
                        <div className="dash-tile tile-green" onClick={() => setView('stats')}>
                            <div className="tile-icon">⏱️</div>
                            <h2>Temps de lecture</h2>
                            <p className="tile-value">12 h 45 de lecture</p>
                        </div>

                        {/* Yellow Tile - Reading Path */}
                        <div className="dash-tile tile-yellow" onClick={() => setView('path')}>
                            <div className="tile-icon">🧭</div>
                            <h2>Mon parcours</h2>
                            <p>Analyse de vos goûts</p>
                        </div>

                        {/* Blue Tile - Settings */}
                        <div className="dash-tile tile-blue" onClick={() => setView('settings')}>
                            <div className="tile-icon">⚙️</div>
                            <h2>Paramètres</h2>
                            <p>Mon compte</p>
                        </div>
                    </div>
                ) : (
                    <div className="detail-view-container">
                        {/* Back button logic is slightly different for Settings main view vs subviews? 
                            The settings sub-views have their own back buttons. 
                            The MAIN settings view needs a back button to dashboard. */}

                        <button className="btn-back" onClick={() => setView('dashboard')}>
                            ← Retour au tableau de bord
                        </button>

                        {view === 'library' && <LibraryView />}
                        {view === 'stats' && <ReadingTimeView />}
                        {view === 'path' && <ReadingPathView />}

                        {view === 'settings' && (
                            <SettingsView
                                userProfile={userProfile}
                                setUserProfile={setUserProfile}
                                authToken={authToken}
                                API_URL={API_URL}
                                stripe={stripe}
                                elements={elements}
                                fetchUserData={fetchUserData}
                            />
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default DashboardPage;
