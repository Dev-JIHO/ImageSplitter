# Image Splitter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a browser-only A4 image splitter that previews page boundaries and exports a multi-page PDF.

**Architecture:** Use a static Vite React app. Keep geometry and layout math in pure TypeScript modules with Vitest coverage; the UI, preview canvas, and PDF export consume those pure layout results.

**Tech Stack:** Vite, React, TypeScript, Vitest, Canvas API, jsPDF.

---

## File Structure

- `package.json`: npm scripts and dependencies.
- `index.html`, `vite.config.ts`, `tsconfig*.json`: Vite/TypeScript setup.
- `src/main.tsx`: React entrypoint.
- `src/App.tsx`: Single-page app state, controls, preview, and PDF action wiring.
- `src/App.css`: Compact responsive app styling.
- `src/lib/geometry.ts`: A4 constants, validation, manual grid sizing, automatic target-size selection.
- `src/lib/posterLayout.ts`: Image scaling, poster dimensions, and per-page crop rectangles.
- `src/lib/pdfExport.ts`: Client-side PDF generation using jsPDF.
- `src/lib/imageLoader.ts`: Browser image upload helpers.
- `src/lib/geometry.test.ts`: Calculation tests.
- `src/lib/posterLayout.test.ts`: Layout and crop tests.

## Task 1: Scaffold Static React App

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/App.css`

- [ ] **Step 1: Add app scaffold**

Create a Vite React TypeScript project with scripts:

```json
{
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "build": "tsc -b && vite build",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@vitejs/plugin-react": "latest",
    "vite": "latest",
    "typescript": "latest",
    "react": "latest",
    "react-dom": "latest",
    "jspdf": "latest"
  },
  "devDependencies": {
    "vitest": "latest",
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "jsdom": "latest"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run: `npm install`

Expected: dependencies install and `package-lock.json` is created.

- [ ] **Step 3: Verify scaffold**

Run: `npm run build`

Expected: TypeScript and Vite build succeed.

## Task 2: Geometry Core

**Files:**
- Create: `src/lib/geometry.test.ts`
- Create: `src/lib/geometry.ts`

- [ ] **Step 1: Write failing tests**

Test A4 dimensions, manual grid margin subtraction, invalid inputs, and automatic target-size recommendation.

Run: `npm test -- src/lib/geometry.test.ts`

Expected before implementation: fail because `geometry.ts` does not exist.

- [ ] **Step 2: Implement geometry module**

Expose:

```ts
export type Orientation = 'portrait' | 'landscape';
export interface PageSize { widthMm: number; heightMm: number; }
export interface ManualGridInput { orientation: Orientation; rows: number; columns: number; marginMm: number; overlapMm: number; }
export interface TargetSizeInput { targetWidthMm: number; targetHeightMm: number; marginMm: number; overlapMm: number; }
export interface GridPlan { orientation: Orientation; rows: number; columns: number; page: PageSize; totalWidthMm: number; totalHeightMm: number; contentWidthMm: number; contentHeightMm: number; pageCount: number; }
export function getA4Size(orientation: Orientation): PageSize;
export function createManualGridPlan(input: ManualGridInput): GridPlan;
export function recommendTargetGrid(input: TargetSizeInput): GridPlan;
```

- [ ] **Step 3: Run tests**

Run: `npm test -- src/lib/geometry.test.ts`

Expected: all geometry tests pass.

## Task 3: Poster Layout Core

**Files:**
- Create: `src/lib/posterLayout.test.ts`
- Create: `src/lib/posterLayout.ts`

- [ ] **Step 1: Write failing tests**

Test cover scaling, centered crop math, page count, and overlap crop rectangles.

Run: `npm test -- src/lib/posterLayout.test.ts`

Expected before implementation: fail because `posterLayout.ts` does not exist.

- [ ] **Step 2: Implement layout module**

Expose:

```ts
export interface ImageSize { widthPx: number; heightPx: number; }
export interface PageSlice { row: number; column: number; pageNumber: number; xPx: number; yPx: number; widthPx: number; heightPx: number; }
export interface PosterLayout { scale: number; sourceX: number; sourceY: number; sourceWidth: number; sourceHeight: number; slices: PageSlice[]; }
export function createPosterLayout(plan: GridPlan, image: ImageSize): PosterLayout;
```

- [ ] **Step 3: Run tests**

Run: `npm test -- src/lib/posterLayout.test.ts`

Expected: all poster layout tests pass.

## Task 4: UI, Preview, and PDF Export

**Files:**
- Create: `src/lib/imageLoader.ts`
- Create: `src/lib/pdfExport.ts`
- Modify: `src/App.tsx`
- Modify: `src/App.css`

- [ ] **Step 1: Wire controls**

Implement upload, mode switch, orientation, row/column, target size, margin, overlap, print marks, calculated summary, and validation messages.

- [ ] **Step 2: Render preview**

Use canvas or positioned overlays to show the poster image, A4 boundaries, page numbers, outer margin, and overlap-relevant page structure.

- [ ] **Step 3: Export PDF**

Use jsPDF with A4 pages in the selected orientation. For each page slice, draw the corresponding image area and optional page boundary/page number marks.

- [ ] **Step 4: Run verification**

Run:

```powershell
npm test
npm run build
```

Expected: tests and production build pass.

## Self Review

- Spec coverage: manual grid, target size recommendation, margin, overlap, preview, PDF export, and browser-only processing are covered.
- Placeholder scan: no implementation step depends on undefined product behavior.
- Type consistency: `GridPlan` from `geometry.ts` is the input contract for `posterLayout.ts` and `pdfExport.ts`.
