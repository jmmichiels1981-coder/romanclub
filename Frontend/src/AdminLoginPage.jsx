import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './login.css'; // Reusing base login styles, overriding specific adjustments inline or via new class

const AdminLoginPage = () => {
    const [email, setEmail] = useState(""); // No default for security, or prefill if requested (user asked "ne met aucun exemple")
    const [pin, setPin] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, pin })
            });

            const data = await response.json();

            if (data.success) {
                if (data.user.role !== 'admin') {
                    alert("Accès refusé : Vous n'êtes pas administrateur.");
                    setIsLoading(false);
                    return;
                }
                localStorage.setItem("user", JSON.stringify(data.user));
                localStorage.setItem("userLoggedIn", "true");
                localStorage.setItem("authToken", data.token);
                // Redirect to admin area or dashboard if no specific admin area yet
                // Redirect to admin dashboard
                navigate("/admin/dashboard");
            } else {
                alert("Erreur : " + (data.message || "Identifiants incorrects"));
                setIsLoading(false);
            }
        } catch (error) {
            console.error("Login error:", error);
            alert("Erreur serveur.");
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            backgroundColor: '#0f172a', // Dark blueish background as per image
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Inter', system-ui, sans-serif",
            color: '#fff'
        }}>
            {/* Header / Logo Area */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                {/* Logo Image */}
                {/* Override with img tag if needed */}
                <img src="/logo.png" alt="Logo" style={{ width: '160px', marginBottom: '1rem' }} />

                <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Console Admin</h1>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>RomanClub - Panneau d'administration</p>
            </div>

            {/* Login Card */}
            <div style={{
                backgroundColor: '#1e293b', // Slightly lighter dark blue
                padding: '2rem',
                borderRadius: '12px',
                width: '100%',
                maxWidth: '400px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                border: '1px solid #334155'
            }}>
                <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            ✉️ Email Admin
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                backgroundColor: '#334155',
                                border: '1px solid #475569',
                                borderRadius: '6px',
                                color: '#fff',
                                fontSize: '1rem',
                                outline: 'none'
                            }}
                        // "ne met aucun exemple" -> no placeholder
                        />
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            🔒 Code PIN
                        </label>
                        <input
                            type="password"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            required
                            maxLength={6} // Admin PIN is 6 chars? User gave 140181 (6 chars).
                            placeholder="••••••"
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                backgroundColor: '#334155',
                                border: '1px solid #475569',
                                borderRadius: '6px',
                                color: '#fff',
                                fontSize: '1rem',
                                outline: 'none',
                                letterSpacing: '4px'
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            backgroundColor: '#ff7700', // RomanClub Orange
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '1rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            opacity: isLoading ? 0.7 : 1
                        }}
                    >
                        {isLoading ? 'Connexion...' : 'Se connecter'}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                    <a href="/" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem' }}>
                        ← Retour à l'accueil
                    </a>
                </div>
            </div>
        </div>
    );
};

export default AdminLoginPage;
