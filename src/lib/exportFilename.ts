export interface ExportFilenameInput {
  originalName: string;
  rows: number;
  columns: number;
  pageCount: number;
  targetWidthMm?: number;
  targetHeightMm?: number;
}

export function createExportFilename(input: ExportFilenameInput) {
  const baseName = sanitizeBaseName(stripExtension(input.originalName));
  const gridPart = `${input.rows}x${input.columns}`;
  const suffix =
    input.targetWidthMm && input.targetHeightMm
      ? `${roundMm(input.targetWidthMm)}x${roundMm(input.targetHeightMm)}mm`
      : `${input.pageCount}pages`;

  return `${baseName}-A4-${gridPart}-${suffix}.pdf`;
}

function stripExtension(name: string) {
  return name.replace(/\.[^.]+$/, '');
}

function sanitizeBaseName(name: string) {
  const normalized = name
    .trim()
    .replace(/[^a-zA-Z0-9가-힣_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return normalized || 'image';
}

function roundMm(value: number) {
  return Math.round(value);
}
