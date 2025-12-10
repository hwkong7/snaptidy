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

  // 경로 매핑
  const [routePaths, setRoutePaths] = useState({});
  // route → 사진 리스트
  const [photosByRoute, setPhotosByRoute] = useState({});

  // 모달 상태 (새 폴더)
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const fileInputRef = useRef(null);
  const currentPhotos = photosByRoute[currentRoute] || [];

  // 선택 개수
  const selectedCount = useMemo(
    () => currentPhotos.filter((p) => p.selected).length,
    [currentPhotos]
  );

  // 파일 읽기 함수
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

  // 앱 시작 시 OS 기본 폴더 경로 불러오기
  useEffect(() => {
    async function init() {
      if (!window.electronAPI?.getDefaultFolders) return;
      const map = await window.electronAPI.getDefaultFolders();
      setRoutePaths(map);
    }
    init();
  }, []);

  // routePaths 준비되면 사진도 읽기
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

  // ===== 전체 선택 =====
  const selectAll = () => {
    setPhotosByRoute((prev) => ({
      ...prev,
      [currentRoute]: (prev[currentRoute] || []).map((p) => ({
        ...p,
        selected: true
      }))
    }));
  };

  // ===== 선택 해제 =====
  const clearSelection = () => {
    setPhotosByRoute((prev) => ({
      ...prev,
      [currentRoute]: (prev[currentRoute] || []).map((p) => ({
        ...p,
        selected: false
      }))
    }));
  };

  // ===== 파일 휴지통 이동 =====
  const deleteSelected = async () => {
    const toDelete = currentPhotos.filter((p) => p.selected);
    if (!toDelete.length) return;

    const ok = window.confirm(
      `${toDelete.length}개 파일을 휴지통으로 이동할까요?`
    );
    if (!ok) return;

    const paths = toDelete.filter((p) => p.path).map((p) => p.path);
    await window.electronAPI.trashFiles(paths);

    await loadFilesFromRoute(currentRoute);
  };

  // ===== 새 폴더 버튼 클릭 → 모달 열기 =====
  const handleCreateFolderClick = () => {
    setIsFolderModalOpen(true);
  };

  // ===== 모달에서 확인 누르면 폴더 생성 =====
  const confirmCreateFolder = async () => {
    const name = newFolderName.trim();
    if (!name) {
      alert("폴더 이름을 입력하세요.");
      return;
    }

    const parentDir = routePaths[currentRoute];

    try {
      const newPath = await window.electronAPI.createFolder(parentDir, name);

      setRoutes((prev) => [...prev, name]);
      setRoutePaths((prev) => ({ ...prev, [name]: newPath }));
      setPhotosByRoute((prev) => ({ ...prev, [name]: [] }));
      //setCurrentRoute(name);

      setNewFolderName("");
      setIsFolderModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("폴더 생성 중 오류가 발생했습니다.");
    }
  };

  // ===== 이미지 업로드 =====
  const handleUploadClick = () => fileInputRef.current?.click();

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

  // ===== 경로 변경 버튼 =====
  const handleChooseFolder = async () => {
    if (!window.electronAPI?.chooseFolder) {
      alert("Electron API가 작동하지 않습니다.");
      return;
    }

    const newPath = await window.electronAPI.chooseFolder();
    if (!newPath) return;

    const folderName = newPath.split("\\").pop();

    setRoutes((prev) => [...prev, folderName]);
    setRoutePaths((prev) => ({ ...prev, [folderName]: newPath }));
    setPhotosByRoute((prev) => ({ ...prev, [folderName]: [] }));
    setCurrentRoute(folderName);
  };
  // ===== 복사 버튼 =====
  const handleCopy = async () => {
    const selected = currentPhotos.filter((p) => p.selected);
    if (!selected.length) return alert("복사할 파일을 선택하세요.");

    const target = await window.electronAPI.chooseFolder();
    if (!target) return;

    const paths = selected.map((p) => p.path);

    const ok = await window.electronAPI.copyFiles(paths, target);
    if (ok) alert("복사 완료!");
    else alert("복사 중 오류 발생");
  };

  // ===== 공유 버튼 =====
  const handleShare = () => {
    const selected = currentPhotos.filter((p) => p.selected);
    if (!selected.length) return alert("공유할 파일을 선택하세요.");

    // 사진 하나만 공유 표시
    window.electronAPI.showItem(selected[0].path);
  };
  return (
    <div>
      <Header
        currentRoutePath={routePaths[currentRoute]}
        onChooseFolder={handleChooseFolder}
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

      {/* ⭐ 새 폴더 모달 창 ⭐ */}
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
