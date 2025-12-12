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

  const [hoveredImage, setHoveredImage] = useState(null);

  /* =========================
     현재 사진
  ========================= */
  const currentPhotos = useMemo(
    () => photosByRoute[currentRoute] || [],
    [photosByRoute, currentRoute]
  );

  /* =========================
     file:// URL
  ========================= */
  const toFileURL = (filePath) => {
    const normalized = filePath.replace(/\\/g, "/");
    const parts = normalized.split("/").map(encodeURIComponent);
    return `file:///${parts.join("/")}`;
  };

  /* =========================
     히스토리 없는 이동 (뒤/앞용)
  ========================= */
  const navigateDirect = (path) => {
    const name = path.split("\\").pop();

    setRoutes((prev) => [...new Set([...prev, name])]);
    setRoutePaths((prev) => ({ ...prev, [name]: path }));
    setPhotosByRoute((prev) => ({ ...prev, [name]: [] }));
    setCurrentRoute(name);
  };

  /* =========================
     일반 이동 (breadcrumb, 폴더 클릭)
  ========================= */
  const navigateToPath = (path) => {
    if (!path) return;

    const currentPath = routePaths[currentRoute];
    if (currentPath) {
      setBackStack((prev) => [...prev, currentPath]);
      setForwardStack([]);
    }

    navigateDirect(path);
  };

  /* =========================
     뒤로 / 앞으로
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
  // =========================
  // 폴더 선택 핸들러
  // =========================
  const handleChooseFolder = async () => {
    const newPath = await window.electronAPI.chooseFolder();
    if (!newPath) return;
    navigateToPath(newPath);
  };
  /* =========================
     초기화 및 경로 변경시 파일 로드
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
     RENDER
  ========================= */
  return (
    <div className="home-page">
      <Header
        currentRoutePath={routePaths[currentRoute]}

        onBack={goForward}
        onForward={goBack}

        canGoBack={forwardStack.length > 0}
        canGoForward={backStack.length > 0}

        onNavigate={navigateToPath}
        onChooseFolder={handleChooseFolder}
      />

      <div className="content-layout">
        <div className="grid-area">
          <PhotoGrid
            photos={currentPhotos}
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

      <SelectedPreviewBar selectedPhotos={[]} />
      <BottomBar count={0} />
    </div>
  );
}
