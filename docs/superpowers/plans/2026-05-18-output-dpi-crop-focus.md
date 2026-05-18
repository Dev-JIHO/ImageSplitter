# Output DPI and Crop Focus Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users control PDF output DPI, drag-select the printed crop area in cover mode, and fix number inputs that force cleared values to `0`.

**Architecture:** Keep layout math in `src/lib/posterLayout.ts`, PDF raster sizing in `src/lib/pdfExport.ts`, and UI state/drag handling in `src/App.tsx`. Add tests for pure crop and DPI helpers before production changes.

**Tech Stack:** React, TypeScript, Vitest, jsPDF, canvas.

---

### Task 1: Layout Crop Focus

**Files:**
- Modify: `src/lib/posterLayout.ts`
- Test: `src/lib/posterLayout.test.ts`

- [ ] Add failing tests showing cover crop can move left/right and clamps focus values.
- [ ] Add `CropFocus` input and clamp it to `0..1`.
- [ ] Use focus to position the cover source rectangle while preserving existing centered default behavior.
- [ ] Run `npm test -- src/lib/posterLayout.test.ts`.

### Task 2: PDF DPI Raster Sizing

**Files:**
- Modify: `src/lib/pdfExport.ts`
- Test: `src/lib/pdfExport.test.ts`

- [ ] Add failing tests for `mmToPixels(25.4, dpi)` and minimum pixel clamping.
- [ ] Export `mmToPixels` and add `dpi` to `PdfExportOptions`.
- [ ] Size the scratch canvas from destination millimeters and DPI.
- [ ] Run `npm test -- src/lib/pdfExport.test.ts`.

### Task 3: UI Controls

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.css`

- [ ] Add `exportDpi` and `cropFocus` state.
- [ ] Pass `cropFocus` into layout and `exportDpi` into PDF export.
- [ ] Add DPI segmented control and cover-mode crop reset button.
- [ ] Add canvas pointer drag handling that updates `cropFocus` only in effective cover mode.
- [ ] Update number input to allow an empty draft while editing and normalize leading zeroes.
- [ ] Run `npm run build`.

### Task 4: Verification

**Files:**
- No new files.

- [ ] Run `npm test`.
- [ ] Run `npm run build`.
- [ ] Start Vite and inspect the app in browser if possible.
