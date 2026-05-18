# Preview PDF Parity Without Full Canvas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply preview/PDF parity improvements except the memory-heavy full poster canvas export.

**Architecture:** Keep PDF export slice-based, but align slice raster dimensions from absolute layout coordinates. Render preview image content from the same `layout.slices` metadata as PDF export. Share constants for glue marks and page labels.

**Tech Stack:** React, TypeScript, Canvas 2D, jsPDF, Vitest.

---

### Task 1: Shared Constants And Pixel Rects

**Files:**
- Create: `src/lib/renderConstants.ts`
- Modify: `src/lib/pdfExport.ts`
- Test: `src/lib/pdfExport.test.ts`

- [ ] Add shared constants for glue hatching and page-number font size.
- [ ] Add `alignedSliceRect` to calculate slice pixel bounds from absolute preview coordinates.
- [ ] Use `alignedSliceRect` dimensions for PDF scratch canvases.

### Task 2: Preview Uses Layout Slice Metadata

**Files:**
- Modify: `src/lib/posterLayout.ts`
- Test: `src/lib/posterLayout.test.ts`
- Modify: `src/App.tsx`

- [ ] Add helper to convert page-local label positions to preview-global positions.
- [ ] Draw preview image content from `layout.slices`, not one whole-image draw.
- [ ] Draw preview page numbers from `layout.slices`.

### Task 3: Glue Mark Rendering Review

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/lib/pdfExport.ts`

- [ ] Reuse shared hatch spacing and line widths in preview and PDF.
- [ ] Keep preview clipping with Canvas `clip()`.
- [ ] Keep PDF manual clipping, but move it into a dedicated function.
