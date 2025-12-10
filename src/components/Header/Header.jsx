import "./Header.css";

export default function Header({ currentRoutePath, onChooseFolder, onBack }) {
  return (
    <header className="header">
      {/* 뒤로가기 버튼 */}
      <button className="back-btn" onClick={onBack}>
        ←
      </button>

      {/* 로고 */}
      <div className="logo">SnapTidy</div>

      {/* 현재 경로 표시 */}
      <div className="path-box">
        <span className="label">📁 현재 경로:</span>
        <span className="path">
          {currentRoutePath ? currentRoutePath : "경로 없음"}
        </span>

        <button className="change-btn" onClick={onChooseFolder}>
          경로 변경
        </button>
      </div>
    </header>
  );
}
