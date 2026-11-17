import { memo, type ReactNode } from "react";
import type { Photo } from "@/types/photo";

interface PhotoCardProps {
  photo: Photo;
  isFocused: boolean;
  isChecked: boolean;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
}

export const PhotoCard = memo(function PhotoCard({ photo, isFocused, isChecked, onSelect, onToggle }: PhotoCardProps) {
  const highlighted = isFocused || isChecked;
  return (
    <div
      className="group cursor-pointer select-none transition-transform hover:-translate-y-0.5"
      onClick={() => onSelect(photo.id)}
    >
      <div
        className={`relative aspect-square w-full overflow-hidden rounded-[10px] border-2 bg-slate-100 transition-[border-color,box-shadow] ${
          highlighted ? "border-blue-500" : "border-transparent"
        } ${isFocused ? "shadow-[0_0_0_3px_rgba(59,130,246,.2)]" : ""}`}
      >
        <img
          src={photo.url}
          alt={photo.name}
          draggable={false}
          className={`block size-full object-cover text-[0px] transition-opacity ${isChecked ? "opacity-75" : ""}`}
        />
        <button
          type="button"
          aria-label={isChecked ? "선택 해제" : "선택"}
          onClick={(e) => {
            e.stopPropagation();
            onToggle(photo.id);
          }}
          className={`absolute top-1.5 right-1.5 z-[2] flex size-5 items-center justify-center rounded-full border-[1.5px] backdrop-blur-sm transition-colors ${
            isChecked
              ? "border-blue-500 bg-blue-500"
              : "border-white/80 bg-white/50 group-hover:border-white group-hover:bg-white/85"
          }`}
        >
          {isChecked && (
            <svg viewBox="0 0 12 12" width="10" height="10">
              <polyline points="2,6 5,9 10,3" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>
      <div className="mt-[5px] truncate px-0.5 text-[11.5px] font-medium text-slate-600">{photo.name}</div>
    </div>
  );
});

export function PhotoGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-3 px-5 pt-1 pb-6">{children}</div>;
}
