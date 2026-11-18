import type { ImageFile } from "../../shared/types";

/** 화면에서 쓰는 사진 정보 (파일 정보 + 표시용 URL + EXIF 촬영일) */
export interface Photo extends ImageFile {
  id: string;
  url: string;
  exifDate: string | null;
}

export type ViewMode = "grid" | "timeline" | "duplicates" | "organize";

export interface FolderItem {
  key: string;
  icon: string;
}
