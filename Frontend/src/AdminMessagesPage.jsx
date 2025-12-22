import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./dashboard.css"; // Reuse dashboard styles
import "./admin-messages.css"; // Specific styles (will create inline or reuse)

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
                        filter === "replied" ? msg.isHandled : true; // Assuming isHandled logic later or just reuse read for now? 
        // V1 spec: "Statut (lu / non lu)". replié is separate? 
        // Let's stick to Read/Unread primarily. Replied implies read.

        const matchesSearch =
            msg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            msg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            msg.subject.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesFilter && matchesSearch;
    });

    const stats = {
        total: messages.length,
        unread: messages.filter(m => !m.isRead).length,
        replied: 0 // Placeholder as backend doesn't track reply status strictly yet, or we assume handled=replied if implemented
    };

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div className="header-left">
                    <button className="back-btn-header" onClick={() => navigate("/admin/dashboard")}>←</button>
                    <h1>Messagerie SAV</h1>
                </div>
            </header>

            <main className="dashboard-content fade-in">
                {/* Stats Cards */}
                <div className="stats-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem", marginBottom: "2rem" }}>
                    <div className="stat-card">
                        <h3>Total messages</h3>
                        <p className="stat-value">{stats.total}</p>
                    </div>
                    <div className="stat-card" style={{ borderColor: "#2196f3" }}>
                        <h3>Non lus</h3>
                        <p className="stat-value" style={{ color: "#2196f3" }}>{stats.unread}</p>
                    </div>
                    <div className="stat-card" style={{ borderColor: "#4caf50" }}>
                        <h3>Répondus</h3>
                        <p className="stat-value" style={{ color: "#4caf50" }}>-</p>
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="filters-bar" style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                    <div className="filter-group">
                        <input
                            type="text"
                            placeholder="Rechercher par nom, email ou sujet..."
                            className="search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ padding: "0.5rem", borderRadius: "8px", border: "1px solid #333", background: "#222", color: "#fff", width: "300px" }}
                        />
                    </div>
                    <div className="filter-tabs" style={{ display: "flex", gap: "0.5rem" }}>
                        {["all", "unread", "read"].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`filter-btn ${filter === f ? "active" : ""}`}
                                style={{
                                    padding: "0.5rem 1rem",
                                    borderRadius: "8px",
                                    background: filter === f ? "#e53935" : "#333",
                                    color: "#fff",
                                    border: "none",
                                    cursor: "pointer",
                                    textTransform: "capitalize"
                                }}
                            >
                                {f === "all" ? "Tous" : f === "unread" ? "Non lus" : "Lus"}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Messages List */}
                <div className="books-table-container">
                    <table className="books-table">
                        <thead>
                            <tr>
                                <th>Nom</th>
                                <th>Email</th>
                                <th>Sujet</th>
                                <th>Date</th>
                                <th>Statut</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" style={{ textAlign: "center", padding: "2rem" }}>Chargement...</td></tr>
                            ) : filteredMessages.length === 0 ? (
                                <tr><td colSpan="5" style={{ textAlign: "center", padding: "2rem" }}>Aucun message trouvé</td></tr>
                            ) : (
                                filteredMessages.map(msg => (
                                    <tr
                                        key={msg._id}
                                        onClick={() => { setSelectedMessage(msg); handleMarkAsRead(msg._id, msg.isRead); }}
                                        style={{ cursor: "pointer", background: msg.isRead ? "transparent" : "rgba(229, 57, 53, 0.1)" }}
                                    >
                                        <td>{msg.name}</td>
                                        <td>{msg.email}</td>
                                        <td>{msg.subject}</td>
                                        <td>{new Date(msg.createdAt).toLocaleDateString()} {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                        <td>
                                            <span className={`status-badge ${msg.isRead ? "published" : "draft"}`} style={{ background: msg.isRead ? "#4caf50" : "#e53935" }}>
                                                {msg.isRead ? "Lu" : "Non lu"}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Message Detail Modal */}
                {selectedMessage && (
                    <div className="modal-overlay" onClick={() => setSelectedMessage(null)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: "600px", width: "90%" }}>
                            <div className="modal-header">
                                <h2>Message de {selectedMessage.name}</h2>
                                <button className="close-btn" onClick={() => setSelectedMessage(null)}>×</button>
                            </div>
                            <div className="modal-body" style={{ marginTop: "1rem" }}>
                                <div style={{ marginBottom: "1rem", color: "#ccc", fontSize: "0.9rem" }}>
                                    <p><strong>Email:</strong> {selectedMessage.email}</p>
                                    <p><strong>Date:</strong> {new Date(selectedMessage.createdAt).toLocaleString()}</p>
                                    <p><strong>Sujet:</strong> {selectedMessage.subject}</p>
                                </div>
                                <div className="message-content" style={{ background: "#222", padding: "1rem", borderRadius: "8px", whiteSpace: "pre-wrap", color: "#fff", border: "1px solid #333" }}>
                                    {selectedMessage.message}
                                </div>

                                <div className="modal-actions" style={{ marginTop: "2rem", display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
                                    <button
                                        className="btn-secondary"
                                        onClick={() => setSelectedMessage(null)}
                                        style={{ padding: "0.5rem 1rem", background: "#333", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
                                    >
                                        Fermer
                                    </button>
                                    <button
                                        className="btn-primary"
                                        onClick={() => handleReply(selectedMessage)}
                                        style={{ padding: "0.5rem 1rem", background: "#2196f3", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
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
