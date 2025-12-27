import React, { useState, useEffect } from 'react';

const NotificationPrompt = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // 1. Check if App is Installed (Standalone Mode)
        // CRITICAL: Only show if installed
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
        if (!isStandalone) {
            return;
        }

        // 2. Check Notification Permission Status
        // Only show if 'default' (not yet asked)
        if (!('Notification' in window) || Notification.permission !== 'default') {
            return;
        }

        // 3. Check Session Dismissal
        // "pas plus d'une fois par session"
        const isDismissed = sessionStorage.getItem('notificationPromptDismissed');
        if (isDismissed) {
            return;
        }

        // Show prompt
        setIsVisible(true);
    }, []);

    const handleAllow = async () => {
        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                setIsVisible(false);
                // Optionally: Trigger a "Welcome Notification" or register token here if needed in future
            } else {
                // Denied or closed
                setIsVisible(false); // Hide even if denied, standard behavior is not to harass
            }
        } catch (error) {
            console.error("Notification permission error:", error);
            setIsVisible(false);
        }
    };

    const handleDismiss = () => {
        setIsVisible(false);
        sessionStorage.setItem('notificationPromptDismissed', 'true');
    };

    if (!isVisible) return null;

    return (
        <div style={styles.overlay}>
            <div style={styles.card}>
                <div style={styles.content}>
                    <div style={styles.iconWrapper}>
                        <span style={{ fontSize: '24px' }}>🔔</span>
                    </div>
                    <div style={styles.textWrapper}>
                        <h3 style={styles.title}>Activer les notifications Roman Club</h3>
                        <p style={styles.text}>
                            Recevez uniquement des notifications utiles :<br />
                            – nouveau roman disponible<br />
                            – facture disponible
                        </p>
                        <p style={{ ...styles.text, marginTop: '8px', opacity: 0.8, fontSize: '0.75rem' }}>
                            Aucun spam. Vous pouvez désactiver à tout moment.
                        </p>
                    </div>
                    <button onClick={handleDismiss} style={styles.closeBtn}>×</button>
                </div>

                <div style={styles.actions}>
                    <button onClick={handleDismiss} style={styles.secondaryBtn}>
                        Plus tard
                    </button>
                    <button onClick={handleAllow} style={styles.primaryBtn}>
                        Autoriser
                    </button>
                </div>
            </div>
        </div>
    );
};

// Reusing styles from PwaInstallPrompt for consistency, with minor adaptations
const styles = {
    overlay: {
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        right: '20px',
        zIndex: 9999, // On top
        display: 'flex',
        justifyContent: 'center',
        paddingBottom: 'safe-area-inset-bottom'
    },
    card: {
        background: '#1e293b',
        color: '#fff',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
        maxWidth: '400px',
        width: '100%',
        border: '1px solid #334155',
        position: 'relative'
    },
    content: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        paddingRight: '20px'
    },
    iconWrapper: {
        background: '#ff9800', // Orange brand
        width: '40px',
        height: '40px',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
    },
    textWrapper: {
        flex: 1
    },
    title: {
        margin: '0 0 8px 0',
        fontSize: '1rem',
        fontWeight: 'bold',
        color: '#fff'
    },
    text: {
        margin: 0,
        fontSize: '0.85rem',
        color: '#cbd5e1',
        lineHeight: '1.4'
    },
    closeBtn: {
        position: 'absolute',
        top: '8px',
        right: '8px',
        background: 'none',
        border: 'none',
        color: '#94a3b8',
        fontSize: '1.5rem',
        cursor: 'pointer',
        padding: '4px',
        lineHeight: 1
    },
    actions: {
        display: 'flex',
        gap: '12px',
        marginTop: '16px',
        justifyContent: 'flex-end'
    },
    primaryBtn: {
        flex: 1,
        background: '#ff9800',
        color: '#fff',
        border: 'none',
        padding: '10px 16px',
        borderRadius: '8px',
        fontSize: '0.9rem',
        fontWeight: 'bold',
        cursor: 'pointer'
    },
    secondaryBtn: {
        background: 'transparent',
        color: '#94a3b8', // Muted text
        border: 'none',
        padding: '10px 16px',
        borderRadius: '8px',
        fontSize: '0.9rem',
        fontWeight: '500',
        cursor: 'pointer'
    }
};

export default NotificationPrompt;
