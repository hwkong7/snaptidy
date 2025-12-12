// src/components/Header/Header.jsx
import "./Header.css";
import logoImg from "../../assets/images/logo.png";

export default function Header({
  currentRoutePath,
  onChooseFolder,
  onBack,
  onForward,          // ⭐ 추가
  onNavigate,
  canGoBack,          // ⭐ 추가
  canGoForward        // ⭐ 추가
}) {
  const parts = currentRoutePath
    ? currentRoutePath.split("\\")
    : [];

  return (
    <header className="header">
      <div className="header-row">

        {/* 로고 */}
        <div className="logo">
          <img src={logoImg} alt="SnapTidy Logo" className="logo-img" />
        </div>

        {/* 뒤로 */}
        <button
          className="nav-btn"
          onClick={onBack}
          disabled={!canGoBack}
        >
          ←
        </button>

        {/* 앞으로 */}
        <button
          className="nav-btn"
          onClick={onForward}
          disabled={!canGoForward}
        >
          →
        </button>

        {/* 경로 breadcrumb */}
        <div className="path-box">
          <span className="label">📂 현재 경로:</span>

          <div className="breadcrumb">
            {parts.map((part, idx) => {
              const fullPath = parts.slice(0, idx + 1).join("\\");

              return (
                <span key={idx} className="breadcrumb-item">
                  <button
                    className="breadcrumb-btn"
                    onClick={() => onNavigate(fullPath)}
                  >
                    {part}
                  </button>
                  {idx < parts.length - 1 && (
                    <span className="sep">›</span>
                  )}
                </span>
              );
            })}
          </div>
        </div>

        {/* 경로 변경 */}
        <button className="change-btn" onClick={onChooseFolder}>
          경로 변경
        </button>

      </div>
    </header>
  );
}
