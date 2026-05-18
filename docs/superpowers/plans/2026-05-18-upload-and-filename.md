# Upload and Filename Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve image upload with drag-and-drop, visible supported extensions, and more descriptive automatic PDF filenames.

**Architecture:** Add a pure filename helper under `src/lib`, then wire the upload drop zone and export filename through `src/App.tsx`. Keep styling local to `src/App.css`.

**Tech Stack:** React, TypeScript, Vitest, Canvas, jsPDF.

---

### Task 1: Export Filename Helper

**Files:**
- Create: `src/lib/exportFilename.ts`
- Create: `src/lib/exportFilename.test.ts`
- Modify: `src/App.tsx`

- [ ] Add failing tests for manual and target-size filenames.
- [ ] Implement `createExportFilename`.
- [ ] Use the helper from `handleExport`.

### Task 2: Drag-and-Drop Upload

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.css`

- [ ] Add `isDraggingFile` state.
- [ ] Replace the small file input label with a large drop zone.
- [ ] Support click-to-select and drop-to-upload.
- [ ] Show supported extensions in the drop zone.

### Task 3: Verification

**Files:**
- No new files.

- [ ] Run `npm test`.
- [ ] Run `npm run build`.
- [ ] Open the local app and confirm the upload box and extension text render.
