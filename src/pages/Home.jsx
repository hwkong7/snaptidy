// src/pages/Home.jsx
import React, {
  useState,
  useMemo,
  useEffect,
  useCallback
} from "react";
import Header from "../components/Header/Header";
import PhotoGrid from "../components/PhotoGrid/PhotoGrid";
import BottomBar from "../layouts/BottomBar";

const BASE_ROUTES = ["바탕화면", "다운로드", "사진", "문서"];

export default function Home() {
  const [routes, setRoutes] = useState(BASE_ROUTES);
  const [currentRoute, setCurrentRoute] = useState("사진");

  const [routePaths, setRoutePaths] = useState({});
  const [photosByRoute, setPhotosByRoute] = useState({});

  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const currentPhotos = useMemo(
    () => photosByRoute[currentRoute] || [],
    [photosByRoute, currentRoute]
  );

  const selectedCount = useMemo(
    () => currentPhotos.filter((p) => p.selected).length,
    [currentPhotos]
  );

  // 상위 폴더 이동(cd ..)
  const goUpDirectory = () => {
    const currentPath = routePaths[currentRoute];
    if (!currentPath) return;

    const normalized = currentPath.replace(/\\/g, "/");
    const parts = normalized.split("/");
    if (parts.length <= 1) return;

    const parentDir = parts.slice(0, -1).join("/");
    const parentName = parentDir.split("/").pop();

    setRoutes((prev) => [...new Set([...prev, parentName])]);

    setRoutePaths((prev) => ({
      ...prev,
      [parentName]: parentDir
    }));

    setCurrentRoute(parentName);
  };

  // 실제 폴더에서 파일 읽기
  const loadFilesFromRoute = useCallback(
    async (routeName) => {
      const dirPath = routePaths[routeName];
      if (!dirPath || !window.electronAPI?.readDir) return;

      const files = await window.electronAPI.readDir(dirPath);

      const fsPhotos = files.map((f) => ({
        id: f.path,
        name: f.name,
        path: f.path,
        url: `file://${f.path}`,
        fromFs: true,
        selected: false
      }));

      setPhotosByRoute((prev) => ({
        ...prev,
        [routeName]: fsPhotos
      }));
    },
    [routePaths]
  );

  // 기본 폴더 가져오기
  useEffect(() => {
    async function init() {
      const map = await window.electronAPI.getDefaultFolders();
      setRoutePaths(map);
    }
    init();
  }, []);

  useEffect(() => {
    if (routePaths[currentRoute]) loadFilesFromRoute(currentRoute);
  }, [currentRoute, routePaths, loadFilesFromRoute]);

  // 선택 토글
  const toggleSelect = (id) => {
    setPhotosByRoute((prev) => ({
      ...prev,
      [currentRoute]: prev[currentRoute].map((p) =>
        p.id === id ? { ...p, selected: !p.selected } : p
      )
    }));
  };

  const selectAll = () => {
    setPhotosByRoute((prev) => ({
      ...prev,
      [currentRoute]: prev[currentRoute].map((p) => ({ ...p, selected: true }))
    }));
  };

  const clearSelection = () => {
    setPhotosByRoute((prev) => ({
      ...prev,
      [currentRoute]: prev[currentRoute].map((p) => ({ ...p, selected: false }))
    }));
  };

  // 삭제 (휴지통)
  const deleteSelected = async () => {
    const toDelete = currentPhotos.filter((p) => p.selected);
    if (!toDelete.length) return;

    const ok = window.confirm(`${toDelete.length}개 파일을 휴지통으로 이동할까요?`);
    if (!ok) return;

    const paths = toDelete.map((p) => p.path);
    await window.electronAPI.trashFiles(paths);
    loadFilesFromRoute(currentRoute);
  };

  // 새 폴더
  const confirmCreateFolder = async () => {
    const name = newFolderName.trim();
    if (!name) return;

    const parentDir = routePaths[currentRoute];
    const newPath = await window.electronAPI.createFolder(parentDir, name);

    setRoutes((prev) => [...prev, name]);
    setRoutePaths((prev) => ({ ...prev, [name]: newPath }));
    setPhotosByRoute((prev) => ({ ...prev, [name]: [] }));

    setIsFolderModalOpen(false);
    setNewFolderName("");
  };

  // 복사
  const handleCopy = async () => {
    const selected = currentPhotos.filter((p) => p.selected);
    if (!selected.length) return;

    const target = await window.electronAPI.chooseFolder();
    if (!target) return;

    const ok = await window.electronAPI.copyFiles(
      selected.map((p) => p.path),
      target
    );

    alert(ok ? "복사 완료!" : "복사 실패");
  };

  // 공유
  const handleShare = () => {
    const selected = currentPhotos.filter((p) => p.selected);
    if (!selected.length) return;
    window.electronAPI.showItem(selected[0].path);
  };

  // 경로 변경
  const handleChooseFolder = async () => {
    const newPath = await window.electronAPI.chooseFolder();
    if (!newPath) return;

    const name = newPath.split("\\").pop();

    setRoutes((prev) => [...prev, name]);
    setRoutePaths((prev) => ({ ...prev, [name]: newPath }));
    setPhotosByRoute((prev) => ({ ...prev, [name]: [] }));

    setCurrentRoute(name);
  };

  return (
    <div>
      <Header
        currentRoutePath={routePaths[currentRoute]}
        onChooseFolder={handleChooseFolder}
        onBack={goUpDirectory}
      />

      <PhotoGrid photos={currentPhotos} onToggle={toggleSelect} />

      <BottomBar
        count={selectedCount}
        onSelectAll={selectAll}
        onClear={clearSelection}
        onDelete={deleteSelected}
        onCreateFolder={() => setIsFolderModalOpen(true)}
        onCopy={handleCopy}
        onShare={handleShare}
      />

      {/* 새 폴더 모달 */}
      {isFolderModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>새 폴더 생성</h3>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="폴더 이름 입력"
            />
            <div className="modal-actions">
              <button onClick={() => setIsFolderModalOpen(false)}>취소</button>
              <button onClick={confirmCreateFolder}>생성</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
