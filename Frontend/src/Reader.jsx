import "./reader.css";

function Reader({ content }) {
    return (
        <div className="reader-container">
            <div
                className="reader-content"
                dangerouslySetInnerHTML={{ __html: content || "" }}
            />
        </div>
    );
}

export default Reader;
