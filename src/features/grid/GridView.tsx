import type { Photo } from "@/types/photo";
import { PhotoCard, PhotoGrid } from "@/components/PhotoCard";
import { EmptyState } from "@/components/EmptyState";

interface GridViewProps {
  photos: Photo[];
  focusedId: string | null;
  checkedIds: Set<string>;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
}

export function GridView({ photos, focusedId, checkedIds, onSelect, onToggle }: GridViewProps) {
  if (photos.length === 0) return <EmptyState icon="🖼️" message="이 폴더에 이미지가 없습니다" />;

  return (
    <PhotoGrid>
      {photos.map((photo) => (
        <PhotoCard
          key={photo.id}
          photo={photo}
          isFocused={focusedId === photo.id}
          isChecked={checkedIds.has(photo.id)}
          onSelect={onSelect}
          onToggle={onToggle}
        />
      ))}
    </PhotoGrid>
  );
}
