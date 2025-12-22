import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./dashboard.css"; // Reuse dashboard styles

const AdminMessagesPage = () => {
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all"); // all, unread, read, replied
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedMessage, setSelectedMessage] = useState(null); // For detail view

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        try {
            const token = localStorage.getItem("authToken");
            const response = await fetch(`${API_URL}/admin/messages`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setMessages(data);
            } else {
                console.error("Failed to fetch messages");
            }
        } catch (error) {
            console.error("Error fetching messages:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id, currentStatus) => {
        if (currentStatus) return; // Already read
        try {
            const token = localStorage.getItem("authToken");
            const response = await fetch(`${API_URL}/admin/messages/${id}/read`, {
                method: "PATCH",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                // Update local state
                setMessages(prev => prev.map(msg =>
                    msg._id === id ? { ...msg, isRead: true } : msg
                ));
                if (selectedMessage && selectedMessage._id === id) {
                    setSelectedMessage(prev => ({ ...prev, isRead: true }));
                }
            }
        } catch (error) {
            console.error("Error marking as read:", error);
        }
    };

    const handleReply = (message) => {
        // Mailto
        const subject = `Re: ${message.subject}`;
        const body = `\n\n-------------------------\nLe ${new Date(message.createdAt).toLocaleDateString()} à ${new Date(message.createdAt).toLocaleTimeString()}, ${message.name} a écrit :\n${message.message}`;
        window.location.href = `mailto:${message.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    // Filters
    const filteredMessages = messages.filter(msg => {
        const matchesFilter =
            filter === "all" ? true :
                filter === "unread" ? !msg.isRead :
                    filter === "read" ? msg.isRead :
                        filter === "replied" ? msg.isHandled : true;

        const matchesSearch =
            msg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            msg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            msg.subject.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesFilter && matchesSearch;
    });

    const stats = {
        total: messages.length,
        unread: messages.filter(m => !m.isRead).length,
        replied: messages.filter(m => m.isHandled).length
    };

    // Icons (using simple unicode/emoji for now to match look, or could use SVG)

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div className="header-left">
                    <button className="back-btn-header" onClick={() => navigate("/admin/dashboard")} style={{ background: "none", border: "none", color: "#fff", fontSize: "1.5rem", paddingRight: "1rem", cursor: "pointer" }}>←</button>
                    <div>
                        <h1>Messagerie</h1>
                        <span style={{ fontSize: "0.85rem", color: "#666", fontWeight: "400" }}>Gestion des emails SAV et recommandations</span>
                    </div>
                </div>
            </header>

            <main className="dashboard-content fade-in" style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>

                {/* Stats Cards Row */}
                <div className="stats-grid-messages">
                    <div className="stat-card-message total">
                        <div className="stat-content-left">
                            <span className="stat-title-msg">Total messages</span>
                            <span className="stat-value-msg">{stats.total}</span>
                        </div>
                        <div className="stat-icon-container">
                            <span className="stat-icon-msg">✉️</span>
                        </div>
                    </div>
                    <div className="stat-card-message unread">
                        <div className="stat-content-left">
                            <span className="stat-title-msg">Non lus</span>
                            <span className="stat-value-msg">{stats.unread}</span>
                        </div>
                        <div className="stat-icon-container">
                            <span className="stat-icon-msg">🗨️</span>
                        </div>
                    </div>
                    <div className="stat-card-message replied">
                        <div className="stat-content-left">
                            <span className="stat-title-msg">Répondus</span>
                            <span className="stat-value-msg">{stats.replied}</span>
                        </div>
                        <div className="stat-icon-container">
                            <span className="stat-icon-msg">✅</span>
                        </div>
                    </div>
                </div>

                {/* Control Panel: Search & Filters Unified */}
                <div className="msg-control-panel">
                    <div className="search-section">
                        <div className="search-input-wrapper">
                            <span className="search-icon">🔍</span>
                            <input
                                type="text"
                                placeholder="Rechercher par nom, email ou sujet..."
                                className="search-input-naked"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="filter-section">
                        <div className="filter-label">
                            <span style={{ fontSize: "1rem" }}>⚡</span>
                            <span>Statut :</span>
                        </div>
                        <div className="filter-options">
                            <button
                                className={`filter-chip ${filter === "all" ? "active" : ""}`}
                                onClick={() => setFilter("all")}
                            >
                                Tous
                            </button>
                            <button
                                className={`filter-chip ${filter === "unread" ? "active" : ""}`}
                                onClick={() => setFilter("unread")}
                            >
                                Non lus
                            </button>
                            <button
                                className={`filter-chip ${filter === "read" ? "active" : ""}`}
                                onClick={() => setFilter("read")}
                            >
                                Lus
                            </button>
                            <button
                                className={`filter-chip ${filter === "replied" ? "active" : ""}`}
                                onClick={() => setFilter("replied")}
                            >
                                Répondus
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                {loading ? (
                    <div className="empty-state-list">Chargement...</div>
                ) : filteredMessages.length === 0 ? (
                    <div className="empty-state-list">
                        <div className="empty-state-icon">✉️</div>
                        <p className="empty-state-text">Aucun message trouvé</p>
                    </div>
                ) : (
                    <div className="books-table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th style={{ width: "40px" }}></th>
                                    <th>Nom</th>
                                    <th>Email</th>
                                    <th>Sujet</th>
                                    <th>Date</th>
                                    <th>Statut</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMessages.map(msg => (
                                    <tr
                                        key={msg._id}
                                        onClick={() => { setSelectedMessage(msg); handleMarkAsRead(msg._id, msg.isRead); }}
                                        className={`msg-table-row ${!msg.isRead ? "unread-row" : ""}`}
                                    >
                                        <td>{msg.isRead ? "" : <span style={{ display: "block", width: "8px", height: "8px", borderRadius: "50%", background: "#2196f3" }}></span>}</td>
                                        <td>{msg.name}</td>
                                        <td>{msg.email}</td>
                                        <td>{msg.subject}</td>
                                        <td>{new Date(msg.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <span className={`status-pill ${msg.isRead ? "published" : "draft"}`}>
                                                {msg.isRead ? "Lu" : "Non lu"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Message Detail Modal */}
                {selectedMessage && (
                    <div className="modal-overlay" onClick={() => setSelectedMessage(null)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: "600px", width: "90%", background: "#1a1a1d", border: "1px solid #333" }}>
                            <div className="modal-header" style={{ borderBottom: "1px solid #333", paddingBottom: "1rem" }}>
                                <h2 style={{ color: "#fff", margin: 0 }}>Message de {selectedMessage.name}</h2>
                                <button className="close-btn" onClick={() => setSelectedMessage(null)} style={{ color: "#fff" }}>×</button>
                            </div>
                            <div className="modal-body" style={{ marginTop: "1rem" }}>
                                <div style={{ marginBottom: "1.5rem", color: "#aaa", fontSize: "0.9rem", display: "grid", gridTemplateColumns: "auto 1fr", gap: "0.5rem 1rem" }}>
                                    <strong>Email:</strong> <span>{selectedMessage.email}</span>
                                    <strong>Date:</strong> <span>{new Date(selectedMessage.createdAt).toLocaleString()}</span>
                                    <strong>Sujet:</strong> <span style={{ color: "#fff" }}>{selectedMessage.subject}</span>
                                </div>
                                <div className="message-content" style={{ background: "#222", padding: "1.5rem", borderRadius: "8px", whiteSpace: "pre-wrap", color: "#ddd", border: "1px solid #333", minHeight: "150px" }}>
                                    {selectedMessage.message}
                                </div>

                                <div className="modal-actions" style={{ marginTop: "2rem", display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
                                    <button
                                        className="btn-secondary"
                                        onClick={() => setSelectedMessage(null)}
                                        style={{ padding: "0.75rem 1.5rem", background: "transparent", color: "#ccc", border: "1px solid #555" }}
                                    >
                                        Fermer
                                    </button>
                                    <button
                                        className="btn-primary"
                                        onClick={() => handleReply(selectedMessage)}
                                        style={{ padding: "0.75rem 1.5rem", background: "#2196f3", color: "#fff", border: "none", fontWeight: "600" }}
                                    >
                                        Répondre par email
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminMessagesPage;
