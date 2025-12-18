import React from 'react';
import './welcome_gift.css';

const WelcomeGiftModal = ({ onClose }) => {
    return (
        <div className="welcome-gift-overlay">
            <div className="welcome-gift-modal">
                <span className="gift-emoji">🎁</span>

                <h2 className="gift-title">Un cadeau de bienvenue pour vous</h2>

                <div className="gift-content">
                    <p>
                        Pour vous souhaiter la bienvenue dans RomanClub, nous sommes heureux de vous offrir un roman en cadeau, accessible immédiatement.
                    </p>

                    <div className="book-highlight">
                        <span className="book-title">📘 Les échos de la sagesse</span>
                        <span className="book-subtitle">60 histoires bouddhistes pour élever votre vie</span>
                    </div>

                    <p>
                        Ce livre vous a été spécialement sélectionné comme première lecture, afin de vous permettre de découvrir l’expérience RomanClub dès maintenant : une lecture fluide, apaisante et inspirante, à votre rythme.
                    </p>

                    <p style={{ marginTop: '1rem' }}>
                        Vous le retrouverez immédiatement dans votre Bibliothèque, section <strong>Nouveau roman hebdomadaire</strong>.
                    </p>

                    <p style={{ marginTop: '1rem', fontStyle: 'italic', color: '#888' }}>
                        Nous vous souhaitons une très belle découverte et d’excellents moments de lecture au sein du club.
                    </p>

                    <p style={{ fontWeight: 'bold', margin: '1rem 0' }}>
                        Bienvenue dans RomanClub.
                    </p>
                </div>

                <button className="gift-confirm-btn" onClick={onClose}>
                    OK, j'ai compris
                </button>
            </div>
        </div>
    );
};

export default WelcomeGiftModal;
