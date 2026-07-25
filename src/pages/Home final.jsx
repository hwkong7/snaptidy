// src/pages/Home.jsx
import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import logoImg from "../assets/images/logo.png";
import "./Home.css";

/* ── 상수 ── */
const BASE_FOLDERS = [
  { key: "바탕화면", icon: "🖥️" },
  { key: "다운로드", icon: "⬇️" },
  { key: "사진",     icon: "🖼️" },
  { key: "문서",     icon: "📄" },
  { key: "스크린샷", icon: "📸" },
];

/* ── 유틸 ── */
function formatSize(bytes) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function toFileURL(filePath) {
  const norm = filePath.replace(/\\/g, "/");
  return "file:///" + norm.split("/").map(encodeURIComponent).join("/");
}

/* ══════════════════════════════════════
   메인 컴포넌트
══════════════════════════════════════ */
export default function Home() {
  /* state */
  const [routePaths,    setRoutePaths]    = useState({});
  const [currentRoute,  setCurrentRoute]  = useState("다운로드");
  const [extraFolders,  setExtraFolders]  = useState([]);
  const [photosByRoute, setPhotosByRoute] = useState({});
  const [loadingRoute,  setLoadingRoute]  = useState(null);

  // 클릭(상세보기)과 체크(다중선택) 완전 분리
  const [focusedId,     setFocusedId]     = useState(null);
  const [checkedIds,    setCheckedIds]    = useState(new Set());

  // 히스토리
  const [backStack,    setBackStack]    = useState([]);
  const [forwardStack, setForwardStack] = useState([]);

  // 모달
  const [folderModal,   setFolderModal]   = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const folderInputRef = useRef(null);

  /* ── 파생값 ── */
  const currentPhotos = useMemo(
    () => photosByRoute[currentRoute] || [],
    [photosByRoute, currentRoute]
  );

  const focusedPhoto = currentPhotos.find((p) => p.id === focusedId) || null;

  // checkedPhotos: Set 기반이라 map() 재계산 최소화
  const checkedPhotos = useMemo(
    () => currentPhotos.filter((p) => checkedIds.has(p.id)),
    [currentPhotos, checkedIds]
  );

  /* ── 파일 읽기 ── */
  const loadFiles = useCallback(async (routeName, paths) => {
    const rp = paths || routePaths;
    const dirPath = rp[routeName];
    if (!dirPath) return;

    setLoadingRoute(routeName);
    try {
      const files = await window.electronAPI.readDir(dirPath);
      setPhotosByRoute((prev) => ({
        ...prev,
        [routeName]: files.map((f) => ({
          id:    f.path,
          name:  f.name,
          path:  f.path,
          url:   toFileURL(f.path),
          size:  f.size  ?? null,   // ← main.js stat() 결과
          mtime: f.mtime ?? null,
        })),
      }));
    } finally {
      setLoadingRoute(null);
    }
  }, [routePaths]);

  /* ── 초기화 ── */
  useEffect(() => {
    window.electronAPI.getDefaultFolders().then((paths) => {
      setRoutePaths(paths);
      loadFiles("다운로드", paths);
    });
  }, []);

  useEffect(() => {
    if (routePaths[currentRoute]) loadFiles(currentRoute);
  }, [currentRoute, routePaths]);

  /* ── 이동 ── */
  const navigateDirect = (path) => {
    const name = path.split(/[\\/]/).pop();
    setRoutePaths((p)    => ({ ...p, [name]: path }));
    setPhotosByRoute((p) => ({ ...p, [name]: p[name] || [] }));
    setCurrentRoute(name);
    setFocusedId(null);
    setCheckedIds(new Set());
  };

  const navigateTo = (path) => {
    if (!path) return;
    const cur = routePaths[currentRoute];
    if (cur) { setBackStack((p) => [...p, cur]); setForwardStack([]); }
    navigateDirect(path);
  };

  const goBack = () => {
    if (!backStack.length) return;
    const prev = backStack[backStack.length - 1];
    setBackStack((p)    => p.slice(0, -1));
    setForwardStack((p) => [...p, routePaths[currentRoute]]);
    navigateDirect(prev);
  };

  const goForward = () => {
    if (!forwardStack.length) return;
    const next = forwardStack[forwardStack.length - 1];
    setForwardStack((p) => p.slice(0, -1));
    setBackStack((p)    => [...p, routePaths[currentRoute]]);
    navigateDirect(next);
  };

  /* ── 체크 토글 (Set 재사용, 리렌더 최소) ── */
  const toggleCheck = useCallback((id, e) => {
    e && e.stopPropagation();
    setCheckedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const selectAll = () => setCheckedIds(new Set(currentPhotos.map((p) => p.id)));
  const clearAll  = () => setCheckedIds(new Set());

  /* ── 액션 ── */
  const deleteChecked = async () => {
    if (!checkedPhotos.length) return;
    const ok = window.confirm(`${checkedPhotos.length}개 파일을 휴지통으로 이동할까요?`);
    if (!ok) return;
    await window.electronAPI.trashFiles(checkedPhotos.map((p) => p.path));
    if (checkedPhotos.some((p) => p.id === focusedId)) setFocusedId(null);
    setCheckedIds(new Set());
    loadFiles(currentRoute);
  };

  const handleCopy = async () => {
    if (!checkedPhotos.length) return;
    const target = await window.electronAPI.chooseFolder();
    if (!target) return;
    await window.electronAPI.copyFiles(checkedPhotos.map((p) => p.path), target);
    alert("복사 완료!");
  };

  const handleShare = () => {
    const t = checkedPhotos[0] || focusedPhoto;
    if (t) window.electronAPI.showItem(t.path);
  };

  /* ── 폴더 생성 ── */
  useEffect(() => {
    if (folderModal) setTimeout(() => folderInputRef.current?.focus(), 50);
  }, [folderModal]);

  const confirmCreateFolder = async () => {
    const name = newFolderName.trim();
    if (!name) return;
    const newPath = await window.electronAPI.createFolder(routePaths[currentRoute], name);
    setExtraFolders((p) => [...p, { key: name, icon: "📁" }]);
    navigateTo(newPath);
    setFolderModal(false);
    setNewFolderName("");
  };

  /* ── 경로 변경 ── */
  const handleChooseFolder = async () => {
    const p = await window.electronAPI.chooseFolder();
    if (p) navigateTo(p);
  };

  /* ── Breadcrumb ── */
  const breadcrumbs = (routePaths[currentRoute] || "").split(/[\\/]/).filter(Boolean);

  const isLoading  = loadingRoute === currentRoute;
  const allFolders = [...BASE_FOLDERS, ...extraFolders];

  /* ══ RENDER ══ */
  return (
    <div className="st-app">

      {/* ════ 사이드바 ════ */}
      <aside className="st-sidebar">
        {/* 로고 */}
        <div className="st-logo">
          <img src={logoImg} alt="SnapTidy" className="st-logo-img" />
        </div>

        <nav className="st-nav">
          <p className="st-nav-label">폴더</p>
          {allFolders.map((f) => (
            <button
              key={f.key}
              className={`st-nav-item ${currentRoute === f.key ? "active" : ""}`}
              onClick={() => {
                const p = routePaths[f.key];
                if (p) navigateTo(p);
                else setCurrentRoute(f.key);
              }}
            >
              <span className="st-nav-icon">{f.icon}</span>
              <span>{f.key}</span>
              {/* 현재 폴더 로딩 중 스피너 */}
              {currentRoute === f.key && isLoading && (
                <span className="st-nav-spin" />
              )}
            </button>
          ))}

          <div className="st-nav-divider" />
          <p className="st-nav-label">즐겨찾기</p>
          <button className="st-nav-item add" onClick={() => setFolderModal(true)}>
            <span className="st-nav-icon">＋</span>
            <span>폴더 추가</span>
          </button>
        </nav>

        <button className="st-path-btn" onClick={handleChooseFolder}>
          📂 경로 변경
        </button>
      </aside>

      {/* ════ 메인 ════ */}
      <main className="st-main">

        {/* 툴바 */}
        <div className="st-toolbar">
          <div className="st-tb-left">
            <button className="st-nav-btn" onClick={goBack}    disabled={!backStack.length}>‹</button>
            <button className="st-nav-btn" onClick={goForward} disabled={!forwardStack.length}>›</button>
            <button className="st-nav-btn" onClick={() => loadFiles(currentRoute)} title="새로고침">↻</button>

            <div className="st-breadcrumb">
              {breadcrumbs.map((part, i) => {
                const fullPath = breadcrumbs.slice(0, i + 1).join("\\");
                return (
                  <span key={i} className="st-bc-seg">
                    {i > 0 && <span className="st-bc-sep">›</span>}
                    <button className="st-bc-btn" onClick={() => navigateTo(fullPath)}>
                      {part}
                    </button>
                  </span>
                );
              })}
            </div>
          </div>

          <div className="st-tb-right">
            {checkedIds.size > 0 && (
              <span className="st-badge">{checkedIds.size}개 선택</span>
            )}
            <button className="st-tb-btn" onClick={selectAll}>전체선택</button>
            <button className="st-tb-btn" onClick={clearAll}>선택해제</button>
            <button className="st-tb-btn primary" onClick={() => setFolderModal(true)}>
              ＋ 새 폴더
            </button>
          </div>
        </div>

        {/* 폴더 헤더 */}
        <div className="st-folder-header">
          <h2>{currentRoute}</h2>
          <span className="st-file-count">
            {isLoading ? "불러오는 중…" : `${currentPhotos.length}개 파일`}
          </span>
        </div>

        {/* 콘텐츠 (그리드 + 상세) */}
        <div className="st-content">

          {/* 그리드 영역 */}
          <div className="st-grid-area">

            {/* 로딩 */}
            {isLoading ? (
              <div className="st-status">
                <div className="st-spinner" />
                <p>사진을 불러오는 중입니다…</p>
              </div>

            /* 비어있음 */
            ) : currentPhotos.length === 0 ? (
              <div className="st-status">
                <span className="st-status-icon">🖼️</span>
                <p>이 폴더에 이미지 파일이 없습니다</p>
              </div>

            /* 그리드 */
            ) : (
              <div className="st-grid">
                {currentPhotos.map((photo) => (
                  <PhotoCard
                    key={photo.id}
                    photo={photo}
                    isChecked={checkedIds.has(photo.id)}
                    isFocused={focusedId === photo.id}
                    onFocus={setFocusedId}
                    onToggleCheck={toggleCheck}
                  />
                ))}
              </div>
            )}

            {/* 하단 선택 액션바 */}
            {checkedIds.size > 0 && (
              <div className="st-bottom-bar">
                <div className="st-bottom-thumbs">
                  {checkedPhotos.slice(0, 6).map((p) => (
                    <div key={p.id} className="st-thumb-wrap">
                      <img src={p.url} alt={p.name} />
                      <button
                        className="st-thumb-rm"
                        onClick={() => setCheckedIds((prev) => {
                          const n = new Set(prev); n.delete(p.id); return n;
                        })}
                      >×</button>
                    </div>
                  ))}
                  {checkedIds.size > 6 && (
                    <span className="st-thumb-more">+{checkedIds.size - 6}</span>
                  )}
                </div>

                <div className="st-bottom-actions">
                  <button className="st-act copy"   onClick={handleCopy}>
                    <CopyIcon /> 복사
                  </button>
                  <button className="st-act share"  onClick={handleShare}>
                    <ShareIcon /> 공유
                  </button>
                  <button className="st-act delete" onClick={deleteChecked}>
                    <TrashIcon /> 삭제
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 상세 패널 */}
          <aside className="st-detail">
            {focusedPhoto ? (
              <>
                <div className="st-detail-img">
                  <img src={focusedPhoto.url} alt={focusedPhoto.name} />
                </div>
                <div className="st-detail-body">
                  <p className="st-detail-name">{focusedPhoto.name}</p>

                  <div className="st-detail-rows">
                    <DetailRow label="형식"
                      value={focusedPhoto.name.split(".").pop().toUpperCase() + " 파일"} />
                    <DetailRow label="크기"   value={formatSize(focusedPhoto.size)} />
                    <DetailRow label="수정일"  value={formatDate(focusedPhoto.mtime)} />
                    <DetailRow label="경로"   value={focusedPhoto.path} small />
                  </div>

                  <div className="st-detail-btns">
                    <button className="st-det-btn outline"
                      onClick={() => window.electronAPI.showItem(focusedPhoto.path)}>
                      탐색기에서 열기
                    </button>
                    <button
                      className={`st-det-btn ${checkedIds.has(focusedPhoto.id) ? "checked" : "primary"}`}
                      onClick={(e) => toggleCheck(focusedPhoto.id, e)}>
                      {checkedIds.has(focusedPhoto.id) ? "✔ 선택됨" : "선택하기"}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="st-detail-empty">
                <EmptyIcon />
                <p>사진을 클릭하면<br />상세정보가 표시됩니다</p>
              </div>
            )}
          </aside>
        </div>
      </main>

      {/* 폴더 생성 모달 */}
      {folderModal && (
        <div className="st-overlay" onClick={() => setFolderModal(false)}>
          <div className="st-modal" onClick={(e) => e.stopPropagation()}>
            <h3>새 폴더 생성</h3>
            <p className="st-modal-path">{routePaths[currentRoute]}</p>
            <input
              ref={folderInputRef}
              className="st-modal-input"
              type="text"
              placeholder="폴더 이름 입력"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && confirmCreateFolder()}
            />
            <div className="st-modal-actions">
              <button className="st-modal-btn cancel"
                onClick={() => { setFolderModal(false); setNewFolderName(""); }}>
                취소
              </button>
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

/* ══════════════════════════════════════
   서브 컴포넌트
══════════════════════════════════════ */

// React.memo → 체크/포커스 상태 변해도 해당 카드만 리렌더
const PhotoCard = React.memo(function PhotoCard({
  photo, isChecked, isFocused, onFocus, onToggleCheck
}) {
  return (
    <div
      className={`st-card ${isFocused ? "focused" : ""} ${isChecked ? "checked" : ""}`}
      onClick={() => onFocus(photo.id)}
    >
      <div className="st-card-img">
        <img src={photo.url} alt={photo.name} loading="lazy" draggable={false} />
        <button
          className={`st-cb ${isChecked ? "on" : ""}`}
          onClick={(e) => onToggleCheck(photo.id, e)}
        >
          {isChecked && (
            <svg viewBox="0 0 12 12" width="9" height="9">
              <polyline points="2,6 5,9 10,3" fill="none"
                stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>
      <div className="st-card-name">{photo.name}</div>
    </div>
  );
});

function DetailRow({ label, value, small }) {
  return (
    <div className="st-d-row">
      <span className="st-d-label">{label}</span>
      <span className={`st-d-val ${small ? "small" : ""}`}>{value}</span>
    </div>
  );
}

/* ── 인라인 아이콘 ── */
function CopyIcon() {
  return (
    <svg viewBox="0 0 20 20" width="15" height="15" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <rect x="6" y="6" width="10" height="12" rx="2" />
      <path d="M4 14V4a2 2 0 012-2h8" />
    </svg>
  );
}
function ShareIcon() {
  return (
    <svg viewBox="0 0 20 20" width="15" height="15" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="15" cy="4" r="2" /><circle cx="15" cy="16" r="2" />
      <circle cx="5" cy="10" r="2" />
      <line x1="7" y1="10.7" x2="13" y2="15.3" />
      <line x1="7" y1="9.3"  x2="13" y2="4.7" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg viewBox="0 0 20 20" width="15" height="15" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M6 8l1 9h6l1-9M3 6h14M8 6V4h4v2" />
    </svg>
  );
}
function EmptyIcon() {
  return (
    <svg viewBox="0 0 48 48" width="44" height="44" fill="none">
      <rect x="6" y="10" width="36" height="28" rx="4" stroke="#CBD5E1" strokeWidth="2" />
      <circle cx="18" cy="22" r="4" stroke="#CBD5E1" strokeWidth="2" />
      <path d="M6 32l10-8 8 6 6-5 12 9" stroke="#CBD5E1" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}