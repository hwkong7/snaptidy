/** 로컬 이미지는 main 프로세스의 snaptidy:// 프로토콜로 불러온다 */
export const toImageUrl = (filePath: string): string =>
  `snaptidy://local/${encodeURIComponent(filePath)}`;

export const formatSize = (bytes: number): string => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const formatDate = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const fileExtension = (name: string): string =>
  name.includes(".") ? name.split(".").pop()!.toUpperCase() : "—";

export const folderName = (dirPath: string): string =>
  dirPath.split(/[\\/]/).filter(Boolean).pop() ?? dirPath;
