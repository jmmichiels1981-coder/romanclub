import { useState, useEffect } from "react";
import "./welcome.css";

function WelcomeModal() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if the user has already seen the welcome message
        const hasSeenWelcome = localStorage.getItem("welcomeSeen");
        // Check if the user is "logged in" (simulated for this task)
        const isLoggedIn = localStorage.getItem("userLoggedIn");

        if (isLoggedIn && !hasSeenWelcome) {
            setIsVisible(true);
        }
    }, []);

    const handleClose = () => {
        localStorage.setItem("welcomeSeen", "true");
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="welcome-overlay">
            <div className="welcome-modal">
                <div className="welcome-content">
                    <h2 className="welcome-title">📘 Message d’accueil — Première connexion</h2>

                    <p className="welcome-text">
                        <strong>Bienvenue dans RomanClub,</strong>
                    </p>
                    <p className="welcome-text">
                        RomanClub est un club de lecture numérique dédié à la découverte de nouveaux talents littéraires.
                    </p>
                    <p className="welcome-text">
                        Chaque dimanche, nous publions un nouveau roman inédit, soigneusement sélectionné selon une ligne éditoriale claire :
                        <br />
                        un polar, une romance, un roman de science-fiction et un roman feel-good chaque mois.
                    </p>
                    <p className="welcome-text">
                        Notre ambition est simple :
                        <br />
                        faire émerger des auteurs prometteurs, dont la qualité d’écriture mérite d’être découverte par le grand public, mais qui n’ont pas toujours la possibilité d’accéder aux circuits traditionnels de l’édition.
                    </p>

                    <h3 className="welcome-section-title">📅 Fonctionnement</h3>
                    <ul className="welcome-list">
                        <li>Un nouveau roman chaque dimanche</li>
                        <li>Accès immédiat depuis votre Bibliothèque → Nouveau roman hebdomadaire</li>
                        <li>Lecture fluide, reprise automatique et résumé intelligent</li>
                    </ul>
                    <p className="welcome-text">
                        L’intelligence artificielle de RomanClub vous permet de vous arrêter à tout moment dans un roman.
                        Si vous reprenez votre lecture plusieurs jours plus tard, un résumé concis et précis de ce que vous avez déjà lu peut être généré, afin de retrouver immédiatement le fil de l’histoire.
                    </p>
                    <p className="welcome-text">
                        Vous recevrez chaque semaine une notification pour vous avertir de la publication du nouveau roman.
                    </p>

                    <h3 className="welcome-section-title">🎁 Période de gratuité</h3>
                    <p className="welcome-text">
                        RomanClub est entièrement gratuit de janvier 2026 à juin 2026 inclus.
                    </p>
                    <ul className="welcome-list">
                        <li>Aucun paiement requis</li>
                        <li>Aucun prélèvement avant le 1er juillet 2026</li>
                        <li>Accès à tous les romans publiés pendant cette période</li>
                    </ul>

                    <h3 className="welcome-section-title">💶 Abonnement à partir du 1er juillet 2026</h3>
                    <p className="welcome-text">
                        À partir du 1er juillet 2026 :
                    </p>
                    <ul className="welcome-list">
                        <li>Abonnement : 15 € / mois</li>
                        <li>4 romans par mois, soit 3,75 € par roman</li>
                    </ul>
                    <p className="welcome-text">
                        RomanClub s’engage pour une rémunération juste des auteurs :
                        <br />
                        70 % des revenus sont reversés directement aux auteurs, en fonction des lectures de leurs romans.
                    </p>

                    <h3 className="welcome-section-title">✍️ Notre engagement éditorial</h3>
                    <p className="welcome-text">
                        Chaque roman publié sur RomanClub a été choisi pour :
                    </p>
                    <ul className="welcome-list">
                        <li>la qualité de son écriture</li>
                        <li>le potentiel de son auteur</li>
                    </ul>
                    <p className="welcome-text">
                        En lisant sur RomanClub, vous participez activement à la mise en lumière d’une nouvelle génération d’auteurs et contribuez à un modèle plus équitable pour la création littéraire.
                    </p>
                    <p className="welcome-text" style={{ marginTop: "2rem" }}>
                        Nous vous souhaitons une excellente lecture.
                        <br />
                        <strong>Bienvenue dans le club.</strong>
                    </p>
                </div>

                <div className="welcome-footer">
                    <button className="welcome-btn" onClick={handleClose}>
                        OK, j’ai compris
                    </button>
                </div>
            </div>
        </div>
    );
}

export default WelcomeModal;
