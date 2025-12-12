import "./BottomBar.css";

import newFolderIcon from "../assets/icons/new_folder_icon.svg";
import copyIcon from "../assets/icons/copy_icon.svg";
import shareIcon from "../assets/icons/share_icon.svg";
import trashIcon from "../assets/icons/trash_icon.svg";

export default function BottomBar({
  count,
  onSelectAll,
  onClear,
  onCreateFolder,
  onCopy,
  onShare,
  onDelete
}) {
  return (
    <div className="bottom-bar">
      <div className="bottom-left">
        {count}개 선택됨
      </div>

      <div className="bottom-actions">
        <ActionButton
          icon={newFolderIcon}
          label="새 폴더"
          onClick={onCreateFolder}
        />
        <ActionButton
          icon={copyIcon}
          label="복사"
          onClick={onCopy}
        />
        <ActionButton
          icon={shareIcon}
          label="공유"
          onClick={onShare}
        />
        <ActionButton
          icon={trashIcon}
          label="휴지통"
          danger
          onClick={onDelete}
        />
      </div>
    </div>
  );
}

function ActionButton({ icon, label, onClick, danger }) {
  return (
    <button
      className={`action-btn ${danger ? "danger" : ""}`}
      onClick={onClick}
    >
      <img src={icon} alt={label} />
      <span>{label}</span>
    </button>
  );
}
