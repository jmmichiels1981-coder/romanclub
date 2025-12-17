import "./reader.css";
import chapter from "./chapters/chapter-01.html?raw";


function Reader() {
    return (
        <div className="reader-container">
            <div
                className="reader-content"
                dangerouslySetInnerHTML={{ __html: chapter }}
            />
        </div>
    );
}

export default Reader;
