import type { ReactNode } from "react";
import type { ViewMode } from "@/types/photo";

const VIEW_TABS: { id: ViewMode; label: string }[] = [
  { id: "grid", label: "그리드" },
  { id: "timeline", label: "타임라인" },
  { id: "duplicates", label: "중복 찾기" },
  { id: "organize", label: "날짜 정리" },
];

interface ToolbarProps {
  dirPath: string | null;
  viewMode: ViewMode;
  canGoBack: boolean;
  canGoForward: boolean;
  onBack: () => void;
  onForward: () => void;
  onReload: () => void;
  onNavigate: (dirPath: string) => void;
  onChangeView: (mode: ViewMode) => void;
  /** 오른쪽 끝에 붙는 버튼들 (보기 모드마다 다름) */
  actions?: ReactNode;
}

function NavButton({ label, title, disabled, onClick }: { label: string; title: string; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className="flex size-[30px] items-center justify-center rounded-[7px] border border-slate-200 bg-slate-50 pb-px text-[17px] leading-none text-slate-500 transition-colors enabled:hover:bg-slate-100 enabled:hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-35"
    >
      {label}
    </button>
  );
}

function Breadcrumb({ dirPath, onNavigate }: { dirPath: string | null; onNavigate: (p: string) => void }) {
  const parts = (dirPath ?? "").split(/[\\/]/).filter(Boolean);
  return (
    <div className="flex max-w-[480px] items-center gap-0.5 overflow-hidden">
      {parts.map((part, i) => {
        const isLast = i === parts.length - 1;
        return (
          <span key={i} className="flex items-center">
            {i > 0 && <span className="mx-[3px] text-[13px] text-slate-300">›</span>}
            <button
              type="button"
              onClick={() => onNavigate(parts.slice(0, i + 1).join("\\"))}
              className={`max-w-[140px] truncate rounded-[5px] px-[5px] py-[3px] text-[13px] transition-colors hover:bg-slate-100 hover:text-slate-900 ${
                isLast ? "font-semibold text-slate-900" : "text-slate-500"
              }`}
            >
              {part}
            </button>
          </span>
        );
      })}
    </div>
  );
}

export function Toolbar(props: ToolbarProps) {
  const { dirPath, viewMode, canGoBack, canGoForward, onBack, onForward, onReload, onNavigate, onChangeView, actions } = props;
  return (
    <div className="flex min-h-[52px] shrink-0 flex-wrap items-center justify-between gap-2.5 border-b border-slate-200 bg-white px-[18px] py-1.5">
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        <NavButton label="‹" title="뒤로" disabled={!canGoBack} onClick={onBack} />
        <NavButton label="›" title="앞으로" disabled={!canGoForward} onClick={onForward} />
        <NavButton label="↻" title="새로고침" onClick={onReload} />
        <Breadcrumb dirPath={dirPath} onNavigate={onNavigate} />
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <div className="flex gap-0.5 rounded-lg bg-slate-100 p-[3px]">
          {VIEW_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChangeView(tab.id)}
              className={`rounded-md px-3 py-[5px] text-xs font-medium whitespace-nowrap transition-all ${
                viewMode === tab.id ? "bg-white text-blue-500 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {actions}
      </div>
    </div>
  );
}
