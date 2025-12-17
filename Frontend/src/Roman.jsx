import { Link } from "react-router-dom";

function Roman({ title, author, summary }) {
    return (
        <div className="container">
            <h1 style={{ marginBottom: "0.5rem" }}>
                {title || ""}
            </h1>

            <p style={{ opacity: 0.75, marginBottom: "2rem" }}>
                {author ? <>par <strong>{author}</strong></> : ""}
            </p>

            <p style={{ marginBottom: "2rem", lineHeight: "1.6" }}>
                {summary || ""}
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
