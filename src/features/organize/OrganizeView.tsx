import { useMemo, useState } from "react";
import type { OrganizePlanItem, OrganizeResult } from "../../../shared/types";
import { toImageUrl } from "@/lib/format";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { ViewHeader } from "@/features/ViewHeader";

interface OrganizeViewProps {
  dirPath: string | null;
  /** 정리를 실행한 뒤 현재 폴더 목록을 다시 읽게 한다 */
  onOrganized?: () => void;
}

export function OrganizeView({ dirPath, onOrganized }: OrganizeViewProps) {
  const [plan, setPlan] = useState<OrganizePlanItem[] | null>(null);
  const [result, setResult] = useState<OrganizeResult | null>(null);
  const [loading, setLoading] = useState(false);

  // "2025/03" 라벨별로 묶고 최신 순으로 정렬
  const grouped = useMemo(() => {
    const map = new Map<string, OrganizePlanItem[]>();
    for (const item of plan ?? []) map.set(item.label, [...(map.get(item.label) ?? []), item]);
    return [...map.entries()].sort(([a], [b]) => b.localeCompare(a));
  }, [plan]);

  if (!dirPath) return <EmptyState icon="📂" message="폴더를 먼저 선택하세요." />;

  const preview = async () => {
    setLoading(true);
    setResult(null);
    const res = await window.electronAPI.previewOrganize(dirPath);
    setPlan(res.plan);
    setLoading(false);
  };

  const execute = async () => {
    if (!plan || !window.confirm(`${plan.length}개 파일을 날짜별 폴더로 이동할까요?`)) return;
    setLoading(true);
    setResult(await window.electronAPI.runOrganize(dirPath));
    setPlan(null);
    setLoading(false);
    onOrganized?.();
  };

  return (
    <div className="mx-auto max-w-[960px]">
      <ViewHeader
        title="날짜별 정리"
        description="EXIF 촬영일 기준으로 연도/월 폴더에 자동 분류합니다."
        actions={
          <>
            {plan && plan.length > 0 && (
              <Button variant="primary" onClick={execute} disabled={loading}>
                정리 실행
              </Button>
            )}
            <Button onClick={preview} disabled={loading}>
              {loading ? "분석 중…" : "미리보기"}
            </Button>
          </>
        }
      />

      {result && (
        <div className="mb-6 flex gap-3">
          <div className="rounded-[10px] bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-600">
            ✅ {result.moved.length}개 파일 정리 완료
          </div>
          {result.errors.length > 0 && (
            <div className="rounded-[10px] bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-500">
              ⚠ {result.errors.length}개 실패
            </div>
          )}
        </div>
      )}

      {loading ? (
        <EmptyState icon="⏳" message="분석 중입니다…" />
      ) : plan === null ? (
        !result && <EmptyState icon="📂" message="미리보기를 눌러 파일이 어떻게 정리될지 확인하세요." />
      ) : plan.length === 0 ? (
        <EmptyState icon="🖼️" message="정리할 이미지가 없습니다." />
      ) : (
        <>
          <p className="mb-5 text-[13px] text-slate-500">
            {plan.length}개 파일 · {grouped.length}개 날짜 폴더로 분류됩니다
          </p>
          <div className="flex flex-col gap-4">
            {grouped.map(([label, items]) => (
              <div key={label} className="overflow-hidden rounded-[10px] border border-slate-200 bg-white">
                <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-700">
                  <span className="text-base">📁</span>
                  {label}
                  <span className="ml-auto text-xs font-medium text-slate-400">{items.length}개</span>
                </div>
                {items.map((item) => (
                  <div key={item.src} className="flex items-center gap-3 border-b border-slate-100 px-4 py-2 text-xs last:border-b-0">
                    <img src={toImageUrl(item.src)} alt={item.name} className="size-10 shrink-0 overflow-hidden rounded-[5px] bg-slate-100 object-cover text-[0px]" />
                    <span className="shrink-0 text-sm text-slate-300">→</span>
                    <span className="truncate text-slate-500">{item.destPath}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
