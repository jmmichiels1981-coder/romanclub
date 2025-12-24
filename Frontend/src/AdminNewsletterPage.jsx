import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './dashboard.css';

const AdminNewsletterPage = () => {
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

    const [stats, setStats] = useState({
        subscriberCount: 0,
        totalSent: 0
    });
    const [history, setHistory] = useState([]);

    // Form state
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [feedback, setFeedback] = useState(null); // { type: 'success'|'error', text: '' }

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem("authToken");
            const response = await fetch(`${API_URL}/admin/notifications`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setStats({
                    subscriberCount: data.subscriberCount || 0,
                    totalSent: data.totalSent || 0
                });
                setHistory(data.history || []);
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!title.trim() || !message.trim()) return;

        setIsSending(true);
        setFeedback(null);

        try {
            const token = localStorage.getItem("authToken");
            const response = await fetch(`${API_URL}/admin/notifications`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ title, message })
            });

            if (response.ok) {
                setFeedback({ type: 'success', text: 'Notification envoyée avec succès !' });
                setTitle("");
                setMessage("");
                fetchData(); // Refresh stats and history
            } else {
                setFeedback({ type: 'error', text: 'Erreur lors de l\'envoi.' });
            }
        } catch (error) {
            console.error("Send error:", error);
            setFeedback({ type: 'error', text: 'Erreur réseau.' });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div className="header-left">
                    <button onClick={() => navigate("/admin/dashboard")} className="back-btn">←</button>
                    <h1>Newsletter</h1>
                    <span className="subtitle" style={{ marginLeft: '10px', fontSize: '0.9rem', color: '#ccc' }}>
                        Notifications push globales
                    </span>
                </div>
            </header>

            <main className="dashboard-content fade-in">

                {/* Info Box */}
                <div style={{
                    background: 'rgba(255, 152, 0, 0.1)',
                    border: '1px solid #ff9800',
                    borderRadius: '8px',
                    padding: '1rem',
                    marginBottom: '2rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '1rem'
                }}>
                    <span style={{ fontSize: '1.5rem' }}>🔔</span>
                    <div>
                        <h3 style={{ color: '#ff9800', margin: '0 0 0.5rem 0' }}>Notifications Push uniquement</h3>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#ccc' }}>
                            Cette fonctionnalité envoie des notification push aux clients ayant accepté les notifications.
                            Ce n'est PAS une newsletter email.
                        </p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                    {/* Card 1: Abonnés */}
                    <div className="dash-tile" style={{
                        background: '#1e293b',
                        height: 'auto',
                        padding: '1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        textAlign: 'left',
                        cursor: 'default'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.8rem', letterSpacing: '1px' }}>
                            <span style={{ fontSize: '1.5rem' }}>👥</span>
                            <span>ABONNÉS</span>
                        </div>
                        <div style={{ fontSize: '3rem', fontWeight: 'bold', margin: '1rem 0' }}>
                            {stats.subscriberCount}
                        </div>
                        <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
                            Clients avec notifications activées
                        </div>
                    </div>

                    {/* Card 2: Envoyées */}
                    <div className="dash-tile" style={{
                        background: '#14532d', // Dark green tint bg? Screenshot looks green/dark
                        // Let's use darker background
                        backgroundColor: '#1a2e1a',
                        border: '1px solid #2e7d32',
                        height: 'auto',
                        padding: '1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        textAlign: 'left',
                        cursor: 'default'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4ade80', fontSize: '0.8rem', letterSpacing: '1px' }}>
                            <span style={{ fontSize: '1.5rem' }}>🚀</span>
                            <span>ENVOYÉES</span>
                        </div>
                        <div style={{ fontSize: '3rem', fontWeight: 'bold', margin: '1rem 0', color: '#fff' }}>
                            {stats.totalSent}
                        </div>
                        <div style={{ color: '#86efac', fontSize: '0.9rem' }}>
                            Notifications envoyées au total
                        </div>
                    </div>
                </div>

                {/* Main Content Split: Form vs History */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>

                    {/* Left: Form */}
                    <div className="dash-tile" style={{ background: '#1e293b', height: 'auto', textAlign: 'left', cursor: 'default' }}>
                        <h3 style={{ borderBottom: '1px solid #334155', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                            💬 Envoyer une notification
                        </h3>

                        <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#ccc' }}>
                                    Titre (0/50)
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    maxLength={50}
                                    placeholder="Ex: Nouveau roman en ligne"
                                    style={{
                                        width: '100%',
                                        padding: '1rem',
                                        background: '#0f172a',
                                        border: '1px solid #334155',
                                        borderRadius: '6px',
                                        color: '#fff',
                                        fontSize: '1rem'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#ccc' }}>
                                    Message court (0/200)
                                </label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    maxLength={200}
                                    placeholder="Ex: Découvrez notre dernière publication !"
                                    rows={4}
                                    style={{
                                        width: '100%',
                                        padding: '1rem',
                                        background: '#0f172a',
                                        border: '1px solid #334155',
                                        borderRadius: '6px',
                                        color: '#fff',
                                        fontSize: '1rem',
                                        resize: 'none'
                                    }}
                                />
                            </div>

                            {feedback && (
                                <div style={{
                                    padding: '0.75rem',
                                    borderRadius: '6px',
                                    background: feedback.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                                    color: feedback.type === 'error' ? '#f87171' : '#4ade80',
                                    textAlign: 'center'
                                }}>
                                    {feedback.text}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isSending || !title || !message}
                                style={{
                                    background: '#ca8a04', // Goldish color from screens
                                    color: '#fff',
                                    border: 'none',
                                    padding: '1rem',
                                    borderRadius: '6px',
                                    fontSize: '1rem',
                                    fontWeight: 'bold',
                                    cursor: isSending ? 'not-allowed' : 'pointer',
                                    opacity: isSending ? 0.7 : 1,
                                    marginTop: '1rem'
                                }}
                            >
                                {isSending ? "Envoi..." : "🚀 Envoyer la notification"}
                            </button>

                            <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#64748b' }}>
                                👥 Cible : {stats.subscriberCount} client(s) ayant accepté les notifications
                            </div>
                        </form>
                    </div>

                    {/* Right: History */}
                    <div className="dash-tile" style={{ background: '#1e293b', height: 'auto', textAlign: 'left', cursor: 'default' }}>
                        <h3 style={{ borderBottom: '1px solid #334155', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                            ↺ Historique récent
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '500px', overflowY: 'auto' }}>
                            {history.length === 0 ? (
                                <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>Aucune notification envoyée.</p>
                            ) : (
                                history.map((notif) => (
                                    <div key={notif._id} style={{
                                        background: '#0f172a',
                                        border: '1px solid #334155',
                                        borderRadius: '6px',
                                        padding: '1rem'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span style={{ fontWeight: 'bold', color: '#fff' }}>{notif.title}</span>
                                            <span style={{ fontSize: '0.8rem', color: '#4ade80' }}>✔ {notif.sentCount}</span>
                                        </div>
                                        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                                            {notif.message}
                                        </p>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                            🕒 {new Date(notif.sentAt).toLocaleString('fr-FR')}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
};

export default AdminNewsletterPage;
