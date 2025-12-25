import React, { useState, useEffect } from 'react';

const PwaInstallPrompt = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // 1. Check if already installed (Standalone mode)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
        if (isStandalone) {
            return;
        }

        // 2. Check Session Dismissal
        const isDismissed = sessionStorage.getItem('pwaPromptDismissed');
        if (isDismissed) {
            return;
        }

        // 3. User Agent Detection (Mobile & Tablet ONLY)
        const ua = navigator.userAgent;
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);

        // Exclude Desktop (even if small screen)
        if (!isMobile) {
            return;
        }

        // 4. Android Logic (beforeinstallprompt)
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // 5. iOS Logic
        const isIOSDevice = /iPhone|iPad|iPod/.test(ua) && !window.MSStream;
        if (isIOSDevice) {
            setIsIOS(true);
            setIsVisible(true);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setIsVisible(false);
        }
        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setIsVisible(false);
        sessionStorage.setItem('pwaPromptDismissed', 'true');
    };

    if (!isVisible) return null;

    return (
        <div style={styles.overlay}>
            <div style={styles.card}>
                <div style={styles.content}>
                    <div style={styles.iconWrapper}>
                        {/* Mock Icon mimicking the logo or generic mobile icon */}
                        <span style={{ fontSize: '24px' }}>📱</span>
                    </div>
                    <div style={styles.textWrapper}>
                        <h3 style={styles.title}>Installer RomanClub</h3>
                        <p style={styles.text}>
                            Installer l'application Roman Club sur votre téléphone/tablette pour une meilleure expérience.
                        </p>
                    </div>
                    <button onClick={handleDismiss} style={styles.closeBtn}>×</button>
                </div>

                {isIOS ? (
                    <div style={styles.iosInstructions}>
                        <p style={{ margin: 0, fontSize: '0.9rem' }}>
                            Pour installer, appuyez sur <span style={{ fontSize: '1.2em' }}>⎋</span> (Partager) puis sur <strong>"Sur l'écran d'accueil"</strong>.
                        </p>
                    </div>
                ) : (
                    <button onClick={handleInstallClick} style={styles.installBtn}>
                        Installer Roman Club
                    </button>
                )}
            </div>
        </div>
    );
};

const styles = {
    overlay: {
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        right: '20px',
        zIndex: 9999,
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
        paddingRight: '20px' // Space for close btn
    },
    iconWrapper: {
        background: '#ff9800',
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
        margin: '0 0 4px 0',
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
    installBtn: {
        marginTop: '12px',
        width: '100%',
        background: '#ff9800',
        color: '#fff',
        border: 'none',
        padding: '10px',
        borderRadius: '8px',
        fontSize: '0.95rem',
        fontWeight: 'bold',
        cursor: 'pointer'
    },
    iosInstructions: {
        marginTop: '12px',
        padding: '10px',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '8px',
        textAlign: 'center',
        color: '#cbd5e1'
    }
};

export default PwaInstallPrompt;
