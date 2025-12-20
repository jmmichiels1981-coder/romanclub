import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './dashboard.css';

const AdminBooksPage = () => {
    const navigate = useNavigate();
    const [books, setBooks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingBook, setEditingBook] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        title: "",
        author: "",
        genre: "polar",
        editorialSummary: "",
        contentUrl: "",
        publishedAt: "",
        isPublished: false
    });

    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
    const authToken = localStorage.getItem("authToken");

    // Fetch Books
    const fetchBooks = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/admin/books`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (res.ok) {
                const data = await res.json();
                setBooks(data);
            } else {
                console.error("Failed to fetch books");
            }
        } catch (error) {
            console.error("Error fetching books:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!authToken) {
            navigate("/admin");
            return;
        }
        fetchBooks();
    }, [authToken, navigate]);

    // Handlers
    const handleOpenModal = (book = null) => {
        if (book) {
            setEditingBook(book);
            setFormData({
                title: book.title,
                author: book.author,
                genre: book.genre,
                editorialSummary: book.editorialSummary,
                contentUrl: book.contentUrl,
                publishedAt: book.publishedAt ? new Date(book.publishedAt).toISOString().split('T')[0] : "",
                isPublished: book.isPublished
            });
        } else {
            setEditingBook(null);
            setFormData({
                title: "",
                author: "",
                genre: "polar",
                editorialSummary: "",
                contentUrl: "",
                publishedAt: "",
                isPublished: false
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingBook(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = editingBook
            ? `${API_URL}/admin/books/${editingBook._id}`
            : `${API_URL}/admin/books`;
        const method = editingBook ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(formData)
            });

            const data = await res.json();
            if (res.ok) {
                alert(editingBook ? "Livre modifié !" : "Livre créé !");
                handleCloseModal();
                fetchBooks();
            } else {
                alert("Erreur: " + (data.error || "Une erreur est survenue"));
            }
        } catch (error) {
            console.error("Submit error:", error);
            alert("Erreur de connexion");
        }
    };

    const handleTogglePublish = async (book) => {
        if (!window.confirm(`Voulez-vous ${book.isPublished ? "dépublier" : "publier"} ce livre ?`)) return;

        try {
            const res = await fetch(`${API_URL}/admin/books/${book._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    ...book,
                    isPublished: !book.isPublished
                    // Note: sending all fields back because specific PUT endpoint might validate/require them?
                    // My backend implementation requires all fields for validation.
                    // So I must send full object. Ideally, I should fetch fresh or just use "book" from list.
                    // Using "book" from list is safe enough here.
                })
            });

            if (res.ok) {
                fetchBooks();
            } else {
                const data = await res.json();
                alert("Erreur: " + data.error);
            }
        } catch (error) {
            alert("Erreur de connexion");
        }
    };

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div className="header-left">
                    <button onClick={() => navigate("/admin/dashboard")} className="btn-back">← Retour</button>
                    <h1>Gestion des Romans</h1>
                </div>
                <div className="header-right">
                    <button className="btn-primary" onClick={() => handleOpenModal()}>+ Ajouter un Roman</button>
                </div>
            </header>

            <main className="dashboard-content fade-in">
                <div className="content-wrapper">
                    {isLoading ? (
                        <p style={{ color: '#fff', textAlign: 'center' }}>Chargement...</p>
                    ) : (
                        <div className="admin-card">
                            <div className="books-table-container">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Statut</th>
                                            <th>Titre</th>
                                            <th>Auteur</th>
                                            <th>Genre</th>
                                            <th>Date Publ.</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {books.map(book => (
                                            <tr key={book._id}>
                                                <td>
                                                    <span
                                                        className={`status-pill ${book.isPublished ? 'published' : 'draft'}`}
                                                        onClick={() => handleTogglePublish(book)}
                                                        style={{ cursor: 'pointer' }}
                                                        title="Cliquer pour changer le statut"
                                                    >
                                                        {book.isPublished ? 'Publié' : 'Brouillon'}
                                                    </span>
                                                </td>
                                                <td><strong>{book.title}</strong></td>
                                                <td>{book.author}</td>
                                                <td>
                                                    <span style={{
                                                        textTransform: 'capitalize',
                                                        color: '#aaa',
                                                        fontSize: '0.85rem'
                                                    }}>
                                                        {book.genre}
                                                    </span>
                                                </td>
                                                <td>{book.publishedAt ? new Date(book.publishedAt).toLocaleDateString() : '-'}</td>
                                                <td>
                                                    <button className="btn-icon" onClick={() => handleOpenModal(book)} title="Modifier">✏️</button>
                                                </td>
                                            </tr>
                                        ))}
                                        {books.length === 0 && (
                                            <tr>
                                                <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
                                                    Aucun roman dans le catalogue.
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

            {/* MODAL */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content large-modal">
                        <h2>{editingBook ? "Modifier le roman" : "Ajouter un roman"}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Titre *</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    required
                                    className="admin-input"
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group half">
                                    <label>Auteur *</label>
                                    <input
                                        type="text"
                                        value={formData.author}
                                        onChange={e => setFormData({ ...formData, author: e.target.value })}
                                        required
                                        className="admin-input"
                                    />
                                </div>
                                <div className="form-group half">
                                    <label>Genre *</label>
                                    <select
                                        value={formData.genre}
                                        onChange={e => setFormData({ ...formData, genre: e.target.value })}
                                        className="admin-input"
                                    >
                                        <option value="polar">Polar</option>
                                        <option value="romance">Romance</option>
                                        <option value="science-fiction">Science-Fiction</option>
                                        <option value="feel-good">Feel-Good</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Résumé Éditorial *</label>
                                <textarea
                                    value={formData.editorialSummary}
                                    onChange={e => setFormData({ ...formData, editorialSummary: e.target.value })}
                                    required
                                    className="admin-input"
                                    rows="4"
                                    placeholder="Rédigé manuellement, affiché aux utilisateurs..."
                                />
                            </div>

                            <div className="form-group">
                                <label>URL Contenu HTML *</label>
                                <input
                                    type="url"
                                    value={formData.contentUrl}
                                    onChange={e => setFormData({ ...formData, contentUrl: e.target.value })}
                                    required
                                    className="admin-input"
                                    placeholder="https://..."
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group half">
                                    <label>Date de publication *</label>
                                    <input
                                        type="date"
                                        value={formData.publishedAt}
                                        onChange={e => setFormData({ ...formData, publishedAt: e.target.value })}
                                        required
                                        className="admin-input"
                                    />
                                </div>
                                <div className="form-group half checkbox-group">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={formData.isPublished}
                                            onChange={e => setFormData({ ...formData, isPublished: e.target.checked })}
                                        />
                                        Publier immédiatement
                                    </label>
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" onClick={handleCloseModal} className="btn-secondary">Annuler</button>
                                <button type="submit" className="btn-primary">Enregistrer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminBooksPage;
