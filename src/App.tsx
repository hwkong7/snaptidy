import { useCallback, useMemo, useState } from "react";
import type { ViewMode } from "@/types/photo";
import { useFolderBrowser } from "@/hooks/useFolderBrowser";
import { useSelection } from "@/hooks/useSelection";
import { Sidebar } from "@/components/Sidebar";
import { Toolbar } from "@/components/Toolbar";
import { Button } from "@/components/Button";
import { DetailPanel } from "@/components/DetailPanel";
import { SelectionBar } from "@/components/SelectionBar";
import { NewFolderModal } from "@/components/NewFolderModal";
import { GridView } from "@/features/grid/GridView";
import { TimelineView } from "@/features/timeline/TimelineView";
import { DuplicatesView } from "@/features/duplicates/DuplicatesView";
import { OrganizeView } from "@/features/organize/OrganizeView";

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const selection = useSelection();
  const { clear: clearSelection } = selection;

  // 다른 폴더로 이동하면 선택 상태를 초기화하고 그리드로 돌아간다
  const resetForNewFolder = useCallback(() => {
    setFocusedId(null);
    clearSelection();
    setViewMode("grid");
  }, [clearSelection]);

  const browser = useFolderBrowser(resetForNewFolder);
  const { photos } = browser;

  const focusedPhoto = useMemo(() => photos.find((p) => p.id === focusedId) ?? null, [photos, focusedId]);
  const checkedPhotos = useMemo(() => photos.filter((p) => selection.checkedIds.has(p.id)), [photos, selection.checkedIds]);

  const deleteChecked = async () => {
    if (!checkedPhotos.length || !window.confirm(`${checkedPhotos.length}개를 휴지통으로 이동할까요?`)) return;
    await window.electronAPI.trashFiles(checkedPhotos.map((p) => p.path));
    if (checkedPhotos.some((p) => p.id === focusedId)) setFocusedId(null);
    selection.clear();
    browser.reload();
  };

  const copyChecked = async () => {
    if (!checkedPhotos.length) return;
    const target = await window.electronAPI.chooseFolder();
    if (!target) return;
    const ok = await window.electronAPI.copyFiles(checkedPhotos.map((p) => p.path), target);
    alert(ok ? "복사 완료!" : "복사 중 오류가 발생했습니다.");
  };

  const choosePath = async () => {
    const p = await window.electronAPI.chooseFolder();
    if (p) browser.navigateTo(p);
  };

  const isPhotoView = viewMode === "grid" || viewMode === "timeline";
  const photoViewProps = {
    photos,
    focusedId,
    checkedIds: selection.checkedIds,
    onSelect: setFocusedId,
    onToggle: selection.toggle,
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        folders={browser.folders}
        currentRoute={browser.currentRoute}
        onOpenFolder={browser.openFolder}
        onAddFolder={() => setIsFolderModalOpen(true)}
        onChoosePath={choosePath}
      />

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Toolbar
          dirPath={browser.currentDirPath}
          viewMode={viewMode}
          canGoBack={browser.canGoBack}
          canGoForward={browser.canGoForward}
          onBack={browser.goBack}
          onForward={browser.goForward}
          onReload={browser.reload}
          onNavigate={browser.navigateTo}
          onChangeView={setViewMode}
          actions={
            isPhotoView && (
              <>
                {selection.checkedIds.size > 0 && (
                  <span className="rounded-full bg-blue-50 px-2.5 py-[3px] text-xs font-semibold text-blue-500">
                    {selection.checkedIds.size}개 선택
                  </span>
                )}
                <Button onClick={() => selection.checkAll(photos.map((p) => p.id))}>전체선택</Button>
                <Button onClick={selection.clear}>선택해제</Button>
                <Button variant="primary" onClick={() => setIsFolderModalOpen(true)}>
                  ＋ 새 폴더
                </Button>
              </>
            )
          }
        />

        {isPhotoView ? (
          <>
            <div className="flex shrink-0 items-baseline gap-2.5 px-5 pt-3.5 pb-2.5">
              <h2 className="text-lg font-bold">{browser.currentRoute}</h2>
              <span className="text-[12.5px] font-medium text-slate-400">{photos.length}개 파일</span>
            </div>

            <div className="flex min-h-0 flex-1 overflow-hidden">
              <div className="relative flex flex-1 flex-col overflow-y-auto">
                {viewMode === "grid" ? <GridView {...photoViewProps} /> : <TimelineView {...photoViewProps} />}
                <SelectionBar
                  checkedPhotos={checkedPhotos}
                  onCopy={copyChecked}
                  onDelete={deleteChecked}
                  onUncheck={selection.uncheck}
                />
              </div>
              <DetailPanel
                photo={focusedPhoto}
                isChecked={focusedId !== null && selection.checkedIds.has(focusedId)}
                onToggle={selection.toggle}
                onShowItem={(p) => window.electronAPI.showItem(p)}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto p-6">
            {viewMode === "duplicates" ? (
              <DuplicatesView key={browser.currentDirPath} dirPath={browser.currentDirPath} />
            ) : (
              <OrganizeView key={browser.currentDirPath} dirPath={browser.currentDirPath} onOrganized={browser.reload} />
            )}
          </div>
        )}
      </main>

      {isFolderModalOpen && (
        <NewFolderModal
          parentPath={browser.currentDirPath}
          onClose={() => setIsFolderModalOpen(false)}
          onCreate={browser.createFolder}
        />
      )}
    </div>
  );
}
