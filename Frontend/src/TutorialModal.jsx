import React from 'react';
import "./welcome.css"; // Reuse existing styles

const TutorialModal = ({ isOpen, onClose, title, content }) => {
    if (!isOpen) return null;

    return (
        <div className="welcome-overlay">
            <div className="welcome-modal">
                <div className="welcome-content">
                    <h2 className="welcome-title">{title}</h2>

                    {/* Render content as HTML to support various formatting if passed as string, 
                        or render children if passed as JSX. For simplicity given the spec, we render children/content */}
                    <div style={{ fontSize: '1.05rem', lineHeight: '1.6', color: '#e0e0e0' }}>
                        {content}
                    </div>
                </div>

                <div className="welcome-footer">
                    <button className="welcome-btn" onClick={onClose}>
                        👉 OK, j’ai compris
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TutorialModal;
