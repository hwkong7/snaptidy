import os from "node:os";
import path from "node:path";
import { promises as fs } from "node:fs";
import { dialog, ipcMain, shell } from "electron";
import { IPC, type DefaultFolders, type ImageFile } from "../../../shared/types";
import { listImagePaths, toImageFile } from "../lib/images";

export function registerFileHandlers(): void {
  ipcMain.handle(IPC.getDefaultFolders, (): DefaultFolders => {
    const home = os.homedir();
    return {
      바탕화면: path.join(home, "Desktop"),
      다운로드: path.join(home, "Downloads"),
      사진: path.join(home, "Pictures"),
      문서: path.join(home, "Documents"),
    };
  });

  ipcMain.handle(IPC.chooseFolder, async (): Promise<string | null> => {
    const result = await dialog.showOpenDialog({ properties: ["openDirectory"] });
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle(IPC.readDir, async (_e, dirPath: string): Promise<ImageFile[]> => {
    try {
      const paths = await listImagePaths(dirPath);
      return await Promise.all(paths.map(toImageFile));
    } catch (err) {
      console.error("readDir error:", err);
      return [];
    }
  });

  ipcMain.handle(IPC.trashFiles, async (_e, paths: string[]): Promise<boolean> => {
    if (!Array.isArray(paths)) return false;
    for (const p of paths) {
      try {
        await shell.trashItem(p);
      } catch (err) {
        console.error("trashItem error:", err);
      }
    }
    return true;
  });

  ipcMain.handle(
    IPC.createFolder,
    async (_e, { parentDir, name }: { parentDir: string; name: string }): Promise<string> => {
      if (!parentDir || !name) throw new Error("Invalid folder params");
      const newPath = path.join(parentDir, name);
      await fs.mkdir(newPath, { recursive: true });
      return newPath;
    }
  );

  ipcMain.handle(
    IPC.copyFiles,
    async (_e, { files, targetDir }: { files: string[]; targetDir: string }): Promise<boolean> => {
      try {
        for (const file of files) {
          await fs.copyFile(file, path.join(targetDir, path.basename(file)));
        }
        return true;
      } catch (err) {
        console.error("copyFiles error:", err);
        return false;
      }
    }
  );

  ipcMain.handle(
    IPC.moveFiles,
    async (_e, { files, targetDir }: { files: string[]; targetDir: string }): Promise<boolean> => {
      try {
        for (const file of files) {
          await fs.rename(file, path.join(targetDir, path.basename(file)));
        }
        return true;
      } catch (err) {
        console.error("moveFiles error:", err);
        return false;
      }
    }
  );

  ipcMain.handle(IPC.showItem, (_e, filePath: string): void => {
    shell.showItemInFolder(filePath);
  });
}
