# CLAUDE.md

이 파일은 Claude 등 AI 에이전트가 이 저장소에서 작업할 때 참고하는 가이드입니다.

## 프로젝트 한 줄 요약

큰 이미지를 여러 장의 A4로 분할해 인쇄용 PDF로 내보내는 **브라우저 전용** React + TypeScript 앱. 서버/계정/저장 없음, 모든 처리는 클라이언트 Canvas에서 수행.

## 명령어

```bash
npm run dev          # 개발 서버 (vite --host 127.0.0.1)
npm run build        # tsc -b 타입검사 후 vite build
npm run test         # vitest run (1회)
npm run test:watch   # vitest watch
```

단일 테스트 실행: `npx vitest run src/lib/geometry.test.ts`

## 작업 규칙 (중요)

- **코드를 작성·수정하기 전에 반드시 사용자에게 확인을 요청한다.** (한국어로 응답)
- 설명·답변은 한국어로, 간결하고 직접적으로. 불필요한 장황함을 피한다.
- UI 문구는 한국어. `index.html`의 `lang="ko"`를 유지한다.

## 아키텍처

핵심 원칙: **도메인 로직은 `src/lib/`의 순수 함수로, 파생 상태는 `src/hooks/`로, UI는 `src/controls`·`src/preview`·`src/components`로** 분리한다. `App.tsx`는 상태 보관 + 조립만 담당하는 얇은 컴포넌트(~140줄)다.

### 폴더 구조

| 위치 | 책임 |
|------|------|
| `App.tsx` | 상태(`settings` 등) 보관 + 훅 호출 + 패널 조립. `SettingsProvider`로 settings를 하위에 공급 |
| `types.ts` / `constants.ts` | `Settings`·`LayoutState` 등 공유 타입, `initialSettings` 등 상수 |
| `SettingsContext.tsx` | `useSettings()`로 `{ settings, setSettings, updateSetting }` 접근 (prop drilling 제거) |
| `hooks/` | `usePreparedImage`, `usePosterLayout`, `usePrintScale`, `usePreviewToolbarPosition`, `useImageUpload`, `useCanvasZoom`, `useCropDrag` |
| `controls/` | 좌측 설정 패널: `SettingsPanel` + 섹션(SeamTest/ImageUpload/SizingMode/FitAndOverlap/PrintOptions) + `Summary` |
| `preview/` | 우측 미리보기: `PreviewPanel`, `PreviewCanvas`, `PreviewToolbar`, `PreviewExportNav`, `PreviewLegend`, `EmptyPreview`, 순수 그리기 `drawPoster.ts` |
| `components/` | 범용 컴포넌트: `NumberField`, `ExportConfirmModal`, `MobileBottomNav` |
| `lib/` | mm 단위 순수 도메인 로직 (아래 표) + `num.ts`(수치 유틸), `imageSource.ts`(이미지 회전) |

### 데이터 흐름

1. `settings` 상태(`Settings` 인터페이스)가 모든 입력을 보관
2. `useImageUpload` → `loadImageFile` → `loadedImage`
3. `usePreparedImage` (useMemo): 회전 적용된 이미지 소스 생성
4. `usePosterLayout` (useMemo): 모드에 따라
   - target 모드 → `resolveTargetSize` → `recommendTargetGrid`
   - manual 모드 → `createManualGridPlan`
   - 공통 → `createPosterLayout`로 슬라이스 레이아웃 산출 → `LayoutState`
5. `PreviewCanvas` → `drawPoster` (순수 함수): Canvas에 레이아웃 그리기
6. `exportPosterPdf` / `exportSeamTestPdf`: PDF 생성

### lib 모듈 (모두 mm 단위 좌표, 대부분 *.test.ts 동반)

| 모듈 | 책임 |
|------|------|
| `geometry.ts` | A4 크기, `createManualGridPlan`, `recommendTargetGrid`, `GridPlan` 타입 |
| `posterLayout.ts` | `createPosterLayout`(슬라이스), 풀칠 탭(`getPageTabs`), 풀칠 마크(`getGlueMarks`), 활성 페이지 윈도우(`getActivePageWindow`), 프린터 프레임 |
| `targetSize.ts` | 목표 크기 해석: `exact`(가로+세로 그대로) / `width`·`height`(한 변+이미지 비율) |
| `printScale.ts` | 실측 기반 인쇄 배율 보정, 여백 한도 클램프 |
| `pdfExport.ts` | 포스터 PDF 생성, `mmToPixels`, 슬라이스 정렬 |
| `seamTestLayout.ts` / `seamTestPdf.ts` | 접합 테스트(100mm 사각형·눈금·이음새) 패턴·PDF |
| `imageLoader.ts` | File → HTMLImageElement + objectURL |
| `exportFilename.ts` | 행·열·매수·목표크기 기반 파일명 |
| `previewToolbar.ts` | 미리보기 툴바 위치 계산 |
| `renderConstants.ts` | 풀칠 빗금/페이지 번호 등 렌더 상수 |

## 핵심 도메인 개념

- **mm 우선**: 모든 레이아웃 계산은 mm 단위. PDF/Canvas 변환 시점에만 DPI/scale로 픽셀화.
- **A4**: 세로 210×297mm, 가로 297×210mm.
- **overlap(풀칠 영역)**: 이웃 페이지가 겹치는 탭. 세로 이음새는 왼쪽 페이지, 가로 이음새는 위 페이지가 탭을 갖는다. 따라서 최하단·최우측 모서리 장은 탭이 없다.
- **페이지 번호 표시(showLabel)**: 번호는 이미지 밖 빈 공간(풀칠 탭/여백)에만 놓는다. 빈 공
