import React, { useState, useEffect } from 'react';

const PwaInstallPrompt = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isIOS, setIsIOS] = useState(false);
    const [showIOSInstructions, setShowIOSInstructions] = useState(false);

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
        if (isIOS) {
            setShowIOSInstructions(true);
        } else if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setIsVisible(false);
            }
            setDeferredPrompt(null);
        }
    };

    const handleDismiss = () => {
        setIsVisible(false);
        sessionStorage.setItem('pwaPromptDismissed', 'true');
    };

    if (!isVisible) return null;

    return (
        <>
            {/* MAIN PROMPT BANNER */}
            <div style={styles.overlay}>
                <div style={styles.card}>
                    <div style={styles.content}>
                        <div style={styles.iconWrapper}>
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

                    <button onClick={handleInstallClick} style={styles.installBtn}>
                        Installer Roman Club
                    </button>
                </div>
            </div>

            {/* iOS INSTRUCTIONS MODAL */}
            {showIOSInstructions && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalCard}>
                        <div style={styles.modalHeader}>
                            <h3>Installation sur iOS</h3>
                            <button onClick={() => setShowIOSInstructions(false)} style={styles.modalCloseBtn}>×</button>
                        </div>
                        <div style={styles.modalBody}>
                            <p>Pour installer l'application sur votre iPhone / iPad, suivez ces 2 étapes :</p>

                            <div style={styles.step}>
                                <div style={styles.stepIcon}>
                                    {/* Share Icon SVG */}
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                                        <polyline points="16 6 12 2 8 6" />
                                        <line x1="12" y1="2" x2="12" y2="15" />
                                    </svg>
                                </div>
                                <div style={styles.stepText}>
                                    1. Appuyez sur le bouton <strong>Partager</strong> dans la barre de menu de Safari.
                                </div>
                            </div>

                            <div style={styles.step}>
                                <div style={styles.stepIcon}>
                                    {/* Plus Square Icon SVG */}
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                        <line x1="12" y1="8" x2="12" y2="16" />
                                        <line x1="8" y1="12" x2="16" y2="12" />
                                    </svg>
                                </div>
                                <div style={styles.stepText}>
                                    2. Sélectionnez <strong>Sur l'écran d'accueil</strong> dans la liste.
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setShowIOSInstructions(false)} style={styles.modalBtn}>Compris</button>
                    </div>
                </div>
            )}
        </>
    );
};

const styles = {
    overlay: {
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        right: '20px',
        zIndex: 9998,
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
    // Modal Styles
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.8)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
    },
    modalCard: {
        background: '#1e293b',
        width: '100%',
        maxWidth: '360px',
        borderRadius: '16px',
        padding: '24px',
        color: 'white',
        border: '1px solid #334155',
        animation: 'fadeIn 0.2s ease-out'
    },
    modalHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
    },
    modalCloseBtn: {
        background: 'none',
        border: 'none',
        color: '#94a3b8',
        fontSize: '1.5rem',
        cursor: 'pointer'
    },
    modalBody: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
    },
    step: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        background: 'rgba(255,255,255,0.05)',
        padding: '12px',
        borderRadius: '8px'
    },
    stepIcon: {
        color: '#3b82f6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    stepText: {
        fontSize: '0.95rem',
        lineHeight: '1.4'
    },
    modalBtn: {
        marginTop: '20px',
        width: '100%',
        background: '#334155',
        color: '#fff',
        border: 'none',
        padding: '12px',
        borderRadius: '8px',
        fontWeight: 'bold',
        cursor: 'pointer'
    }
};

export default PwaInstallPrompt;
