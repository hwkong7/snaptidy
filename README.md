# SnapTidy

SnapTidy는 사진 정리 및 선택 흐름을 돕는 React 기반 UI 프로젝트입니다. 로컬 실행, 프로덕션 빌드, Vercel 배포까지 한 번에 확인할 수 있도록 정리한 문서입니다.

## 프로젝트 소개
- React + Create React App 기반
- Electron 앱 구조도 함께 포함되어 있음
- 웹 화면으로도 실행 가능하며, Vercel로 배포 가능

## 화면 미리보기
<img width="1448" height="1032" alt="Frame 1" src="https://github.com/user-attachments/assets/8c2f9b7f-4314-4823-9256-f4862f85baf3" />

<img width="296" height="191" alt="file_route_selection" src="https://github.com/user-attachments/assets/13ecf645-f4862f85baf3" />

<img width="995" height="577" alt="image" src="https://github.com/user-attachments/assets/e4d6c4f3-f676-49a8-935a-f9ef5860c9a3" />

## 로컬 실행

### 1) 의존성 설치
```bash
npm install
```

### 2) 개발 서버 실행
```bash
npm start
```

브라우저에서 다음 주소로 접속합니다.
- http://localhost:3000

## 프로덕션 빌드

```bash
npm run build
```

빌드 결과는 `build/` 폴더에 생성됩니다.

## Vercel 배포

이 프로젝트는 React 웹 앱으로 Vercel에 배포할 수 있습니다.

### 배포 순서
1. GitHub 저장소에 프로젝트를 업로드합니다.
2. Vercel 대시보드에서 New Project를 선택합니다.
3. 저장소를 연결합니다.
4. 프로젝트를 선택하고 Deploy 합니다.

### 주의사항
- Vercel 배포는 웹 UI 기준입니다.
- Electron 데스크톱 앱 기능은 Vercel에서 직접 실행되지 않을 수 있습니다.
- SPA 라우팅을 위해 [vercel.json](vercel.json) 파일을 포함했습니다.

## 프로젝트 구조
```text
src/
  components/
  layouts/
  pages/
  assets/
  App.js
  index.js
```

## 기술 스택
- React 19
- Create React App
- Electron
- CSS

## 참고
- React: https://reactjs.org/
- Create React App: https://create-react-app.dev/
- Vercel: https://vercel.com/
