// src/components/Header/Header.jsx
import "./Header.css";

export default function Header({ currentRoutePath, onChooseFolder }) {
  return (
    <header className="header">
      <div className="logo">SnapTidy</div>

      <div className="path-box">
        <span className="label">📁 현재 경로:</span>
        <span className="path">{currentRoutePath}</span>
        <button className="change-btn" onClick={onChooseFolder}>
          경로 변경
        </button>
      </div>
    </header>
  );
}

