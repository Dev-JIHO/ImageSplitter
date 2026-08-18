# 애드센스 도입 준비 — 진행 상황 및 남은 작업

작성일: 2026-08-18. Opus 검토(완성도 리뷰 + 애드센스 도입 방안) 후 진행한 1·2단계 작업의 기록입니다.
다음 세션에서 이어서 진행할 때 이 문서를 참고하세요.

## 완료된 작업

### 1단계 — 기반 안정화
- 행·열 입력 상한(각 30, 전체 100장) 및 완성 크기 입력 상한(10,000mm) 추가 — `src/lib/geometry.ts`, `src/lib/targetSize.ts`
- PDF/테스트 PDF 내보내기 `try/catch` + 한국어 에러 메시지(모달 내부·화면 상단 토스트) — `src/App.tsx`, `src/components/ExportConfirmModal.tsx`
- PDF 생성 진행률 "N/M장" 표시 — `src/lib/pdfExport.ts`, `src/preview/PreviewSidebar.tsx`
- `ErrorBoundary` 추가 — `src/components/ErrorBoundary.tsx`, `src/main.tsx`
- 라이브러리 에러 메시지 영→한 번역, `layoutState.error`가 화면에 표시되지 않던 버그 수정
- 포스터 PDF 풀칠 영역 테두리 누락 수정(미리보기·테스트 PDF와 파리티 일치)
- 주요 CTA·선택 상태·`--c-muted` 색상 대비 WCAG AA 기준으로 조정 — `src/App.css`
- `index.html` 메타 설명·favicon(SVG)·한국어 title·OG 태그 추가

### 2단계 — 콘텐츠·법적 준비
- 정적 콘텐츠 페이지 5개 추가, Vite 멀티페이지 빌드로 구성(React 라우터 없이 순수 HTML, 크롤러가 그대로 읽을 수 있음) — `vite.config.ts`
  - `guide.html` (사용법), `faq.html` (FAQ), `about.html` (소개), `privacy.html` (개인정보처리방침), `terms.html` (이용약관)
- `public/favicon.svg`, `public/robots.txt`, `public/sitemap.xml` 추가
- 앱 좌측 패널 하단에 위 페이지로 가는 푸터 링크 추가 — `src/controls/SettingsPanel.tsx`
- `privacy.html`에 애드센스 도입을 대비한 쿠키·맞춤광고 옵트아웃 안내를 미리 반영해둠

빌드(`npm run build`)·타입체크·유닛테스트(72개)·`vite preview` 브라우저 구동으로 전부 검증 완료.

### 3단계 — 4단계 코드 스캐폴딩 (승인 전 미리 준비)
- `src/lib/adsenseConfig.ts`, `src/lib/adsenseLoader.ts`, `src/components/AdSlot.tsx` 추가 (지연 로드 + `useRef`/`dataset` 중복 push 가드)
- `src/lib/adsenseLoader.test.ts` 추가, 타입체크·전체 유닛테스트(74개) 통과 확인
- 실제 client ID/slot ID는 비어 있어 `AdSlot`은 현재 아무것도 렌더링하지 않음 — 아직 어떤 페이지에도 마운트되어 있지 않음

## 남은 작업 (사용자 확인/결정 필요)

### 1. 문의 이메일 확정
아래 3곳에 `<!-- TODO -->` 주석으로 자리만 잡아뒀습니다. 이메일이 정해지면 문장을 `mailto:` 링크로 교체해야 합니다.
- `about.html:56`
- `privacy.html:90`
- `terms.html:90`

### 2. 커스텀 도메인 연결
현재 `image-splitter-flax.vercel.app`로 하드코딩되어 있습니다. 도메인을 연결하면 아래 7개 파일의 URL을 새 도메인으로 일괄 교체해야 합니다.
- `index.html:12`, `guide.html:12`, `faq.html:12`, `about.html:12`, `privacy.html:9`, `terms.html:9` (각 `<link rel="canonical">`)
- `public/robots.txt:4` (`Sitemap:` 줄)
- `public/sitemap.xml` 전체 6개 `<loc>` 항목

### 3. 애드센스 실제 신청
Google 애드센스 콘솔에서 사용자가 직접 진행해야 하는 단계입니다(에이전트가 대신 신청 불가). 위 1·2번이 끝나고 사이트가 실제로 그 도메인에서 서비스되고 있어야 신청 가능합니다. 신청 전 체크:
- [ ] Search Console에 등록하고 `sitemap.xml` 제출, 색인 확인
- [ ] 커스텀 도메인 연결 완료
- [ ] 문의 이메일 반영 완료

### 4. 승인 후 해야 할 일

코드 스캐폴딩은 미리 준비해뒀습니다 (승인 전이라 실제 광고는 아직 뜨지 않습니다):
- `src/lib/adsenseConfig.ts` — `ADSENSE_CLIENT_ID`, `ADSENSE_SLOTS`(guide/faq/about), `AUTO_ADS_ENABLED = false`. 승인 후 발급받은 값으로 채우면 됨.
- `src/lib/adsenseLoader.ts` — 애드센스 스크립트 지연 로드(중복 삽입 방지) + `pushAdUnit`(요소당 1회만 push, `adsenseLoader.test.ts`로 검증됨).
- `src/components/AdSlot.tsx` — `<ins class="adsbygoogle">` 렌더링 + `useRef` 가드로 StrictMode 이중 렌더 대응. `ADSENSE_CLIENT_ID`가 비어 있으면 아무것도 렌더링하지 않음. `enabled` prop으로 필요 시 로드/리프레시를 일시 중지할 수 있음.

남은 일:
- `ads.txt`를 `public/`에 추가 (애드센스 콘솔에서 발급하는 내용 그대로)
- `adsenseConfig.ts`에 실제 client ID·slot ID 채우기
- `guide.html`/`faq.html`/`about.html`은 현재 순수 정적 HTML(React 마운트 없음)이라, `AdSlot`을 쓰려면 각 페이지에 React 마운트 포인트를 추가하거나, 애드센스가 제공하는 `<ins>` + 스크립트 스니펫을 정적 HTML에 직접 삽입하는 더 단순한 방식 중 하나를 승인 후 결정해서 반영해야 함
- 광고 유닛은 **콘텐츠 페이지(`guide`/`faq`/`about`)에만** 수동으로 삽입 — 도구 화면(`App.tsx`)에는 넣지 않는 것을 권장(`.app-shell`이 `height:100vh; overflow:hidden` 구조라 물리적 공간도 없음)
- 자동 광고(Auto ads)는 애드센스 콘솔에서도 꺼서 수동 유닛만 사용 — 캔버스 위에 임의로 앵커/전면 광고가 삽입되는 것을 방지
- EU/영국 트래픽이 섞인다면 Google 인증 CMP(Funding Choices 등) 연동 검토

## "4단계 — 품질" 항목 진행 상황 (애드센스와 무관, 완성도 항목)

### 완료
- **리포지토리 정리**: `git_status_backup.txt`, `llm_changes.patch`, `reference/`(미사용 AI Studio 스캐폴드) 삭제 (git 스테이징 완료, 커밋은 아직 안 함)
- **의존성 버전 고정**: `package.json`의 모든 `"latest"`를 실제 설치된 버전의 `^` 범위로 교체 (예: `react ^19.2.6`, `vite ^8.2.1`)
- **모달 접근성**: `ExportConfirmModal`/`AdvancedHelpModal`/`Onboarding` 3개 모달에 Escape 닫기 + Tab 포커스 트랩 적용 — `src/hooks/useModalA11y.ts` 신규, chromium 헤드리스 구동으로 동작 확인(포커스 트랩·Escape 닫기 정상, 콘솔 에러 없음)
- **NumberField 키보드 접근**: 스테퍼 버튼 `tabIndex={-1}` 제거(Tab으로 도달 가능) + 입력창에서 ArrowUp/ArrowDown으로 값 증감 가능
- **ESLint 도입**: `eslint.config.js`(flat config) 추가, `npm run lint` 스크립트 추가. `typescript-eslint` + `react-hooks`(rules-of-hooks·exhaustive-deps만 활성화 — 7.x의 `recommended`는 React Compiler 전제 규칙까지 포함해 과함) + `react-refresh`. 전체 통과 확인.
- **컴포넌트 테스트**: `@testing-library/react`(+ jest-dom, user-event) 도입, `vite.config.ts`에 `test.setupFiles` 연결. `NumberField`(키보드 스텝), `useModalA11y`(Escape·포커스 트랩·순환), `useImageUpload`(정상 로드·형식 거부·용량 초과)에 대한 테스트 19개 추가.
- **HEIC 지원**: `heic2any`로 업로드 시 JPEG로 자동 변환 후 기존 파이프라인에 합류 (`src/lib/imageLoader.ts`). 초기 로딩에 영향 없도록 `await import('heic2any')`로 동적 로드(별도 청크, gzip 약 345KB — 실제 HEIC 파일을 선택했을 때만 받음). FAQ·가이드 문구를 "미지원"에서 "지원"으로 갱신.
- **대용량 이미지 업로드 상한**: 파일 50MB, 픽셀수 6,000만 초과 시 한국어 에러 메시지로 거부 (`validateFileSize`/`validateImagePixels`, `imageLoader.test.ts`로 검증).
- **CI 추가**: `.github/workflows/ci.yml` — push/PR마다 `npm ci` → lint → test → build.
- **npm audit**: 5건 중 4건(nanoid/postcss/undici/vite)은 `vite ^8.2.1`, `jsdom ^30.0.1`로 올려 해소. 남은 1건(dompurify, high)은 `jspdf@4.2.1`(최신)이 여전히 취약한 dompurify 범위를 물고 있어 상류(jsPDF) 릴리스 전까지 우리 쪽에서 고칠 수 없음 — 다만 우리 코드는 jsPDF의 `.html()` API(해당 청크를 필요로 하는 기능)를 호출하지 않아 실제 노출 경로는 없음(번들엔 포함되지만 아무 데서도 임포트해 실행하지 않는 죽은 코드 청크).
- **CLAUDE.md 정리**: 폴더 구조 표를 실제 코드에 맞게 갱신(`useModalA11y`/`useOnboarding`/`usePasteImage`/`AdSlot`/`ErrorBoundary` 등 반영, 존재하지 않던 `previewToolbar.ts`/`usePreviewToolbarPosition`/`PreviewToolbar`/`PreviewExportNav` 제거하고 실제 `PreviewSidebar`로 교체), 파일 끝이 잘려있던 문장 복구, `npm run lint`·테스트 설정·CI 안내 추가.

리포지토리 정리·의존성 고정 등은 `git status`에 스테이징/미스테이징 상태로 남아있음 — 커밋은 사용자 요청 시 진행.

### 아직 손대지 않음
- HEIC 변환은 지원 형식 중 하나에만 대응(멀티 이미지 HEIC 파일은 첫 프레임만 사용) — 실사용 케이스가 드물어 우선순위 낮음
- `npm audit`의 dompurify 잔여 1건 (상류 jsPDF 릴리스 대기, 위 설명대로 실사용 경로 없음)
