// electron/preload.js
// electron/preload.js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  getDefaultFolders: () => ipcRenderer.invoke("fs:getDefaultFolders"),
  chooseFolder: () => ipcRenderer.invoke("fs:chooseFolder"),
  readDir: (dirPath) => ipcRenderer.invoke("fs:readDir", dirPath),
  trashFiles: (paths) => ipcRenderer.invoke("fs:trashFiles", paths),
  createFolder: (parentDir, name) =>
    ipcRenderer.invoke("fs:createFolder", { parentDir, name }),
  copyFiles: (files, targetDir) =>
    ipcRenderer.invoke("fs:copyFiles", { files, targetDir }),
  showItem: (filePath) =>
    ipcRenderer.invoke("fs:showItem", filePath),
  shareFile: (path) => ipcRenderer.invoke("share:file", path)
});
