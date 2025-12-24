import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './dashboard.css';

const AdminSecurityPage = () => {
    const navigate = useNavigate();
    const [securityInfo, setSecurityInfo] = useState({ lastPinChange: null, lastLogin: null });
    const [isLoadingInfo, setIsLoadingInfo] = useState(true);

    // Admin PIN Form State
    const [adminPinData, setAdminPinData] = useState({ currentPin: '', newPin: '', confirmPin: '' });
    const [adminMessage, setAdminMessage] = useState({ type: '', text: '' });

    // Client PIN Form State
    const [clientEmail, setClientEmail] = useState('');
    const [clientMessage, setClientMessage] = useState({ type: '', text: '', generatedPin: '' });

    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
    const authToken = localStorage.getItem("authToken");

    // Fetch initial info
    useEffect(() => {
        if (!authToken) {
            navigate("/admin");
            return;
        }

        const fetchInfo = async () => {
            try {
                const res = await fetch(`${API_URL}/admin/security/info`, {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setSecurityInfo(data);
                }
            } catch (error) {
                console.error("Fetch security info error:", error);
            } finally {
                setIsLoadingInfo(false);
            }
        };

        fetchInfo();
    }, [authToken, navigate, API_URL]);

    // Handle Admin PIN Change
    const handleAdminPinChange = async (e) => {
        e.preventDefault();
        setAdminMessage({ type: '', text: '' });

        if (adminPinData.newPin !== adminPinData.confirmPin) {
            setAdminMessage({ type: 'error', text: "Les nouveaux PIN ne correspondent pas." });
            return;
        }
        if (adminPinData.newPin.length < 4) {
            setAdminMessage({ type: 'error', text: "Le nouveau PIN est trop court." });
            return;
        }

        try {
            const res = await fetch(`${API_URL}/admin/security/change-admin-pin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    currentPin: adminPinData.currentPin,
                    newPin: adminPinData.newPin
                })
            });
            const data = await res.json();

            if (res.ok) {
                setAdminMessage({ type: 'success', text: data.message });
                setAdminPinData({ currentPin: '', newPin: '', confirmPin: '' });
                // Update timestamp
                setSecurityInfo(prev => ({ ...prev, lastPinChange: new Date() }));
            } else {
                setAdminMessage({ type: 'error', text: data.error || "Erreur inconnue." });
            }
        } catch (error) {
            setAdminMessage({ type: 'error', text: "Erreur de connexion." });
        }
    };

    // Handle Client PIN Reset
    const handleClientPinReset = async (e) => {
        e.preventDefault();
        setClientMessage({ type: '', text: '', generatedPin: '' });

        if (!clientEmail) return;

        if (!window.confirm(`Générer un nouveau PIN pour ${clientEmail} ?\nCette action est immédiate.`)) return;

        try {
            const res = await fetch(`${API_URL}/admin/security/reset-client-pin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ clientEmail })
            });
            const data = await res.json();

            if (res.ok) {
                setClientMessage({
                    type: 'success',
                    text: data.info || "PIN généré.",
                    generatedPin: data.generatedPin
                });
                setClientEmail(''); // Reset field
            } else {
                setClientMessage({ type: 'error', text: data.error || "Erreur." });
            }
        } catch (error) {
            setClientMessage({ type: 'error', text: "Erreur de connexion." });
        }
    };

    // Helper for Date Formatting
    const formatDate = (dateStr) => {
        if (!dateStr) return "Jamais";
        return new Date(dateStr).toLocaleString('fr-FR', {
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div className="header-left">
                    <button onClick={() => navigate("/admin/dashboard")} className="btn-back">← Retour</button>
                    <div style={{ marginLeft: '1rem' }}>
                        <h1>Sécurité</h1>
                        <p style={{ fontSize: '0.9rem', color: '#aaa', margin: 0 }}>Gestion de la sécurité admin et clients</p>
                    </div>
                </div>
            </header>

            <main className="dashboard-content fade-in">
                <div className="content-wrapper" style={{ maxWidth: '800px', margin: '0 auto' }}>

                    {/* SECTION A: ADMIN SECURITY */}
                    <div className="admin-card" style={{ marginBottom: '2rem', border: '1px solid #37474f' }}>
                        <h2 style={{ fontSize: '1.1rem', color: '#ff7043', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>🔐</span> A. Sécurité Admin
                        </h2>

                        {/* INFO ROW */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#263238', padding: '1rem', borderRadius: '8px', marginBottom: '2rem' }}>
                            <div>
                                <small style={{ color: '#aaa', display: 'block', marginBottom: '4px' }}>Dernière modification PIN</small>
                                <strong style={{ color: '#fff' }}>{isLoadingInfo ? '...' : formatDate(securityInfo.lastPinChange)}</strong>
                            </div>
                            <div>
                                <small style={{ color: '#aaa', display: 'block', marginBottom: '4px' }}>Dernière connexion admin</small>
                                <strong style={{ color: '#fff' }}>{isLoadingInfo ? '...' : formatDate(securityInfo.lastLogin)}</strong>
                            </div>
                        </div>

                        {/* CHANGE FORM */}
                        <h3 style={{ fontSize: '1rem', color: '#ddd', marginBottom: '1rem' }}>Changer le PIN admin</h3>

                        <form onSubmit={handleAdminPinChange}>
                            <div className="form-group">
                                <label style={{ color: '#ccc' }}>PIN actuel</label>
                                <input
                                    type="password"
                                    className="admin-input"
                                    value={adminPinData.currentPin}
                                    onChange={e => setAdminPinData({ ...adminPinData, currentPin: e.target.value })}
                                    required
                                    placeholder="••••"
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group half">
                                    <label style={{ color: '#ccc' }}>Nouveau PIN</label>
                                    <input
                                        type="password"
                                        className="admin-input"
                                        value={adminPinData.newPin}
                                        onChange={e => setAdminPinData({ ...adminPinData, newPin: e.target.value })}
                                        required
                                        placeholder="••••"
                                    />
                                </div>
                                <div className="form-group half">
                                    <label style={{ color: '#ccc' }}>Confirmer nouveau PIN</label>
                                    <input
                                        type="password"
                                        className="admin-input"
                                        value={adminPinData.confirmPin}
                                        onChange={e => setAdminPinData({ ...adminPinData, confirmPin: e.target.value })}
                                        required
                                        placeholder="••••"
                                    />
                                </div>
                            </div>

                            {adminMessage.text && (
                                <div style={{
                                    padding: '10px',
                                    borderRadius: '4px',
                                    marginBottom: '1rem',
                                    backgroundColor: adminMessage.type === 'error' ? 'rgba(211, 47, 47, 0.2)' : 'rgba(56, 142, 60, 0.2)',
                                    color: adminMessage.type === 'error' ? '#ffcdd2' : '#c8e6c9',
                                    border: `1px solid ${adminMessage.type === 'error' ? '#d32f2f' : '#388e3c'}`
                                }}>
                                    {adminMessage.text}
                                </div>
                            )}

                            <button type="submit" className="btn-primary" style={{ width: '100%', background: '#d32f2f' }}>
                                Changer le PIN admin
                            </button>
                        </form>
                    </div>

                    {/* SECTION B: CLIENT SECURITY */}
                    <div className="admin-card" style={{ border: '1px solid #37474f' }}>
                        <h2 style={{ fontSize: '1.1rem', color: '#ffb74d', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>👥</span> B. Sécurité Cliente [critique V1]
                        </h2>

                        {/* WARNING BOX */}
                        <div style={{
                            background: 'rgba(255, 112, 67, 0.1)',
                            borderLeft: '4px solid #ff7043',
                            padding: '1rem',
                            borderRadius: '4px',
                            marginBottom: '2rem'
                        }}>
                            <h4 style={{ color: '#ffab91', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span>⚠️</span> Usage : Support client
                            </h4>
                            <p style={{ color: '#dedede', fontSize: '0.9rem', margin: 0, lineHeight: '1.4' }}>
                                Cette fonctionnalité génère un nouveau PIN pour un client qui a perdu accès à son compte.
                                <strong> Le PIN doit être communiqué au client par téléphone ou email sécurisé.</strong> Aucun email automatique n'est envoyé.
                            </p>
                        </div>

                        {/* RESET FORM */}
                        <h3 style={{ fontSize: '1rem', color: '#ddd', marginBottom: '1rem' }}>1 Réinitialisation manuelle du PIN client</h3>

                        <form onSubmit={handleClientPinReset}>
                            <div className="form-group">
                                <label style={{ color: '#ccc' }}>Email du client</label>
                                <input
                                    type="email"
                                    className="admin-input"
                                    value={clientEmail}
                                    onChange={e => setClientEmail(e.target.value)}
                                    required
                                    placeholder="client@exemple.com"
                                />
                            </div>

                            {clientMessage.text && !clientMessage.generatedPin && (
                                <div style={{
                                    padding: '10px',
                                    marginBottom: '1rem',
                                    color: '#ffcdd2'
                                }}>
                                    {clientMessage.text}
                                </div>
                            )}

                            {clientMessage.generatedPin && (
                                <div style={{
                                    background: '#2e7d32',
                                    color: 'white',
                                    padding: '1.5rem',
                                    borderRadius: '8px',
                                    marginBottom: '1.5rem',
                                    textAlign: 'center',
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                                }}>
                                    <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold', fontSize: '1.1rem' }}>Nouveau PIN généré avec succès</p>
                                    <div style={{
                                        fontSize: '2.5rem',
                                        fontWeight: '800',
                                        letterSpacing: '5px',
                                        fontFamily: 'monospace',
                                        margin: '1rem 0'
                                    }}>
                                        {clientMessage.generatedPin}
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>
                                        ⚠️ Notez-le maintenant, il ne sera plus affiché.
                                        <br />
                                        Communiquez-le directement au client.
                                    </p>
                                </div>
                            )}

                            <button type="submit" className="btn-primary" style={{ width: '100%', background: '#ff9800', color: '#000', fontWeight: 'bold' }}>
                                Générer un nouveau PIN
                            </button>
                        </form>

                    </div>

                </div>
            </main>
        </div>
    );
};

export default AdminSecurityPage;
