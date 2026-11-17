const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // 기본
  getDefaultFolders: () => ipcRenderer.invoke("fs:getDefaultFolders"),
  chooseFolder: () => ipcRenderer.invoke("fs:chooseFolder"),
  readDir: (dirPath) => ipcRenderer.invoke("fs:readDir", dirPath),

  // 파일 조작
  trashFiles: (paths) => ipcRenderer.invoke("fs:trashFiles", paths),
  createFolder: (parentDir, name) => ipcRenderer.invoke("fs:createFolder", { parentDir, name }),
  copyFiles: (files, targetDir) => ipcRenderer.invoke("fs:copyFiles", { files, targetDir }),
  moveFiles: (files, targetDir) => ipcRenderer.invoke("fs:moveFiles", { files, targetDir }),
  showItem: (filePath) => ipcRenderer.invoke("fs:showItem", filePath),

  // 분석 기능
  findDuplicates: (dirPath) => ipcRenderer.invoke("fs:findDuplicates", dirPath),
  readExifDates: (filePaths) => ipcRenderer.invoke("fs:readExifDates", filePaths),
  organizeByDate: (dirPath, dryRun) => ipcRenderer.invoke("fs:organizeByDate", { dirPath, dryRun }),
});
