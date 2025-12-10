// src/components/PhotoGrid/PhotoGrid.jsx
import PhotoCard from "../PhotoCard/PhotoCard";
import "./PhotoGrid.css";

export default function PhotoGrid({ photos, onToggle }) {
  return (
    <div className="photo-grid">
      {photos.map((p) => (
        <PhotoCard
          key={p.id}
          image={p.url}
          selected={p.selected}
          onClick={() => onToggle(p.id)}
        />
      ))}
    </div>
  );
}
