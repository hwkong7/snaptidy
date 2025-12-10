// src/components/PhotoCard/PhotoCard.jsx
import "./PhotoCard.css";

export default function PhotoCard({ image, selected, onClick }) {
  return (
    <div
      className={`photo-card ${selected ? "selected" : ""}`}
      onClick={onClick}
    >
      {image && <img src={image} alt="thumb" />}
      {selected && <div className="check-icon">✔</div>}
    </div>
  );
}
