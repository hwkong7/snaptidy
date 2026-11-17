import { useState } from "react";

interface NewFolderModalProps {
  parentPath: string | null;
  onClose: () => void;
  onCreate: (name: string) => void | Promise<void>;
}

export function NewFolderModal({ parentPath, onClose, onCreate }: NewFolderModalProps) {
  const [name, setName] = useState("");

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    await onCreate(trimmed);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/25 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-folder-title"
        className="flex w-[340px] flex-col gap-3 rounded-[14px] bg-white p-7 shadow-[0_20px_60px_rgba(0,0,0,.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="new-folder-title" className="text-base font-bold">
          새 폴더 생성
        </h3>
        <p className="text-xs break-all text-slate-400">현재 위치: {parentPath}</p>
        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
            if (e.key === "Escape") onClose();
          }}
          placeholder="폴더 이름 입력"
          className="w-full rounded-lg border-[1.5px] border-slate-200 px-3 py-2.5 text-sm outline-none transition-colors focus:border-blue-500"
        />
        <div className="mt-1 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg bg-slate-100 px-5 py-2 text-[13.5px] font-semibold text-slate-600 hover:opacity-85">
            취소
          </button>
          <button type="button" onClick={submit} className="rounded-lg bg-blue-500 px-5 py-2 text-[13.5px] font-semibold text-white hover:opacity-85">
            생성
          </button>
        </div>
      </div>
    </div>
  );
}
