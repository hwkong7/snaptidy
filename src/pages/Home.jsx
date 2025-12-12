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
import SelectedPreviewBar from "../components/SelectedPreviewBar/SelectedPreviewBar";

const BASE_ROUTES = ["바탕화면", "다운로드", "사진", "문서"];

export default function Home() {
  const [routes, setRoutes] = useState(BASE_ROUTES);
  const [currentRoute, setCurrentRoute] = useState("다운로드");

  const [routePaths, setRoutePaths] = useState({});
  const [photosByRoute, setPhotosByRoute] = useState({});

  // ⭐ 히스토리 스택
  const [backStack, setBackStack] = useState([]);
  const [forwardStack, setForwardStack] = useState([]);

  // UI 상태
  const [hoveredImage, setHoveredImage] = useState(null);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  /* =========================
     현재 사진 / 선택 개수
  ========================= */
  const currentPhotos = useMemo(
    () => photosByRoute[currentRoute] || [],
    [photosByRoute, currentRoute]
  );

  const selectedCount = useMemo(
    () => currentPhotos.filter((p) => p.selected).length,
    [currentPhotos]
  );

  const selectedPhotos = currentPhotos.filter((p) => p.selected);

  /* =========================
     file:// URL 생성
  ========================= */
  const toFileURL = (filePath) => {
    const normalized = filePath.replace(/\\/g, "/");
    const parts = normalized.split("/").map(encodeURIComponent);
    return `file:///${parts.join("/")}`;
  };

  /* =========================
     히스토리 없는 이동 (뒤/앞 전용)
  ========================= */
  const navigateDirect = (path) => {
    const name = path.split("\\").pop();

    setRoutes((prev) => [...new Set([...prev, name])]);
    setRoutePaths((prev) => ({ ...prev, [name]: path }));
    setPhotosByRoute((prev) => ({ ...prev, [name]: [] }));
    setCurrentRoute(name);
  };

  /* =========================
     일반 이동 (breadcrumb, 폴더 선택)
  ========================= */
  const navigateToPath = (path) => {
    if (!path) return;

    const currentPath = routePaths[currentRoute];
    if (currentPath) {
      setBackStack((prev) => [...prev, currentPath]);
      setForwardStack([]); // 새 이동 시 앞으로 스택 초기화
    }

    navigateDirect(path);
  };

  /* =========================
     ← : 뒤로 / → : 앞으로
  ========================= */
  const goBack = () => {
    if (backStack.length === 0) return;

    const prevPath = backStack[backStack.length - 1];
    const currentPath = routePaths[currentRoute];

    setBackStack((prev) => prev.slice(0, -1));
    setForwardStack((prev) => [...prev, currentPath]);

    navigateDirect(prevPath);
  };

  const goForward = () => {
    if (forwardStack.length === 0) return;

    const nextPath = forwardStack[forwardStack.length - 1];
    const currentPath = routePaths[currentRoute];

    setForwardStack((prev) => prev.slice(0, -1));
    setBackStack((prev) => [...prev, currentPath]);

    navigateDirect(nextPath);
  };

  /* =========================
     폴더 파일 읽기
  ========================= */
  const loadFilesFromRoute = useCallback(
    async (routeName) => {
      const dirPath = routePaths[routeName];
      if (!dirPath) return;

      const files = await window.electronAPI.readDir(dirPath);

      setPhotosByRoute((prev) => ({
        ...prev,
        [routeName]: files.map((f) => ({
          id: f.path,
          name: f.name,
          path: f.path,
          url: toFileURL(f.path),
          selected: false
        }))
      }));
    },
    [routePaths]
  );

  /* =========================
     초기 기본 폴더
  ========================= */
  useEffect(() => {
    window.electronAPI.getDefaultFolders().then(setRoutePaths);
  }, []);

  useEffect(() => {
    if (routePaths[currentRoute]) {
      loadFilesFromRoute(currentRoute);
    }
  }, [currentRoute, routePaths, loadFilesFromRoute]);

  /* =========================
     선택 관련
  ========================= */
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
      [currentRoute]: prev[currentRoute].map((p) => ({
        ...p,
        selected: true
      }))
    }));
  };

  const clearSelection = () => {
    setPhotosByRoute((prev) => ({
      ...prev,
      [currentRoute]: prev[currentRoute].map((p) => ({
        ...p,
        selected: false
      }))
    }));
  };

  /* =========================
     삭제 / 복사 / 공유
  ========================= */
  const deleteSelected = async () => {
    if (!selectedPhotos.length) return;

    const ok = window.confirm(
      `${selectedPhotos.length}개 파일을 휴지통으로 이동할까요?`
    );
    if (!ok) return;

    await window.electronAPI.trashFiles(
      selectedPhotos.map((p) => p.path)
    );
    loadFilesFromRoute(currentRoute);
  };

  const handleCopy = async () => {
    if (!selectedPhotos.length) return;

    const target = await window.electronAPI.chooseFolder();
    if (!target) return;

    await window.electronAPI.copyFiles(
      selectedPhotos.map((p) => p.path),
      target
    );

    alert("복사 완료!");
  };

  const handleShare = () => {
    if (!selectedPhotos.length) return;
    window.electronAPI.showItem(selectedPhotos[0].path);
  };

  /* =========================
     폴더 생성 / 경로 선택
  ========================= */
  const confirmCreateFolder = async () => {
    const name = newFolderName.trim();
    if (!name) return;

    const parentDir = routePaths[currentRoute];
    const newPath = await window.electronAPI.createFolder(parentDir, name);

    navigateToPath(newPath);

    setIsFolderModalOpen(false);
    setNewFolderName("");
  };

  const handleChooseFolder = async () => {
    const newPath = await window.electronAPI.chooseFolder();
    if (!newPath) return;
    navigateToPath(newPath);
  };

  /* =========================
     선택 미리보기 제거
  ========================= */
  const removeSelected = (id) => {
    setPhotosByRoute((prev) => ({
      ...prev,
      [currentRoute]: prev[currentRoute].map((p) =>
        p.id === id ? { ...p, selected: false } : p
      )
    }));
  };

  /* =========================
     RENDER
  ========================= */
  return (
    <div className="home-page">
      <Header
        currentRoutePath={routePaths[currentRoute]}
        onChooseFolder={handleChooseFolder}

        onBack={goBack}
        onForward={goForward}

        canGoBack={backStack.length > 0}
        canGoForward={forwardStack.length > 0}

        onNavigate={navigateToPath}
      />

      <div className="content-layout">
        <div className="grid-area">
          <PhotoGrid
            photos={currentPhotos}
            onToggle={toggleSelect}
            onHover={setHoveredImage}
          />
        </div>

        <div className="preview-area">
          {hoveredImage ? (
            <img src={hoveredImage} alt="preview" />
          ) : (
            <div className="preview-empty">미리보기 없음</div>
          )}
        </div>
      </div>

      <SelectedPreviewBar
        selectedPhotos={selectedPhotos}
        onRemove={removeSelected}
      />

      <BottomBar
        count={selectedCount}
        onSelectAll={selectAll}
        onClear={clearSelection}
        onDelete={deleteSelected}
        onCreateFolder={() => setIsFolderModalOpen(true)}
        onCopy={handleCopy}
        onShare={handleShare}
      />

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
              <button onClick={() => setIsFolderModalOpen(false)}>
                취소
              </button>
              <button onClick={confirmCreateFolder}>
                생성
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
