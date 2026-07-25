// src/pages/Home.jsx
import React, { useState, useMemo, useEffect, useCallback } from "react";
import "./Home.css";

const BASE_FOLDERS = [
  { key: "바탕화면", icon: "🖥️" },
  { key: "다운로드", icon: "⬇️" },
  { key: "사진", icon: "🖼️" },
  { key: "문서", icon: "📄" },
];

export default function Home() {
  const [routePaths, setRoutePaths] = useState({});
  const [currentRoute, setCurrentRoute] = useState("다운로드");
  const [customFolders, setCustomFolders] = useState([]);

  const [photosByRoute, setPhotosByRoute] = useState({});
  const [selectedId, setSelectedId] = useState(null); // 단일 클릭 미리보기
  const [checkedIds, setCheckedIds] = useState(new Set()); // 체크박스 선택

  const [backStack, setBackStack] = useState([]);
  const [forwardStack, setForwardStack] = useState([]);

  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [copyTarget, setCopyTarget] = useState("");

  // ── 파일 URL 변환 ──
  const toFileURL = (filePath) => {
    const normalized = filePath.replace(/\\/g, "/");
    const parts = normalized.split("/").map(encodeURIComponent);
    return `file:///${parts.join("/")}`;
  };

  // ── 현재 사진 목록 ──
  const currentPhotos = useMemo(
    () => photosByRoute[currentRoute] || [],
    [photosByRoute, currentRoute]
  );

  const selectedPhoto = currentPhotos.find((p) => p.id === selectedId) || null;
  const checkedPhotos = currentPhotos.filter((p) => checkedIds.has(p.id));

  // ── 파일 읽기 ──
  const loadFiles = useCallback(
    async (routeName, paths = routePaths) => {
      const dirPath = paths[routeName];
      if (!dirPath) return;
      const files = await window.electronAPI.readDir(dirPath);
      setPhotosByRoute((prev) => ({
        ...prev,
        [routeName]: files.map((f) => ({
          id: f.path,
          name: f.name,
          path: f.path,
          url: toFileURL(f.path),
          size: null,
          date: null,
        })),
      }));
    },
    [routePaths]
  );

  // ── 초기화 ──
  useEffect(() => {
    window.electronAPI.getDefaultFolders().then((paths) => {
      setRoutePaths(paths);
      loadFiles("다운로드", paths);
    });
  }, []);

  useEffect(() => {
    if (routePaths[currentRoute]) loadFiles(currentRoute);
  }, [currentRoute, routePaths]);

  // ── 이동 ──
  const navigateDirect = (path) => {
    const name = path.split(/[\\/]/).pop();
    setRoutePaths((prev) => ({ ...prev, [name]: path }));
    setPhotosByRoute((prev) => ({ ...prev, [name]: [] }));
    setCurrentRoute(name);
    setSelectedId(null);
    setCheckedIds(new Set());
  };

  const navigateTo = (path) => {
    if (!path) return;
    const cur = routePaths[currentRoute];
    if (cur) {
      setBackStack((p) => [...p, cur]);
      setForwardStack([]);
    }
    navigateDirect(path);
  };

  const goBack = () => {
    if (!backStack.length) return;
    const prev = backStack[backStack.length - 1];
    const cur = routePaths[currentRoute];
    setBackStack((p) => p.slice(0, -1));
    setForwardStack((p) => [...p, cur]);
    navigateDirect(prev);
  };

  const goForward = () => {
    if (!forwardStack.length) return;
    const next = forwardStack[forwardStack.length - 1];
    const cur = routePaths[currentRoute];
    setForwardStack((p) => p.slice(0, -1));
    setBackStack((p) => [...p, cur]);
    navigateDirect(next);
  };

  // ── 체크박스 토글 ──
  const toggleCheck = (id, e) => {
    e.stopPropagation();
    setCheckedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () =>
    setCheckedIds(new Set(currentPhotos.map((p) => p.id)));
  const clearAll = () => setCheckedIds(new Set());

  // ── 삭제 ──
  const deleteChecked = async () => {
    if (!checkedPhotos.length) return;
    const ok = window.confirm(`${checkedPhotos.length}개를 휴지통으로 이동할까요?`);
    if (!ok) return;
    await window.electronAPI.trashFiles(checkedPhotos.map((p) => p.path));
    setCheckedIds(new Set());
    if (checkedPhotos.some((p) => p.id === selectedId)) setSelectedId(null);
    loadFiles(currentRoute);
  };

  // ── 복사 ──
  const handleCopy = async () => {
    if (!checkedPhotos.length) return;
    const target = await window.electronAPI.chooseFolder();
    if (!target) return;
    await window.electronAPI.copyFiles(
      checkedPhotos.map((p) => p.path),
      target
    );
    alert("복사 완료!");
  };

  // ── 폴더 생성 ──
  const confirmCreateFolder = async () => {
    const name = newFolderName.trim();
    if (!name) return;
    const parentDir = routePaths[currentRoute];
    const newPath = await window.electronAPI.createFolder(parentDir, name);
    setCustomFolders((p) => [...p, { key: name, icon: "📁" }]);
    navigateTo(newPath);
    setIsFolderModalOpen(false);
    setNewFolderName("");
  };

  // ── 경로 변경 ──
  const handleChooseFolder = async () => {
    const path = await window.electronAPI.chooseFolder();
    if (path) navigateTo(path);
  };

  // ── Breadcrumb ──
  const breadcrumbs = (routePaths[currentRoute] || "")
    .split(/[\\/]/)
    .filter(Boolean);

  // ── 파일 크기 포맷 ──
  const formatSize = (bytes) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const allFolders = [...BASE_FOLDERS, ...customFolders];

  return (
    <div className="st-app">
      {/* ── 사이드바 ── */}
      <aside className="st-sidebar">
        <div className="st-logo">
          <div className="st-logo-icon">
            <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
              <rect x="2" y="4" width="9" height="8" rx="2" fill="white" opacity="0.9"/>
              <rect x="13" y="4" width="9" height="5" rx="2" fill="white" opacity="0.6"/>
              <rect x="2" y="14" width="9" height="6" rx="2" fill="white" opacity="0.6"/>
              <rect x="13" y="11" width="9" height="9" rx="2" fill="white" opacity="0.9"/>
              <path d="M17 14.5l1.5 1.5-1.5 1.5" stroke="rgba(59,130,246,0.8)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="st-logo-text">SnapTidy</span>
        </div>

        <nav className="st-nav">
          <p className="st-nav-label">기본 폴더</p>
          {allFolders.map((f) => (
            <button
              key={f.key}
              className={`st-nav-item ${currentRoute === f.key ? "active" : ""}`}
              onClick={() => {
                const path = routePaths[f.key];
                if (path) navigateTo(path);
                else setCurrentRoute(f.key);
              }}
            >
              <span className="st-nav-icon">{f.icon}</span>
              <span>{f.key}</span>
            </button>
          ))}

          <div className="st-nav-divider" />
          <p className="st-nav-label">즐겨찾기</p>
          <button
            className="st-nav-item"
            onClick={() => setIsFolderModalOpen(true)}
          >
            <span className="st-nav-icon">＋</span>
            <span>폴더 추가</span>
          </button>
        </nav>

        <button className="st-sidebar-path-btn" onClick={handleChooseFolder}>
          <span>📂</span> 경로 변경
        </button>
      </aside>

      {/* ── 메인 ── */}
      <main className="st-main">
        {/* 툴바 */}
        <div className="st-toolbar">
          <div className="st-toolbar-left">
            <button
              className="st-nav-btn"
              onClick={goBack}
              disabled={!backStack.length}
              title="뒤로"
            >‹</button>
            <button
              className="st-nav-btn"
              onClick={goForward}
              disabled={!forwardStack.length}
              title="앞으로"
            >›</button>
            <button className="st-nav-btn" onClick={() => loadFiles(currentRoute)} title="새로고침">↻</button>

            {/* Breadcrumb */}
            <div className="st-breadcrumb">
              {breadcrumbs.map((part, i) => {
                const fullPath = breadcrumbs.slice(0, i + 1).join("\\");
                return (
                  <span key={i} className="st-bc-item">
                    {i > 0 && <span className="st-bc-sep">›</span>}
                    <button
                      className="st-bc-btn"
                      onClick={() => navigateTo(fullPath)}
                    >
                      {part}
                    </button>
                  </span>
                );
              })}
            </div>
          </div>

          <div className="st-toolbar-right">
            {checkedIds.size > 0 && (
              <span className="st-count-badge">{checkedIds.size}개 선택</span>
            )}
            <button className="st-action-btn" onClick={selectAll}>전체선택</button>
            <button className="st-action-btn" onClick={clearAll}>선택해제</button>
            <button
              className="st-action-btn primary"
              onClick={() => setIsFolderModalOpen(true)}
            >
              ＋ 새 폴더
            </button>
          </div>
        </div>

        {/* 폴더 제목 */}
        <div className="st-folder-title">
          <h2>{currentRoute}</h2>
          <span className="st-file-count">{currentPhotos.length}개 파일</span>
        </div>

        {/* 그리드 + 상세 패널 */}
        <div className="st-content">
          {/* 사진 그리드 */}
          <div className="st-grid-area">
            {currentPhotos.length === 0 ? (
              <div className="st-empty">
                <div className="st-empty-icon">🖼️</div>
                <p>이 폴더에 이미지가 없습니다</p>
              </div>
            ) : (
              <div className="st-grid">
                {currentPhotos.map((photo) => {
                  const isChecked = checkedIds.has(photo.id);
                  const isSelected = selectedId === photo.id;
                  return (
                    <div
                      key={photo.id}
                      className={`st-card ${isSelected ? "focused" : ""} ${isChecked ? "checked" : ""}`}
                      onClick={() => setSelectedId(photo.id)}
                    >
                      <div className="st-card-img-wrap">
                        <img src={photo.url} alt={photo.name} draggable={false} />

                        {/* 체크박스 */}
                        <button
                          className={`st-checkbox ${isChecked ? "on" : ""}`}
                          onClick={(e) => toggleCheck(photo.id, e)}
                        >
                          {isChecked && (
                            <svg viewBox="0 0 12 12" width="10" height="10">
                              <polyline
                                points="2,6 5,9 10,3"
                                fill="none"
                                stroke="white"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                              />
                            </svg>
                          )}
                        </button>
                      </div>
                      <div className="st-card-name">{photo.name}</div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 선택 항목 하단 바 */}
            {checkedIds.size > 0 && (
              <div className="st-bottom-bar">
                <div className="st-bottom-previews">
                  {checkedPhotos.slice(0, 5).map((p) => (
                    <div key={p.id} className="st-preview-thumb">
                      <img src={p.url} alt={p.name} />
                      <button
                        className="st-preview-remove"
                        onClick={() =>
                          setCheckedIds((prev) => {
                            const n = new Set(prev);
                            n.delete(p.id);
                            return n;
                          })
                        }
                      >×</button>
                    </div>
                  ))}
                  {checkedIds.size > 5 && (
                    <span className="st-more">+{checkedIds.size - 5}</span>
                  )}
                </div>
                <div className="st-bottom-actions">
                  <button className="st-bar-btn copy" onClick={handleCopy}>
                    <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
                      <rect x="6" y="6" width="10" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                      <path d="M4 14V4a2 2 0 012-2h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                    </svg>
                    복사
                  </button>
                  <button className="st-bar-btn delete" onClick={deleteChecked}>
                    <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
                      <path d="M6 8l1 9h6l1-9M3 6h14M8 6V4h4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                    </svg>
                    삭제
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 상세 패널 */}
          <aside className="st-detail">
            {selectedPhoto ? (
              <>
                <div className="st-detail-preview">
                  <img src={selectedPhoto.url} alt={selectedPhoto.name} />
                </div>
                <div className="st-detail-info">
                  <h3 className="st-detail-name">{selectedPhoto.name}</h3>
                  <div className="st-detail-rows">
                    <div className="st-detail-row">
                      <span className="st-detail-label">형식</span>
                      <span className="st-detail-val">
                        {selectedPhoto.name.split(".").pop().toUpperCase()} 파일
                      </span>
                    </div>
                    <div className="st-detail-row">
                      <span className="st-detail-label">크기</span>
                      <span className="st-detail-val">
                        {formatSize(selectedPhoto.size)}
                      </span>
                    </div>
                    <div className="st-detail-row">
                      <span className="st-detail-label">경로</span>
                      <span className="st-detail-val st-detail-path">
                        {selectedPhoto.path}
                      </span>
                    </div>
                  </div>

                  <div className="st-detail-actions">
                    <button
                      className="st-detail-btn outline"
                      onClick={() => window.electronAPI.showItem(selectedPhoto.path)}
                    >
                      탐색기에서 열기
                    </button>
                    <button
                      className={`st-detail-btn ${checkedIds.has(selectedPhoto.id) ? "selected" : "primary"}`}
                      onClick={(e) => toggleCheck(selectedPhoto.id, e)}
                    >
                      {checkedIds.has(selectedPhoto.id) ? "✔ 선택됨" : "선택하기"}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="st-detail-empty">
                <div className="st-detail-empty-icon">
                  <svg viewBox="0 0 48 48" width="48" height="48" fill="none">
                    <rect x="6" y="10" width="36" height="28" rx="4" stroke="#CBD5E1" strokeWidth="2"/>
                    <circle cx="18" cy="22" r="4" stroke="#CBD5E1" strokeWidth="2"/>
                    <path d="M6 32l10-8 8 6 6-5 12 9" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p>사진을 클릭하면<br/>상세정보가 표시됩니다</p>
              </div>
            )}
          </aside>
        </div>
      </main>

      {/* ── 폴더 생성 모달 ── */}
      {isFolderModalOpen && (
        <div className="st-modal-overlay" onClick={() => setIsFolderModalOpen(false)}>
          <div className="st-modal" onClick={(e) => e.stopPropagation()}>
            <h3>새 폴더 생성</h3>
            <p className="st-modal-sub">현재 위치: {routePaths[currentRoute]}</p>
            <input
              autoFocus
              type="text"
              className="st-modal-input"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && confirmCreateFolder()}
              placeholder="폴더 이름 입력"
            />
            <div className="st-modal-actions">
              <button
                className="st-modal-btn cancel"
                onClick={() => { setIsFolderModalOpen(false); setNewFolderName(""); }}
              >취소</button>
              <button className="st-modal-btn confirm" onClick={confirmCreateFolder}>
                생성
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
