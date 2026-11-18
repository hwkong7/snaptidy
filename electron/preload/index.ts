import { contextBridge, ipcRenderer } from "electron";
import { IPC, type ElectronAPI } from "../../shared/types";

const api: ElectronAPI = {
  getDefaultFolders: () => ipcRenderer.invoke(IPC.getDefaultFolders),
  chooseFolder: () => ipcRenderer.invoke(IPC.chooseFolder),
  readDir: (dirPath) => ipcRenderer.invoke(IPC.readDir, dirPath),

  trashFiles: (paths) => ipcRenderer.invoke(IPC.trashFiles, paths),
  createFolder: (parentDir, name) => ipcRenderer.invoke(IPC.createFolder, { parentDir, name }),
  copyFiles: (files, targetDir) => ipcRenderer.invoke(IPC.copyFiles, { files, targetDir }),
  moveFiles: (files, targetDir) => ipcRenderer.invoke(IPC.moveFiles, { files, targetDir }),
  showItem: (filePath) => ipcRenderer.invoke(IPC.showItem, filePath),

  findDuplicates: (dirPath) => ipcRenderer.invoke(IPC.findDuplicates, dirPath),
  readExifDates: (filePaths) => ipcRenderer.invoke(IPC.readExifDates, filePaths),
  previewOrganize: (dirPath) => ipcRenderer.invoke(IPC.organizeByDate, { dirPath, dryRun: true }),
  runOrganize: (dirPath) => ipcRenderer.invoke(IPC.organizeByDate, { dirPath, dryRun: false }),
};

contextBridge.exposeInMainWorld("electronAPI", api);
