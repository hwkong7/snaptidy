import "./SelectedPreviewBar.css";

export default function SelectedPreviewBar({ selectedPhotos, onRemove }) {
    if (!selectedPhotos.length) return null;

    return (
        <div className="selected-preview-bar">
            <div className="preview-scroll">
                {selectedPhotos.map((p) => (
                    <div className="preview-item" key={p.id}>
                        <img src={p.url} alt="preview" />
                        <button className="remove-btn" onClick={() => onRemove(p.id)}>×</button>
                    </div>
                ))}
            </div>
        </div>
    );
}
