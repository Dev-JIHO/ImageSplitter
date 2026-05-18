# Legacy Preview Renderer Backup

Backed up before switching preview rendering to page-slice parity with PDF export.

The previous preview model rendered the entire image once over the global palette,
then drew page guides, glue marks, labels, and margin overlays on top. That made
the browser preview diverge from PDF output because PDF export renders one
`layout.slices` entry per page.

Key legacy behavior:

```ts
context.drawImage(
  image,
  layout.sourceX,
  layout.sourceY,
  layout.sourceWidth,
  layout.sourceHeight,
  layout.imageFrameMm.x,
  layout.imageFrameMm.y,
  layout.imageFrameMm.width,
  layout.imageFrameMm.height,
);
```

This file intentionally keeps only the behavioral reference, not executable code.
