// src/components/Header/Header.jsx
import "./Header.css";
import logoImg from "../../assets/images/logo.png";

export default function Header({
  currentRoutePath,
  onChooseFolder,
  onBack
}) {
  return (
    <header className="header">
      <div className="header-row">

        {/* 로고 */}
        <div className="logo">
          <img src={logoImg} alt="SnapTidy Logo" className="logo-img" />
        </div>

        {/* 뒤로가기 */}
        <button className="nav-btn" onClick={onBack}>←</button>

        {/* 경로 표시 */}
        <div className="path-box">
          <span className="label">📂 현재 경로:</span>
          <span className="path">
            {currentRoutePath || "경로 없음"}
          </span>
        </div>

        {/* 경로 변경 */}
        <button className="change-btn" onClick={onChooseFolder}>
          경로 변경
        </button>

      </div>
    </header>
  );
}
