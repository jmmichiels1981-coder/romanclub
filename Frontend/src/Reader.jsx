import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import "./reader.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function Reader() {
    const { bookId } = useParams();
    const navigate = useNavigate();
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(0);
    const contentRef = useRef(null);

    // Retrieve auth token
    const token = localStorage.getItem("authToken");

    useEffect(() => {
        if (!token) {
            navigate("/connexion");
            return;
        }

        const fetchBookContent = async () => {
            try {
                // 1. Start or Resume to get position
                const resStart = await fetch(`${API_URL}/library/${bookId}/start-or-resume`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!resStart.ok) throw new Error("Impossible de charger le livre");
                const dataStart = await resStart.json();

                // 2. We need the content URL. 
                // The endpoint start-or-resume does NOT return contentUrl in the current spec implementation in index.js.
                // It returns { status, lastChapter, lastPosition }.
                // We might need to fetch book details separately or update backend. 
                // HOWEVER, let's check if we can get it from "reading" list or if we simply fetch the book details?
                // The Spec doesn't mention a specific "GET /books/:id" for content.
                // But /library/reading returns contentUrl.
                // A clean way is to maybe expect the backend to return contentUrl in start-or-resume?
                // Let's assume for now we need to fetch the content. 
                // WAIT: The user said "backend models... contentUrl (S3)".
                // I will assume for V1 I can fetch the content from a simple fetch if I have the URL.
                // But I don't have the URL yet.
                // Let's rely on `library/reading` to find the book and its URL?
                // Or maybe I should add `contentUrl` to the response of `start-or-resume` in backend?
                // The spec for `start-or-resume` says "renvoie la position".
                // I'll cheat slightly and look up the book in `library/weekly` or `library/reading` or `library/completed` to find the URL?
                // No, that's inefficient.
                // I will add `contentUrl` to the `start-or-resume` response in backend. It's a minor "compliance" fix but essential.

                // ... For now, let's assume I fix the backend below.
                const { contentUrl, lastPosition } = dataStart;

                if (contentUrl) {
                    // Fetch actual HTML content
                    const resContent = await fetch(contentUrl);
                    const text = await resContent.text();
                    setContent(text);

                    // Restore position after render
                    setTimeout(() => {
                        window.scrollTo(0, lastPosition || 0);
                    }, 100);
                } else {
                    // Fallback if backend doesn't send it yet (safety)
                    setContent("<p>Erreur: URL du contenu manquante.</p>");
                }

            } catch (error) {
                console.error(error);
                setContent("<p>Erreur lors du chargement du livre.</p>");
            } finally {
                setLoading(false);
            }
        };

        fetchBookContent();
    }, [bookId, token, navigate]);

    // Scroll Tracking & Auto-Save
    useEffect(() => {
        const handleScroll = () => {
            if (!contentRef.current) return;

            const scrollTop = window.scrollY;
            const docHeight = document.body.scrollHeight - window.innerHeight;
            const scrollPercent = Math.min(100, Math.max(0, (scrollTop / docHeight) * 100));

            setProgress(scrollPercent);

            // Debounce save would be better, but for simplicity/V1 check spec: "Sauvegarder ... pourcent, position"
        };

        window.addEventListener('scroll', handleScroll);

        // Save interval (every 5 seconds)
        const intervalId = setInterval(async () => {
            if (window.scrollY > 0) {
                await saveProgress(window.scrollY);
            }
        }, 5000);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            clearInterval(intervalId);
        };
    }, [bookId, token]);

    const saveProgress = async (currentPos) => {
        const docHeight = document.body.scrollHeight - window.innerHeight;
        const p = Math.round((currentPos / docHeight) * 100);

        try {
            await fetch(`${API_URL}/library/${bookId}/progress`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    progressPercent: p,
                    lastChapter: "1", // Single chapter for now or calculated
                    lastPosition: Math.round(currentPos)
                })
            });
        } catch (e) {
            console.error("Save failed", e);
        }
    };

    const handleFinish = async () => {
        if (!window.confirm("Avez-vous terminé ce livre ?")) return;
        try {
            await fetch(`${API_URL}/library/${bookId}/complete`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            navigate('/dashboard');
        } catch (e) {
            alert("Erreur");
        }
    };

    if (loading) return <div className="reader-loading">Chargement...</div>;

    return (
        <div className="reader-container" ref={contentRef}>
            <button className="reader-back-btn" onClick={() => navigate('/dashboard')}>
                ← Retour
            </button>

            <div
                className="reader-content"
                dangerouslySetInnerHTML={{ __html: content }}
            />

            <div className="reader-actions">
                <button className="btn-finish" onClick={handleFinish}>
                    J'ai terminé ce livre
                </button>
            </div>
        </div>
    );
}

export default Reader;
