// Electron(main/preload)과 화면(renderer)이 함께 쓰는 타입과 IPC 채널 이름

/** 폴더에서 읽어 온 이미지 파일 한 개 */
export interface ImageFile {
  name: string;
  path: string;
  size: number;
  /** 파일 수정 시각 (ISO 문자열) */
  mtime: string;
}

/** 내용이 같은 파일 묶음 (항상 2개 이상) */
export type DuplicateGroup = ImageFile[];

/** 기본 폴더 이름 → 실제 경로 */
export type DefaultFolders = Record<"바탕화면" | "다운로드" | "사진" | "문서", string>;

/** 파일 경로 → EXIF 촬영일 (ISO 문자열) */
export type ExifDates = Record<string, string>;

/** 날짜별 정리 계획 한 줄 */
export interface OrganizePlanItem {
  name: string;
  src: string;
  destDir: string;
  destPath: string;
  /** "2025/03" 형식 */
  label: string;
}

export interface OrganizeError {
  name?: string;
  error: string;
}

export interface OrganizePreview {
  plan: OrganizePlanItem[];
}

export interface OrganizeResult {
  moved: string[];
  errors: OrganizeError[];
}

/** preload 가 window.electronAPI 로 노출하는 함수들 */
export interface ElectronAPI {
  getDefaultFolders(): Promise<DefaultFolders>;
  chooseFolder(): Promise<string | null>;
  readDir(dirPath: string): Promise<ImageFile[]>;

  trashFiles(paths: string[]): Promise<boolean>;
  createFolder(parentDir: string, name: string): Promise<string>;
  copyFiles(files: string[], targetDir: string): Promise<boolean>;
  moveFiles(files: string[], targetDir: string): Promise<boolean>;
  showItem(filePath: string): Promise<void>;

  findDuplicates(dirPath: string): Promise<DuplicateGroup[]>;
  readExifDates(filePaths: string[]): Promise<ExifDates>;
  previewOrganize(dirPath: string): Promise<OrganizePreview>;
  runOrganize(dirPath: string): Promise<OrganizeResult>;
}

export const IPC = {
  getDefaultFolders: "fs:getDefaultFolders",
  chooseFolder: "fs:chooseFolder",
  readDir: "fs:readDir",
  trashFiles: "fs:trashFiles",
  createFolder: "fs:createFolder",
  copyFiles: "fs:copyFiles",
  moveFiles: "fs:moveFiles",
  showItem: "fs:showItem",
  findDuplicates: "fs:findDuplicates",
  readExifDates: "fs:readExifDates",
  organizeByDate: "fs:organizeByDate",
} as const;
