# Printer Margin and Preview Toolbar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add printer hardware margin compensation and move image adjustment controls close to the preview palette.

**Architecture:** Extend `GridPlan` with `printerMarginMm`, use printable page dimensions for target-size grid recommendation, and constrain PDF page slices to each page's printable area. Keep image rotation, zoom, and reset controls in a floating preview toolbar.

**Tech Stack:** React, TypeScript, Vitest, jsPDF, Canvas.

---

### Task 1: Printer Margin Geometry

**Files:**
- Modify: `src/lib/geometry.ts`
- Modify: `src/lib/geometry.test.ts`

- [ ] Add failing tests for target-size recommendation using page printable width/height.
- [ ] Add optional `printerMarginMm` to manual and target inputs.
- [ ] Store `printerMarginMm` on `GridPlan`.
- [ ] Use `page.widthMm - printerMarginMm * 2` and `page.heightMm - printerMarginMm * 2` for printable capacity.

### Task 2: Printable Page Slices

**Files:**
- Modify: `src/lib/posterLayout.ts`
- Modify: `src/lib/posterLayout.test.ts`

- [ ] Add failing tests that compensated slices stay inside page-local printer margins.
- [ ] Restrict slice destination rectangles to the printer printable area.
- [ ] Expose a printer printable frame helper for preview drawing.

### Task 3: UI Controls

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.css`

- [ ] Add printer margin presets and direct numeric input.
- [ ] Pass `printerMarginMm` into grid plan creation.
- [ ] Move rotation, zoom, and reset controls into a preview floating toolbar.
- [ ] Draw printer unprintable area in the preview legend and canvas.

### Task 4: Verification

**Files:**
- No new files.

- [ ] Run `npm test`.
- [ ] Run `npm run build`.
- [ ] Open the local app and verify the controls render.
