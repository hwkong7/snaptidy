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

  // ⭐ 뒤로가기용 경로 히스토리
  const [routeHistory, setRouteHistory] = useState([]);

  // 경로 매핑: 이름 → 실제 OS 경로
  const [routePaths, setRoutePaths] = useState({});

  // 각 경로 → 이미지 리스트
  const [photosByRoute, setPhotosByRoute] = useState({});

  // 새 폴더 모달 상태
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const fileInputRef = useRef(null);

  // ⭐ useMemo로 최적화
  const currentPhotos = useMemo(
    () => photosByRoute[currentRoute] || [],
    [photosByRoute, currentRoute]
  );

  const selectedCount = useMemo(
    () => currentPhotos.filter((p) => p.selected).length,
    [currentPhotos]
  );

  // ⭐ 경로 이동 시 히스토리 저장 + 이동
  const goToRoute = useCallback(
    (newRoute) => {
      if (newRoute === currentRoute) return;
      setRouteHistory((prev) => [...prev, currentRoute]);
      setCurrentRoute(newRoute);
    },
    [currentRoute]
  );

  // ⭐ 뒤로가기
  const goBack = () => {
    if (routeHistory.length === 0) return;
    const last = routeHistory[routeHistory.length - 1];
    setRouteHistory((prev) => prev.slice(0, prev.length - 1));
    setCurrentRoute(last);
  };

  // OS 경로에서 파일 읽기
  const loadFilesFromRoute = useCallback(
    async (routeName) => {
      const dirPath = routePaths[routeName];
      if (!dirPath || !window.electronAPI?.readDir) return;

      const files = await window.electronAPI.readDir(dirPath);

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
        const localOnly = existing.filter((p) => !p.fromFs);
        return {
          ...prev,
          [routeName]: [...fromFsPhotos, ...localOnly]
        };
      });
    },
    [routePaths]
  );

  // 앱 시작 시 Home, Picture, Download 경로 가져오기
  useEffect(() => {
    async function init() {
      const map = await window.electronAPI.getDefaultFolders();
      setRoutePaths(map);
    }
    init();
  }, []);

  // 경로 바뀔 때 사진 로드
  useEffect(() => {
    if (!routePaths[currentRoute]) return;
    loadFilesFromRoute(currentRoute);
  }, [currentRoute, routePaths, loadFilesFromRoute]);

  // ===== 선택 토글 =====
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
      [currentRoute]: prev[currentRoute].map((p) => ({ ...p, selected: true }))
    }));
  };

  const clearSelection = () => {
    setPhotosByRoute((prev) => ({
      ...prev,
      [currentRoute]: prev[currentRoute].map((p) => ({ ...p, selected: false }))
    }));
  };

  // ===== 휴지통 이동 =====
  const deleteSelected = async () => {
    const selected = currentPhotos.filter((p) => p.selected);
    if (!selected.length) return;

    const ok = window.confirm(`${selected.length}개 삭제할까요?`);
    if (!ok) return;

    const paths = selected.map((p) => p.path);
    await window.electronAPI.trashFiles(paths);

    loadFilesFromRoute(currentRoute);
  };

  // ===== 새 폴더 모달 열기 =====
  const handleCreateFolderClick = () => setIsFolderModalOpen(true);

  // ===== 새 폴더 생성 =====
  const confirmCreateFolder = async () => {
    const name = newFolderName.trim();
    if (!name) return alert("폴더 이름을 입력하세요");

    const parentDir = routePaths[currentRoute];

    try {
      const newPath = await window.electronAPI.createFolder(parentDir, name);

      setRoutes((prev) => [...prev, name]);
      setRoutePaths((prev) => ({ ...prev, [name]: newPath }));
      setPhotosByRoute((prev) => ({ ...prev, [name]: [] }));

      // 자동 이동 ❌
      setNewFolderName("");
      setIsFolderModalOpen(false);
    } catch (err) {
      alert("폴더 생성 오류");
    }
  };

  // ===== 파일 업로드 =====
  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const newPhotos = files.map((f) => ({
      id: `${Date.now()}-${Math.random()}`,
      name: f.name,
      url: URL.createObjectURL(f),
      fromFs: false,
      selected: false
    }));

    setPhotosByRoute((prev) => ({
      ...prev,
      [currentRoute]: [...prev[currentRoute], ...newPhotos]
    }));
  };

  // ===== 경로 폴더 선택 =====
  const handleChooseFolder = async () => {
    const newPath = await window.electronAPI.chooseFolder();
    if (!newPath) return;

    const name = newPath.split("\\").pop();
    setRoutes((prev) => [...prev, name]);
    setRoutePaths((prev) => ({ ...prev, [name]: newPath }));
    goToRoute(name); // ⭐ 뒤로가기용 이동
  };

  // ===== 복사 =====
  const handleCopy = async () => {
    const selected = currentPhotos.filter((p) => p.selected);
    if (!selected.length) return alert("복사할 파일을 선택하세요.");

    const target = await window.electronAPI.chooseFolder();
    if (!target) return;

    const paths = selected.map((p) => p.path);
    const ok = await window.electronAPI.copyFiles(paths, target);

    alert(ok ? "복사 완료!" : "복사 실패");
  };

  // ===== 공유 =====
  const handleShare = () => {
    const selected = currentPhotos.filter((p) => p.selected);
    if (!selected.length) return alert("공유할 파일 선택하세요");
    window.electronAPI.showItem(selected[0].path);
  };

  return (
    <div>
      <Header
        currentRoutePath={routePaths[currentRoute]}
        onChooseFolder={handleChooseFolder}
        onBack={goBack}
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
        onCreateFolder={handleCreateFolderClick}
        onUpload={handleUploadClick}
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
