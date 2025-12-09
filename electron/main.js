// electron/main.js
const { app, BrowserWindow, ipcMain, dialog } = require("electron");
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
    },
  });

  if (isDev) {
    win.loadURL("http://localhost:3000");
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, "../build/index.html"));
  }
}

// 앱 준비되면 창 만들기
app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// 모든 창 닫히면 종료 (맥 제외)
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

//
// ====== 여기서부터는 파일 시스템 API ======
//

ipcMain.handle("fs:getDefaultFolders", async () => {
  const home = os.homedir();
  return {
    바탕화면: path.join(home, "Desktop"),
    다운로드: path.join(home, "Downloads"),
    사진: path.join(home, "Pictures"),
    문서: path.join(home, "Documents"),
  };
});

ipcMain.handle("fs:chooseFolder", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });
  if (result.canceled) return null;
  return result.filePaths[0];
});

ipcMain.handle("fs:readDir", async (event, dirPath) => {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    return entries
      .filter((e) => e.isFile())
      .map((e) => ({
        name: e.name,
        path: path.join(dirPath, e.name),
      }));
  } catch (e) {
    console.error(e);
    return [];
  }
});
