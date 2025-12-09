// electron/preload.js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  getDefaultFolders: () => ipcRenderer.invoke("fs:getDefaultFolders"),
  chooseFolder: () => ipcRenderer.invoke("fs:chooseFolder"),
  readDir: (dirPath) => ipcRenderer.invoke("fs:readDir", dirPath),
});
