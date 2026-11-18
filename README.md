# SnapTidy

SnapTidy는 내 컴퓨터에 쌓인 사진을 빠르게 훑어보고, 중복을 찾고, 날짜별로 정리해 주는 **Windows 데스크톱 앱**입니다.

## 주요 기능
- 🖼️ **그리드 보기**: 폴더 안의 사진을 썸네일로 보고, 여러 장을 골라 복사하거나 휴지통으로 보낼 수 있습니다.
- 🕒 **타임라인**: 촬영일(EXIF, 없으면 수정일) 기준으로 날짜별로 묶어서 보여줍니다.
- 🔍 **중복 찾기**: 파일 내용(MD5 해시)이 같은 사진을 묶어서 보여줍니다.
- 📅 **날짜 정리**: 사진을 `연도/월` 폴더로 자동으로 옮깁니다. 옮기기 전에 미리보기로 먼저 확인할 수 있습니다.

## 화면 미리보기
<img width="1448" height="1032" alt="Frame 1" src="https://github.com/user-attachments/assets/8c2f9b7f-4314-4823-9256-f4862f85baf3" />

<img width="296" height="191" alt="file_route_selection" src="https://github.com/user-attachments/assets/13ecf645-f4862f85baf3" />

<img width="995" height="577" alt="image" src="https://github.com/user-attachments/assets/e4d6c4f3-f676-49a8-935a-f9ef5860c9a3" />

## 실행 방법

패키지 매니저는 [pnpm](https://pnpm.io)을 씁니다. 설치되어 있지 않다면 `npm install -g pnpm`으로 설치하세요.

```bash
pnpm install    # 의존성 설치
pnpm start      # 개발 모드로 앱 실행 (코드를 고치면 바로 반영)
```

| 명령어 | 설명 |
|---|---|
| `pnpm start` / `pnpm dev` | 개발 모드로 실행 |
| `pnpm run typecheck` | TypeScript 타입 검사 |
| `pnpm run build` | `out/` 폴더에 빌드 |
| `pnpm run preview` | 빌드 결과를 앱으로 실행 |
| `pnpm run dist` | Windows 설치 파일 생성 → `dist/SnapTidy Setup x.y.z.exe` |

> VS Code 터미널 등에서 `ELECTRON_RUN_AS_NODE=1` 환경변수가 설정돼 있으면 Electron이 Node처럼 실행돼 앱이 뜨지 않습니다. 이럴 때는 이 변수를 지우고 실행하세요.

## 브랜치와 배포

- 작업은 `feature/*`, `fix/*`, `refactor/*`, `chore/*` 브랜치에서 하고 `develop`으로 PR을 올립니다. `main`에는 `develop`이 안정되었을 때만 반영합니다.
- PR을 올리면 GitHub Actions가 타입 검사와 빌드를 자동으로 확인합니다 (`.github/workflows/ci.yml`).
- 새 버전을 배포할 때는 `package.json`의 `version`을 올린 뒤 같은 이름의 태그를 푸시합니다.

  ```bash
  git tag v0.2.0
  git push origin v0.2.0
  ```

  Windows 설치 파일이 빌드되어 [Releases](../../releases)에 자동으로 올라갑니다 (`.github/workflows/release.yml`).
- 코드 서명을 하지 않은 설치 파일이라 처음 실행할 때 Windows SmartScreen 경고가 나올 수 있습니다. "추가 정보 → 실행"을 누르면 설치됩니다.

## 프로젝트 구조
```text
electron/
  main/
    index.ts          # 창 생성, 앱 시작
    protocol.ts       # snaptidy:// 로컬 이미지 프로토콜
    ipc/
      files.ts        # 폴더 읽기, 복사, 이동, 삭제
      analysis.ts     # 중복 찾기, EXIF 날짜, 날짜별 정리
    lib/images.ts     # 이미지 판별, EXIF 읽기
  preload/index.ts    # window.electronAPI 노출
shared/
  types.ts            # main ↔ 화면이 같이 쓰는 타입, IPC 채널 이름
src/
  App.tsx             # 화면 전체 배치
  components/         # Sidebar, Toolbar, PhotoCard, DetailPanel …
  features/           # 보기 모드별 화면 (grid, timeline, duplicates, organize)
  hooks/              # useFolderBrowser, useSelection
  lib/                # 포맷·타임라인 유틸
  types/              # 화면 전용 타입
resources/icon.png    # 앱 아이콘
electron.vite.config.ts
electron-builder.yml  # 설치 파일 설정
```

## 보안
- 사진은 `file://` 대신 앱 전용 `snaptidy://` 프로토콜로 불러오고, 이미지 확장자만 허용합니다.
- `contextIsolation`과 `webSecurity`를 켜 두었고, 화면 쪽은 `window.electronAPI`로만 파일 시스템에 접근합니다.
- `index.html`에 Content-Security-Policy를 적용합니다 (`electron.vite.config.ts`).

## 기술 스택
- Electron 39
- React 19 + TypeScript
- Vite 8 (electron-vite)
- Tailwind CSS 4
- exifr (EXIF 읽기), Pretendard (글꼴)
- electron-builder (Windows 설치 파일)
