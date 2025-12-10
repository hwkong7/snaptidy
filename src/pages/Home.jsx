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

  // 실제 OS 경로 저장
  const [routePaths, setRoutePaths] = useState({});
  const [photosByRoute, setPhotosByRoute] = useState({});

  // 새 폴더 모달 상태
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const fileInputRef = useRef(null);

  // 현재 폴더의 사진 목록
  const currentPhotos = useMemo(
    () => photosByRoute[currentRoute] || [],
    [photosByRoute, currentRoute]
  );

  const selectedCount = useMemo(
    () => currentPhotos.filter((p) => p.selected).length,
    [currentPhotos]
  );

  // ⭐ cd .. 상위 디렉토리 이동 기능
  const goUpDirectory = () => {
    const currentPath = routePaths[currentRoute];
    if (!currentPath) return;

    // 윈도우 경로 구분 문제 방지
    const normalized = currentPath.replace(/\\/g, "/");

    const parts = normalized.split("/");
    if (parts.length <= 1) {
      alert("상위 폴더가 없습니다.");
      return;
    }

    // 상위 디렉토리 경로 만들기
    const parentDir = parts.slice(0, -1).join("/");

    const parentName = parentDir.split("/").pop();

    // route 목록에 없으면 추가
    setRoutes((prev) => {
      if (!prev.includes(parentName)) return [...prev, parentName];
      return prev;
    });

    // routePaths 에 상위 폴더 저장
    setRoutePaths((prev) => ({
      ...prev,
      [parentName]: parentDir
    }));

    // 이동
    setCurrentRoute(parentName);
  };

  // 파일 읽기
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

      setPhotosByRoute((prev) => {
        const existingLocal = prev[routeName]?.filter((p) => !p.fromFs) || [];
        return {
          ...prev,
          [routeName]: [...fsPhotos, ...existingLocal]
        };
      });
    },
    [routePaths]
  );

  // OS 기본 폴더 경로 가져오기
  useEffect(() => {
    async function init() {
      const map = await window.electronAPI.getDefaultFolders();
      setRoutePaths(map);
    }
    init();
  }, []);

  // currentRoute 바뀌면 사진 다시 불러오기
  useEffect(() => {
    if (!routePaths[currentRoute]) return;
    loadFilesFromRoute(currentRoute);
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

  // 휴지통 이동
  const deleteSelected = async () => {
    const selected = currentPhotos.filter((p) => p.selected);
    if (!selected.length) return alert("삭제할 파일을 선택하세요.");

    const ok = window.confirm(`${selected.length}개 파일을 휴지통으로 이동할까요?`);
    if (!ok) return;

    const paths = selected.map((p) => p.path);
    await window.electronAPI.trashFiles(paths);

    loadFilesFromRoute(currentRoute);
  };

  // 새 폴더 모달 열기
  const handleCreateFolderClick = () => {
    setIsFolderModalOpen(true);
  };

  // 새 폴더 생성
  const confirmCreateFolder = async () => {
    const name = newFolderName.trim();
    if (!name) return alert("폴더 이름을 입력하세요");

    const parentDir = routePaths[currentRoute];

    const newPath = await window.electronAPI.createFolder(parentDir, name);

    setRoutes((prev) => [...prev, name]);
    setRoutePaths((prev) => ({ ...prev, [name]: newPath }));
    setPhotosByRoute((prev) => ({ ...prev, [name]: [] }));

    setNewFolderName("");
    setIsFolderModalOpen(false);
  };

  // 파일 업로드
  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const uploaded = files.map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      name: file.name,
      url: URL.createObjectURL(file),
      fromFs: false,
      selected: false
    }));

    setPhotosByRoute((prev) => ({
      ...prev,
      [currentRoute]: [...prev[currentRoute], ...uploaded]
    }));
  };

  // 경로 변경 버튼
  const handleChooseFolder = async () => {
    const newPath = await window.electronAPI.chooseFolder();
    if (!newPath) return;

    const folderName = newPath.split("\\").pop();

    setRoutes((prev) => [...prev, folderName]);
    setRoutePaths((prev) => ({ ...prev, [folderName]: newPath }));
    setPhotosByRoute((prev) => ({ ...prev, [folderName]: [] }));

    setCurrentRoute(folderName);
  };

  // 복사
  const handleCopy = async () => {
    const selected = currentPhotos.filter((p) => p.selected);
    if (!selected.length) return alert("복사할 파일을 선택하세요.");

    const target = await window.electronAPI.chooseFolder();
    if (!target) return;

    const paths = selected.map((p) => p.path);
    const ok = await window.electronAPI.copyFiles(paths, target);

    alert(ok ? "복사 완료!" : "복사 실패");
  };

  // 공유 (탐색기에서 파일 열기)
  const handleShare = () => {
    const selected = currentPhotos.filter((p) => p.selected);
    if (!selected.length) return alert("공유할 파일을 선택하세요.");
    window.electronAPI.showItem(selected[0].path);
  };

  return (
    <div>
      <Header
        currentRoutePath={routePaths[currentRoute]}
        onChooseFolder={handleChooseFolder}
        onBack={goUpDirectory} // ⭐ cd .. 기능 실행
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
