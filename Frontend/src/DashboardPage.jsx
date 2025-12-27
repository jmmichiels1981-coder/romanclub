import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStripe, useElements, CardNumberElement, CardExpiryElement, CardCvcElement, IbanElement } from "@stripe/react-stripe-js";
import WelcomeModal from './WelcomeModal';
import TutorialModal from './TutorialModal';
import { getDeviceId } from "./utils/device";
import './dashboard.css';

// =========================================
// TUTORIAL CONTENT CONSTANTS
// =========================================
const TUTORIAL_CONTENT = {
    library: {
        title: "📘 Votre bibliothèque RomanClub",
        content: (
            <>
                <p className="welcome-text">Ici se trouvent tous les romans disponibles dans votre abonnement.</p>
                <ul className="welcome-list">
                    <li><strong>Nouveautés de la semaine :</strong> le roman publié le dimanche, avec son résumé éditorial.</li>
                    <li><strong>Romans en cours :</strong> ceux que vous avez commencés. Vous pouvez reprendre exactement où vous vous êtes arrêté, et générer un Résumé IA par chapitre.</li>
                    <li><strong>Romans lus :</strong> votre historique de lecture. Vous pouvez relire un roman ou générer un Résumé IA complet.</li>
                </ul>
                <p className="welcome-text">Cliquez sur <strong>Lire</strong> pour commencer ou reprendre un roman.</p>
            </>
        )
    },
    stats: { // Reading Time
        title: "⏱️ Votre temps de lecture",
        content: (
            <>
                <p className="welcome-text">RomanClub suit votre temps de lecture pour valoriser votre parcours, sans comparaison ni pression.</p>
                <ul className="welcome-list">
                    <li>Temps total de lecture depuis votre inscription</li>
                    <li>Moyenne quotidienne</li>
                    <li>Détail par roman (en cours ou terminé)</li>
                </ul>
                <p className="welcome-text">Chaque titre est cliquable pour revenir directement au roman concerné.</p>
            </>
        )
    },
    path: { // Reading Path
        title: "📊 Votre parcours de lecteur",
        content: (
            <>
                <p className="welcome-text">Cette section met en lumière votre parcours de lecture au fil du temps.</p>
                <p className="welcome-text">Vous y verrez :</p>
                <ul className="welcome-list">
                    <li>les genres que vous lisez le plus</li>
                    <li>la répartition de votre temps par genre</li>
                    <li>l’évolution naturelle de vos goûts</li>
                </ul>
                <div style={{ marginTop: '1rem', padding: '10px', background: 'rgba(255,165,0,0.1)', borderLeft: '3px solid #ff7700', borderRadius: '4px' }}>
                    <strong>⚠️ Aucune recommandation automatique :</strong><br />
                    RomanClub publie toujours un roman par genre chaque mois.
                </div>
            </>
        )
    },
    settings: {
        title: "⚙️ Votre compte RomanClub",
        content: (
            <>
                <p className="welcome-text">Depuis cette section, vous pouvez gérer votre compte :</p>
                <ul className="welcome-list">
                    <li>modifier votre adresse email</li>
                    <li>mettre à jour votre moyen de paiement</li>
                    <li>consulter vos factures</li>
                    <li>accéder à <strong>Mes livres</strong> : tous les romans commencés et lus</li>
                </ul>
                <p className="welcome-text">L’annulation de l’abonnement est possible à tout moment, avec effet en fin de période.</p>
            </>
        )
    }
};

// MOCK DATA REMOVED
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// =========================================
// SUB-COMPONENTS (Views)
// =========================================

const LibraryView = ({ initialSection, onClearInitial, authToken }) => {
    const [activeSection, setActiveSection] = useState(initialSection || null);
    const [newBooks, setNewBooks] = useState([]);
    const [ongoingBooks, setOngoingBooks] = useState([]);
    const [readBooks, setReadBooks] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        if (initialSection) {
            setActiveSection(initialSection);
            onClearInitial();
        }
    }, [initialSection, onClearInitial]);

    // Fetch Data
    useEffect(() => {
        if (!authToken) return;

        const fetchData = async () => {
            try {
                const [resNew, resReading, resCompleted] = await Promise.all([
                    fetch(`${API_URL}/library/weekly`, { headers: { 'Authorization': `Bearer ${authToken}` } }),
                    fetch(`${API_URL}/library/reading`, { headers: { 'Authorization': `Bearer ${authToken}` } }),
                    fetch(`${API_URL}/library/completed`, { headers: { 'Authorization': `Bearer ${authToken}` } })
                ]);

                const dataNew = await resNew.json();
                const dataReading = await resReading.json();
                const dataCompleted = await resCompleted.json();

                setNewBooks(dataNew.items || []);
                setOngoingBooks(dataReading.items || []);
                setReadBooks(dataCompleted.items || []);

            } catch (e) {
                console.error("Library fetch error", e);
            }
        };
        fetchData();
    }, [authToken]);

    const handleStartRead = async (bookId) => {
        try {
            await fetch(`${API_URL}/library/${bookId}/start-or-resume`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            navigate(`/lecture/${bookId}`);
        } catch (e) {
            console.error(e);
        }
    };

    const renderSectionContent = () => {
        switch (activeSection) {
            case 'new':
                return (
                    <div className="content-tile tile-orange fade-in">
                        <h3>Nouveautés de la semaine</h3>
                        {newBooks.length === 0 ? <p>Aucun nouveau roman pour le moment.</p> : newBooks.map(book => (
                            <div key={book.bookId} className="book-card">
                                <div className="book-info">
                                    <h4>{book.title} <span className="genre-tag">{book.genre}</span></h4>
                                    <p className="author">de {book.author} — Publié le {new Date(book.publishedAt).toLocaleDateString()}</p>
                                    <p className="summary">{book.editorialSummary}</p>
                                </div>
                                <div className="book-actions">
                                    <button className="btn-action" onClick={() => handleStartRead(book.bookId)}>Commencer</button>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            case 'ongoing':
                return (
                    <div className="content-tile tile-green fade-in">
                        <h3>En cours de lecture</h3>
                        {ongoingBooks.length === 0 ? <p>Aucun livre en cours.</p> : ongoingBooks.map(book => (
                            <div key={book.bookId} className="book-card">
                                <div className="book-info">
                                    <h4>{book.title}</h4>
                                    <div className="progress-container">
                                        <div className="progress-bar-bg">
                                            <div className="progress-bar-fill" style={{ width: `${book.progressPercent}%` }}></div>
                                        </div>
                                        <span className="status-text">{book.progressPercent}% lu</span>
                                    </div>
                                </div>
                                <div className="book-actions">
                                    <button className="btn-action" onClick={() => handleStartRead(book.bookId)}>Reprendre</button>
                                    <button className="btn-secondary">Résumé IA</button>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            case 'read':
                return (
                    <div className="content-tile tile-blue fade-in">
                        <h3>Romans lus</h3>
                        {readBooks.length === 0 ? <p>Aucun livre terminé.</p> : readBooks.map(book => (
                            <div key={book.bookId} className="book-card">
                                <div className="book-info">
                                    <h4>{book.title}</h4>
                                    <p className="author">Terminé le {new Date(book.completedAt).toLocaleDateString()}</p>
                                </div>
                                <div className="book-actions">
                                    <button className="btn-secondary" onClick={() => handleStartRead(book.bookId)}>Relire</button>
                                    <button className="btn-secondary">Résumé IA</button>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="dashboard-detail-view fade-in">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 className="view-title" style={{ borderBottom: 'none', marginBottom: 0 }}>Ma Bibliothèque</h2>
                {activeSection && (
                    <button className="btn-back-settings" onClick={() => setActiveSection(null)} style={{ marginBottom: 0 }}>
                        ← Retour au menu
                    </button>
                )}
            </div>
            <div style={{ borderBottom: '1px solid #333', marginBottom: '2rem', marginTop: '0.5rem' }}></div>

            {!activeSection ? (
                <div className="tiles-grid">
                    <div className="dash-tile tile-orange" onClick={() => setActiveSection('new')}>
                        <div className="tile-icon">🔥</div>
                        <h2>Nouveautés de la semaine</h2>
                    </div>

                    <div className="dash-tile tile-green" onClick={() => setActiveSection('ongoing')}>
                        <div className="tile-icon">📖</div>
                        <h2>En cours de lecture</h2>
                    </div>

                    <div className="dash-tile tile-blue" onClick={() => setActiveSection('read')}>
                        <div className="tile-icon">✅</div>
                        <h2>Romans lus</h2>
                    </div>
                </div>
            ) : (
                renderSectionContent()
            )}
        </div>
    );
};

// Reading Time with Clickable Items
const ReadingTimeView = ({ onNavigateToLibrary, authToken }) => {
    const [stats, setStats] = useState({ totalHuman: "...", detail: [] });

    useEffect(() => {
        if (!authToken) return;
        const fetchStats = async () => {
            // Mocking detail list if backend returns empty byBook, but we fetch summary
            const res = await fetch(`${API_URL}/stats/reading-time/summary`, { headers: { 'Authorization': `Bearer ${authToken}` } });
            const data = await res.json();

            // Also fetch details for list if available
            // For now using data from summary assuming it might have details or just generic
            // The backend detailed endpoint is: /stats/reading-time/detail

            setStats({ totalHuman: data.totalHuman, detail: [] });
        };
        fetchStats();
    }, [authToken]);

    return (
        <div className="dashboard-detail-view fade-in">
            <h2 className="view-title" style={{ color: '#4caf50' }}>Temps de lecture</h2>

            <div className="stat-highlight">
                <p>Vous avez lu <strong>{stats.totalHuman}</strong> sur RomanClub</p>
                <p className="sub-stat">Moyenne : -- min / jour</p>
            </div>

            <section className="reading-list">
                <h3 style={{ color: '#ccc', marginBottom: '1rem', borderBottom: '1px solid #333', paddingBottom: '0.5rem' }}>Détail par livre</h3>
                <p>Données détaillées bientôt disponibles.</p>
            </section>
        </div>
    );
};

const ReadingPathView = ({ authToken }) => {
    const [stats, setStats] = useState({ genresRead: [], genreBreakdown: [], editorialInsight: "" });

    useEffect(() => {
        if (!authToken) return;
        const fetchPath = async () => {
            const res = await fetch(`${API_URL}/stats/reading-journey`, { headers: { 'Authorization': `Bearer ${authToken}` } });
            const data = await res.json();
            setStats(data);
        };
        fetchPath();
    }, [authToken]);

    return (
        <div className="dashboard-detail-view fade-in">
            <h2 className="view-title" style={{ color: '#ffca28' }}>Mon parcours de lecture</h2>

            <div className="path-section">
                <h3>Vos genres de prédilection</h3>
                <ul className="genres-list">
                    {stats.genreBreakdown.map((stat, idx) => (
                        <li key={idx} className="dist-item">
                            <div className="dist-header">
                                <span>{stat.genre}</span>
                                <span>{stat.percent} %</span>
                            </div>
                            <div className="dist-bar-bg">
                                <div className="dist-bar-fill" style={{ width: `${stat.percent}%`, backgroundColor: idx === 0 ? '#ffca28' : '#666' }}></div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="editorial-box">
                <p>
                    <strong>Analyse de votre profil :</strong><br />
                    {stats.editorialInsight}
                </p>
            </div>
        </div>
    );
};

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

// Expanded Account View (Synthesis)
const SettingsAccountView = ({ booksCount, onBack, onNavigateToLibrary, authToken }) => {
    // We can fetch user's books here too to show the list if needed, or just booksCount
    // The previous design had a list of all reads.
    // Let's implement fetching all "reading" + "completed" to show here.
    const [allBooks, setAllBooks] = useState([]);

    useEffect(() => {
        if (!authToken) return;
        const fetchAll = async () => {
            const [resRead, resComp, resNew] = await Promise.all([
                fetch(`${API_URL}/library/reading`, { headers: { 'Authorization': `Bearer ${authToken}` } }),
                fetch(`${API_URL}/library/completed`, { headers: { 'Authorization': `Bearer ${authToken}` } }),
                fetch(`${API_URL}/library/weekly`, { headers: { 'Authorization': `Bearer ${authToken}` } })
            ]);
            const dataRead = await resRead.json();
            const dataComp = await resComp.json();
            const dataNew = await resNew.json();

            // Filter out new books that are already in reading or completed to avoid duplicates if backend doesn't handle it
            // Assuming backend lists are distinct for simplicty, or we just show them.
            // But usually 'weekly' are all available. 'reading' are subset of started.
            // Let's just merge all.
            const merged = [
                ...(dataNew.items || []).map(b => ({ ...b, status: 'Nouveau', type: 'new' })),
                ...(dataRead.items || []).map(b => ({ ...b, status: 'En cours', type: 'ongoing' })),
                ...(dataComp.items || []).map(b => ({ ...b, status: 'Terminé', type: 'read' }))
            ];

            // Deduplicate by bookId (prefer 'En cours'/'Terminé' over 'Nouveau')
            const uniqueBooks = [];
            const map = new Map();
            for (const item of merged) {
                if (!map.has(item.bookId)) {
                    map.set(item.bookId, true);
                    uniqueBooks.push(item);
                } else {
                    // Start/Finish status overwrites 'Nouveau' ?
                    // Since we added 'new' first, subsequent 'ongoing' should overwrite? 
                    // No, Map prevents overwrite.
                    // Let's reverse order: Completed, Reading, New.
                }
            }

            // Better approach:
            // 1. Create map from New
            // 2. Overwrite with Reading
            // 3. Overwrite with Completed
            const bookMap = new Map();
            (dataNew.items || []).forEach(b => bookMap.set(b.bookId, { ...b, status: 'À découvrir', type: 'new' }));
            (dataRead.items || []).forEach(b => bookMap.set(b.bookId, { ...b, status: 'En cours', type: 'ongoing' }));
            (dataComp.items || []).forEach(b => bookMap.set(b.bookId, { ...b, status: 'Terminé', type: 'read' }));

            setAllBooks(Array.from(bookMap.values()));
        };
        fetchAll();
    }, [authToken]);

    return (
        <div className="dashboard-detail-view fade-in">
            <button className="btn-back-settings" onClick={onBack}>← Retour aux paramètres</button>
            <h2 className="view-title">Mon compte RomanClub</h2>

            <div className="stat-highlight">
                <p>Vous avez accès à <strong>{booksCount}</strong> romans dans votre bibliothèque numérique.</p>
            </div>

            <section className="account-books-list">
                <h3>Vos lectures (Synthèse)</h3>
                {allBooks.length === 0 ? <p>Aucun livre commencé.</p> : allBooks.map((book) => (
                    <div key={book.bookId} className="reading-item clickable-row" onClick={() => onNavigateToLibrary(book.type)}>
                        <div className="book-info-minimal">
                            <span
                                className="book-title"
                                style={{ textDecoration: 'underline', cursor: 'pointer', color: '#fff' }}
                            >
                                {book.title}
                            </span>
                            <div className="book-meta-sub">
                                <span className={`status-text-simple ${book.status === 'Terminé' ? 'done' : 'ongoing'}`}>
                                    {book.status}
                                </span>
                            </div>
                        </div>
                        <span style={{ fontSize: '1.2rem', color: '#555' }}>›</span>
                    </div>
                ))}
            </section>
        </div>
    );
};

const SettingsView = ({ userProfile, setUserProfile, authToken, API_URL, stripe, elements, fetchUserData, onNavigateToLibrary }) => {
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
    const [newPaymentType, setNewPaymentType] = useState('card');
    const [sepaAccepted, setSepaAccepted] = useState(false);

    // Iban State
    const [ibanComplete, setIbanComplete] = useState(false);

    // Cancellation State
    const [cancelling, setCancelling] = useState(false);

    // PIN Change State
    const [editingPin, setEditingPin] = useState(false);
    const [pinData, setPinData] = useState({ currentPin: "", newPin: "" });
    const [pinStatus, setPinStatus] = useState("");

    // Data State
    const [invoices, setInvoices] = useState([]);
    const [booksCount, setBooksCount] = useState(0);

    // Options for Stripe Elements
    const BASE_CARD_STYLE = {
        base: { fontSize: '16px', color: '#fff', '::placeholder': { color: '#aab7c4' } },
        invalid: { color: '#fa755a' }
    };

    const CARD_NUM_OPTIONS = {
        style: BASE_CARD_STYLE,
        placeholder: '', // Clean no digits
        showIcon: true,
        disableLink: true
    };

    // Explicit placeholder for Expiry based on request
    const CARD_EXP_OPTIONS = {
        style: BASE_CARD_STYLE,
        placeholder: 'MM / AA'
    };

    // Explicit placeholder for CVC (Empty to avoid '123' or 'CVC' if user wants strictly no example digits)
    const CARD_CVC_OPTIONS = {
        style: BASE_CARD_STYLE,
        placeholder: ''
    };

    // Logic for Country
    const userCountry = userProfile.pays || 'FR'; // 'BE', 'FR', etc.
    const showSepaOption = userCountry !== 'CA';

    // Strict IBAN: Force placeholder to be invisible using CSS color: transparent.
    // This is the only way to guarantee 'clean' empty look if Stripe enforces a default.
    const IBAN_ELEMENT_OPTIONS = {
        supportedCountries: ['SEPA'],
        placeholderCountry: 'FR', // Keep a valid country for formatting logic if needed, but hide the visual text
        style: {
            base: {
                fontSize: '16px',
                color: '#fff',
                '::placeholder': { color: 'transparent' }
            },
            invalid: {
                color: '#fa755a'
            }
        }
    };

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
                setBooksCount(dataBooks.count || 3);

            } catch (error) {
                console.error("Fetch settings data error:", error);
                setBooksCount(3);
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

    // Calculate if Save button should be disabled
    const isSaveDisabled = () => {
        if (paymentLoading) return true;
        if (!stripe || !elements) return true;
        if (newPaymentType === 'sepa') {
            return !sepaAccepted || !ibanComplete;
        }
        return false;
    };

    const handleUpdatePaymentMethod = async (e) => {
        e.preventDefault();
        setPaymentLoading(true);
        setPaymentStatus("");

        if (!stripe || !elements) return;

        if (newPaymentType === 'sepa' && !sepaAccepted) {
            setPaymentStatus("Vous devez accepter le mandat SEPA pour continuer.");
            setPaymentLoading(false);
            return;
        }

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
                setSepaAccepted(false);
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

    const handleCancelSubscription = async () => {
        if (!window.confirm("Êtes-vous sûr de vouloir résilier votre abonnement ? La résiliation prendra effet à la fin de la période en cours.")) {
            return;
        }

        setCancelling(true);
        try {
            const res = await fetch(`${API_URL}/billing/cancel-subscription`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            const data = await res.json();
            if (res.ok) {
                alert("Votre abonnement a été résilié. Il prendra fin à l'échéance prévue.");
                fetchUserData(); // Refresh status
            } else {
                alert("Erreur lors de la résiliation : " + (data.error || "Erreur inconnue"));
            }
        } catch (error) {
            console.error("Cancellation error", error);
            alert("Erreur de connexion.");
        } finally {
            setCancelling(false);
        }
    };

    const handleUpdatePin = async (e) => {
        e.preventDefault();
        setPinStatus("Validation...");
        try {
            const res = await fetch(`${API_URL}/me/change-pin`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(pinData)
            });
            const data = await res.json();
            if (res.ok) {
                setPinStatus("✅ Code PIN modifié avec succès !");
                setTimeout(() => {
                    setEditingPin(false);
                    setPinStatus("");
                    setPinData({ currentPin: "", newPin: "" });
                }, 2000);
            } else {
                setPinStatus("❌ " + (data.error || "Erreur"));
            }
        } catch (error) {
            setPinStatus("❌ Erreur de connexion");
        }
    };

    // --- Render Logic ---

    if (viewMode === 'invoices') return <SettingsInvoicesView invoices={invoices} onBack={() => setViewMode('main')} />;
    if (viewMode === 'books') return <SettingsAccountView booksCount={booksCount} onBack={() => setViewMode('main')} onNavigateToLibrary={onNavigateToLibrary} authToken={authToken} />;

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
                            {userProfile.subscriptionStatus === 'active' ? 'Abonné actif' : (userProfile.subscriptionStatus === 'cancel_at_period_end' ? 'Résiliation programmée' : 'Inactif')}
                        </span>
                    </div>
                </div>
            </section>


            {/* 2. Security (PIN) */}
            <section className="settings-section">
                <h3>Sécurité</h3>
                <div className="settings-card">
                    <div className="setting-row">
                        <span className="label">Code PIN :</span>
                        <span>••••••</span>
                    </div>

                    {!editingPin ? (
                        <button className="btn-secondary" onClick={() => setEditingPin(true)} style={{ marginTop: '10px' }}>
                            Changer mon code PIN
                        </button>
                    ) : (
                        <form className="email-edit-form" onSubmit={handleUpdatePin} style={{ marginTop: '1rem', background: '#333', padding: '1rem', borderRadius: '8px' }}>
                            <div className="input-group" style={{ marginBottom: '1rem' }}>
                                <label className="input-label" style={{ fontSize: '0.9rem' }}>Code PIN actuel</label>
                                <input
                                    type="password"
                                    maxLength={6}
                                    className="login-input"
                                    required
                                    value={pinData.currentPin}
                                    onChange={e => setPinData({ ...pinData, currentPin: e.target.value })}
                                />
                            </div>
                            <div className="input-group" style={{ marginBottom: '1rem' }}>
                                <label className="input-label" style={{ fontSize: '0.9rem' }}>Nouveau Code PIN (6 chiffres)</label>
                                <input
                                    type="password"
                                    maxLength={6}
                                    placeholder="••••••"
                                    className="login-input"
                                    required
                                    value={pinData.newPin}
                                    onChange={e => setPinData({ ...pinData, newPin: e.target.value })}
                                />
                            </div>
                            <div className="edit-actions">
                                <button type="submit" className="btn-small-confirm">Confirmer</button>
                                <button type="button" onClick={() => { setEditingPin(false); setPinStatus(""); }} className="btn-small-cancel">Annuler</button>
                            </div>
                            {pinStatus && <div className="status-message-small" style={{ marginTop: '0.5rem', color: pinStatus.includes('✅') ? '#4caf50' : '#fa755a' }}>{pinStatus}</div>}
                        </form>
                    )}
                </div>
            </section>

            {/* 3. Payment Method */}
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
                                {showSepaOption && (
                                    <span
                                        className={newPaymentType === 'sepa' ? 'active' : ''}
                                        onClick={() => setNewPaymentType('sepa')}
                                    >SEPA</span>
                                )}
                            </div>

                            <div className="payment-element-box" style={{ marginBottom: '1rem' }}>
                                {newPaymentType === 'card' ? (
                                    <div className="stripe-field-group">
                                        <label>Numéro de carte</label>
                                        <div className="stripe-input"><CardNumberElement options={CARD_NUM_OPTIONS} /></div>
                                        <div className="row-2">
                                            <div><label>Expiration</label><div className="stripe-input"><CardExpiryElement options={CARD_EXP_OPTIONS} /></div></div>
                                            <div>
                                                <label>CVC</label>
                                                <div className="stripe-input"><CardCvcElement options={CARD_CVC_OPTIONS} /></div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="stripe-field-group">
                                        <label>IBAN</label>
                                        <div className="stripe-input">
                                            <IbanElement
                                                options={IBAN_ELEMENT_OPTIONS}
                                                onChange={(e) => setIbanComplete(e.complete)}
                                            />
                                        </div>
                                        <div className="mandate-box" style={{ marginTop: '1.5rem', background: '#2a2a2d', padding: '1rem', borderRadius: '8px' }}>
                                            <label className="mandate-label" style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={sepaAccepted}
                                                    onChange={(e) => setSepaAccepted(e.target.checked)}
                                                    style={{ marginTop: '4px' }}
                                                />
                                                <div className="mandate-text" style={{ fontSize: '0.8rem', color: '#ccc', lineHeight: '1.4', textAlign: 'left' }}>
                                                    En cochant cette case, j’autorise RomanClub à prélever le montant de mon abonnement via prélèvement SEPA.
                                                    Aucun prélèvement ne sera effectué avant le 1er juillet 2026.
                                                    Je peux annuler ce mandat ou demander un remboursement selon les conditions de ma banque.
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="form-actions">
                                <button type="submit" className="btn-primary" disabled={isSaveDisabled()}>
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
                    </button>
                    <button className="settings-nav-btn" onClick={() => setViewMode('books')}>
                        <span className="icon">📚</span>
                        <span>Mes livres</span>
                    </button>
                </div>
            </section>

            <button className="btn-text-cancel" style={{ marginTop: '2rem', fontSize: '0.8rem' }} onClick={handleCancelSubscription}>
                {cancelling ? 'Traitement...' : 'Annuler l\'abonnement'}
            </button>
        </div >
    );
};

// =========================================
// MAIN COMPONENT
// =========================================

const DashboardPage = () => {
    const navigate = useNavigate();
    const [view, setView] = useState('dashboard'); // 'dashboard', 'library', 'stats', 'path', 'settings'
    const [userProfile, setUserProfile] = useState({});
    const [loading, setLoading] = useState(true);

    // Tutorial State
    const [activeTutorial, setActiveTutorial] = useState(null); // 'library', 'stats', 'path', 'settings'

    // UI State for Deep Linking
    const [libraryDefaultSection, setLibraryDefaultSection] = useState(null);

    const stripe = useStripe();
    const elements = useElements();

    const API_URL = import.meta.env.VITE_API_URL || 'https://romanclub-backend-1.onrender.com/api';
    const authToken = localStorage.getItem('authToken');

    useEffect(() => {
        if (!authToken) {
            navigate("/");
            return;
        }
        fetchUserData();
    }, [authToken, navigate]);

    const fetchUserData = async () => {
        setLoading(true);
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
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("userLoggedIn");
        localStorage.removeItem("user");
        localStorage.removeItem("authToken");
        navigate("/");
    };

    const handleNavigateToLibrary = (section) => {
        setLibraryDefaultSection(section);
        setView('library');
    };

    // --- Tutorial Logic ---
    const handleTileClick = (tileKey) => {
        // dictionary key map for consistency with localStorage keys and TUTORIAL_CONTENT keys
        // tileKey expected: 'library', 'stats', 'path', 'settings'

        const storageKey = "tutorialsSeen";
        let seenData = {};
        try {
            seenData = JSON.parse(localStorage.getItem(storageKey)) || {};
        } catch (e) {
            seenData = {};
        }

        if (seenData[tileKey]) {
            // Already seen -> Navigate directly
            setView(tileKey);
        } else {
            // Not seen -> Show Tutorial
            setActiveTutorial(tileKey);
        }
    };

    const handleCloseTutorial = () => {
        if (!activeTutorial) return;

        // Save to LocalStorage
        const storageKey = "tutorialsSeen";
        let seenData = {};
        try {
            seenData = JSON.parse(localStorage.getItem(storageKey)) || {};
        } catch (e) {
            seenData = {};
        }
        seenData[activeTutorial] = true;
        localStorage.setItem(storageKey, JSON.stringify(seenData));

        // Navigate to the view
        const targetView = activeTutorial;
        setActiveTutorial(null); // Close modal
        setView(targetView); // Go to section
    };

    if (loading) {
        return (
            <div className="dashboard-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#fff' }}>
                <div className="spinner" style={{ border: '4px solid rgba(255,255,255,0.1)', width: '36px', height: '36px', borderRadius: '50%', borderLeftColor: '#ff7700', animation: 'spin 1s linear infinite' }}></div>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <WelcomeModal />

            {activeTutorial && TUTORIAL_CONTENT[activeTutorial] && (
                <TutorialModal
                    isOpen={!!activeTutorial}
                    onClose={handleCloseTutorial}
                    title={TUTORIAL_CONTENT[activeTutorial].title}
                    content={TUTORIAL_CONTENT[activeTutorial].content}
                />
            )}

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
                        <div className="dash-tile tile-orange" onClick={() => handleTileClick('library')}>
                            <div className="tile-icon">📚</div>
                            <h2>Ma bibliothèque</h2>
                            <p>Accéder à vos romans</p>
                        </div>

                        {/* Green Tile - Reading Time */}
                        <div className="dash-tile tile-green" onClick={() => handleTileClick('stats')}>
                            <div className="tile-icon">⏱️</div>
                            <h2>Temps de lecture</h2>
                            <p className="tile-value">12 h 45 de lecture</p>
                        </div>

                        {/* Yellow Tile - Reading Path */}
                        <div className="dash-tile tile-yellow" onClick={() => handleTileClick('path')}>
                            <div className="tile-icon">🧭</div>
                            <h2>Mon parcours</h2>
                            <p>Analyse de vos goûts</p>
                        </div>

                        {/* Blue Tile - Settings */}
                        <div className="dash-tile tile-blue" onClick={() => handleTileClick('settings')}>
                            <div className="tile-icon">⚙️</div>
                            <h2>Paramètres</h2>
                            <p>Mon compte</p>
                        </div>
                    </div>
                ) : (
                    <div className="detail-view-container">
                        <button className="btn-back" onClick={() => setView('dashboard')}>
                            ← Retour au tableau de bord
                        </button>

                        {view === 'library' && (
                            <LibraryView
                                initialSection={libraryDefaultSection}
                                onClearInitial={() => setLibraryDefaultSection(null)}
                                authToken={authToken}
                            />
                        )}
                        {view === 'stats' && <ReadingTimeView onNavigateToLibrary={handleNavigateToLibrary} authToken={authToken} />}
                        {view === 'path' && <ReadingPathView authToken={authToken} />}

                        {view === 'settings' && (
                            <SettingsView
                                userProfile={userProfile}
                                setUserProfile={setUserProfile}
                                authToken={authToken}
                                API_URL={API_URL}
                                stripe={stripe}
                                elements={elements}
                                fetchUserData={fetchUserData}
                                onNavigateToLibrary={handleNavigateToLibrary}
                            />
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default DashboardPage;
