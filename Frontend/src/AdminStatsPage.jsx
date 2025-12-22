import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './dashboard.css';

const AdminStatsPage = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            const token = localStorage.getItem("authToken");
            if (!token) {
                navigate("/admin");
                return;
            }

            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/admin/stats`, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error("Erreur chargement stats");
                }

                const data = await response.json();
                setStats(data);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setError("Impossible de charger les statistiques.");
                setLoading(false);
            }
        };

        fetchStats();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem("userLoggedIn");
        localStorage.removeItem("user");
        localStorage.removeItem("authToken");
        navigate("/admin");
    };

    if (loading) return <div className="dashboard-container"><p style={{ padding: '2rem' }}>Chargement...</p></div>;
    if (error) return <div className="dashboard-container"><p style={{ padding: '2rem', color: 'red' }}>{error}</p></div>;

    // Helper for genre colors
    const getGenreColor = (genre) => {
        switch (genre) {
            case 'polar': return '#78909C'; // Blue Grey
            case 'romance': return '#E91E63'; // Pink
            case 'science-fiction': return '#2979FF'; // Blue
            case 'feel-good': return '#43A047'; // Green
            default: return '#888';
        }
    };

    // Helper for genre icons or labels if needed, though text is fine
    const formatGenre = (g) => {
        if (!g) return '';
        return g.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div className="header-left">
                    <img src="/logo.png" alt="Logo" className="header-logo" />
                    <h1>Console Admin</h1>
                </div>
                <div className="header-right">
                    <button className="btn-back" onClick={() => navigate("/admin/dashboard")} style={{ marginBottom: 0, marginRight: '1rem' }}>
                        ← Retour
                    </button>
                    <button className="btn-logout" onClick={handleLogout}>Déconnexion</button>
                </div>
            </header>

            <main className="dashboard-content fade-in">
                <div className="content-wrapper">
                    <h2 className="section-title">Performance Platforme</h2>

                    {/* 1. Global KPI Cards */}
                    <div className="stats-grid-global" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                        {/* Published */}
                        <div className="admin-card" style={{ borderTop: '4px solid #ff7700', padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <span style={{ fontSize: '2rem' }}>📖</span>
                                <span style={{ color: '#888', fontSize: '0.8rem', textTransform: 'uppercase' }}>TOTAL</span>
                            </div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{stats.global.totalBooks}</div>
                            <div style={{ color: '#ccc' }}>Romans publiés</div>
                        </div>

                        {/* Started */}
                        <div className="admin-card" style={{ borderTop: '4px solid #2979FF', padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <span style={{ fontSize: '2rem' }}>⏱️</span>
                                <span style={{ color: '#888', fontSize: '0.8rem', textTransform: 'uppercase' }}>EN COURS</span>
                            </div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{stats.global.totalStarted}</div>
                            <div style={{ color: '#ccc' }}>Romans commencés</div>
                        </div>

                        {/* Completed */}
                        <div className="admin-card" style={{ borderTop: '4px solid #43A047', padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <span style={{ fontSize: '2rem' }}>✅</span>
                                <span style={{ color: '#888', fontSize: '0.8rem', textTransform: 'uppercase' }}>TERMINÉS</span>
                            </div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{stats.global.totalCompleted}</div>
                            <div style={{ color: '#ccc' }}>Romans terminés</div>
                        </div>
                    </div>

                    {/* 2. Genre Breakdown */}
                    <h3 style={{ marginTop: '3rem', marginBottom: '1.5rem', borderBottom: '1px solid #333', paddingBottom: '0.5rem' }}>Répartition par genre</h3>
                    <div className="stats-grid-genres" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                        {stats.genres.map((g) => (
                            <div key={g.genre} className="admin-card" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                                {/* Colored Header Line or BG accent */}
                                <div style={{
                                    position: 'absolute', top: 0, left: 0, width: '100%', height: '4px',
                                    backgroundColor: getGenreColor(g.genre)
                                }}></div>

                                <h4 style={{ marginTop: '0.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: getGenreColor(g.genre) }}>
                                    <span>🏷️</span> {formatGenre(g.genre)}
                                </h4>

                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ color: '#ccc' }}>Commencés</span>
                                    <span style={{ fontWeight: 'bold' }}>{g.started}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                    <span style={{ color: '#ccc' }}>Terminés</span>
                                    <span style={{ fontWeight: 'bold' }}>{g.completed}</span>
                                </div>

                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem', color: '#aaa' }}>
                                        <span>Taux complétion</span>
                                        <span>{g.completionRate}%</span>
                                    </div>
                                    <div style={{ height: '6px', backgroundColor: '#333', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{ width: `${g.completionRate}%`, backgroundColor: getGenreColor(g.genre), height: '100%' }}></div>
                                    </div>
                                </div>

                                <div style={{ borderTop: '1px solid #333', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#888' }}>
                                    <span>Temps moyen</span>
                                    <span>{g.avgTime}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* 3. Top Books Table */}
                    <h3 style={{ marginTop: '3rem', marginBottom: '1.5rem', borderBottom: '1px solid #333', paddingBottom: '0.5rem' }}>Romans les plus lus</h3>
                    <div className="admin-card books-table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Titre</th>
                                    <th>Genre</th>
                                    <th>Lectures (Start)</th>
                                    <th>Taux Complétion</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.topBooks.length === 0 ? (
                                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>Aucune donnée disponible</td></tr>
                                ) : (
                                    stats.topBooks.map((book) => (
                                        <tr key={book._id}>
                                            <td style={{ fontWeight: 'bold', color: '#fff' }}>#{book.rank}  {book.title}</td>
                                            <td>
                                                <span className="status-pill" style={{
                                                    backgroundColor: 'transparent',
                                                    border: `1px solid ${getGenreColor(book.genre)}`,
                                                    color: getGenreColor(book.genre)
                                                }}>
                                                    {formatGenre(book.genre)}
                                                </span>
                                            </td>
                                            <td>{book.reads}</td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <div style={{ flex: 1, height: '6px', backgroundColor: '#333', borderRadius: '3px', maxWidth: '100px', overflow: 'hidden' }}>
                                                        <div style={{ width: `${book.completionRate}%`, backgroundColor: '#4caf50', height: '100%' }}></div>
                                                    </div>
                                                    <span style={{ fontSize: '0.85rem', width: '40px' }}>{book.completionRate}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#1a1a1d', border: '1px solid #2979FF', borderRadius: '8px', color: '#ccc', fontSize: '0.9rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ width: '10px', height: '10px', backgroundColor: '#2979FF', flexShrink: 0 }}></div>
                        Les statistiques affichées sont basées sur l'activité globale de la plateforme, incluant tous les utilisateurs. Les filtres de période seront disponibles en V2.
                    </div>

                </div>
            </main>
        </div>
    );
};

export default AdminStatsPage;
