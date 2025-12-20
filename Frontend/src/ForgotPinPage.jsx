import React from 'react';
import { Link } from 'react-router-dom';
import './login.css'; // Reuse login styles for consistency

const ForgotPinPage = () => {
    return (
        <div className="login-container">
            <div className="login-header">
                <img src="/logo.png" alt="RomanClub Logo" className="login-logo" />
                <h1 className="brand-title">ROMAN CLUB</h1>
                <p className="page-subtitle">CODE PIN OUBLIÉ</p>
            </div>

            <div className="login-card">
                <div style={{ textAlign: 'center', color: '#fff' }}>
                    <p style={{ marginBottom: '1.5rem', lineHeight: '1.6' }}>
                        Pour des raisons de sécurité, le changement de code PIN nécessite une vérification manuelle.
                    </p>
                    <p style={{ marginBottom: '1.5rem', lineHeight: '1.6' }}>
                        Merci de nous contacter à l'adresse suivante pour réinitialiser votre accès :
                    </p>
                    <p style={{ marginBottom: '2rem', fontSize: '1.1rem', fontWeight: 'bold', color: '#ff7700' }}>
                        <a href="mailto:contact@app-romanclub.com" style={{ color: '#ff7700', textDecoration: 'none' }}>contact@app-romanclub.com</a>
                    </p>
                </div>

                <div className="helper-links">
                    <div className="footer-links">
                        <Link to="/connexion">← Retour à la connexion</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPinPage;
