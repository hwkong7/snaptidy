const process = require("process");
const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const path = require("path");
const fs = require("fs").promises;
const fsCb = require("fs");
const os = require("os");
const crypto = require("crypto");

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
  if (process.platform !== "darwin") {
    app.quit();
    process.exit(0);
  }
});

// ── 이미지 확장자 ──
const IMAGE_EXTS = [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp", ".svg", ".heic", ".tiff"];
const isImage = (name) => IMAGE_EXTS.includes(path.extname(name).toLowerCase());

// ── 기본 폴더 ──
ipcMain.handle("fs:getDefaultFolders", async () => {
  const home = os.homedir();
  return {
    바탕화면: path.join(home, "Desktop"),
    다운로드: path.join(home, "Downloads"),
    사진: path.join(home, "Pictures"),
    문서: path.join(home, "Documents")
  };
});

// ── 폴더 선택 다이얼로그 ──
ipcMain.handle("fs:chooseFolder", async () => {
  const result = await dialog.showOpenDialog({ properties: ["openDirectory"] });
  if (result.canceled) return null;
  return result.filePaths[0];
});

// ── 디렉터리 읽기 (크기·날짜 포함) ──
ipcMain.handle("fs:readDir", async (event, dirPath) => {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const files = await Promise.all(
      entries
        .filter((e) => e.isFile() && isImage(e.name))
        .map(async (e) => {
          const filePath = path.join(dirPath, e.name);
          const stat = await fs.stat(filePath);
          return {
            name: e.name,
            path: filePath,
            size: stat.size,
            mtime: stat.mtime.toISOString()
          };
        })
    );
    return files;
  } catch (err) {
    console.error("readDir error:", err);
    return [];
  }
});

// ── 파일 삭제 (휴지통) ──
ipcMain.handle("fs:trashFiles", async (event, paths) => {
  if (!Array.isArray(paths)) return;
  for (const p of paths) {
    try { await shell.trashItem(p); } catch (err) { console.error("trashItem error:", err); }
  }
  return true;
});

// ── 폴더 생성 ──
ipcMain.handle("fs:createFolder", async (event, { parentDir, name }) => {
  if (!parentDir || !name) throw new Error("Invalid folder params");
  const newPath = path.join(parentDir, name);
  await fs.mkdir(newPath, { recursive: true });
  return newPath;
});

// ── 파일 복사 ──
ipcMain.handle("fs:copyFiles", async (event, { files, targetDir }) => {
  try {
    for (const file of files) {
      const dest = path.join(targetDir, path.basename(file));
      fsCb.copyFileSync(file, dest);
    }
    return true;
  } catch (err) {
    console.error("copyFiles error:", err);
    return false;
  }
});

// ── 파일 이동 ──
ipcMain.handle("fs:moveFiles", async (event, { files, targetDir }) => {
  try {
    for (const file of files) {
      const dest = path.join(targetDir, path.basename(file));
      await fs.rename(file, dest);
    }
    return true;
  } catch (err) {
    console.error("moveFiles error:", err);
    return false;
  }
});

// ── 탐색기에서 열기 ──
ipcMain.handle("fs:showItem", async (event, filePath) => {
  shell.showItemInFolder(filePath);
});

// ── 중복 파일 탐지 (MD5 해시 기반) ──
ipcMain.handle("fs:findDuplicates", async (event, dirPath) => {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const files = entries
      .filter((e) => e.isFile() && isImage(e.name))
      .map((e) => path.join(dirPath, e.name));

    const hashMap = {};
    await Promise.all(
      files.map(
        (filePath) =>
          new Promise((resolve) => {
            const hash = crypto.createHash("md5");
            const stream = fsCb.createReadStream(filePath);
            stream.on("data", (d) => hash.update(d));
            stream.on("end", async () => {
              const digest = hash.digest("hex");
              const stat = await fs.stat(filePath);
              if (!hashMap[digest]) hashMap[digest] = [];
              hashMap[digest].push({
                name: path.basename(filePath),
                path: filePath,
                size: stat.size,
                mtime: stat.mtime.toISOString()
              });
              resolve();
            });
            stream.on("error", resolve);
          })
      )
    );

    // 2개 이상인 그룹만 반환
    return Object.values(hashMap).filter((group) => group.length > 1);
  } catch (err) {
    console.error("findDuplicates error:", err);
    return [];
  }
});

// ── EXIF 날짜 읽기 ──
ipcMain.handle("fs:readExifDates", async (event, filePaths) => {
  let exifr;
  try {
    exifr = require("exifr");
  } catch {
    return {};
  }

  const result = {};
  await Promise.all(
    filePaths.map(async (filePath) => {
      try {
        const exif = await exifr.parse(filePath, { pick: ["DateTimeOriginal", "DateTime"] });
        const date = exif?.DateTimeOriginal || exif?.DateTime;
        if (date) result[filePath] = date instanceof Date ? date.toISOString() : String(date);
      } catch {
        // EXIF 없는 파일은 건너뜀
      }
    })
  );
  return result;
});

// ── 날짜별 정리 (미리보기 or 실행) ──
// dryRun=true 이면 이동할 계획만 반환, false 이면 실제 이동
ipcMain.handle("fs:organizeByDate", async (event, { dirPath, dryRun }) => {
  let exifr;
  try { exifr = require("exifr"); } catch { exifr = null; }

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const files = entries
      .filter((e) => e.isFile() && isImage(e.name))
      .map((e) => ({ name: e.name, filePath: path.join(dirPath, e.name) }));

    const plan = [];
    await Promise.all(
      files.map(async ({ name, filePath }) => {
        let date;
        try {
          const exif = exifr && await exifr.parse(filePath, { pick: ["DateTimeOriginal", "DateTime"] });
          date = exif?.DateTimeOriginal || exif?.DateTime;
        } catch { /* no exif */ }

        if (!date) {
          const stat = await fs.stat(filePath);
          date = stat.mtime;
        }

        const d = date instanceof Date ? date : new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const destDir = path.join(dirPath, `${year}`, month);
        const destPath = path.join(destDir, name);
        plan.push({ name, src: filePath, destDir, destPath, label: `${year}/${month}` });
      })
    );

    if (dryRun) return { plan };

    // 실제 이동
    const moved = [];
    const errors = [];
    for (const { src, destDir, destPath, name } of plan) {
      try {
        await fs.mkdir(destDir, { recursive: true });
        await fs.rename(src, destPath);
        moved.push(name);
      } catch (err) {
        errors.push({ name, error: err.message });
      }
    }
    return { moved, errors };
  } catch (err) {
    console.error("organizeByDate error:", err);
    return { plan: [], moved: [], errors: [{ error: err.message }] };
  }
});
