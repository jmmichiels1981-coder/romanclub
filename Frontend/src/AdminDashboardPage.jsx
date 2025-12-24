import React from 'react';
import { useNavigate } from 'react-router-dom';
import './dashboard.css';

const AdminDashboardPage = () => {
    const navigate = useNavigate();
    const [unreadCount, setUnreadCount] = React.useState(0);
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

    React.useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem("authToken");
                const response = await fetch(`${API_URL}/admin/stats`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.global && typeof data.global.unreadMessages === 'number') {
                        setUnreadCount(data.global.unreadMessages);
                    }
                }
            } catch (error) {
                console.error("Dashboard stats error:", error);
            }
        };
        fetchStats();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("userLoggedIn");
        localStorage.removeItem("user");
        localStorage.removeItem("authToken");
        navigate("/admin");
    };

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div className="header-left">
                    <img src="/logo.png" alt="Logo" className="header-logo" />
                    <h1>Console Admin</h1>
                </div>
                <div className="header-right">
                    <button className="btn-logout" onClick={handleLogout}>Déconnexion</button>
                </div>
            </header>

            <main className="dashboard-content fade-in">
                <div className="content-wrapper">
                    <h2 className="section-title">Tableau de bord</h2>
                    <div className="tiles-grid">
                        {/* 1. Romans */}
                        <div className="dash-tile tile-orange" onClick={() => navigate("/admin/dashboard/books")} style={{ cursor: 'pointer' }}>
                            <div className="tile-icon">📖</div>
                            <h2>Romans</h2>
                            <p style={{ fontSize: '0.9rem', color: '#ccc', marginTop: '0.5rem' }}>Gestion du catalogue</p>
                        </div>

                        {/* 2. Clients */}
                        <div className="dash-tile tile-green" onClick={() => navigate("/admin/dashboard/clients")} style={{ cursor: 'pointer' }}>
                            <div className="tile-icon">👥</div>
                            <h2>Clients</h2>
                            <p style={{ fontSize: '0.9rem', color: '#ccc', marginTop: '0.5rem' }}>Utilisateurs & Abonnés</p>
                        </div>

                        {/* 3. Statistiques */}
                        <div className="dash-tile tile-blue" onClick={() => navigate("/admin/dashboard/stats")} style={{ cursor: 'pointer' }}>
                            <div className="tile-icon">📊</div>
                            <h2>Statistiques</h2>
                            <p style={{ fontSize: '0.9rem', color: '#ccc', marginTop: '0.5rem' }}>Performances App</p>
                        </div>

                        {/* 4. Finance */}
                        <div className="dash-tile tile-purple" style={{ background: 'linear-gradient(135deg, #4a148c 0%, #7b1fa2 100%)' }}>
                            <div className="tile-icon">💳</div>
                            <h2>Finance</h2>
                            <p style={{ fontSize: '0.9rem', color: '#ccc', marginTop: '0.5rem' }}>Facturation & Revenus</p>
                        </div>

                        {/* 5. Messagerie */}
                        <div
                            className={`dash-tile tile-red ${unreadCount > 0 ? "notification-pulse" : ""}`}
                            onClick={() => navigate("/admin/dashboard/messages")}
                            style={{
                                background: 'linear-gradient(135deg, #c62828 0%, #e53935 100%)',
                                cursor: 'pointer',
                                position: 'relative'
                            }}
                        >
                            {unreadCount > 0 && (
                                <div style={{
                                    position: 'absolute',
                                    top: '10px',
                                    right: '10px',
                                    background: '#ff9800',
                                    color: '#fff',
                                    borderRadius: '50%',
                                    width: '24px',
                                    height: '24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.8rem',
                                    fontWeight: 'bold',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                                }}>
                                    {unreadCount}
                                </div>
                            )}
                            <div className="tile-icon">✉️</div>
                            <h2>Messagerie</h2>
                            <p style={{ fontSize: '0.9rem', color: '#ccc', marginTop: '0.5rem' }}>
                                Messages de contact
                                {unreadCount > 0 && <span style={{ display: 'block', color: '#ffd54f', fontWeight: 'bold', marginTop: '4px' }}>• {unreadCount} nouveau(x)</span>}
                            </p>
                        </div>

                        {/* 6. Sécurité */}
                        <div className="dash-tile tile-gray" onClick={() => navigate("/admin/dashboard/security")} style={{ background: 'linear-gradient(135deg, #37474f 0%, #546e7a 100%)', cursor: 'pointer' }}>
                            <div className="tile-icon">🔒</div>
                            <h2>Sécurité</h2>
                            <p style={{ fontSize: '0.9rem', color: '#ccc', marginTop: '0.5rem' }}>Accès & Logs</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboardPage;
