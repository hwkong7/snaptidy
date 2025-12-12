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
      webSecurity: false, // file:// 이미지 허용
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
});

// ========= 파일 시스템 IPC =========

// 기본 폴더 경로 (홈 기준)
ipcMain.handle("fs:getDefaultFolders", async () => {
  const home = os.homedir();
  return {
    바탕화면: path.join(home, "Desktop"),
    다운로드: path.join(home, "Downloads"),
    사진: path.join(home, "Pictures"),
    문서: path.join(home, "Documents")
  };
});

// 사용자 정의 폴더 선택 (지금은 안 써도 됨)
ipcMain.handle("fs:chooseFolder", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"]
  });
  if (result.canceled) return null;
  return result.filePaths[0];
});

// 디렉터리 안의 "이미지 파일만" 읽기
ipcMain.handle("fs:readDir", async (event, dirPath) => {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const exts = [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp", ".svg"];

    return entries
      .filter((e) => e.isFile())
      .map((e) => ({
        name: e.name,
        path: path.join(dirPath, e.name)
      }))
      .filter((f) => exts.includes(path.extname(f.path).toLowerCase()));
  } catch (err) {
    console.error("readDir error:", err);
    return [];
  }
});

// 선택 파일들을 OS 휴지통으로 보내기
ipcMain.handle("fs:trashFiles", async (event, paths) => {
  if (!Array.isArray(paths)) return;
  for (const p of paths) {
    try {
      await shell.trashItem(p); // ← 진짜 윈도우 휴지통으로 이동
    } catch (err) {
      console.error("trashItem error:", err);
    }
  }
  return true;
});

// 현재 경로 아래에 실제 새 폴더 만들기
ipcMain.handle("fs:createFolder", async (event, { parentDir, name }) => {
  if (!parentDir || !name) throw new Error("Invalid folder params");
  const newPath = path.join(parentDir, name);
  await fs.mkdir(newPath, { recursive: true });
  return newPath; // React 쪽에서 routePaths에 저장
});

// 선택한 파일들을 특정 폴더로 복사하기
ipcMain.handle("fs:copyFiles", async (event, { files, targetDir }) => {
  const fs = require("fs");
  const path = require("path");

  try {
    for (const file of files) {
      const filename = path.basename(file);
      const dest = path.join(targetDir, filename);
      fs.copyFileSync(file, dest);
    }
    return true;
  } catch (err) {
    console.error("copyFiles error:", err);
    return false;
  }
});

// 선택한 파일을 탐색기에서 열기
ipcMain.handle("fs:showItem", async (event, filePath) => {
  const { shell } = require("electron");
  shell.showItemInFolder(filePath);  // 탐색기에서 파일 위치 열기
});

// 선택한 파일을 공유 (Windows 11 공유 UI 사용)
//const { exec } = require("child_process");
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

app.on("window-all-closed", () => {
  // Electron을 종료
  app.quit();

  // ⭐ React 개발 서버까지 완전히 종료!
  process.exit(0);
});
