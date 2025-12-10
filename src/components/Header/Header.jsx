// src/components/Header/Header.jsx
import "./Header.css";

export default function Header({
  currentRoutePath,
  onChooseFolder,
  onBack,
  onForward
}) {
  return (
    <header className="header">

      {/* 로고 + 네비게이션 + 경로박스 한 줄 */}
      <div className="header-row">

        {/* SnapTidy 로고 */}
        <div className="logo">SnapTidy</div>

        {/* 뒤로/앞으로 버튼 */}
        <div className="nav-buttons">
          <button className="nav-btn" onClick={onBack}>←</button>
          <button className="nav-btn" onClick={onForward}>→</button>
        </div>

        {/* 경로 표시 */}
        <div className="path-box">
          <span className="label">📂 현재 경로:</span>
          <span className="path">
            {currentRoutePath || "경로 없음"}
          </span>
        </div>

        {/* 경로 변경 버튼 */}
        <button className="change-btn" onClick={onChooseFolder}>
          경로 변경
        </button>

      </div>
    </header>
  );
}
