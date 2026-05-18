# Remove Outer Margin and Add Glue Marks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove user-facing outer margin behavior and add an optional glue-area mark for overlap regions.

**Architecture:** Treat printer margin as the only non-image safety inset. Keep overlap duplication logic, and add glue mark rectangles as layout metadata so preview and PDF export render the same regions.

**Tech Stack:** React, TypeScript, Vitest, jsPDF, Canvas 2D.

---

### Task 1: Geometry Without Outer Margin

**Files:**
- Modify: `src/lib/geometry.ts`
- Modify: `src/lib/geometry.test.ts`
- Modify: `src/lib/posterLayout.ts`
- Modify: `src/lib/posterLayout.test.ts`

- [ ] Remove `marginMm` from public grid inputs and store `marginMm: 0` only for compatibility.
- [ ] Make `contentWidthMm` and `contentHeightMm` depend on page size, grid count, overlap, and printer margin only.
- [ ] Update poster frame helpers so physical printable frame starts at `0,0`, while image content starts at `printerMarginMm`.
- [ ] Run `npm test -- --run src/lib/geometry.test.ts src/lib/posterLayout.test.ts`.

### Task 2: Glue Marks

**Files:**
- Modify: `src/lib/posterLayout.ts`
- Modify: `src/lib/posterLayout.test.ts`
- Modify: `src/lib/pdfExport.ts`
- Modify: `src/App.tsx`
- Modify: `src/App.css`

- [ ] Add glue mark rectangles for overlap regions that should remain as paste tabs: right edge for non-last columns and bottom edge for non-last rows.
- [ ] Add `showGlueMarks` setting and UI checkbox.
- [ ] Render glue marks in preview as a separate green overlay.
- [ ] Render glue marks in PDF when the toggle is on.
- [ ] Run full tests and build.
