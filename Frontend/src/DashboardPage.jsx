import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WelcomeModal from './WelcomeModal';
import './dashboard.css';

const DashboardPage = () => {
    const navigate = useNavigate();
    const [view, setView] = useState('dashboard'); // 'dashboard', 'library', 'stats', 'path', 'settings'

    // Mock Data
    // User Data from LocalStorage
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

    const userProfile = {
        nom: storedUser.nom || "Dupont",
        prenom: storedUser.prenom || "Jean",
        email: storedUser.email || "jean.dupont@example.com",
        dateInscription: storedUser.dateInscription || "15/12/2025",
        statut: storedUser.statut || "Abonné actif"
    };

    const mockStats = {
        totalTime: "12 h 45",
        monthTime: "3 h 10",
        books: [
            { title: "Les échos de la sagesse", status: "Terminé", time: "5h 20" },
            { title: "L'aube des sentinelles", status: "En cours", time: "7h 25" }
        ]
    };

    const mockLibrary = {
        new: [
            { id: 1, title: "Le Dernier Algorithme", author: "Marc Levy", genre: "Science-fiction", summary: "Dans un futur proche, une IA prend le contrôle..." }
        ],
        inProgress: [
            { id: 2, title: "L'aube des sentinelles", author: "Claire North", progress: 65 }
        ],
        read: [
            { id: 3, title: "Les échos de la sagesse", author: "Lama Surya Das" }
        ]
    };

    const mockPath = {
        genres: ["Polar", "Romance", "Science-fiction", "Feel-good"],
        distribution: [
            { name: "Science-fiction", percent: 45 },
            { name: "Polar", percent: 30 },
            { name: "Romance", percent: 15 },
            { name: "Feel-good", percent: 10 }
        ],
        analysis: "Votre parcours de lecture montre une préférence pour les romans de science-fiction et les récits introspectifs."
    };

    const handleLogout = () => {
        localStorage.removeItem("userLoggedIn");
        localStorage.removeItem("user");
        navigate("/");
    };

    // Sub-components for Views
    const LibraryView = () => (
        <div className="dashboard-detail-view fade-in">
            <h2 className="view-title">Ma Bibliothèque</h2>

            <section className="lib-section">
                <h3>Nouveau roman hebdomadaire</h3>
                {mockLibrary.new.map(book => (
                    <div key={book.id} className="book-card new-book">
                        <div className="book-info">
                            <h4>{book.title}</h4>
                            <p className="author">{book.author} — {book.genre}</p>
                            <p className="summary">{book.summary}</p>
                        </div>
                        <button className="btn-action">Lire</button>
                    </div>
                ))}
            </section>

            <section className="lib-section">
                <h3>Romans en cours de lecture</h3>
                {mockLibrary.inProgress.map(book => (
                    <div key={book.id} className="book-card in-progress">
                        <div className="book-info">
                            <h4>{book.title}</h4>
                            <p className="author">{book.author}</p>
                            <div className="progress-bar-container">
                                <div className="progress-bar" style={{ width: `${book.progress}%` }}></div>
                            </div>
                            <p className="status-text">En cours ({book.progress}%)</p>
                        </div>
                        <div className="book-actions">
                            <button className="btn-action">Lire</button>
                            <button className="btn-secondary">Résumé IA</button>
                            <label className="checkbox-container">
                                <input type="checkbox" /> Terminé
                            </label>
                        </div>
                    </div>
                ))}
            </section>

            <section className="lib-section">
                <h3>Romans lus</h3>
                {mockLibrary.read.map(book => (
                    <div key={book.id} className="book-card read">
                        <div className="book-info">
                            <h4>{book.title}</h4>
                            <p className="author">{book.author}</p>
                        </div>
                        <div className="book-actions">
                            <button className="btn-secondary">Relire</button>
                            <button className="btn-secondary">Résumé IA</button>
                        </div>
                    </div>
                ))}
            </section>
        </div>
    );

    const ReadingTimeView = () => (
        <div className="dashboard-detail-view fade-in">
            <h2 className="view-title" style={{ color: '#4caf50' }}>Temps de lecture</h2>

            <div className="stat-highlight">
                <p>Vous avez lu <strong>{mockStats.totalTime}</strong> sur RomanClub</p>
                <p className="sub-stat">Ce mois-ci : {mockStats.monthTime}</p>
            </div>

            <div className="stat-list">
                <h3>Détail par roman</h3>
                {mockStats.books.map((book, index) => (
                    <div key={index} className="stat-item">
                        <span className="stat-book-title">{book.title}</span>
                        <div className="stat-right">
                            <span className={`status-pill ${book.status === 'Terminé' ? 'done' : 'ongoing'}`}>
                                {book.status}
                            </span>
                            <span className="stat-time">{book.time}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const ReadingPathView = () => (
        <div className="dashboard-detail-view fade-in">
            <h2 className="view-title" style={{ color: '#ffca28' }}>Mon parcours de lecture</h2>

            <div className="path-section">
                <h3>Genres lus</h3>
                <ul className="genres-list">
                    {mockPath.genres.map((g, i) => <li key={i}>{g}</li>)}
                </ul>
            </div>

            <div className="path-section">
                <h3>Répartition du temps par genre</h3>
                <div className="distribution-list">
                    {mockPath.distribution.map((d, i) => (
                        <div key={i} className="dist-item">
                            <div className="dist-header">
                                <span>{d.name}</span>
                                <span>{d.percent} %</span>
                            </div>
                            <div className="dist-bar-bg">
                                <div className="dist-bar-fill" style={{ width: `${d.percent}%` }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="path-section">
                <h3>Analyse éditoriale</h3>
                <p className="ai-analysis">« {mockPath.analysis} »</p>
            </div>
        </div>
    );

    const SettingsView = () => (
        <div className="dashboard-detail-view fade-in">
            <h2 className="view-title" style={{ color: '#2196f3' }}>Paramètres</h2>

            <div className="settings-card">
                <div className="setting-row"><span className="label">Nom :</span> {userProfile.nom}</div>
                <div className="setting-row"><span className="label">Prénom :</span> {userProfile.prenom}</div>
                <div className="setting-row"><span className="label">Email :</span> {userProfile.email}</div>
                <div className="setting-row"><span className="label">Inscrit le :</span> {userProfile.dateInscription}</div>
                <div className="setting-row"><span className="label">Statut :</span> <span className="status-active">{userProfile.statut}</span></div>
            </div>

            <div className="settings-actions">
                <button className="btn-danger">Annuler l'abonnement</button>
                <p className="hint-text">Effet en fin de période en cours</p>
            </div>
        </div>
    );

    return (
        <div className="dashboard-container">
            <WelcomeModal />
            <header className="dashboard-header">
                <div className="header-left">
                    <img src="/logo.png" alt="Logo" className="header-logo" />
                    <h1>Tableau de bord</h1>
                </div>
                <div className="header-right">
                    <span className="user-welcome">Bienvenue, {userProfile.prenom}</span>
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
                            <p className="tile-value">{mockStats.totalTime} de lecture</p>
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
                        <button className="btn-back" onClick={() => setView('dashboard')}>
                            ← Retour au tableau de bord
                        </button>

                        {view === 'library' && <LibraryView />}
                        {view === 'stats' && <ReadingTimeView />}
                        {view === 'path' && <ReadingPathView />}
                        {view === 'settings' && <SettingsView />}
                    </div>
                )}
            </main>
        </div>
    );
};

export default DashboardPage;
