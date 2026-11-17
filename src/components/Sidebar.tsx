import type { FolderItem } from "@/types/photo";

interface SidebarProps {
  folders: FolderItem[];
  currentRoute: string;
  onOpenFolder: (key: string) => void;
  onAddFolder: () => void;
  onChoosePath: () => void;
}

function Logo() {
  return (
    <div className="flex items-center gap-2.5 border-b border-slate-100 px-[18px] pt-[18px] pb-3.5">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-[9px] bg-gradient-to-br from-blue-400 to-blue-500 shadow-[0_2px_8px_rgba(59,130,246,.35)]">
        <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
          <rect x="2" y="4" width="9" height="8" rx="2" fill="white" opacity="0.9" />
          <rect x="13" y="4" width="9" height="5" rx="2" fill="white" opacity="0.6" />
          <rect x="2" y="14" width="9" height="6" rx="2" fill="white" opacity="0.6" />
          <rect x="13" y="11" width="9" height="9" rx="2" fill="white" opacity="0.9" />
          <path d="M17 14.5l1.5 1.5-1.5 1.5" stroke="rgba(59,130,246,0.8)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <span className="text-[17px] font-bold tracking-tight">SnapTidy</span>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: string; label: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13.5px] transition-colors ${
        active ? "bg-blue-50 font-semibold text-blue-500" : "font-medium text-slate-700 hover:bg-slate-100"
      }`}
    >
      <span className="shrink-0 text-[15px]">{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  );
}

const SectionLabel = ({ children }: { children: string }) => (
  <p className="px-2 pt-2 pb-1 text-[10.5px] font-semibold tracking-wider text-slate-400 uppercase">{children}</p>
);

export function Sidebar({ folders, currentRoute, onOpenFolder, onAddFolder, onChoosePath }: SidebarProps) {
  return (
    <aside className="flex w-[220px] shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white pb-4">
      <Logo />

      <nav className="flex-1 overflow-y-auto px-2.5 py-3">
        <SectionLabel>기본 폴더</SectionLabel>
        {folders.map((f) => (
          <NavItem
            key={f.key}
            icon={f.icon}
            label={f.key}
            active={currentRoute === f.key}
            onClick={() => onOpenFolder(f.key)}
          />
        ))}

        <div className="mx-2 my-2.5 h-px bg-slate-100" />
        <SectionLabel>즐겨찾기</SectionLabel>
        <NavItem icon="＋" label="폴더 추가" onClick={onAddFolder} />
      </nav>

      <button
        type="button"
        onClick={onChoosePath}
        className="mx-2.5 flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-[12.5px] font-medium text-slate-500 transition-colors hover:border-blue-500 hover:bg-blue-50 hover:text-blue-500"
      >
        <span>📂</span> 경로 변경
      </button>
    </aside>
  );
}
