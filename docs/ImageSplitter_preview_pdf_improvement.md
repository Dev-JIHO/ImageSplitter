# ImageSplitter — 미리보기 vs 실제 PDF 괴리 개선 방안

> **대상 프로젝트**: [Dev-JIHO/ImageSplitter](https://github.com/Dev-JIHO/ImageSplitter)  
> **기술 스택**: React + TypeScript + Vite + jsPDF  
> **작성 기준**: `src/App.tsx`, `src/lib/pdfExport.ts`, `src/lib/posterLayout.ts`, `src/lib/geometry.ts` 분석 결과

---

## 목차

1. [배경 및 문제 구조](#1-배경-및-문제-구조)
2. [개선 1 — 렌더링 파이프라인 통일 (이미지 보간 2회 제거)](#2-개선-1--렌더링-파이프라인-통일-이미지-보간-2회-제거)
3. [개선 2 — 슬라이스 경계 픽셀 오차 제거](#3-개선-2--슬라이스-경계-픽셀-오차-제거)
4. [개선 3 — 풀칠 영역 해칭 통일](#4-개선-3--풀칠-영역-해칭-통일)
5. [개선 4 — 페이지 번호 위치 통일](#5-개선-4--페이지-번호-위치-통일)
6. [적용 순서 및 체크리스트](#6-적용-순서-및-체크리스트)

---

## 1. 배경 및 문제 구조

### 1.1 현재 렌더링 구조

미리보기와 PDF 내보내기는 동일한 `PosterLayout` 객체를 공유하지만, **렌더링 파이프라인이 완전히 분리**되어 있다.

```
[원본 이미지]
     │
     ├─── renderPreview() ──────────────────────────────────────────────
     │         Canvas 1개 (totalWidthMm × scale px)
     │         context.drawImage(image, sourceX, sourceY, ...) ← 보간 1회
     │         → 화면 표시
     │
     └─── exportPosterPdf() ────────────────────────────────────────────
               슬라이스별 scratch Canvas 생성
               context.drawImage(image, slice.sourceX, ...) ← 보간 1회
               scratch.toDataURL('image/jpeg', 0.92)         ← JPEG 열화
               pdf.addImage(dataUrl, ...)                    ← 보간 2회
               → PDF 파일
```

이 구조에서 파생되는 괴리는 크게 4가지이며, 아래 개선안에서 순차적으로 다룬다.

### 1.2 괴리 원인 요약

| # | 원인 | 체감 증상 | 영향도 |
|---|------|-----------|--------|
| 1 | 이미지 보간 2회 발생 | 인쇄물 선명도 저하, 미리보기보다 흐림 | 🔴 높음 |
| 2 | `Math.round()` 슬라이스 경계 오차 | 슬라이스 접합부에 흰 줄 또는 겹침 | 🔴 높음 |
| 3 | 풀칠 해칭 간격·클리핑 불일치 | 풀칠 영역 모양이 미리보기와 다름 | 🟡 중간 |
| 4 | 페이지 번호 위치 계산 방식 차이 | 번호 위치 미세 어긋남 | 🟡 중간 |

---

## 2. 개선 1 — 렌더링 파이프라인 통일 (이미지 보간 2회 제거)

### 2.1 문제 분석

**현재 `pdfExport.ts`의 슬라이스별 렌더링:**

```typescript
// src/lib/pdfExport.ts (현재)
options.layout.slices.forEach((slice, index) => {
  // ❌ 슬라이스마다 개별 Canvas 생성 → 보간이 매번 독립적으로 발생
  scratch.width  = mmToPixels(slice.destWidthMm, options.dpi);
  scratch.height = mmToPixels(slice.destHeightMm, options.dpi);

  context.drawImage(
    options.image,
    slice.sourceX, slice.sourceY,         // 원본 픽셀 좌표
    slice.sourceWidth, slice.sourceHeight, // 원본 픽셀 크기
    0, 0,
    scratch.width, scratch.height,         // ← 보간 1회: 원본 → scratch
  );

  const dataUrl = scratch.toDataURL('image/jpeg', 0.92); // ← JPEG 압축 손실
  pdf.addImage(
    dataUrl, 'JPEG',
    slice.destXmm, slice.destYmm,         // mm 단위 배치
    slice.destWidthMm, slice.destHeightMm, // ← 보간 2회: jsPDF 내부 재스케일
  );
});
```

**문제점:**
- `drawImage()`로 원본 → scratch Canvas: **보간 1회**
- `pdf.addImage()`가 내부적으로 mm → PDF 포인트로 재스케일: **보간 2회**
- 슬라이스마다 독립적으로 보간하므로 슬라이스 경계에서 픽셀 값이 불연속

반면 미리보기(`renderPreview`)는 전체 포스터를 하나의 Canvas에 한 번에 그리므로 보간이 1회만 발생한다.

### 2.2 개선 방안 — 전체 포스터 Canvas 방식

PDF 내보내기도 미리보기와 동일하게 **"전체 포스터 Canvas 1개를 고해상도로 먼저 렌더링한 뒤, 슬라이스 영역을 잘라내어 각 페이지에 배치"** 하는 방식으로 변경한다.

#### 2.2.1 `src/lib/pdfExport.ts` 수정

```typescript
// src/lib/pdfExport.ts (개선안)
import { jsPDF } from 'jspdf';
import type { GridPlan } from './geometry';
import { getGlueMarks, type PosterLayout } from './posterLayout';

export interface PdfExportOptions {
  image: CanvasImageSource;
  plan: GridPlan;
  layout: PosterLayout;
  dpi: number;
  showPageNumbers: boolean;
  showPageBoundaries: boolean;
  showGlueMarks: boolean;
  filename?: string;
}

export function exportPosterPdf(options: PdfExportOptions) {
  const { plan, layout, dpi } = options;

  const pdf = new jsPDF({
    orientation: plan.orientation,
    unit: 'mm',
    format: 'a4',
  });

  // ─────────────────────────────────────────────────────────────
  // [개선] STEP 1: 전체 포스터를 고해상도 Canvas에 한 번만 렌더링
  // ─────────────────────────────────────────────────────────────
  const fullCanvas  = document.createElement('canvas');
  const fullContext = fullCanvas.getContext('2d');
  if (!fullContext) throw new Error('Canvas를 사용할 수 없습니다.');

  const fullWidthPx  = mmToPixels(plan.totalWidthMm,  dpi);
  const fullHeightPx = mmToPixels(plan.totalHeightMm, dpi);
  fullCanvas.width  = fullWidthPx;
  fullCanvas.height = fullHeightPx;

  // 흰 배경 초기화
  fullContext.fillStyle = '#ffffff';
  fullContext.fillRect(0, 0, fullWidthPx, fullHeightPx);

  // 이미지를 전체 포스터 좌표계에 맞게 한 번만 그림 (보간 1회)
  fullContext.drawImage(
    options.image,
    layout.sourceX,           // 원본 픽셀 좌표 (크롭 시작점)
    layout.sourceY,
    layout.sourceWidth,       // 원본 픽셀 크기 (크롭 영역)
    layout.sourceHeight,
    mmToPixels(layout.imageFrameMm.x,      dpi),  // 포스터 내 배치 위치
    mmToPixels(layout.imageFrameMm.y,      dpi),
    mmToPixels(layout.imageFrameMm.width,  dpi),  // 포스터 내 배치 크기
    mmToPixels(layout.imageFrameMm.height, dpi),
  );

  // ─────────────────────────────────────────────────────────────
  // [개선] STEP 2: 슬라이스별로 전체 Canvas에서 잘라내어 PDF 페이지에 추가
  // ─────────────────────────────────────────────────────────────
  const sliceCanvas  = document.createElement('canvas');
  const sliceContext = sliceCanvas.getContext('2d');
  if (!sliceContext) throw new Error('Canvas를 사용할 수 없습니다.');

  options.layout.slices.forEach((slice, index) => {
    if (index > 0) {
      pdf.addPage('a4', plan.orientation);
    }

    // floor/ceil로 경계 정렬 (개선 2와 연동)
    const srcRect = alignedSliceRect(slice, dpi);

    sliceCanvas.width  = srcRect.width;
    sliceCanvas.height = srcRect.height;
    sliceContext.clearRect(0, 0, srcRect.width, srcRect.height);

    // 전체 Canvas → slice Canvas (보간 없이 픽셀 복사에 가까움)
    sliceContext.drawImage(
      fullCanvas,
      srcRect.x, srcRect.y, srcRect.width, srcRect.height, // 소스 영역
      0, 0, srcRect.width, srcRect.height,                  // 목적 영역 (1:1)
    );

    // jsPDF addImage: 이미 올바른 크기의 Canvas이므로 내부 재스케일 최소화
    const dataUrl = sliceCanvas.toDataURL('image/jpeg', 0.92);
    pdf.addImage(
      dataUrl, 'JPEG',
      slice.destXmm, slice.destYmm,
      slice.destWidthMm, slice.destHeightMm,
    );

    // 이하 장식 요소 (변경 없음)
    if (options.showPageBoundaries) {
      pdf.setDrawColor(35, 45, 57);
      pdf.setLineWidth(0.2);
      pdf.rect(slice.destXmm, slice.destYmm, slice.destWidthMm, slice.destHeightMm);
    }

    if (options.showGlueMarks) {
      renderGlueMarksToPdf(pdf, options.plan, slice);
    }

    if (options.showPageNumbers) {
      pdf.setFontSize(9);
      pdf.setTextColor(35, 45, 57);
      pdf.text(slice.labelText, slice.labelXmm, slice.labelYmm);
    }
  });

  pdf.save(options.filename ?? 'image-splitter.pdf');
}

/** mm → 픽셀 변환 (Math.round 유지 — 전체 Canvas 크기 결정용) */
export function mmToPixels(mm: number, dpi: number): number {
  return Math.max(1, Math.round((mm / 25.4) * dpi));
}

/** 슬라이스 픽셀 경계를 전체 Canvas 좌표 기준으로 floor/ceil 정렬 */
function alignedSliceRect(
  slice: { previewXmm: number; previewYmm: number; previewWidthMm: number; previewHeightMm: number },
  dpi: number,
): { x: number; y: number; width: number; height: number } {
  const pxPerMm = dpi / 25.4;
  const x1 = Math.floor(slice.previewXmm      * pxPerMm);
  const y1 = Math.floor(slice.previewYmm      * pxPerMm);
  const x2 = Math.ceil((slice.previewXmm + slice.previewWidthMm)  * pxPerMm);
  const y2 = Math.ceil((slice.previewYmm + slice.previewHeightMm) * pxPerMm);
  return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
}
```

### 2.3 기대 효과

- 이미지 보간이 전체 포스터 기준 **1회**로 고정되어 슬라이스 수와 무관하게 화질이 일정해진다.
- 미리보기와 PDF가 동일한 소스 좌표(`layout.sourceX/Y`, `layout.imageFrameMm`)를 사용하므로 **크롭 위치가 픽셀 단위로 일치**한다.

---

## 3. 개선 2 — 슬라이스 경계 픽셀 오차 제거

### 3.1 문제 분석

현재 `mmToPixels`는 `Math.round()`를 사용한다.

```typescript
// 현재
export function mmToPixels(mm: number, dpi: number) {
  return Math.max(1, Math.round((mm / 25.4) * dpi));
}
```

예를 들어 A4 세로(210mm) × 2열, 200 DPI 환경에서:

```
page.widthMm = 210mm
pxPerMm = 200 / 25.4 ≈ 7.874

슬라이스 0 (x=0): previewXmm=0, previewWidthMm=210
  → x1 = Math.round(0 × 7.874)   = 0
  → x2 = Math.round(210 × 7.874) = Math.round(1653.5) = 1654

슬라이스 1 (x=210): previewXmm=210, previewWidthMm=210
  → x1 = Math.round(210 × 7.874) = 1654  ← 정확히 맞음
  → x2 = Math.round(420 × 7.874) = Math.round(3307.0) = 3307

슬라이스 2 (x=420): previewXmm=420, previewWidthMm=210
  → x1 = Math.round(420 × 7.874) = Math.round(3307.0) = 3307 ← 맞음
```

위 예시에서는 우연히 맞지만, 비정수 pxPerMm 값과 특정 mm 조합에서는 `Math.round()` 결과가 ±1px 어긋날 수 있다. 특히 **겹침 여백(overlapMm)이 적용된 경우** 더 빈번하게 발생한다.

### 3.2 개선 방안 — `alignedSliceRect` 함수 적용

개선 1에서 도입한 `alignedSliceRect()`가 이 문제를 함께 해결한다.

```typescript
// 핵심 원리: 슬라이스 경계를 절대 좌표 기준 floor/ceil로 계산
function alignedSliceRect(slice, dpi) {
  const pxPerMm = dpi / 25.4;

  // ✅ 각 슬라이스의 시작점은 floor, 끝점은 ceil
  //    → 인접 슬라이스 간에 틈 없이 연속되도록 보장
  const x1 = Math.floor(slice.previewXmm * pxPerMm);
  const y1 = Math.floor(slice.previewYmm * pxPerMm);
  const x2 = Math.ceil((slice.previewXmm + slice.previewWidthMm) * pxPerMm);
  const y2 = Math.ceil((slice.previewYmm + slice.previewHeightMm) * pxPerMm);

  return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
}
```

**원리:** `floor(A)` → `ceil(A + B)` 방식은 두 인접 슬라이스가 정확히 맞닿도록 보장한다.

```
슬라이스 0 끝: ceil((0 + 210) × 7.874) = ceil(1653.54) = 1654
슬라이스 1 시작: floor(210 × 7.874)    = floor(1653.54) = 1653
                                                          ↑ 1px 중첩
```

1px 중첩은 틈(흰 줄)보다 훨씬 낫다. 만약 완벽한 1:1 정렬이 필요하다면 아래와 같이 누적 좌표 방식을 쓸 수 있다.

```typescript
// 대안: 누적 픽셀 좌표 방식 (틈도 중첩도 없음)
function buildPixelGrid(plan: GridPlan, dpi: number) {
  const pxPerMm = dpi / 25.4;
  const colBoundaries = [0];
  const rowBoundaries = [0];

  for (let c = 1; c <= plan.columns; c++) {
    colBoundaries.push(Math.round(c * plan.page.widthMm * pxPerMm));
  }
  for (let r = 1; r <= plan.rows; r++) {
    rowBoundaries.push(Math.round(r * plan.page.heightMm * pxPerMm));
  }

  return { colBoundaries, rowBoundaries };
}
// 슬라이스 사용 시:
// x1 = colBoundaries[slice.column]
// x2 = colBoundaries[slice.column + 1]
```

### 3.3 기대 효과

- 4×4 이상 분할 시에도 슬라이스 접합부에서 흰 줄 또는 픽셀 이중 표시가 발생하지 않는다.
- 출력물을 이어 붙였을 때 이미지가 끊기지 않는다.

---

## 4. 개선 3 — 풀칠 영역 해칭 통일

### 4.1 문제 분석

미리보기와 PDF의 풀칠 영역 렌더링이 세 가지 측면에서 다르다.

| 항목 | 미리보기 (`App.tsx`) | PDF (`pdfExport.ts`) |
|------|---------------------|----------------------|
| 해칭 간격 | `hatchSpacing = 2.8`(px/mm 혼용) | `hatchSpacing = 3`(mm) |
| 경계 클리핑 | `context.clip()` 사용 | 수동 좌표 계산으로 클리핑 |
| 배경 색상 | `rgba(0,0,0,0.02)` 반투명 | `RGB(245,245,245)` 불투명 |
| 테두리 두께 | `max(1/scale, 0.4)` / `0.7` | `0.10` / `0.25` lineWidth |

특히 **해칭 간격 차이(2.8 vs 3)**는 시각적으로 명확히 다르게 보인다. PDF의 클리핑 수동 계산은 경계 근처 해칭선이 미리보기와 달리 잘리지 않는 경우가 있다.

### 4.2 개선 방안

#### 4.2.1 공유 상수 파일 생성

```typescript
// src/lib/constants.ts (신규 파일)
/** 풀칠 해칭선 간격 (mm 단위, 미리보기·PDF 공유) */
export const GLUE_HATCH_SPACING_MM = 3;

/** PDF 풀칠 테두리 선 두께 */
export const GLUE_BORDER_LINE_WIDTH = 0.25;

/** PDF 풀칠 해칭선 두께 */
export const GLUE_HATCH_LINE_WIDTH = 0.10;
```

#### 4.2.2 미리보기 해칭 간격 수정 (`App.tsx`)

```typescript
// App.tsx — renderPreview 함수 내 (현재)
const hatchSpacing = 2.8;   // ❌ 단위 불명확, PDF와 다름

// App.tsx — renderPreview 함수 내 (개선)
import { GLUE_HATCH_SPACING_MM } from './lib/constants';

// scale은 mm → px 변환 배율이므로, mm 간격을 px로 변환
const hatchSpacing = GLUE_HATCH_SPACING_MM; // scale 좌표계이므로 mm 단위 그대로 사용
```

> **참고:** `renderPreview`의 `context.save(); context.scale(scale, scale)` 블록 내부에서는 단위가 이미 mm이므로 `GLUE_HATCH_SPACING_MM`을 직접 쓰면 된다.

#### 4.2.3 PDF 풀칠 렌더링 함수 분리 및 클리핑 적용 (`pdfExport.ts`)

```typescript
// src/lib/pdfExport.ts
import { GLUE_HATCH_SPACING_MM, GLUE_BORDER_LINE_WIDTH, GLUE_HATCH_LINE_WIDTH } from './constants';

function renderGlueMarksToPdf(
  pdf: jsPDF,
  plan: GridPlan,
  slice: { row: number; column: number },
) {
  getGlueMarks(plan)
    .filter((mark) => mark.row === slice.row && mark.column === slice.column)
    .forEach((mark) => {
      // 배경 fill
      pdf.setFillColor(245, 245, 245);
      pdf.rect(mark.xMm, mark.yMm, mark.widthMm, mark.heightMm, 'F');

      // 해칭선 — 클리핑 영역 내에서만 그리기
      pdf.setLineWidth(GLUE_HATCH_LINE_WIDTH);
      pdf.setDrawColor(120, 120, 120);

      const { xMm, yMm, widthMm, heightMm } = mark;
      const hatch = GLUE_HATCH_SPACING_MM;

      // jsPDF에는 native clip API가 없으므로 선의 시작·끝 좌표를
      // mark 경계에 clamp하여 클리핑을 수동 구현
      for (let offset = -heightMm; offset < widthMm; offset += hatch) {
        // 해칭선: 좌하→우상 방향
        let x1 = xMm + offset;
        let y1 = yMm;
        let x2 = x1 + heightMm;
        let y2 = yMm + heightMm;

        // 좌측 경계 clamp
        if (x1 < xMm) {
          y1 += (xMm - x1) * (heightMm / heightMm); // 기울기 보정
          y1 = yMm + (xMm - (xMm + offset));         // 단순화
          x1 = xMm;
        }
        // 우측 경계 clamp
        if (x2 > xMm + widthMm) {
          const excess = x2 - (xMm + widthMm);
          y2 -= excess;
          x2 = xMm + widthMm;
        }
        // 하단 경계 clamp
        if (y2 > yMm + heightMm) {
          const excess = y2 - (yMm + heightMm);
          x2 -= excess;
          y2 = yMm + heightMm;
        }

        if (x2 > x1 && y2 > y1) {
          pdf.line(x1, y1, x2, y2);
        }
      }

      // 테두리
      pdf.setLineWidth(GLUE_BORDER_LINE_WIDTH);
      pdf.setDrawColor(120, 120, 120);
      pdf.rect(mark.xMm, mark.yMm, mark.widthMm, mark.heightMm);
    });
}
```

> **대안:** jsPDF 2.x 이상에서는 `pdf.saveGraphicsState()` / `pdf.restoreGraphicsState()` 와 함께 클리핑 패스를 사용할 수 있다. 라이브러리 버전을 확인 후 네이티브 클리핑 사용을 권장한다.

```typescript
// jsPDF 네이티브 클리핑 적용 (버전 지원 시)
pdf.saveGraphicsState();
pdf.rect(mark.xMm, mark.yMm, mark.widthMm, mark.heightMm); // 클리핑 패스 정의
// pdf.clip(); ← jsPDF API에 따라 다름, 공식 문서 확인 필요
for (let offset = -heightMm; offset < widthMm; offset += GLUE_HATCH_SPACING_MM) {
  pdf.line(mark.xMm + offset, mark.yMm, mark.xMm + offset + heightMm, mark.yMm + heightMm);
}
pdf.restoreGraphicsState();
```

### 4.3 기대 효과

- 미리보기와 PDF에서 풀칠 영역의 해칭 밀도가 동일하게 보인다.
- 경계 근처 해칭선이 동일하게 클리핑된다.
- 상수를 한 곳(`constants.ts`)에서 관리하므로 향후 디자인 변경 시 한 번만 수정하면 된다.

---

## 5. 개선 4 — 페이지 번호 위치 통일

### 5.1 문제 분석

**미리보기 (`App.tsx` — `renderPreview`):**

```typescript
// 현재: scale 역변환으로 픽셀 좌표를 어림 계산
context.font = `${Math.max(11 / scale, 7)}px sans-serif`;
context.fillStyle = 'rgba(20, 31, 45, 0.82)';
for (let row = 0; row < plan.rows; row++) {
  for (let column = 0; column < plan.columns; column++) {
    context.fillText(
      `${row + 1}-${column + 1}`,
      column * plan.page.widthMm + 5 / scale,   // ← scale 역변환 어림
      row    * plan.page.heightMm + 15 / scale,  // ← scale 역변환 어림
    );
  }
}
```

**PDF (`pdfExport.ts`):**

```typescript
// PosterLayout의 slice.labelXmm, labelYmm 사용
pdf.setFontSize(9);
pdf.text(slice.labelText, slice.labelXmm, slice.labelYmm);
```

미리보기는 `PosterLayout`의 `slice.labelXmm/labelYmm`을 쓰지 않고 직접 계산한다. 반면 PDF는 `createPageLabel()`이 계산한 정확한 위치를 사용한다. 두 값이 다를 수 있으며 특히 **겹침 여백이 크거나 이미지가 페이지 일부에만 걸칠 때** 차이가 벌어진다.

### 5.2 개선 방안 — 미리보기에서도 `slice.labelXmm/labelYmm` 사용

```typescript
// App.tsx — renderPreview 함수 (개선)
// 기존 이중 for 루프 제거, layout.slices 순회로 변경

if (settings.showPageNumbers) {
  context.fillStyle = 'rgba(20, 31, 45, 0.82)';

  layout.slices.forEach((slice) => {
    // 폰트 크기: PDF의 9pt를 mm로 환산 (1pt = 0.353mm)
    // 미리보기 scale 좌표계이므로 mm 단위 그대로 사용
    const fontSizeMm = 9 * 0.353; // ≈ 3.2mm
    context.font = `${Math.max(fontSizeMm, 2.5)}px sans-serif`; // scale 좌표계 내 mm

    context.fillText(
      slice.labelText,
      slice.labelXmm,  // ✅ posterLayout이 계산한 정확한 위치
      slice.labelYmm,
    );
  });
}
```

> **참고:** `renderPreview` 내부의 `context.save(); context.scale(scale, scale)` 블록 안에서는 px 좌표가 아닌 mm 단위로 동작한다. 따라서 `slice.labelXmm/labelYmm`을 그대로 사용하면 올바른 위치에 렌더링된다. 폰트 크기도 mm 단위로 환산해야 한다.

### 5.3 부가 개선 — 폰트 크기 공유 상수

```typescript
// src/lib/constants.ts (추가)
/** 페이지 번호 폰트 크기 (PDF는 포인트, 미리보기는 mm로 환산) */
export const PAGE_NUMBER_FONT_SIZE_PT = 9;
/** 1포인트 = 0.3528mm */
export const PT_TO_MM = 0.3528;
```

```typescript
// renderPreview 내 사용
import { PAGE_NUMBER_FONT_SIZE_PT, PT_TO_MM } from './lib/constants';

const fontSizeMm = PAGE_NUMBER_FONT_SIZE_PT * PT_TO_MM; // 3.175mm
context.font = `500 ${fontSizeMm}px sans-serif`;

// pdf 내 사용 (기존과 동일, 단 상수로 관리)
pdf.setFontSize(PAGE_NUMBER_FONT_SIZE_PT);
```

### 5.4 기대 효과

- 모든 레이아웃 조건(겹침 여백 유무, 이미지 부분 걸침 등)에서 페이지 번호 위치가 미리보기와 PDF 사이에 정확히 일치한다.
- `createPageLabel()` 로직을 변경해도 미리보기에 자동으로 반영된다.

---

## 6. 적용 순서 및 체크리스트

### 6.1 권장 적용 순서

화질과 경계 정렬이 사용자 체감에 가장 큰 영향을 주므로 다음 순서로 적용한다.

```
Phase 1 (필수, 2~4시간)
  ├─ 개선 2: alignedSliceRect 함수 추가 (독립적, 의존성 없음)
  └─ 개선 1: 전체 Canvas 방식으로 exportPosterPdf 재작성
              └─ alignedSliceRect 내부 사용

Phase 2 (권장, 1~2시간)
  ├─ constants.ts 파일 생성
  ├─ 개선 3: 해칭 간격 상수화 + renderGlueMarksToPdf 함수 분리
  └─ 개선 4: renderPreview의 페이지 번호를 slice 기반으로 변경
```

### 6.2 검증 체크리스트

개선 적용 후 아래 시나리오별로 미리보기와 PDF를 나란히 비교한다.

#### 이미지 화질
- [ ] 고해상도 사진(4000px 이상)을 업로드하여 2×2 분할 후 PDF 인쇄 시 선명도 확인
- [ ] 200 DPI vs 300 DPI 전환 시 PDF 화질 차이가 기대에 맞는지 확인

#### 슬라이스 경계
- [ ] 3×3 이상 분할 후 PDF 출력물을 이어 붙여 슬라이스 접합부 흰 줄 없음 확인
- [ ] 겹침 여백 0mm 조건에서 접합부 확인
- [ ] 겹침 여백 10mm 조건에서 접합부 확인

#### 풀칠 영역
- [ ] 미리보기와 PDF의 풀칠 해칭 밀도 육안 비교
- [ ] 풀칠 영역 경계 근처 해칭선 클리핑 여부 확인

#### 페이지 번호
- [ ] 겹침 여백 0mm / 10mm 조건에서 번호 위치 비교
- [ ] `fitMode: 'fit'`(이미지 안 자르기) 조건에서 이미지가 페이지 일부에만 걸칠 때 번호 위치 확인
- [ ] 프린터 여백 보정 5mm 조건에서 번호 위치 확인

#### 회귀 테스트
- [ ] 기존 vitest 테스트 (`pnpm test`) 전체 통과 확인
- [ ] `mmToPixels` 함수 단위 테스트 추가 (입력: 210mm, 200dpi → 기대값: 1654)
- [ ] `alignedSliceRect` 함수 단위 테스트 추가 (2열 210mm 조건에서 경계 연속성 검증)

### 6.3 향후 고려 사항

- **PDF Canvas 메모리**: 전체 포스터 Canvas를 고해상도로 생성하면 4×4, 300 DPI 조건에서 최대 수백 MB의 메모리를 차지할 수 있다. `OffscreenCanvas` + `transferToImageBitmap()` 도입을 검토한다.
- **Web Worker 분리**: PDF 생성을 메인 스레드에서 실행하면 브라우저가 멈출 수 있다. `exportPosterPdf`를 Worker로 이전하고 `OffscreenCanvas`를 사용하면 UX가 개선된다.
- **PNG 옵션 추가**: 현재 JPEG 0.92 고정이므로, 투명도가 필요한 이미지(PNG)나 무손실이 필요한 경우를 위해 `toDataURL('image/png')` 옵션을 선택 가능하게 노출하는 것을 고려한다.
