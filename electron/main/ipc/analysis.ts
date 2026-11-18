import crypto from "node:crypto";
import path from "node:path";
import { createReadStream, promises as fs } from "node:fs";
import { ipcMain } from "electron";
import {
  IPC,
  type DuplicateGroup,
  type ExifDates,
  type OrganizePlanItem,
  type OrganizePreview,
  type OrganizeResult,
} from "../../../shared/types";
import { listImagePaths, readExifDate, toImageFile } from "../lib/images";

function md5(filePath: string): Promise<string | null> {
  return new Promise((resolve) => {
    const hash = crypto.createHash("md5");
    createReadStream(filePath)
      .on("data", (chunk) => hash.update(chunk))
      .on("end", () => resolve(hash.digest("hex")))
      .on("error", () => resolve(null));
  });
}

async function buildOrganizePlan(dirPath: string): Promise<OrganizePlanItem[]> {
  const paths = await listImagePaths(dirPath);
  return Promise.all(
    paths.map(async (src) => {
      const name = path.basename(src);
      const date = (await readExifDate(src)) ?? (await fs.stat(src)).mtime;
      const year = String(date.getFullYear());
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const destDir = path.join(dirPath, year, month);
      return { name, src, destDir, destPath: path.join(destDir, name), label: `${year}/${month}` };
    })
  );
}

export function registerAnalysisHandlers(): void {
  // 중복 파일 탐지 (MD5 해시가 같은 파일끼리 묶음)
  ipcMain.handle(IPC.findDuplicates, async (_e, dirPath: string): Promise<DuplicateGroup[]> => {
    try {
      const paths = await listImagePaths(dirPath);
      const byHash = new Map<string, DuplicateGroup>();
      await Promise.all(
        paths.map(async (filePath) => {
          const digest = await md5(filePath);
          if (!digest) return;
          const file = await toImageFile(filePath);
          byHash.set(digest, [...(byHash.get(digest) ?? []), file]);
        })
      );
      return [...byHash.values()].filter((group) => group.length > 1);
    } catch (err) {
      console.error("findDuplicates error:", err);
      return [];
    }
  });

  ipcMain.handle(IPC.readExifDates, async (_e, filePaths: string[]): Promise<ExifDates> => {
    const result: ExifDates = {};
    await Promise.all(
      filePaths.map(async (filePath) => {
        const date = await readExifDate(filePath);
        if (date) result[filePath] = date.toISOString();
      })
    );
    return result;
  });

  // 날짜별 정리: dryRun=true 이면 계획만, false 이면 실제로 이동
  ipcMain.handle(
    IPC.organizeByDate,
    async (
      _e,
      { dirPath, dryRun }: { dirPath: string; dryRun: boolean }
    ): Promise<OrganizePreview | OrganizeResult> => {
      try {
        const plan = await buildOrganizePlan(dirPath);
        if (dryRun) return { plan };

        const result: OrganizeResult = { moved: [], errors: [] };
        for (const { src, destDir, destPath, name } of plan) {
          try {
            await fs.mkdir(destDir, { recursive: true });
            await fs.rename(src, destPath);
            result.moved.push(name);
          } catch (err) {
            result.errors.push({ name, error: (err as Error).message });
          }
        }
        return result;
      } catch (err) {
        console.error("organizeByDate error:", err);
        const error = { error: (err as Error).message };
        return dryRun ? { plan: [] } : { moved: [], errors: [error] };
      }
    }
  );
}
