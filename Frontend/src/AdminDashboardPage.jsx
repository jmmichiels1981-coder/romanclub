import React from 'react';
import { useNavigate } from 'react-router-dom';
import './dashboard.css';

const AdminDashboardPage = () => {
    const navigate = useNavigate();

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
                        <div className="dash-tile tile-blue">
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
                        <div className="dash-tile tile-red" style={{ background: 'linear-gradient(135deg, #c62828 0%, #e53935 100%)' }}>
                            <div className="tile-icon">✉️</div>
                            <h2>Messagerie</h2>
                            <p style={{ fontSize: '0.9rem', color: '#ccc', marginTop: '0.5rem' }}>Messages de contact</p>
                        </div>

                        {/* 6. Sécurité */}
                        <div className="dash-tile tile-gray" style={{ background: 'linear-gradient(135deg, #37474f 0%, #546e7a 100%)' }}>
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
