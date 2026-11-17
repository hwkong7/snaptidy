import type { ReactNode } from "react";

interface ViewHeaderProps {
  title: string;
  description: string;
  actions?: ReactNode;
}

/** 중복 찾기·날짜 정리 화면 위쪽 제목 + 버튼 */
export function ViewHeader({ title, description, actions }: ViewHeaderProps) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h2 className="mb-1 text-xl font-bold">{title}</h2>
        <p className="text-[13px] text-slate-500">{description}</p>
      </div>
      <div className="flex shrink-0 gap-2">{actions}</div>
    </div>
  );
}
