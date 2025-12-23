import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./dashboard.css"; // Reuse dashboard styles

const AdminMessagesPage = () => {
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all"); // all, unread, read, replied, deleted
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
        if (currentStatus !== "unread") return; // Only mark as read if currently unread
        try {
            const token = localStorage.getItem("authToken");
            const response = await fetch(`${API_URL}/admin/messages/${id}/read`, {
                method: "PATCH",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                // Update local state
                setMessages(prev => prev.map(msg =>
                    msg._id === id ? { ...msg, status: "read" } : msg
                ));
                if (selectedMessage && selectedMessage._id === id) {
                    setSelectedMessage(prev => ({ ...prev, status: "read" }));
                }
            }
        } catch (error) {
            console.error("Error marking as read:", error);
        }
    };

    const handleMarkAsReplied = async (id) => {
        try {
            const token = localStorage.getItem("authToken");
            const response = await fetch(`${API_URL}/admin/messages/${id}/replied`, {
                method: "PATCH",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                const newStatus = "replied";
                setMessages(prev => prev.map(msg =>
                    msg._id === id ? { ...msg, status: newStatus } : msg
                ));
                if (selectedMessage && selectedMessage._id === id) {
                    setSelectedMessage(prev => ({ ...prev, status: newStatus }));
                }
            }
        } catch (error) {
            console.error("Error marking as replied:", error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Voulez-vous vraiment supprimer ce message ?")) return;
        try {
            const token = localStorage.getItem("authToken");
            const response = await fetch(`${API_URL}/admin/messages/${id}/delete`, {
                method: "PATCH",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                // Remove from list or mark as deleted depending on current view? 
                // Spec says: "appears only in Deleted filter". 
                // So if we are in "all", it should disappear.
                const newStatus = "deleted";
                setMessages(prev => prev.map(msg =>
                    msg._id === id ? { ...msg, status: newStatus } : msg
                ));
                if (selectedMessage && selectedMessage._id === id) {
                    setSelectedMessage(null); // Close modal
                }
            }
        } catch (error) {
            console.error("Error deleting message:", error);
        }
    };

    const handleReply = (message) => {
        // Mailto
        const subjectRaw = message.sujet || message.subject || "Message RomanClub";
        const subject = `Re: ${subjectRaw}`;

        const nameDisplay = `${message.prenom || ""} ${message.nom || message.name || ""}`.trim();
        const bodyDate = message.createdAt ? new Date(message.createdAt).toLocaleDateString() : 'Date inconnue';
        const bodyTime = message.createdAt ? new Date(message.createdAt).toLocaleTimeString() : '';

        const body = `\n\n-------------------------\nLe ${bodyDate} à ${bodyTime}, ${nameDisplay} a écrit :\n${message.message || ""}`;

        const mailtoLink = `mailto:${message.email || ""}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

        window.location.href = mailtoLink;
    };

    // Filters
    // Filters
    const filteredMessages = messages.filter(msg => {
        // Normaliser status si ancien format (fallback):
        const status = msg.status || (msg.isHandled ? "replied" : (msg.isRead ? "read" : "unread"));

        // DELETED LOGIC: 
        // If filter is NOT 'deleted', exclude deleted messages.
        // If filter IS 'deleted', show ONLY deleted messages.
        if (filter !== "deleted" && status === "deleted") return false;
        if (filter === "deleted" && status !== "deleted") return false;

        const matchesFilter =
            filter === "all" ? true :
                filter === "unread" ? status === "unread" :
                    filter === "read" ? status === "read" :
                        filter === "replied" ? status === "replied" :
                            filter === "deleted" ? status === "deleted" : true;

        const nameDisplay = `${msg.prenom || ""} ${msg.nom || msg.name || ""}`.trim();

        const search = (searchTerm || "").toLowerCase();

        const matchesSearch =
            (nameDisplay || "").toLowerCase().includes(search) ||
            (msg.email || "").toLowerCase().includes(search) ||
            (msg.subject || msg.sujet || "").toLowerCase().includes(search);

        return matchesFilter && matchesSearch;
    });

    const stats = {
        total: messages.filter(m => (m.status || (m.isRead ? "read" : "unread")) !== "deleted").length, // Total active
        unread: messages.filter(m => (m.status || (m.isRead ? "read" : "unread")) === "unread").length,
        replied: messages.filter(m => (m.status || (m.isHandled ? "replied" : "unread")) === "replied").length,
        deleted: messages.filter(m => m.status === "deleted").length
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
                    <div className="stat-card-message deleted-stat" style={{ background: '#2c2c2c', border: '1px solid #444' }}>
                        <div className="stat-content-left">
                            <span className="stat-title-msg">Supprimés</span>
                            <span className="stat-value-msg">{stats.deleted}</span>
                        </div>
                        <div className="stat-icon-container">
                            <span className="stat-icon-msg">🗑️</span>
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
                            <button
                                className={`filter-chip ${filter === "deleted" ? "active" : ""}`}
                                onClick={() => setFilter("deleted")}
                            >
                                Supprimés
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
                                    <th>Prénom</th>
                                    <th>Nom</th>
                                    <th>Email</th>
                                    <th>Sujet</th>
                                    <th>Date</th>
                                    <th>Statut</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMessages.map(msg => {
                                    const status = msg.status || (msg.isHandled ? "replied" : (msg.isRead ? "read" : "unread"));
                                    return (
                                        <tr
                                            key={msg._id}
                                            onClick={() => { setSelectedMessage(msg); handleMarkAsRead(msg._id, status); }}
                                            className={`msg-table-row ${status === "unread" ? "unread-row" : ""}`}
                                        >
                                            <td>{status !== "unread" ? "" : <span style={{ display: "block", width: "8px", height: "8px", borderRadius: "50%", background: "#2196f3" }}></span>}</td>
                                            <td>{msg.prenom || "-"}</td>
                                            <td>{msg.nom || msg.name || "Inconnu"}</td>
                                            <td>{msg.email}</td>
                                            <td>{msg.sujet || msg.subject || "Sans sujet"}</td>
                                            <td>{new Date(msg.createdAt).toLocaleDateString()}</td>
                                            <td>
                                                <span className={`status-pill ${status === "replied" ? "completed" : (status === "read" ? "visible" : (status === "deleted" ? "draft" : "draft"))}`}>
                                                    {status === "replied" ? "Répondu" : (status === "read" ? "Lu" : (status === "deleted" ? "Supprimé" : "Non lu"))}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: "right" }}>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(msg._id); }}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}
                                                    title="Supprimer"
                                                >
                                                    🗑️
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
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
                                    {selectedMessage.status === "replied" ? (
                                        <button
                                            className="btn-secondary"
                                            disabled
                                            style={{ padding: "0.75rem 1.5rem", background: "#333", color: "#888", border: "1px solid #444", cursor: 'not-allowed', fontWeight: "600" }}
                                        >
                                            TRAITÉ
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            className="btn-primary"
                                            onClick={() => handleReply(selectedMessage)}
                                            style={{ padding: "0.75rem 1.5rem", background: "#2196f3", color: "#fff", border: "none", fontWeight: "600" }}
                                        >
                                            Répondre (Mail)
                                        </button>
                                    )}

                                    {selectedMessage.status !== "replied" && (
                                        <button
                                            className="btn-primary"
                                            onClick={() => handleMarkAsReplied(selectedMessage._id)}
                                            style={{ padding: "0.75rem 1.5rem", background: "#4caf50", color: "#fff", border: "none", fontWeight: "600" }}
                                        >
                                            Marquer comme répondu
                                        </button>
                                    )}
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
