import { useMemo } from "react";
import type { Photo } from "@/types/photo";
import { groupByDay } from "@/lib/timeline";
import { GridView } from "@/features/grid/GridView";
import { EmptyState } from "@/components/EmptyState";

interface TimelineViewProps {
  photos: Photo[];
  focusedId: string | null;
  checkedIds: Set<string>;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
}

/** 촬영일(없으면 수정일) 기준으로 날짜별로 묶어서 보여준다 */
export function TimelineView({ photos, ...gridProps }: TimelineViewProps) {
  const groups = useMemo(() => groupByDay(photos), [photos]);

  if (groups.length === 0) return <EmptyState icon="🖼️" message="이 폴더에 이미지가 없습니다" />;

  return (
    <div className="pt-2">
      {groups.map((group) => (
        <section key={group.key} className="mb-8">
          <div className="mb-3 flex items-baseline gap-2.5 border-b border-slate-200 px-4 pt-3 pb-2.5">
            <span className="text-[15px] font-bold">{group.label}</span>
            <span className="text-xs text-slate-400">{group.photos.length}장</span>
          </div>
          <GridView photos={group.photos} {...gridProps} />
        </section>
      ))}
    </div>
  );
}
