import path from "node:path";
import { app, BrowserWindow } from "electron";
import { registerImageProtocol, registerSchemePrivileges } from "./protocol";
import { registerFileHandlers } from "./ipc/files";
import { registerAnalysisHandlers } from "./ipc/analysis";

registerSchemePrivileges();

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 600,
    title: "SnapTidy",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // electron-vite dev 서버가 있으면 그 주소로, 아니면 빌드된 파일로
  const devUrl = process.env.ELECTRON_RENDERER_URL;
  if (!app.isPackaged && devUrl) {
    win.loadURL(devUrl);
  } else {
    win.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(() => {
  registerImageProtocol();
  registerFileHandlers();
  registerAnalysisHandlers();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
