import type { Photo } from "@/types/photo";
import { fileExtension, formatDate, formatSize } from "@/lib/format";

interface DetailPanelProps {
  photo: Photo | null;
  isChecked: boolean;
  onToggle: (id: string) => void;
  onShowItem: (path: string) => void;
}

function Row({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10.5px] font-semibold tracking-wide text-slate-400 uppercase">{label}</span>
      <span className={small ? "text-[11.5px] leading-normal break-all text-slate-500" : "text-[13px] font-medium text-slate-700"}>
        {value}
      </span>
    </div>
  );
}

export function DetailPanel({ photo, isChecked, onToggle, onShowItem }: DetailPanelProps) {
  return (
    <aside className="flex w-[280px] shrink-0 flex-col overflow-hidden border-l border-slate-200 bg-white">
      {photo ? (
        <>
          <div className="aspect-[4/3] w-full shrink-0 overflow-hidden bg-slate-100">
            <img src={photo.url} alt={photo.name} className="block size-full object-cover" />
          </div>
          <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto p-4">
            <h3 className="text-[13.5px] leading-snug font-bold break-all">{photo.name}</h3>
            <div className="flex flex-col gap-2.5">
              <Row label="형식" value={fileExtension(photo.name)} />
              <Row label="크기" value={formatSize(photo.size)} />
              <Row label="수정일" value={formatDate(photo.mtime)} />
              {photo.exifDate && <Row label="촬영일" value={formatDate(photo.exifDate)} />}
              <Row label="경로" value={photo.path} small />
            </div>
            <div className="mt-auto flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => onShowItem(photo.path)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-[13px] font-semibold text-slate-700 transition-opacity hover:opacity-85"
              >
                탐색기에서 열기
              </button>
              <button
                type="button"
                onClick={() => onToggle(photo.id)}
                className={`rounded-lg px-3.5 py-2 text-[13px] font-semibold transition-opacity hover:opacity-85 ${
                  isChecked ? "bg-blue-100 text-blue-500" : "bg-blue-500 text-white"
                }`}
              >
                {isChecked ? "✔ 선택됨" : "선택하기"}
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <svg viewBox="0 0 48 48" width="48" height="48" fill="none" className="opacity-50">
            <rect x="6" y="10" width="36" height="28" rx="4" stroke="#CBD5E1" strokeWidth="2" />
            <circle cx="18" cy="22" r="4" stroke="#CBD5E1" strokeWidth="2" />
            <path d="M6 32l10-8 8 6 6-5 12 9" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-[13px] leading-relaxed text-slate-400">
            사진을 클릭하면
            <br />
            상세정보가 표시됩니다
          </p>
        </div>
      )}
    </aside>
  );
}
