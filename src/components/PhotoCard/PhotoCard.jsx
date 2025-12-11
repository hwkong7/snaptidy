import "./PhotoCard.css";

export default function PhotoCard({ image, selected, onClick, onHover }) {
  let hoverTimer = null;

  const handleMouseEnter = () => {
    hoverTimer = setTimeout(() => {
      onHover(image);
    }, 800); // 0.8초 후 실행
  };

  const handleMouseLeave = () => {
    clearTimeout(hoverTimer);
    onHover(null);
  };

  return (
    <div
      className={`photo-card ${selected ? "selected" : ""}`}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {image && <img src={image} alt="thumb" />}
      {selected && <div className="check-icon">✔</div>}
    </div>
  );
}
