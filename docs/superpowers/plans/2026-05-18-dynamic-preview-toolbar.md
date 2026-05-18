# Dynamic preview toolbar

## Goal

Place the preview adjustment toolbar near the current palette/canvas top-right instead of the preview panel corner, and split center/reset behavior into two explicit controls.

## Tasks

1. Add a tested helper that calculates toolbar position from preview panel and canvas rectangles.
2. Measure preview panel/canvas geometry in `App.tsx` and pass the position into `PreviewToolbar`.
3. Replace the combined center/reset button with separate `center crop` and `reset zoom` buttons.
4. Update toolbar CSS for top-right anchoring and the extra button.
5. Run tests and production build.
