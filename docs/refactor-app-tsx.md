# App.tsx 리팩토링 설계

작성일: 2026-06-15
상태: **설계(제안)** — 코드 변경 전, 사용자 승인 후 단계별 진행

## 1. 문제 정의

`src/App.tsx`는 약 1,485줄 단일 파일에 다음을 모두 담고 있다.

- `Settings` 타입 + 초기값 정의
- 12개 이상의 `useState`/`useRef`와 4개의 `useEffect`
- 파일 로드·내보내기·드래그·휠 등 이벤트 핸들러
- Canvas 미리보기 렌더링(`renderPreview`, ~200줄)
- 하위 컴포넌트(`PreviewToolbar`, `ExportConfirmModal`, `NumberField`, `Summary`, `PreviewLegend`)
- 순수 유틸(`clamp`, `normalizeRotation`, `createRotatedImageSource` 등)

### 증상
- **단일 책임 위반**: 상태·렌더링·도메인 변환·UI가 한 파일에 혼재.
- **테스트 어려움**: `renderPreview`와 핸들러 로직이 컴포넌트에 묶여 단위 테스트 불가. (반면 `src/lib/`는 테스트가 잘 갖춰져 대조적)
- **재사용·탐색성 저하**: 설정 패널 한 섹션을 고치려면 거대 JSX를 스크롤해야 함.
- **리렌더 비용**: 거대한 단일 컴포넌트라 작은 입력 변경도 전체 트리 재평가.

## 2. 목표와 비목표

**목표**
- `App.tsx`를 100~200줄 수준의 조립(composition) 컴포넌트로 축소.
- 도메인 변환/계산 로직을 `src/lib/`(순수, 테스트 가능)로 이동.
- 미리보기 렌더링을 테스트 가능한 순수 그리기 함수 + 얇은 React 래퍼로 분리.
- UI를 의미 단위 컴포넌트로 분할.

**비목표 (이번 범위 아님)**
- 디자인/스타일 변경, 기능 추가, UX 변경.
- 상태관리 라이브러리(Redux/Zustand 등) 도입 — 우선 표준 훅으로 정리.
- `src/lib/` 기존 공개 API 변경.

**불변 조건**: 모든 단계 후 `npm run test`와 `npm run build` 통과. 사용자 동작/출력 결과는 동일(회귀 없음).

## 3. 목표 구조 (제안)

```
src/
  App.tsx                        조립만 담당 (레이아웃 + 패널 배치)
  types.ts                       Settings, SizingMode, MobilePanel 등 공유 타입
  constants.ts                   initialSettings, supportedImageAccept 등

  hooks/
    usePosterLayout.ts           settings+image → {plan, layout, targetSize, error} (현재 layoutState useMemo)
    usePrintScale.ts             인쇄 배율 보정 useMemo
    usePreviewToolbarPosition.ts 툴바/내보내기 위치 useEffect+state
    useImageUpload.ts            파일 로드·objectURL 해제·에러 상태
    useCanvasZoom.ts             휠 확대(non-passive wheel) useEffect
    useCropDrag.ts               포인터 드래그로 cropFocus 갱신

  preview/
    drawPoster.ts                renderPreview의 순수 그리기 로직 (Canvas 인자로 받음)
    drawPoster.test.ts           (신규) 핵심 계산 분리 후 테스트
    PreviewCanvas.tsx            canvas + 포인터/더블클릭 이벤트 래퍼
    PreviewToolbar.tsx
    PreviewLegend.tsx
    PreviewExportNav.tsx
    EmptyPreview.tsx

  controls/
    SettingsPanel.tsx            좌측 패널 조립
    SeamTestSection.tsx
    ImageUploadSection.tsx
    SizingModeSection.tsx        manual/target 분기
    FitAndOverlapSection.tsx
    PrintOptionsSection.tsx
    Summary.tsx

  components/
    NumberField.tsx              범용 숫자 입력 (이미 독립적)
    ExportConfirmModal.tsx
    MobileBottomNav.tsx

  lib/
    imageSource.ts               createRotatedImageSource 이동 + 테스트
    num.ts                       clamp, round, roundNumber, normalizeNumberDraft, normalizeRotation + 테스트
    (기존 모듈 유지)
```

## 4. 상태 관리 방향

현재 `settings` 단일 객체 + `updateSetting`/`setSettings` 패턴은 유지하되, 다음을 고려한다.

- `settings`를 `useReducer`로 전환할지 검토(액션: `setMode`, `rotate`, `resetCrop`, `swapGridAxes` 등 의미 단위). 회전/크롭 리셋이 묶여 일어나는 곳이 많아 reducer가 적합.
- 파생 상태(`preparedImage`, `layoutState`, `printScale`)는 훅으로 추출하되 계산 책임은 그대로 `src/lib/`에 위임.
- prop drilling이 2단계를 넘으면 `SettingsContext`(값 + dispatch) 도입을 검토. 단, 과도한 추상화는 지양.

## 5. 단계별 실행 계획 (각 단계 후 test+build 통과 확인)

1. **순수 유틸 추출**: `clamp/round/roundNumber/normalizeNumberDraft/normalizeRotation` → `lib/num.ts`, `createRotatedImageSource` → `lib/imageSource.ts`. 테스트 추가. (위험 최소, 선행)
2. **타입/상수 분리**: `Settings` 등 → `types.ts`, `initialSettings`·accept 문자열 → `constants.ts`.
3. **프레젠테이션 컴포넌트 분리**: `NumberField`, `ExportConfirmModal`, `PreviewLegend`, `Summary`, `PreviewToolbar`, `MobileBottomNav`를 개별 파일로. (동작 변화 없음)
4. **미리보기 렌더링 분리**: `renderPreview` → `preview/drawPoster.ts`(순수, canvas/ctx 주입) + `PreviewCanvas.tsx` 래퍼. 계산 가능한 부분에 테스트.
5. **파생 상태 훅화**: `usePosterLayout`, `usePrintScale`, `usePreviewToolbarPosition`.
6. **이벤트 훅화**: `useImageUpload`, `useCanvasZoom`, `useCropDrag`.
7. **컨트롤 패널 분할**: `SettingsPanel`과 섹션 컴포넌트들.
8. **(선택) reducer 전환** 및 필요 시 Context 도입.
9. **App.tsx 최종 정리**: 조립만 남도록 축소.

각 단계는 독립 커밋으로 분리해 회귀 추적을 쉽게 한다.

## 6. 검증 전략

- 단계마다 `npm run test`(기존 lib 테스트가 회귀 가드) + `npm run build`(타입).
- 신규 순수 함수(`drawPoster` 계산부, `num`, `imageSource`)에 단위 테스트 추가.
- 수동 스모크 체크리스트: 이미지 업로드 → manual/target 전환 → 회전/확대/드래그 → 풀칠/여백/번호 토글 → PDF 내보내기 → 접합 테스트 PDF → 모바일 패널 전환.
- (권장) 1·4·7단계 같은 큰 분기 후 `engineering:code-review` 스킬로 변경 리뷰.

## 7. 리스크와 완화

| 리스크 | 완화 |
|--------|------|
| `renderPreview`가 Canvas 부수효과와 계산이 섞여 분리 시 회귀 | 계산(좌표/스케일)과 그리기(ctx 호출)를 명확히 가르고, 계산부만 테스트. 픽셀 단위 동작은 스모크로 확인 |
| 훅 추출 중 useEffect 의존성 배열 변동으로 미묘한 타이밍 버그 | 의존성 배열을 원본과 1:1 유지, 한 번에 한 훅만 추출 |
| reducer 전환 범위 과대 | 8단계는 선택. 1~7로도 목표 달성 가능하면 보류 |
| prop drilling 과다 | 2단계 초과 시에만 Context 도입 |

## 8. 예상 효과

- `App.tsx`: ~1,485줄 → ~150줄.
- 테스트 커버리지: 미리보기 계산·유틸·이미지 회전까지 확장.
- 변경 국소성↑(섹션별 파일), 리뷰·온보딩 비용↓.

---
다음 작업으로 1단계(순수 유틸 추출)부터 진행할지, 또는 우선순위를 조정할지 알려주시면 **코드 변경 전 다시 확인 요청** 후 시작하겠습니다.
