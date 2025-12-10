// src/layouts/BottomBar.jsx
import "./BottomBar.css";

export default function BottomBar({
  count,
  onSelectAll,
  onClear,
  onDelete,
  onCreateFolder,
  onUpload,
  onCopy,
  onShare
}) {
  return (
    <div className="bottom-bar">
      <div className="count">{count}개 선택됨</div>

      <div className="actions">
        <button onClick={onSelectAll}>전체 선택</button>
        <button onClick={onClear}>선택 해제</button>
        <button className="folder" onClick={onCreateFolder}>
          새 폴더
        </button>
        <button className="delete" onClick={onDelete}>
          휴지통
        </button>
        <button onClick={onUpload}>업로드</button>
        <button onClick={onCopy}>복사</button>
        <button onClick={onShare}>공유</button>

      </div>
    </div>
  );
}
