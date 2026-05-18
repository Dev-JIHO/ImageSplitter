# Image Splitter Design

Date: 2026-05-17

## Goal

Build a browser-only web service that lets users upload a large image, split it across multiple A4 pages, preview the split layout, and export the result as a printable PDF. When the printed A4 pages are joined together, they should recreate the intended large image size.

The first version does not upload images to a server, store user files, require accounts, or keep project history.

## Product Scope

The app supports two sizing modes.

1. Manual grid mode
   - The user selects A4 portrait or landscape.
   - The user enters row and column counts.
   - The app calculates the full physical poster area from that A4 grid.
   - The user-configured outer margin is subtracted from the full grid area.
   - The uploaded image is scaled to fill the remaining printable poster area.
   - The split pages are generated from that filled poster layout.

2. Target size mode
   - The user enters the desired final poster width and height in millimeters.
   - The app evaluates A4 portrait and landscape arrangements.
   - It recommends the orientation, rows, and columns that fit the target size using the fewest A4 sheets.
   - If multiple arrangements use the same number of sheets, the app prefers the one that better matches the target/image aspect ratio.

Both modes support overlap margin. Overlap lets neighboring pages include duplicated image area so printed pages are easier to align and tape together.

## UI

The first version is a single-page app with a control panel and a preview area.

Controls:

- Image upload.
- Sizing mode: manual grid or target size.
- A4 orientation: portrait, landscape, or automatic in target size mode.
- Manual grid inputs: rows and columns.
- Target size inputs: width and height in millimeters.
- Outer margin input in millimeters.
- Overlap input in millimeters.
- Optional print marks: page number and page boundary line.
- PDF export button.

Preview:

- Shows the final poster as one continuous image.
- Draws A4 page boundaries over the poster.
- Shows row and column page numbers.
- Shows outer margin and overlap behavior clearly enough for the user to catch obvious mistakes before exporting.

## Measurement Rules

A4 sizes:

- Portrait: 210mm x 297mm.
- Landscape: 297mm x 210mm.

Manual grid mode:

- Total grid width = page width x columns.
- Total grid height = page height x rows.
- Poster content width = total grid width - left margin - right margin.
- Poster content height = total grid height - top margin - bottom margin.
- The uploaded image is scaled to cover the poster content area.
- If the image aspect ratio differs from the poster content aspect ratio, the first version uses cover behavior: fill the area and crop the overflow evenly from the center.

Overlap:

- Overlap is applied between neighboring pages, not outside the poster boundary.
- A page may include duplicated image area from adjacent pages by the configured overlap amount.
- The exported PDF still has one A4-sized page per grid cell.
- Overlap does not increase the number of pages.

Target size mode:

- For each orientation, the app finds the smallest rows and columns that can cover the requested poster size after accounting for overlap between pages.
- Effective width for columns = page width + (columns - 1) x (page width - overlap).
- Effective height for rows = page height + (rows - 1) x (page height - overlap).
- The chosen arrangement must cover the target width and height.
- The app chooses the arrangement with the fewest pages.
- Ties are resolved by smaller unused area, then by closer aspect ratio.

## Architecture

The app is a static client-side web app. Recommended stack for implementation is Vite, React, TypeScript, Canvas APIs, and a client PDF library such as jsPDF.

Core modules:

- `geometry`: A4 constants, unit calculations, grid sizing, automatic arrangement selection.
- `image-loader`: Reads uploaded images into browser memory and extracts natural dimensions.
- `poster-layout`: Converts user settings into a poster layout and per-page crop rectangles.
- `preview`: Renders the scaled poster preview and page grid overlay.
- `pdf-export`: Creates one A4 PDF page per split sheet and inserts the matching image slice.

No backend API is required for the first version.

## Error Handling

The app validates inputs before rendering or exporting:

- Rows and columns must be positive integers.
- Target width and height must be positive numbers.
- Margin must be non-negative and smaller than the available A4 grid size.
- Overlap must be non-negative and smaller than the selected page width and height.
- PDF export is disabled until a valid image and valid layout exist.

Large images may be downscaled internally for preview to keep the browser responsive. PDF export should use the best practical resolution available in the browser without freezing the UI.

## Testing

Automated tests focus on calculation logic:

- A4 portrait and landscape dimensions.
- Manual grid poster size after margins.
- Manual grid page count.
- Cover scaling and centered crop math.
- Overlap-adjusted page crop rectangles.
- Target size automatic orientation and row/column recommendation.
- Tie-breaking by page count, unused area, and aspect ratio.

Manual browser checks:

- Upload a sample image.
- Verify manual grid preview boundaries.
- Verify target size recommendation.
- Export a PDF and confirm the page count equals rows x columns.
- Check that page numbering and boundary lines appear in the generated PDF.

## Deferred

The first version does not include:

- Server-side image processing.
- User accounts.
- Saved projects.
- Cloud storage.
- Payment or print-shop ordering.
- Advanced color management.
- Bleed/crop mark presets beyond simple page boundaries and page numbers.

## Self Review

- No server dependency is assumed.
- Manual grid mode explicitly uses the full selected A4 grid minus user margin, then scales the image to fill that area.
- Overlap is defined as duplicated area between neighboring pages and does not change page count.
- Target size mode has deterministic page-count and tie-breaking rules.
- The design is scoped to a single implementation plan.
