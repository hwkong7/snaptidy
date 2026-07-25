// electron/main.js
const process = require("process");
const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const path = require("path");
const fs = require("fs").promises;
const os = require("os");

const isDev = !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
      allowRunningInsecureContent: true
    }
  });

  if (isDev) {
    win.loadURL("http://localhost:3000");
    win.webContents.openDevTools();
  } else {
    const indexPath = path.resolve(__dirname, "..", "build", "index.html");
    win.loadFile(indexPath);
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
  process.exit(0);
});

// ── 기본 폴더 경로 ──
ipcMain.handle("fs:getDefaultFolders", async () => {
  const home = os.homedir();
  const folders = {
    바탕화면: path.join(home, "Desktop"),
    다운로드: path.join(home, "Downloads"),
    사진: path.join(home, "Pictures"),
    문서: path.join(home, "Documents"),
    스크린샷: path.join(home, "Pictures", "Screenshots"),
  };

  // 스크린샷 폴더가 없으면 제외 (macOS 등)
  const result = {};
  for (const [key, val] of Object.entries(folders)) {
    try {
      await fs.access(val);
      result[key] = val;
    } catch {
      if (key !== "스크린샷") result[key] = val; // 기본 폴더는 항상 포함
    }
  }
  return result;
});

// ── 폴더 선택 ──
ipcMain.handle("fs:chooseFolder", async () => {
  const result = await dialog.showOpenDialog({ properties: ["openDirectory"] });
  if (result.canceled) return null;
  return result.filePaths[0];
});

// ── 디렉터리 읽기 (이미지만, stat 포함) ──
ipcMain.handle("fs:readDir", async (event, dirPath) => {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const exts = [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp", ".svg"];

    const files = entries
      .filter((e) => e.isFile())
      .map((e) => ({ name: e.name, path: path.join(dirPath, e.name) }))
      .filter((f) => exts.includes(path.extname(f.path).toLowerCase()));

    // stat 병렬 조회
    const results = await Promise.all(
      files.map(async (f) => {
        try {
          const stat = await fs.stat(f.path);
          return {
            ...f,
            size: stat.size,           // bytes
            mtime: stat.mtime.toISOString(), // 수정일
          };
        } catch {
          return { ...f, size: null, mtime: null };
        }
      })
    );

    return results;
  } catch (err) {
    console.error("readDir error:", err);
    return [];
  }
});

// ── 휴지통 이동 ──
ipcMain.handle("fs:trashFiles", async (event, paths) => {
  if (!Array.isArray(paths)) return;
  for (const p of paths) {
    try { await shell.trashItem(p); }
    catch (err) { console.error("trashItem error:", err); }
  }
  return true;
});

// ── 새 폴더 생성 ──
ipcMain.handle("fs:createFolder", async (event, { parentDir, name }) => {
  if (!parentDir || !name) throw new Error("Invalid folder params");
  const newPath = path.join(parentDir, name);
  await fs.mkdir(newPath, { recursive: true });
  return newPath;
});

// ── 파일 복사 ──
ipcMain.handle("fs:copyFiles", async (event, { files, targetDir }) => {
  const fsSync = require("fs");
  try {
    for (const file of files) {
      const filename = path.basename(file);
      const dest = path.join(targetDir, filename);
      fsSync.copyFileSync(file, dest);
    }
    return true;
  } catch (err) {
    console.error("copyFiles error:", err);
    return false;
  }
});

// ── 탐색기에서 열기 ──
ipcMain.handle("fs:showItem", async (event, filePath) => {
  shell.showItemInFolder(filePath);
});

// ── 공유 ──
ipcMain.handle("share:file", async (event, filePath) => {
  const { exec } = require("child_process");
  try {
    exec(`start ms-photos:viewer?file=${filePath}`);
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
});