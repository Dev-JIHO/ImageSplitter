# Rotation and Image Scale Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add image rotation and user-controlled cover zoom/positioning for both manual and target-size modes.

**Architecture:** Keep crop/zoom math in `src/lib/posterLayout.ts`. Build a rotated canvas in `src/App.tsx` and use it as the source for both preview and PDF export, so printed output matches preview.

**Tech Stack:** React, TypeScript, Vitest, jsPDF, Canvas.

---

### Task 1: Cover Scale Math

**Files:**
- Modify: `src/lib/posterLayout.ts`
- Modify: `src/lib/posterLayout.test.ts`

- [ ] Add failing tests for cover `imageScale` reducing the source crop in both axes.
- [ ] Add `imageScale` to `PosterLayoutInput`, clamped to at least `1`.
- [ ] Apply the scale to cover-mode source rectangles while preserving existing default output.
- [ ] Run `npm test -- src/lib/posterLayout.test.ts`.

### Task 2: Rotation Source

**Files:**
- Modify: `src/App.tsx`

- [ ] Add `rotationDeg` setting with `0 / 90 / 180 / 270`.
- [ ] Create a rotated canvas from the uploaded image and use its dimensions for layout.
- [ ] Pass the rotated canvas to preview and PDF export.

### Task 3: UI Interaction

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.css`

- [ ] Remove forced fit mode in target-size width-only/height-only modes.
- [ ] Add image adjustment controls: rotate left, rotate right, zoom slider, center reset.
- [ ] Keep drag-to-position active in cover mode.
- [ ] Run `npm run build`.

### Task 4: Verification

**Files:**
- No new files.

- [ ] Run `npm test`.
- [ ] Run `npm run build`.
- [ ] Open the local app and verify the new controls are present.
