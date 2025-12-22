import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './dashboard.css';

const AdminClientsPage = () => {
    const navigate = useNavigate();
    const [clients, setClients] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedClient, setSelectedClient] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");

    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
    const authToken = localStorage.getItem("authToken");

    // Fetch Clients
    const fetchClients = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/admin/users`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (res.ok) {
                const data = await res.json();
                setClients(data);
            } else {
                console.error("Failed to fetch clients");
            }
        } catch (error) {
            console.error("Error fetching clients:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!authToken) {
            navigate("/admin");
            return;
        }
        fetchClients();
    }, [authToken, navigate]);

    // Country Code Mapper
    const getCountryCode = (countryName) => {
        const map = {
            "France": "FR",
            "Belgique": "BE",
            "Luxembourg": "LU",
            "Suisse": "CH",
            "Canada": "CA",
            "Monaco": "MC"
        };
        return map[countryName] || "??"; // Fallback or use first 2 chars
    };

    // Status Badge Logic
    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'Actif': return 'status-pill published';
            case 'Résilié': return 'status-pill warning';
            case 'Problème de paiement': return 'status-pill error';
            case 'En attente': return 'status-pill draft';
            default: return 'status-pill draft';
        }
    };

    // Filter Logic
    const filteredClients = clients.filter(client => {
        const search = searchQuery.toLowerCase();
        return (
            (client.nom || "").toLowerCase().includes(search) ||
            (client.prenom || "").toLowerCase().includes(search) ||
            (client.email || "").toLowerCase().includes(search)
        );
    });

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div className="header-left">
                    <button onClick={() => navigate("/admin/dashboard")} className="btn-back">← Retour</button>
                    <h1>Clients</h1>
                    <span style={{ marginLeft: '1rem', color: '#888', fontSize: '0.9rem' }}>
                        {clients.length} clients enregistrés
                    </span>
                </div>
            </header>

            <main className="dashboard-content fade-in">
                <div className="content-wrapper">

                    {/* Search Bar - Visual Match */}
                    <div className="search-bar-container" style={{ marginBottom: '1rem' }}>
                        <input
                            type="text"
                            placeholder="Rechercher par nom, prénom ou email..."
                            className="admin-input"
                            style={{ width: '100%' }}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {isLoading ? (
                        <p style={{ color: '#fff', textAlign: 'center' }}>Chargement...</p>
                    ) : (
                        <div className="admin-card">
                            <div className="books-table-container">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Prénom</th>
                                            <th>Nom</th>
                                            <th>Email</th>
                                            <th>Pays</th>
                                            <th>Date d'inscription</th>
                                            <th>Statut</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredClients.map(client => (
                                            <tr
                                                key={client._id}
                                                onClick={() => setSelectedClient(client)}
                                                style={{ cursor: 'pointer' }}
                                                className="clickable-row"
                                            >
                                                <td>{client.prenom}</td>
                                                <td>{client.nom}</td>
                                                <td>{client.email}</td>
                                                <td>
                                                    {client.pays === 'Monde' ? '🌍' : getCountryCode(client.pays)}
                                                </td>
                                                <td>{client.createdAt ? new Date(client.createdAt).toLocaleDateString() : '-'}</td>
                                                <td>
                                                    <span className={getStatusBadgeClass(client.displayStatus)}>
                                                        {client.displayStatus}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredClients.length === 0 && (
                                            <tr>
                                                <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
                                                    Aucun client trouvé.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* READ ONLY MODAL */}
            {selectedClient && (
                <div className="modal-overlay" onClick={() => setSelectedClient(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2>Fiche Client</h2>

                        <div className="form-row">
                            <div className="form-group half">
                                <label>Prénom</label>
                                <input type="text" value={selectedClient.prenom} readOnly className="admin-input read-only" />
                            </div>
                            <div className="form-group half">
                                <label>Nom</label>
                                <input type="text" value={selectedClient.nom} readOnly className="admin-input read-only" />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Email</label>
                            <input type="text" value={selectedClient.email} readOnly className="admin-input read-only" />
                        </div>

                        <div className="form-row">
                            <div className="form-group half">
                                <label>Pays</label>
                                <input type="text" value={selectedClient.pays} readOnly className="admin-input read-only" />
                            </div>
                            <div className="form-group half">
                                <label>Date d'inscription</label>
                                <input type="text" value={new Date(selectedClient.createdAt).toLocaleDateString()} readOnly className="admin-input read-only" />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group half">
                                <label>Statut Abonnement</label>
                                <input type="text" value={selectedClient.displayStatus} readOnly className="admin-input read-only" />
                            </div>
                            {selectedClient.cancellationDate && (
                                <div className="form-group half">
                                    <label>Date de résiliation</label>
                                    <input type="text" value={new Date(selectedClient.cancellationDate).toLocaleDateString()} readOnly className="admin-input read-only" />
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label>Stripe Customer ID</label>
                            <input type="text" value={selectedClient.stripeCustomerId || "N/A"} readOnly className="admin-input read-only" style={{ fontFamily: 'monospace', fontSize: '0.9rem' }} />
                        </div>

                        <div className="modal-actions">
                            <button onClick={() => setSelectedClient(null)} className="btn-primary">Fermer</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminClientsPage;
