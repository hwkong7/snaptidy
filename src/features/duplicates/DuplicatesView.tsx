import { useState } from "react";
import type { DuplicateGroup, ImageFile } from "../../../shared/types";
import { formatDate, formatSize, toImageUrl } from "@/lib/format";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { ViewHeader } from "@/features/ViewHeader";

interface DuplicatesViewProps {
  dirPath: string | null;
}

export function DuplicatesView({ dirPath }: DuplicatesViewProps) {
  const [groups, setGroups] = useState<DuplicateGroup[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [toDelete, setToDelete] = useState<Set<string>>(() => new Set());

  if (!dirPath) return <EmptyState icon="📂" message="폴더를 먼저 선택하세요." />;

  const scan = async () => {
    setLoading(true);
    setToDelete(new Set());
    setGroups(await window.electronAPI.findDuplicates(dirPath));
    setLoading(false);
  };

  const toggleDelete = (filePath: string) => {
    setToDelete((prev) => {
      const next = new Set(prev);
      if (next.has(filePath)) next.delete(filePath);
      else next.add(filePath);
      return next;
    });
  };

  const deleteSelected = async () => {
    if (!toDelete.size || !window.confirm(`${toDelete.size}개 파일을 휴지통으로 보낼까요?`)) return;
    await window.electronAPI.trashFiles([...toDelete]);
    setGroups((prev) =>
      (prev ?? []).map((g) => g.filter((f) => !toDelete.has(f.path))).filter((g) => g.length > 1)
    );
    setToDelete(new Set());
  };

  return (
    <div className="mx-auto max-w-[960px]">
      <ViewHeader
        title="중복 파일 탐지"
        description="동일한 내용의 파일을 찾아 정리합니다."
        actions={
          <>
            {groups && toDelete.size > 0 && (
              <Button variant="danger" onClick={deleteSelected}>
                선택 삭제 ({toDelete.size}개)
              </Button>
            )}
            <Button variant="primary" onClick={scan} disabled={loading}>
              {loading ? "분석 중…" : "지금 스캔"}
            </Button>
          </>
        }
      />

      {loading ? (
        <EmptyState icon="⏳" message="파일을 분석하는 중입니다…" />
      ) : groups === null ? (
        <EmptyState icon="🔍" message="스캔 버튼을 눌러 중복 파일을 찾아보세요." />
      ) : groups.length === 0 ? (
        <EmptyState icon="✅" message="중복 파일이 없습니다!" />
      ) : (
        <>
          <p className="mb-5 text-[13px] text-slate-500">
            {groups.length}개의 중복 그룹 발견 (하나만 남기고 나머지를 선택하세요)
          </p>
          <div className="flex flex-col gap-6">
            {groups.map((group, i) => (
              <div key={group[0].path} className="overflow-hidden rounded-[10px] border border-slate-200 bg-white">
                <div className="border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-500">
                  그룹 {i + 1} — {group.length}개의 동일 파일
                </div>
                {group.map((file) => (
                  <DuplicateRow
                    key={file.path}
                    file={file}
                    marked={toDelete.has(file.path)}
                    onToggle={() => toggleDelete(file.path)}
                  />
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function DuplicateRow({ file, marked, onToggle }: { file: ImageFile; marked: boolean; onToggle: () => void }) {
  return (
    <div
      onClick={onToggle}
      className={`flex cursor-pointer items-center gap-3 border-b border-slate-100 px-4 py-3 transition-colors last:border-b-0 ${
        marked ? "bg-red-50" : "hover:bg-slate-50"
      }`}
    >
      <img src={toImageUrl(file.path)} alt={file.name} className="size-14 shrink-0 overflow-hidden rounded-md bg-slate-100 object-cover text-[0px]" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-medium">{file.name}</div>
        <div className="mt-0.5 text-xs text-slate-400">
          {formatSize(file.size)} · {formatDate(file.mtime)}
        </div>
      </div>
      <span
        className={`shrink-0 rounded-full px-2.5 py-[3px] text-xs font-semibold ${
          marked ? "bg-red-100 text-red-500" : "bg-slate-100 text-slate-500"
        }`}
      >
        {marked ? "🗑 삭제" : "유지"}
      </span>
    </div>
  );
}
