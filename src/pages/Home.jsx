// src/pages/Home.jsx
import React, {
  useState,
  useRef,
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
  const [currentRoute, setCurrentRoute] = useState("다운로드");

  // 각 라우트 → 실제 OS 경로
  const [routePaths, setRoutePaths] = useState({});
  // 각 라우트 → 사진 리스트
  const [photosByRoute, setPhotosByRoute] = useState({});

  const fileInputRef = useRef(null);

  const currentPhotos = photosByRoute[currentRoute] || [];

  // 선택 개수
  const selectedCount = useMemo(
    () => currentPhotos.filter((p) => p.selected).length,
    [currentPhotos]
  );

  // 현재 라우트의 파일 목록을 OS에서 읽어와 상태에 반영
  const loadFilesFromRoute = useCallback(
    async (routeName) => {
      const dirPath = routePaths[routeName];
      if (!dirPath || !window.electronAPI?.readDir) return;

      const files = await window.electronAPI.readDir(dirPath); // [{name, path}...]

      const fromFsPhotos = files.map((f) => ({
        id: f.path,
        name: f.name,
        path: f.path,
        url: `file://${f.path}`,
        fromFs: true,
        selected: false
      }));

      setPhotosByRoute((prev) => {
        const existing = prev[routeName] || [];
        // 기존 중에서 메모리(업로드)로만 존재하는 애들 유지
        const localOnly = existing.filter((p) => !p.fromFs);
        return {
          ...prev,
          [routeName]: [...fromFsPhotos, ...localOnly]
        };
      });
    },
    [routePaths]
  );

  // 처음 시작 시 기본 폴더 경로 가져오기
  useEffect(() => {
    async function init() {
      if (!window.electronAPI?.getDefaultFolders) return;
      const map = await window.electronAPI.getDefaultFolders();
      setRoutePaths(map);
    }
    init();
  }, []);

  // routePaths 준비되거나, 현재 라우트 바뀔 때마다 동기화
  useEffect(() => {
    if (!routePaths[currentRoute]) return;
    loadFilesFromRoute(currentRoute);
  }, [currentRoute, routePaths, loadFilesFromRoute]);

  // ===== 선택 관련 =====
  const toggleSelect = (id) => {
    setPhotosByRoute((prev) => ({
      ...prev,
      [currentRoute]: (prev[currentRoute] || []).map((p) =>
        p.id === id ? { ...p, selected: !p.selected } : p
      )
    }));
  };

  const selectAll = () => {
    setPhotosByRoute((prev) => ({
      ...prev,
      [currentRoute]: (prev[currentRoute] || []).map((p) => ({
        ...p,
        selected: true
      }))
    }));
  };

  const clearSelection = () => {
    setPhotosByRoute((prev) => ({
      ...prev,
      [currentRoute]: (prev[currentRoute] || []).map((p) => ({
        ...p,
        selected: false
      }))
    }));
  };

  // ===== 진짜 휴지통으로 보내기 =====
  const deleteSelected = async () => {
    const toDelete = currentPhotos.filter((p) => p.selected);
    if (!toDelete.length) return;

    if (!window.electronAPI?.trashFiles) {
      alert("OS 휴지통과 연동되지 않았습니다.");
      return;
    }

    const ok = window.confirm(
      `${toDelete.length}개 파일을 실제 휴지통으로 이동할까요?`
    );
    if (!ok) return;

    const paths = toDelete
      .filter((p) => p.path) // 업로드로만 존재하는 애들은 건너뜀
      .map((p) => p.path);

    try {
      await window.electronAPI.trashFiles(paths);
      // 다시 읽어서 새로고침
      await loadFilesFromRoute(currentRoute);
    } catch (err) {
      console.error(err);
      alert("휴지통으로 이동하는 중 오류가 발생했습니다.");
    }
  };

  // ===== 실제 새 폴더(앨범) 만들기 =====
  const handleCreateFolder = async () => {
    const name = prompt("새 앨범 이름을 입력하세요");
    if (!name) return;

    if (routes.includes(name)) {
      alert("이미 같은 이름의 앨범이 있습니다.");
      return;
    }

    const parentDir = routePaths[currentRoute];
    if (!parentDir || !window.electronAPI?.createFolder) {
      alert("현재 경로에는 실제 폴더를 만들 수 없습니다.");
      return;
    }

    try {
      const newPath = await window.electronAPI.createFolder(parentDir, name);
      // 라우트와 경로 매핑에 추가
      setRoutes((prev) => [...prev, name]);
      setRoutePaths((prev) => ({ ...prev, [name]: newPath }));
      setPhotosByRoute((prev) => ({ ...prev, [name]: [] }));
      setCurrentRoute(name);
    } catch (err) {
      console.error(err);
      alert("폴더를 만드는 중 오류가 발생했습니다.");
    }
  };

  // ===== 업로드 (세션 동안만 존재하는 가짜 앨범 요소) =====
  const handleUploadClick = () => {
    if (!fileInputRef.current) return;
    fileInputRef.current.click();
  };

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const newPhotos = files.map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      name: file.name,
      url: URL.createObjectURL(file),
      fromFs: false,
      selected: false
    }));

    setPhotosByRoute((prev) => ({
      ...prev,
      [currentRoute]: [...(prev[currentRoute] || []), ...newPhotos]
    }));

    e.target.value = "";
  };

  return (
    <div>
      <Header
        routes={routes}
        currentRoute={currentRoute}
        onChangeRoute={setCurrentRoute}
      />

      <PhotoGrid photos={currentPhotos} onToggle={toggleSelect} />

      <input
        type="file"
        ref={fileInputRef}
        multiple
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFileInput}
      />

      <BottomBar
        count={selectedCount}
        onSelectAll={selectAll}
        onClear={clearSelection}
        onDelete={deleteSelected}
        onCreateFolder={handleCreateFolder}
        onUpload={handleUploadClick}
      />
    </div>
  );
}
