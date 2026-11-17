import React, { useState, useMemo, useEffect, useCallback } from "react";
import "./Home.css";

// ── 상수 ──────────────────────────────────────────────
const BASE_FOLDERS = [
  { key: "바탕화면", icon: "🖥️" },
  { key: "다운로드", icon: "⬇️" },
  { key: "사진", icon: "🖼️" },
  { key: "문서", icon: "📄" },
];

const VIEW_GRID = "grid";
const VIEW_TIMELINE = "timeline";
const VIEW_DUPLICATES = "duplicates";
const VIEW_ORGANIZE = "organize";

// ── 유틸 ──────────────────────────────────────────────
const toFileURL = (filePath) => {
  const normalized = filePath.replace(/\\/g, "/");
  const parts = normalized.split("/").map(encodeURIComponent);
  return `file:///${parts.join("/")}`;
};

const formatSize = (bytes) => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric", month: "long", day: "numeric"
  });
};

const groupByDate = (photos) => {
  const map = {};
  for (const p of photos) {
    const key = p.exifDate
      ? new Date(p.exifDate).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })
      : formatDate(p.mtime);
    if (!map[key]) map[key] = [];
    map[key].push(p);
  }
  // 최신 날짜 순 정렬
  return Object.entries(map).sort(([a], [b]) => {
    const da = new Date(a);
    const db = new Date(b);
    return db - da;
  });
};

// ── 컴포넌트: PhotoCard ────────────────────────────────
function PhotoCard({ photo, isSelected, isChecked, onSelect, onToggle }) {
  return (
    <div
      className={`st-card ${isSelected ? "focused" : ""} ${isChecked ? "checked" : ""}`}
      onClick={() => onSelect(photo.id)}
    >
      <div className="st-card-img-wrap">
        <img src={photo.url} alt={photo.name} draggable={false} />
        <button
          className={`st-checkbox ${isChecked ? "on" : ""}`}
          onClick={(e) => { e.stopPropagation(); onToggle(photo.id); }}
        >
          {isChecked && (
            <svg viewBox="0 0 12 12" width="10" height="10">
              <polyline points="2,6 5,9 10,3" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>
      <div className="st-card-name">{photo.name}</div>
    </div>
  );
}

// ── 컴포넌트: BottomBar ────────────────────────────────
function BottomBar({ checkedPhotos, onCopy, onDelete, onUncheck }) {
  if (!checkedPhotos.length) return null;
  return (
    <div className="st-bottom-bar">
      <div className="st-bottom-previews">
        {checkedPhotos.slice(0, 5).map((p) => (
          <div key={p.id} className="st-preview-thumb">
            <img src={p.url} alt={p.name} />
            <button className="st-preview-remove" onClick={() => onUncheck(p.id)}>×</button>
          </div>
        ))}
        {checkedPhotos.length > 5 && <span className="st-more">+{checkedPhotos.length - 5}</span>}
      </div>
      <div className="st-bottom-actions">
        <button className="st-bar-btn copy" onClick={onCopy}>
          <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
            <rect x="6" y="6" width="10" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <path d="M4 14V4a2 2 0 012-2h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          </svg>
          복사
        </button>
        <button className="st-bar-btn delete" onClick={onDelete}>
          <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
            <path d="M6 8l1 9h6l1-9M3 6h14M8 6V4h4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          </svg>
          삭제
        </button>
      </div>
    </div>
  );
}

// ── 컴포넌트: DetailPanel ──────────────────────────────
function DetailPanel({ photo, isChecked, onToggle, onShowItem }) {
  if (!photo) {
    return (
      <aside className="st-detail">
        <div className="st-detail-empty">
          <div className="st-detail-empty-icon">
            <svg viewBox="0 0 48 48" width="48" height="48" fill="none">
              <rect x="6" y="10" width="36" height="28" rx="4" stroke="#CBD5E1" strokeWidth="2" />
              <circle cx="18" cy="22" r="4" stroke="#CBD5E1" strokeWidth="2" />
              <path d="M6 32l10-8 8 6 6-5 12 9" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p>사진을 클릭하면<br />상세정보가 표시됩니다</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="st-detail">
      <div className="st-detail-preview">
        <img src={photo.url} alt={photo.name} />
      </div>
      <div className="st-detail-info">
        <h3 className="st-detail-name">{photo.name}</h3>
        <div className="st-detail-rows">
          <div className="st-detail-row">
            <span className="st-detail-label">형식</span>
            <span className="st-detail-val">{photo.name.split(".").pop().toUpperCase()}</span>
          </div>
          <div className="st-detail-row">
            <span className="st-detail-label">크기</span>
            <span className="st-detail-val">{formatSize(photo.size)}</span>
          </div>
          <div className="st-detail-row">
            <span className="st-detail-label">수정일</span>
            <span className="st-detail-val">{formatDate(photo.mtime)}</span>
          </div>
          {photo.exifDate && (
            <div className="st-detail-row">
              <span className="st-detail-label">촬영일</span>
              <span className="st-detail-val">{formatDate(photo.exifDate)}</span>
            </div>
          )}
          <div className="st-detail-row">
            <span className="st-detail-label">경로</span>
            <span className="st-detail-val st-detail-path">{photo.path}</span>
          </div>
        </div>
        <div className="st-detail-actions">
          <button className="st-detail-btn outline" onClick={() => onShowItem(photo.path)}>
            탐색기에서 열기
          </button>
          <button
            className={`st-detail-btn ${isChecked ? "selected" : "primary"}`}
            onClick={() => onToggle(photo.id)}
          >
            {isChecked ? "✔ 선택됨" : "선택하기"}
          </button>
        </div>
      </div>
    </aside>
  );
}

// ── 컴포넌트: DuplicatesView ───────────────────────────
function DuplicatesView({ dirPath }) {
  const [groups, setGroups] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toDelete, setToDelete] = useState(new Set());

  const scan = async () => {
    setLoading(true);
    setToDelete(new Set());
    const result = await window.electronAPI.findDuplicates(dirPath);
    setGroups(result);
    setLoading(false);
  };

  const toggleDelete = (filePath) => {
    setToDelete((prev) => {
      const next = new Set(prev);
      next.has(filePath) ? next.delete(filePath) : next.add(filePath);
      return next;
    });
  };

  const deleteSelected = async () => {
    if (!toDelete.size) return;
    const ok = window.confirm(`${toDelete.size}개 파일을 휴지통으로 보낼까요?`);
    if (!ok) return;
    await window.electronAPI.trashFiles([...toDelete]);
    setGroups((prev) => {
      const updated = prev
        .map((group) => group.filter((f) => !toDelete.has(f.path)))
        .filter((group) => group.length > 1);
      return updated;
    });
    setToDelete(new Set());
  };

  if (!dirPath) return <div className="st-view-placeholder">폴더를 먼저 선택하세요.</div>;

  return (
    <div className="st-dup-view">
      <div className="st-dup-header">
        <div>
          <h2>중복 파일 탐지</h2>
          <p className="st-dup-desc">동일한 내용의 파일을 찾아 정리합니다.</p>
        </div>
        <div className="st-dup-header-actions">
          {groups !== null && toDelete.size > 0 && (
            <button className="st-action-btn danger" onClick={deleteSelected}>
              선택 삭제 ({toDelete.size}개)
            </button>
          )}
          <button className="st-action-btn primary" onClick={scan} disabled={loading}>
            {loading ? "분석 중…" : "지금 스캔"}
          </button>
        </div>
      </div>

      {groups === null && !loading && (
        <div className="st-dup-empty">
          <div className="st-dup-empty-icon">🔍</div>
          <p>스캔 버튼을 눌러 중복 파일을 찾아보세요.</p>
        </div>
      )}

      {loading && (
        <div className="st-dup-empty">
          <div className="st-dup-empty-icon">⏳</div>
          <p>파일을 분석하는 중입니다…</p>
        </div>
      )}

      {groups !== null && !loading && groups.length === 0 && (
        <div className="st-dup-empty">
          <div className="st-dup-empty-icon">✅</div>
          <p>중복 파일이 없습니다!</p>
        </div>
      )}

      {groups !== null && !loading && groups.length > 0 && (
        <div className="st-dup-groups">
          <p className="st-dup-summary">{groups.length}개의 중복 그룹 발견 (하나만 남기고 나머지를 선택하세요)</p>
          {groups.map((group, gi) => (
            <div key={gi} className="st-dup-group">
              <div className="st-dup-group-label">그룹 {gi + 1} — {group.length}개의 동일 파일</div>
              <div className="st-dup-cards">
                {group.map((file) => {
                  const marked = toDelete.has(file.path);
                  return (
                    <div
                      key={file.path}
                      className={`st-dup-card ${marked ? "marked" : ""}`}
                      onClick={() => toggleDelete(file.path)}
                    >
                      <img src={toFileURL(file.path)} alt={file.name} />
                      <div className="st-dup-card-info">
                        <div className="st-dup-card-name">{file.name}</div>
                        <div className="st-dup-card-meta">{formatSize(file.size)} · {formatDate(file.mtime)}</div>
                      </div>
                      <div className="st-dup-card-badge">{marked ? "🗑 삭제" : "유지"}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 컴포넌트: OrganizeView ────────────────────────────
function OrganizeView({ dirPath }) {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const preview = async () => {
    setLoading(true);
    setResult(null);
    const res = await window.electronAPI.organizeByDate(dirPath, true);
    setPlan(res.plan || []);
    setLoading(false);
  };

  const execute = async () => {
    const ok = window.confirm(`${plan.length}개 파일을 날짜별 폴더로 이동할까요?`);
    if (!ok) return;
    setLoading(true);
    const res = await window.electronAPI.organizeByDate(dirPath, false);
    setResult(res);
    setPlan(null);
    setLoading(false);
  };

  const grouped = useMemo(() => {
    if (!plan) return [];
    const map = {};
    for (const item of plan) {
      if (!map[item.label]) map[item.label] = [];
      map[item.label].push(item);
    }
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a));
  }, [plan]);

  if (!dirPath) return <div className="st-view-placeholder">폴더를 먼저 선택하세요.</div>;

  return (
    <div className="st-org-view">
      <div className="st-dup-header">
        <div>
          <h2>날짜별 정리</h2>
          <p className="st-dup-desc">EXIF 촬영일 기준으로 연도/월 폴더에 자동 분류합니다.</p>
        </div>
        <div className="st-dup-header-actions">
          {plan && plan.length > 0 && (
            <button className="st-action-btn primary" onClick={execute} disabled={loading}>
              정리 실행
            </button>
          )}
          <button className="st-action-btn" onClick={preview} disabled={loading}>
            {loading ? "분석 중…" : "미리보기"}
          </button>
        </div>
      </div>

      {!plan && !result && !loading && (
        <div className="st-dup-empty">
          <div className="st-dup-empty-icon">📂</div>
          <p>미리보기를 눌러 파일이 어떻게 정리될지 확인하세요.</p>
        </div>
      )}

      {loading && (
        <div className="st-dup-empty">
          <div className="st-dup-empty-icon">⏳</div>
          <p>분석 중입니다…</p>
        </div>
      )}

      {result && (
        <div className="st-org-result">
          <div className="st-org-result-badge success">
            ✅ {result.moved?.length || 0}개 파일 정리 완료
          </div>
          {result.errors?.length > 0 && (
            <div className="st-org-result-badge error">
              ⚠ {result.errors.length}개 실패
            </div>
          )}
        </div>
      )}

      {plan && !loading && (
        <>
          {plan.length === 0 ? (
            <div className="st-dup-empty">
              <div className="st-dup-empty-icon">🖼️</div>
              <p>정리할 이미지가 없습니다.</p>
            </div>
          ) : (
            <div className="st-org-plan">
              <p className="st-dup-summary">{plan.length}개 파일 · {grouped.length}개 날짜 폴더로 분류됩니다</p>
              {grouped.map(([label, items]) => (
                <div key={label} className="st-org-group">
                  <div className="st-org-group-label">
                    <span className="st-org-folder-icon">📁</span>
                    {label}
                    <span className="st-org-count">{items.length}개</span>
                  </div>
                  <div className="st-org-files">
                    {items.map((item) => (
                      <div key={item.src} className="st-org-file">
                        <img src={toFileURL(item.src)} alt={item.name} className="st-org-thumb" />
                        <span className="st-org-arrow">→</span>
                        <span className="st-org-dest">{item.destPath}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── 메인 컴포넌트: Home ────────────────────────────────
export default function Home() {
  const [routePaths, setRoutePaths] = useState({});
  const [currentRoute, setCurrentRoute] = useState("다운로드");
  const [customFolders, setCustomFolders] = useState([]);
  const [photosByRoute, setPhotosByRoute] = useState({});
  const [exifByRoute, setExifByRoute] = useState({});

  const [selectedId, setSelectedId] = useState(null);
  const [checkedIds, setCheckedIds] = useState(new Set());

  const [backStack, setBackStack] = useState([]);
  const [forwardStack, setForwardStack] = useState([]);

  const [viewMode, setViewMode] = useState(VIEW_GRID);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const currentPhotos = useMemo(
    () => photosByRoute[currentRoute] || [],
    [photosByRoute, currentRoute]
  );

  const currentExif = useMemo(
    () => exifByRoute[currentRoute] || {},
    [exifByRoute, currentRoute]
  );

  const photosWithExif = useMemo(
    () => currentPhotos.map((p) => ({ ...p, exifDate: currentExif[p.path] || null })),
    [currentPhotos, currentExif]
  );

  const selectedPhoto = photosWithExif.find((p) => p.id === selectedId) || null;
  const checkedPhotos = photosWithExif.filter((p) => checkedIds.has(p.id));

  const loadFiles = useCallback(
    async (routeName, paths = routePaths) => {
      const dirPath = paths[routeName];
      if (!dirPath) return;
      const files = await window.electronAPI.readDir(dirPath);
      const photos = files.map((f) => ({
        id: f.path,
        name: f.name,
        path: f.path,
        url: toFileURL(f.path),
        size: f.size,
        mtime: f.mtime,
      }));
      setPhotosByRoute((prev) => ({ ...prev, [routeName]: photos }));

      // EXIF 비동기 로드
      const paths_ = files.map((f) => f.path);
      if (paths_.length > 0) {
        window.electronAPI.readExifDates(paths_).then((exif) => {
          setExifByRoute((prev) => ({ ...prev, [routeName]: exif }));
        });
      }
    },
    [routePaths]
  );

  useEffect(() => {
    window.electronAPI.getDefaultFolders().then((paths) => {
      setRoutePaths(paths);
      loadFiles("다운로드", paths);
    });
  }, []);

  useEffect(() => {
    if (routePaths[currentRoute]) loadFiles(currentRoute);
  }, [currentRoute, routePaths]);

  const navigateDirect = (p) => {
    const name = p.split(/[\\/]/).pop();
    setRoutePaths((prev) => ({ ...prev, [name]: p }));
    setPhotosByRoute((prev) => ({ ...prev, [name]: [] }));
    setCurrentRoute(name);
    setSelectedId(null);
    setCheckedIds(new Set());
    setViewMode(VIEW_GRID);
  };

  const navigateTo = (p) => {
    if (!p) return;
    const cur = routePaths[currentRoute];
    if (cur) { setBackStack((s) => [...s, cur]); setForwardStack([]); }
    navigateDirect(p);
  };

  const goBack = () => {
    if (!backStack.length) return;
    const prev = backStack[backStack.length - 1];
    const cur = routePaths[currentRoute];
    setBackStack((s) => s.slice(0, -1));
    setForwardStack((s) => [...s, cur]);
    navigateDirect(prev);
  };

  const goForward = () => {
    if (!forwardStack.length) return;
    const next = forwardStack[forwardStack.length - 1];
    const cur = routePaths[currentRoute];
    setForwardStack((s) => s.slice(0, -1));
    setBackStack((s) => [...s, cur]);
    navigateDirect(next);
  };

  const toggleCheck = (id) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const deleteChecked = async () => {
    if (!checkedPhotos.length) return;
    const ok = window.confirm(`${checkedPhotos.length}개를 휴지통으로 이동할까요?`);
    if (!ok) return;
    await window.electronAPI.trashFiles(checkedPhotos.map((p) => p.path));
    setCheckedIds(new Set());
    if (checkedPhotos.some((p) => p.id === selectedId)) setSelectedId(null);
    loadFiles(currentRoute);
  };

  const handleCopy = async () => {
    if (!checkedPhotos.length) return;
    const target = await window.electronAPI.chooseFolder();
    if (!target) return;
    await window.electronAPI.copyFiles(checkedPhotos.map((p) => p.path), target);
    alert("복사 완료!");
  };

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

  const breadcrumbs = (routePaths[currentRoute] || "").split(/[\\/]/).filter(Boolean);
  const allFolders = [...BASE_FOLDERS, ...customFolders];
  const currentDirPath = routePaths[currentRoute] || null;

  // 타임라인 그룹
  const timelineGroups = useMemo(() => groupByDate(photosWithExif), [photosWithExif]);

  return (
    <div className="st-app">
      {/* ── 사이드바 ── */}
      <aside className="st-sidebar">
        <div className="st-logo">
          <div className="st-logo-icon">
            <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
              <rect x="2" y="4" width="9" height="8" rx="2" fill="white" opacity="0.9" />
              <rect x="13" y="4" width="9" height="5" rx="2" fill="white" opacity="0.6" />
              <rect x="2" y="14" width="9" height="6" rx="2" fill="white" opacity="0.6" />
              <rect x="13" y="11" width="9" height="9" rx="2" fill="white" opacity="0.9" />
              <path d="M17 14.5l1.5 1.5-1.5 1.5" stroke="rgba(59,130,246,0.8)" strokeWidth="1.5" strokeLinecap="round" />
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
                const p = routePaths[f.key];
                if (p) navigateTo(p);
                else setCurrentRoute(f.key);
              }}
            >
              <span className="st-nav-icon">{f.icon}</span>
              <span>{f.key}</span>
            </button>
          ))}

          <div className="st-nav-divider" />
          <p className="st-nav-label">즐겨찾기</p>
          <button className="st-nav-item" onClick={() => setIsFolderModalOpen(true)}>
            <span className="st-nav-icon">＋</span>
            <span>폴더 추가</span>
          </button>
        </nav>

        <button className="st-sidebar-path-btn" onClick={async () => {
          const p = await window.electronAPI.chooseFolder();
          if (p) navigateTo(p);
        }}>
          <span>📂</span> 경로 변경
        </button>
      </aside>

      {/* ── 메인 ── */}
      <main className="st-main">
        {/* 툴바 */}
        <div className="st-toolbar">
          <div className="st-toolbar-left">
            <button className="st-nav-btn" onClick={goBack} disabled={!backStack.length} title="뒤로">‹</button>
            <button className="st-nav-btn" onClick={goForward} disabled={!forwardStack.length} title="앞으로">›</button>
            <button className="st-nav-btn" onClick={() => loadFiles(currentRoute)} title="새로고침">↻</button>
            <div className="st-breadcrumb">
              {breadcrumbs.map((part, i) => {
                const fullPath = breadcrumbs.slice(0, i + 1).join("\\");
                return (
                  <span key={i} className="st-bc-item">
                    {i > 0 && <span className="st-bc-sep">›</span>}
                    <button className="st-bc-btn" onClick={() => navigateTo(fullPath)}>{part}</button>
                  </span>
                );
              })}
            </div>
          </div>

          <div className="st-toolbar-right">
            {/* 뷰 모드 탭 */}
            <div className="st-view-tabs">
              {[
                { id: VIEW_GRID, label: "그리드" },
                { id: VIEW_TIMELINE, label: "타임라인" },
                { id: VIEW_DUPLICATES, label: "중복 찾기" },
                { id: VIEW_ORGANIZE, label: "날짜 정리" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  className={`st-view-tab ${viewMode === tab.id ? "active" : ""}`}
                  onClick={() => setViewMode(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {(viewMode === VIEW_GRID || viewMode === VIEW_TIMELINE) && (
              <>
                {checkedIds.size > 0 && (
                  <span className="st-count-badge">{checkedIds.size}개 선택</span>
                )}
                <button className="st-action-btn" onClick={() => setCheckedIds(new Set(currentPhotos.map((p) => p.id)))}>전체선택</button>
                <button className="st-action-btn" onClick={() => setCheckedIds(new Set())}>선택해제</button>
                <button className="st-action-btn primary" onClick={() => setIsFolderModalOpen(true)}>＋ 새 폴더</button>
              </>
            )}
          </div>
        </div>

        {/* 폴더 제목 (그리드/타임라인에서만) */}
        {(viewMode === VIEW_GRID || viewMode === VIEW_TIMELINE) && (
          <div className="st-folder-title">
            <h2>{currentRoute}</h2>
            <span className="st-file-count">{currentPhotos.length}개 파일</span>
          </div>
        )}

        {/* 뷰 콘텐츠 */}
        {viewMode === VIEW_GRID && (
          <div className="st-content">
            <div className="st-grid-area">
              {currentPhotos.length === 0 ? (
                <div className="st-empty">
                  <div className="st-empty-icon">🖼️</div>
                  <p>이 폴더에 이미지가 없습니다</p>
                </div>
              ) : (
                <div className="st-grid">
                  {photosWithExif.map((photo) => (
                    <PhotoCard
                      key={photo.id}
                      photo={photo}
                      isSelected={selectedId === photo.id}
                      isChecked={checkedIds.has(photo.id)}
                      onSelect={setSelectedId}
                      onToggle={toggleCheck}
                    />
                  ))}
                </div>
              )}
              <BottomBar
                checkedPhotos={checkedPhotos}
                onCopy={handleCopy}
                onDelete={deleteChecked}
                onUncheck={(id) => setCheckedIds((prev) => { const n = new Set(prev); n.delete(id); return n; })}
              />
            </div>
            <DetailPanel
              photo={selectedPhoto}
              isChecked={checkedIds.has(selectedId)}
              onToggle={toggleCheck}
              onShowItem={(p) => window.electronAPI.showItem(p)}
            />
          </div>
        )}

        {viewMode === VIEW_TIMELINE && (
          <div className="st-content">
            <div className="st-grid-area">
              {timelineGroups.length === 0 ? (
                <div className="st-empty">
                  <div className="st-empty-icon">🖼️</div>
                  <p>이 폴더에 이미지가 없습니다</p>
                </div>
              ) : (
                <div className="st-timeline">
                  {timelineGroups.map(([dateLabel, photos]) => (
                    <div key={dateLabel} className="st-tl-group">
                      <div className="st-tl-date-header">
                        <span className="st-tl-date">{dateLabel}</span>
                        <span className="st-tl-count">{photos.length}장</span>
                      </div>
                      <div className="st-grid">
                        {photos.map((photo) => (
                          <PhotoCard
                            key={photo.id}
                            photo={photo}
                            isSelected={selectedId === photo.id}
                            isChecked={checkedIds.has(photo.id)}
                            onSelect={setSelectedId}
                            onToggle={toggleCheck}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <BottomBar
                checkedPhotos={checkedPhotos}
                onCopy={handleCopy}
                onDelete={deleteChecked}
                onUncheck={(id) => setCheckedIds((prev) => { const n = new Set(prev); n.delete(id); return n; })}
              />
            </div>
            <DetailPanel
              photo={selectedPhoto}
              isChecked={checkedIds.has(selectedId)}
              onToggle={toggleCheck}
              onShowItem={(p) => window.electronAPI.showItem(p)}
            />
          </div>
        )}

        {viewMode === VIEW_DUPLICATES && (
          <div className="st-full-view">
            <DuplicatesView dirPath={currentDirPath} />
          </div>
        )}

        {viewMode === VIEW_ORGANIZE && (
          <div className="st-full-view">
            <OrganizeView dirPath={currentDirPath} />
          </div>
        )}
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
              <button className="st-modal-btn cancel" onClick={() => { setIsFolderModalOpen(false); setNewFolderName(""); }}>취소</button>
              <button className="st-modal-btn confirm" onClick={confirmCreateFolder}>생성</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
