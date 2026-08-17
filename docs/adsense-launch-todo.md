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
- `ads.txt`를 `public/`에 추가 (애드센스 콘솔에서 발급하는 내용 그대로)
- 광고 유닛은 **콘텐츠 페이지(`guide`/`faq`/`about`)에만** 수동으로 삽입 — 도구 화면(`App.tsx`)에는 넣지 않는 것을 권장(`.app-shell`이 `height:100vh; overflow:hidden` 구조라 물리적 공간도 없음)
- 자동 광고(Auto ads)는 끄고 수동 유닛만 사용 — 캔버스 위에 임의로 앵커/전면 광고가 삽입되는 것을 방지
- 광고 스크립트는 지연 로드(`isExporting` 중에는 로드/리프레시하지 않기), `<StrictMode>` 이중 렌더 대응 위해 `adsbygoogle.push({})` 호출에 `useRef` 가드 필요
- EU/영국 트래픽이 섞인다면 Google 인증 CMP(Funding Choices 등) 연동 검토

## 아직 손대지 않은 나머지 항목 (참고용, 필수 아님)

Opus 검토 보고서에서 "4단계 — 품질" 로 분류했던 항목들로, 애드센스와는 무관하지만 완성도를 더 높이고 싶을 때 참고:
- 컴포넌트/E2E 테스트 부재 (업로드→내보내기 흐름 전체를 검증하는 테스트 없음)
- 모달 Escape 닫기·포커스 트랩, `NumberField` 스테퍼 키보드 접근 불가
- HEIC 이미지 미지원(현재 FAQ에 안내 문구만 추가한 상태, 실제 변환 지원은 안 함)
- 대용량 이미지 업로드 시 크기/픽셀 상한 없음
- 리포지토리 정리 필요(`git`, `git_status_backup.txt`, `llm_changes.patch`, `reference/`), 의존성 버전이 전부 `"latest"`로 고정 안 됨, ESLint/CI 없음
- `CLAUDE.md`/`README.md`의 폴더 구조 설명이 실제 코드와 어긋난 부분 있음(예: `previewToolbar.ts` 등 존재하지 않는 파일 언급, `Onboarding`/`usePasteImage` 등 누락)
