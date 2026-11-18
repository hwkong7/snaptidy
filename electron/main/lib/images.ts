import path from "node:path";
import { promises as fs } from "node:fs";
import exifr from "exifr";
import type { ImageFile } from "../../../shared/types";

const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp", ".svg", ".heic", ".tiff"]);

export const isImage = (name: string): boolean =>
  IMAGE_EXTS.has(path.extname(name).toLowerCase());

/** 폴더 바로 아래에 있는 이미지 파일 경로 목록 (하위 폴더는 보지 않음) */
export async function listImagePaths(dirPath: string): Promise<string[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && isImage(e.name))
    .map((e) => path.join(dirPath, e.name));
}

export async function toImageFile(filePath: string): Promise<ImageFile> {
  const stat = await fs.stat(filePath);
  return {
    name: path.basename(filePath),
    path: filePath,
    size: stat.size,
    mtime: stat.mtime.toISOString(),
  };
}

/** EXIF 촬영일 (DateTimeOriginal → DateTime). 없으면 null */
export async function readExifDate(filePath: string): Promise<Date | null> {
  try {
    const exif = await exifr.parse(filePath, { pick: ["DateTimeOriginal", "DateTime"] });
    const raw: unknown = exif?.DateTimeOriginal ?? exif?.DateTime;
    if (!raw) return null;
    const date = raw instanceof Date ? raw : new Date(String(raw));
    return Number.isNaN(date.getTime()) ? null : date;
  } catch {
    return null; // EXIF 없는 파일
  }
}
