import type { ReactNode } from "react";
import type { Photo } from "@/types/photo";

interface SelectionBarProps {
  checkedPhotos: Photo[];
  onCopy: () => void;
  onDelete: () => void;
  onUncheck: (id: string) => void;
}

const MAX_PREVIEW = 5;

/** 사진을 체크하면 아래에 나타나는 바 (미리보기 + 복사/삭제) */
export function SelectionBar({ checkedPhotos, onCopy, onDelete, onUncheck }: SelectionBarProps) {
  if (checkedPhotos.length === 0) return null;
  const hidden = checkedPhotos.length - MAX_PREVIEW;

  return (
    <div className="sticky bottom-0 z-10 mt-auto flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-2.5 shadow-[0_-4px_16px_rgba(0,0,0,.06)]">
      <div className="flex items-center gap-1.5 overflow-hidden">
        {checkedPhotos.slice(0, MAX_PREVIEW).map((p) => (
          <div key={p.id} className="relative shrink-0">
            <img src={p.url} alt={p.name} className="size-12 overflow-hidden rounded-[7px] border border-slate-200 bg-slate-100 object-cover text-[0px]" />
            <button
              type="button"
              aria-label={`${p.name} 선택 해제`}
              onClick={() => onUncheck(p.id)}
              className="absolute -top-[5px] -right-[5px] flex size-4 items-center justify-center rounded-full bg-red-500 text-[11px] leading-none text-white"
            >
              ×
            </button>
          </div>
        ))}
        {hidden > 0 && <span className="px-1 text-xs font-semibold text-slate-400">+{hidden}</span>}
      </div>

      <div className="flex shrink-0 gap-2">
        <BarButton tone="blue" onClick={onCopy} label="복사">
          <rect x="6" y="6" width="10" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <path d="M4 14V4a2 2 0 012-2h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        </BarButton>
        <BarButton tone="red" onClick={onDelete} label="삭제">
          <path d="M6 8l1 9h6l1-9M3 6h14M8 6V4h4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        </BarButton>
      </div>
    </div>
  );
}

function BarButton({ tone, label, onClick, children }: { tone: "blue" | "red"; label: string; onClick: () => void; children: ReactNode }) {
  const colors = tone === "blue" ? "bg-blue-50 text-blue-500" : "bg-red-50 text-red-500";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-semibold transition hover:-translate-y-px hover:opacity-90 ${colors}`}
    >
      <svg viewBox="0 0 20 20" width="16" height="16">{children}</svg>
      {label}
    </button>
  );
}
