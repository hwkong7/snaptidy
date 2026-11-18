import { useCallback, useEffect, useMemo, useState } from "react";
import type { ExifDates, ImageFile } from "../../shared/types";
import type { FolderItem, Photo } from "@/types/photo";
import { folderName, toImageUrl } from "@/lib/format";

export const BASE_FOLDERS: FolderItem[] = [
  { key: "바탕화면", icon: "🖥️" },
  { key: "다운로드", icon: "⬇️" },
  { key: "사진", icon: "🖼️" },
  { key: "문서", icon: "📄" },
];

const toPhoto = (file: ImageFile, exif: ExifDates): Photo => ({
  ...file,
  id: file.path,
  url: toImageUrl(file.path),
  exifDate: exif[file.path] ?? null,
});

/**
 * 폴더 이동(뒤로/앞으로 포함)과 현재 폴더의 사진 목록을 관리한다.
 * 폴더는 "이름 → 경로"로 기억하고, 사이드바·제목에는 이름을 보여준다.
 */
export function useFolderBrowser(onNavigate?: () => void) {
  const [routePaths, setRoutePaths] = useState<Record<string, string>>({});
  const [currentRoute, setCurrentRoute] = useState("다운로드");
  const [customFolders, setCustomFolders] = useState<FolderItem[]>([]);
  const [filesByRoute, setFilesByRoute] = useState<Record<string, ImageFile[]>>({});
  const [exifByRoute, setExifByRoute] = useState<Record<string, ExifDates>>({});
  const [backStack, setBackStack] = useState<string[]>([]);
  const [forwardStack, setForwardStack] = useState<string[]>([]);

  const currentDirPath = routePaths[currentRoute] ?? null;

  const loadFiles = useCallback(async (routeName: string, dirPath: string) => {
    const files = await window.electronAPI.readDir(dirPath);
    setFilesByRoute((prev) => ({ ...prev, [routeName]: files }));

    // EXIF 촬영일은 목록을 먼저 보여준 뒤 따로 불러온다
    if (files.length > 0) {
      const exif = await window.electronAPI.readExifDates(files.map((f) => f.path));
      setExifByRoute((prev) => ({ ...prev, [routeName]: exif }));
    }
  }, []);

  useEffect(() => {
    window.electronAPI.getDefaultFolders().then(setRoutePaths);
  }, []);

  useEffect(() => {
    if (currentDirPath) loadFiles(currentRoute, currentDirPath);
  }, [currentRoute, currentDirPath, loadFiles]);

  const photos = useMemo(() => {
    const exif = exifByRoute[currentRoute] ?? {};
    return (filesByRoute[currentRoute] ?? []).map((f) => toPhoto(f, exif));
  }, [filesByRoute, exifByRoute, currentRoute]);

  const openPath = useCallback(
    (dirPath: string) => {
      const name = folderName(dirPath);
      setRoutePaths((prev) => ({ ...prev, [name]: dirPath }));
      setFilesByRoute((prev) => ({ ...prev, [name]: [] }));
      setCurrentRoute(name);
      onNavigate?.();
    },
    [onNavigate]
  );

  /** 새 위치로 이동 (뒤로 가기 기록에 남김) */
  const navigateTo = useCallback(
    (dirPath: string) => {
      if (!dirPath) return;
      if (currentDirPath) {
        setBackStack((s) => [...s, currentDirPath]);
        setForwardStack([]);
      }
      openPath(dirPath);
    },
    [currentDirPath, openPath]
  );

  const goBack = useCallback(() => {
    const prev = backStack.at(-1);
    if (!prev) return;
    setBackStack((s) => s.slice(0, -1));
    if (currentDirPath) setForwardStack((s) => [...s, currentDirPath]);
    openPath(prev);
  }, [backStack, currentDirPath, openPath]);

  const goForward = useCallback(() => {
    const next = forwardStack.at(-1);
    if (!next) return;
    setForwardStack((s) => s.slice(0, -1));
    if (currentDirPath) setBackStack((s) => [...s, currentDirPath]);
    openPath(next);
  }, [forwardStack, currentDirPath, openPath]);

  /** 사이드바 폴더 클릭 */
  const openFolder = useCallback(
    (key: string) => {
      const dirPath = routePaths[key];
      if (dirPath) navigateTo(dirPath);
      else setCurrentRoute(key);
    },
    [routePaths, navigateTo]
  );

  const reload = useCallback(() => {
    if (currentDirPath) loadFiles(currentRoute, currentDirPath);
  }, [currentRoute, currentDirPath, loadFiles]);

  const createFolder = useCallback(
    async (name: string) => {
      if (!currentDirPath) return;
      const newPath = await window.electronAPI.createFolder(currentDirPath, name);
      setCustomFolders((prev) => [...prev, { key: name, icon: "📁" }]);
      navigateTo(newPath);
    },
    [currentDirPath, navigateTo]
  );

  return {
    folders: [...BASE_FOLDERS, ...customFolders],
    currentRoute,
    currentDirPath,
    photos,
    canGoBack: backStack.length > 0,
    canGoForward: forwardStack.length > 0,
    navigateTo,
    goBack,
    goForward,
    openFolder,
    reload,
    createFolder,
  };
}
