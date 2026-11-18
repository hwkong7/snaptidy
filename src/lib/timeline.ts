import type { Photo } from "@/types/photo";
import { formatDate } from "./format";

export interface TimelineGroup {
  /** "2025-03-05" 형식 (정렬용) */
  key: string;
  /** "2025년 3월 5일" 형식 (표시용) */
  label: string;
  photos: Photo[];
}

const localDayKey = (iso: string): string => {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
};

/** 촬영일(없으면 수정일) 기준으로 하루 단위로 묶고, 최신 날짜가 위로 오게 정렬 */
export function groupByDay(photos: Photo[]): TimelineGroup[] {
  const map = new Map<string, TimelineGroup>();
  for (const photo of photos) {
    const iso = photo.exifDate ?? photo.mtime;
    const key = localDayKey(iso);
    const group = map.get(key) ?? { key, label: formatDate(iso), photos: [] };
    group.photos.push(photo);
    map.set(key, group);
  }
  return [...map.values()].sort((a, b) => b.key.localeCompare(a.key));
}
