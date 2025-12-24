import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './dashboard.css'; // Re-use dashboard styles

const AdminFinancePage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState(null);
    const [expenses, setExpenses] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // Expense Form State
    const [formData, setFormData] = useState({
        amount: '',
        currency: 'EUR',
        date: new Date().toISOString().split('T')[0],
        category: 'outils',
        country: 'BE',
        vatAmount: '',
        description: ''
    });

    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

    useEffect(() => {
        fetchData();
        fetchExpenses();
    }, [selectedMonth, selectedYear]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("authToken");
            const res = await fetch(`${API_URL}/admin/finance/summary?month=${selectedMonth}&year=${selectedYear}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSummary(data);
            }
        } catch (error) {
            console.error("Error fetching finance summary:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchExpenses = async () => {
        try {
            const token = localStorage.getItem("authToken");
            const res = await fetch(`${API_URL}/admin/finance/expenses`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setExpenses(data);
            }
        } catch (error) {
            console.error("Error fetching expenses:", error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmitExpense = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("authToken");
            const res = await fetch(`${API_URL}/admin/finance/expenses`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setShowModal(false);
                setFormData({
                    amount: '',
                    currency: 'EUR',
                    date: new Date().toISOString().split('T')[0],
                    category: 'outils',
                    country: 'BE',
                    vatAmount: '',
                    description: ''
                });
                fetchData(); // Refresh summary
                fetchExpenses(); // Refresh list
            } else {
                alert("Erreur lors de l'ajout");
            }
        } catch (error) {
            console.error("Error creating expense:", error);
        }
    };

    const handleDeleteExpense = async (id) => {
        if (!window.confirm("Supprimer cette dépense ?")) return;
        try {
            const token = localStorage.getItem("authToken");
            await fetch(`${API_URL}/admin/finance/expenses/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            fetchData();
            fetchExpenses();
        } catch (error) {
            console.error("Error deleting expense:", error);
        }
    };

    // Helpers
    const formatCurrency = (amount, currency = 'EUR') => {
        return new Intl.NumberFormat('fr-BE', { style: 'currency', currency }).format(amount);
    };

    // Calculate Net Profit
    // CA - Dépenses - TVA à payer + TVA à déduire
    // Note: 'TVA à payer' usually comes from Sales (Collected)
    // 'TVA à déduire' from Expenses
    // BUT Profit = CA HT - Dépenses HT + (TVA Collectée - TVA Déductible)?
    // Accountingly: Profit = Revenue (excl VAT) - Expenses (excl VAT).
    // Startups often look at Cash Flow: Cash In - Cash Out.
    // The spec says: Bénéfice net = Chiffre d’affaires – Dépenses – TVA à payer + TVA à déduire
    // Wait. "TVA à payer" is what you owe to state. "TVA à déduire" is what state owes you.
    // If we assume CA is Gross (TTC) and Expenses are Gross (TTC):
    // Net Cash = CA (TTC) - Expenses (TTC) - (VAT Collected - VAT Deductible)
    // Actually the equation in spec: "CA - Dépenses - TVA à payer + TVA à déduire"
    // Let's stick to the spec's formula visually.

    const calculateNet = () => {
        if (!summary) return 0;
        const CA = summary.revenue.totalEur;
        const DEP = summary.expenses.total;

        // Sum taxes
        const totalCollected = Object.values(summary.taxes.collected).reduce((a, b) => a + b, 0);
        const totalDeductible = Object.values(summary.taxes.deductible).reduce((a, b) => a + b, 0);

        // Spec formula: CA - Expenses - (Collected) + (Deductible)
        // Wait, if I pay VAT to state, it's cash out.
        // Balance VAT = Collected - Deductible.
        // If Balance > 0, I pay. If < 0, I get back.
        // So Net = CA - Expenses - (Collected - Deductible).
        // This matches " - Collected + Deductible".

        return CA - DEP - totalCollected + totalDeductible;
    };

    if (loading && !summary) return <div className="loading-spinner">Chargement...</div>;

    const netProfit = calculateNet();
    const months = [
        "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
        "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div className="header-left">
                    <button className="btn-back" onClick={() => navigate("/admin/dashboard")}>←</button>
                    <h1>Finance</h1>
                    <span className="subtitle">Suivi CA, dépenses, TVA et Bénéfice net</span>
                </div>
                <div className="header-right">
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                        className="date-selector"
                    >
                        {months.map((m, i) => (
                            <option key={i} value={i + 1}>{m}</option>
                        ))}
                    </select>
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        className="date-selector"
                        style={{ marginLeft: '10px' }}
                    >
                        <option value="2024">2024</option>
                        <option value="2025">2025</option>
                        <option value="2026">2026</option>
                    </select>
                </div>
            </header>

            <main className="dashboard-content fade-in">
                {/* TOP CARDS */}
                <div className="stats-grid">
                    <div className="stat-card" style={{ borderLeft: '4px solid #00c853' }}>
                        <h3>{summary ? formatCurrency(summary.revenue.totalEur) : '0,00 €'}</h3>
                        <p>Chiffre d'Affaires</p>
                    </div>
                    <div className="stat-card" style={{ borderLeft: '4px solid #d32f2f' }}>
                        <h3>{summary ? formatCurrency(summary.expenses.total) : '0,00 €'}</h3>
                        <p>Total Dépenses</p>
                    </div>
                    <div className="stat-card" style={{ borderLeft: '4px solid #2196f3' }}>
                        <h3>{summary ? formatCurrency(Object.values(summary.taxes.deductible).reduce((a, b) => a + b, 0)) : '0,00 €'}</h3>
                        <p>TVA à récupérer (Total)</p>
                    </div>
                    <div className="stat-card" style={{ borderLeft: `4px solid ${netProfit >= 0 ? '#00c853' : '#d32f2f'}` }}>
                        <h3 style={{ color: netProfit >= 0 ? '#00c853' : '#d32f2f' }}>
                            {formatCurrency(netProfit)}
                        </h3>
                        <p>Bénéfice Net</p>
                    </div>
                </div>

                <div className="grid-2-columns">
                    {/* COL 1: REVENUE DETAILS */}
                    <div className="content-card">
                        <h2>Chiffre d'affaires par devise</h2>
                        <div className="currency-list">
                            {summary && Object.entries(summary.revenue.byCurrency).map(([curr, val]) => (
                                <div key={curr} className="currency-row">
                                    <span className="currency-badge">{curr}</span>
                                    <span>{new Intl.NumberFormat('fr-BE', { style: 'currency', currency: curr }).format(val)}</span>
                                </div>
                            ))}
                            {(!summary || Object.keys(summary.revenue.byCurrency).length === 0) && (
                                <p className="empty-text">Aucun revenu sur la période.</p>
                            )}
                        </div>
                    </div>

                    {/* COL 2: EXPENSES LIST */}
                    <div className="content-card">
                        <div className="card-header-row">
                            <h2>Dépenses du mois</h2>
                            <button className="btn-primary" onClick={() => setShowModal(true)}>+ Ajouter</button>
                        </div>
                        <div className="expenses-list">
                            {expenses.length === 0 ? (
                                <p className="empty-text">Aucune dépense enregistrée.</p>
                            ) : (
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Catégorie</th>
                                            <th>Montant</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {expenses.map(exp => (
                                            <tr key={exp._id}>
                                                <td>{new Date(exp.date).toLocaleDateString()}</td>
                                                <td>{exp.category}</td>
                                                <td style={{ color: '#ff5252' }}>- {formatCurrency(exp.amount, exp.currency)}</td>
                                                <td>
                                                    <button className="btn-icon-delete" onClick={() => handleDeleteExpense(exp._id)}>🗑️</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                        <div className="total-row" style={{ marginTop: '1rem', borderTop: '1px solid #eee', paddingTop: '0.5rem', textAlign: 'right' }}>
                            Total : <span style={{ color: '#d32f2f', fontWeight: 'bold' }}>{summary ? formatCurrency(summary.expenses.total) : '0,00 €'}</span>
                        </div>
                    </div>
                </div>

                {/* TVA SECTION */}
                <div className="content-card" style={{ marginTop: '2rem' }}>
                    <div className="card-header-row">
                        <h2>TVA / Taxes - Gestion Multi-pays</h2>
                        <div className="info-badge">Belgique (TVA 21%) - Défaut</div>
                    </div>
                    <div className="alert-info" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
                        ℹ️ Note: L'affichage dépend du paramétrage Stripe Tax. Pour la V1, seules les dépenses manuelles affectent la TVA déductible par pays.
                    </div>

                    <div className="countries-grid">
                        {['BE', 'FR', 'LU', 'CH', 'CA'].map(country => {
                            const collected = summary?.taxes.collected[country] || 0;
                            const deductible = summary?.taxes.deductible[country] || 0;
                            const balance = collected - deductible;

                            return (
                                <div key={country} className="country-tax-card">
                                    <h4>{country === 'MWST' ? 'Suisse' : country}</h4>
                                    <div className="tax-row">
                                        <span>Collectée:</span>
                                        <span className="val-collected">{formatCurrency(collected)}</span>
                                    </div>
                                    <div className="tax-row">
                                        <span>Déductible:</span>
                                        <span className="val-deductible">{formatCurrency(deductible)}</span>
                                    </div>
                                    <div className="tax-row balance-row">
                                        <span>Solde:</span>
                                        <span className={balance > 0 ? 'text-warn' : 'text-success'}>
                                            {formatCurrency(balance)}
                                            {balance > 0 ? ' (À payer)' : ' (À récupérer)'}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* CALCULATION FOOTER */}
                <div className="content-card" style={{ marginTop: '2rem' }}>
                    <h2>Calcul du Bénéfice Net</h2>
                    <div className="calculation-visual">
                        <div className="calc-block positive">
                            <label>CA</label>
                            <span>{summary ? formatCurrency(summary.revenue.totalEur) : '0 €'}</span>
                        </div>
                        <span className="operator">-</span>
                        <div className="calc-block negative">
                            <label>Dépenses</label>
                            <span>{summary ? formatCurrency(summary.expenses.total) : '0 €'}</span>
                        </div>
                        <span className="operator">+</span>
                        <div className="calc-block positive">
                            <label>Solde TVA (Récup - Payé)</label>
                            <span>{summary ? formatCurrency((Object.values(summary.taxes.deductible).reduce((a, b) => a + b, 0) - Object.values(summary.taxes.collected).reduce((a, b) => a + b, 0))) : '0 €'}</span>
                        </div>
                        <span className="operator">=</span>
                        <div className={`calc-block result ${netProfit >= 0 ? 'positive-bg' : 'negative-bg'}`}>
                            <label>Bénéfice Net</label>
                            <span>{formatCurrency(netProfit)}</span>
                        </div>
                    </div>
                </div>
            </main>

            {/* MODAL ADD EXPENSE */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Ajouter une dépense</h3>
                        <form onSubmit={handleSubmitExpense}>
                            <div className="form-group">
                                <label>Date</label>
                                <input
                                    type="date"
                                    name="date"
                                    value={formData.date}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Catégorie</label>
                                <select name="category" value={formData.category} onChange={handleInputChange}>
                                    <option value="hebergement">Hébergement</option>
                                    <option value="outils">Outils / SaaS</option>
                                    <option value="marketing">Marketing</option>
                                    <option value="autre">Autre</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Pays (TVA)</label>
                                <select name="country" value={formData.country} onChange={handleInputChange}>
                                    <option value="BE">Belgique</option>
                                    <option value="FR">France</option>
                                    <option value="LU">Luxembourg</option>
                                    <option value="CH">Suisse</option>
                                    <option value="CA">Canada</option>
                                    <option value="Autre">Autre</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Montant (TTC)</label>
                                <div className="input-group">
                                    <input
                                        type="number"
                                        name="amount"
                                        value={formData.amount}
                                        onChange={handleInputChange}
                                        step="0.01"
                                        required
                                    />
                                    <select name="currency" value={formData.currency} onChange={handleInputChange}>
                                        <option value="EUR">EUR</option>
                                        <option value="USD">USD</option>
                                        <option value="CHF">CHF</option>
                                        <option value="CAD">CAD</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Dont TVA (Montant)</label>
                                <input
                                    type="number"
                                    name="vatAmount"
                                    value={formData.vatAmount}
                                    onChange={handleInputChange}
                                    step="0.01"
                                    placeholder="Ex: 21.00"
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <input
                                    type="text"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="Détails..."
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
                                <button type="submit" className="btn-primary">Enregistrer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <style>{`
                .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
                .stat-card { background: #1e293b; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                .stat-card h3 { font-size: 1.8rem; margin: 0; }
                .stat-card p { opacity: 0.7; font-size: 0.9rem; }
                .grid-2-columns { display: grid; grid-template-columns: 1fr 2fr; gap: 1.5rem; }
                .content-card { background: #1e293b; padding: 1.5rem; border-radius: 12px; }
                .card-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
                .currency-list { display: flex; flex-direction: column; gap: 0.5rem; }
                .currency-row { display: flex; justify-content: space-between; padding: 0.5rem; background: rgba(255,255,255,0.05); border-radius: 8px; }
                .currency-badge { background: #334155; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: bold; }
                .expenses-list table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
                .expenses-list th { text-align: left; padding: 0.5rem; color: #94a3b8; border-bottom: 1px solid #334155; }
                .expenses-list td { padding: 0.75rem 0.5rem; border-bottom: 1px solid #1e293b; }
                .countries-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; }
                .country-tax-card { background: #0f172a; padding: 1rem; border-radius: 8px; border: 1px solid #334155; }
                .country-tax-card h4 { margin: 0 0 0.5rem 0; color: #cbd5e1; }
                .tax-row { display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.25rem; }
                .val-collected { color: #818cf8; }
                .val-deductible { color: #4ade80; }
                .balance-row { margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid #334155; font-weight: bold; }
                .text-warn { color: #f87171; } 
                .text-success { color: #4ade80; }
                .calculation-visual { display: flex; align-items: center; justify-content: space-around; background: #0f172a; padding: 1rem; border-radius: 8px; flex-wrap: wrap; gap: 1rem;}
                .calc-block { display: flex; flex-direction: column; align-items: center; }
                .calc-block label { font-size: 0.8rem; color: #94a3b8; margin-bottom: 0.25rem; }
                .calc-block span { font-size: 1.2rem; fontWeight: bold; }
                .positive span { color: #4ade80; }
                .negative span { color: #f87171; }
                .operator { font-size: 1.5rem; color: #64748b; }
                .result span { font-size: 1.5rem; }
                .positive-bg {  }
                .negative-bg {  }
                .date-selector { background: #334155; color: white; border: none; padding: 0.5rem; border-radius: 4px; }
            `}</style>
        </div>
    );
};

export default AdminFinancePage;
