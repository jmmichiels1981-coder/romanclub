import chapter from "./chapters/chapter-01.html?raw";

function ReaderTest() {
    return (
        <div className="reader-container">
            <div
                className="reader-content"
                dangerouslySetInnerHTML={{ __html: chapter }}
            />
        </div>
    );
}

export default ReaderTest;
