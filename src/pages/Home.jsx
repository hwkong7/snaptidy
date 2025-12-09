// src/pages/Home.jsx
import React, { useState, useRef, useMemo } from "react";
import Header from "../components/Header/Header";
import PhotoGrid from "../components/PhotoGrid/PhotoGrid";
import BottomBar from "../layouts/BottomBar";

const INITIAL_ROUTES = ["바탕화면", "다운로드", "사진", "문서"];

function createRouteMap(routes) {
  const map = {};
  routes.forEach((r) => (map[r] = []));
  map["휴지통"] = [];
  return map;
}

export default function Home() {
  const [routes, setRoutes] = useState(INITIAL_ROUTES);
  const [currentRoute, setCurrentRoute] = useState("다운로드");
  const [photosByRoute, setPhotosByRoute] = useState(createRouteMap(INITIAL_ROUTES));
  const fileInput = useRef(null);

  const currentPhotos = photosByRoute[currentRoute];

  const selectedCount = useMemo(
    () => currentPhotos.filter((p) => p.selected).length,
    [currentPhotos]
  );

  const addFiles = (fileList) => {
    const newFiles = Array.from(fileList).map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      name: file.name,
      url: URL.createObjectURL(file),
      selected: false,
    }));

    setPhotosByRoute((prev) => ({
      ...prev,
      [currentRoute]: [...prev[currentRoute], ...newFiles],
    }));
  };

  const toggleSelect = (id) => {
    setPhotosByRoute((prev) => ({
      ...prev,
      [currentRoute]: prev[currentRoute].map((p) =>
        p.id === id ? { ...p, selected: !p.selected } : p
      ),
    }));
  };

  const selectAll = () => {
    setPhotosByRoute((prev) => ({
      ...prev,
      [currentRoute]: prev[currentRoute].map((p) => ({ ...p, selected: true })),
    }));
  };

  const clearSelection = () => {
    setPhotosByRoute((prev) => ({
      ...prev,
      [currentRoute]: prev[currentRoute].map((p) => ({ ...p, selected: false })),
    }));
  };

  const deleteSelected = () => {
    setPhotosByRoute((prev) => {
      const alive = prev[currentRoute].filter((p) => !p.selected);
      const removed = prev[currentRoute].filter((p) => p.selected);

      return {
        ...prev,
        [currentRoute]: alive,
        휴지통: [...prev.휴지통, ...removed],
      };
    });
  };

  const handleCreateFolder = () => {
    const name = prompt("새 폴더 이름을 입력하세요");
    if (!name) return;

    if (routes.includes(name)) {
      alert("이미 같은 폴더가 존재합니다.");
      return;
    }

    setRoutes([...routes, name]);
    setPhotosByRoute((prev) => ({ ...prev, [name]: [] }));
  };

  const handleUploadClick = () => {
    fileInput.current.click();
  };

  const handleFileInput = (e) => {
    if (e.target.files.length) {
      addFiles(e.target.files);
      e.target.value = "";
    }
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
        ref={fileInput}
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
