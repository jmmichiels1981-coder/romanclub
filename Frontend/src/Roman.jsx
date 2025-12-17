import { Link } from "react-router-dom";

function Roman() {
    return (
        <div className="container">
            <h1 style={{ marginBottom: "0.5rem" }}>
                Entre ses chaînes de bras
            </h1>

            <p style={{ opacity: 0.75, marginBottom: "2rem" }}>
                par <strong>Nom de l’auteur</strong>
            </p>

            <p style={{ marginBottom: "2rem", lineHeight: "1.6" }}>
                RomanClub publie chaque semaine un roman inédit.
                <br />
                Ce roman explore les thèmes de l’enfermement, du silence et de la quête de liberté.
            </p>

            <Link to="/lecture" className="btn btn-primary">
                LIRE LE ROMAN
            </Link>

            <div style={{ marginTop: "2rem" }}>
                <Link to="/" style={{ color: "var(--primary-color)" }}>
                    ← Retour à l’accueil
                </Link>
            </div>
        </div>
    );
}

export default Roman;
