import type { GridPlan } from './geometry';
import type { ActivePageWindow, PosterLayout } from './posterLayout';
import type { ResolvedTargetSize } from './targetSize';

export interface QaSettingsSnapshotInput {
  appVersion: string;
  exportedAt: string;
  originalName?: string;
  imageSize?: {
    widthPx: number;
    heightPx: number;
  };
  settings: Record<string, unknown>;
  plan: GridPlan;
  layout: PosterLayout;
  activeWindow: ActivePageWindow;
  targetSize: ResolvedTargetSize | null;
  previewCanvas?: {
    widthPx: number;
    heightPx: number;
  };
  userAgent?: string;
}

export function createQaSettingsSnapshot(input: QaSettingsSnapshotInput) {
  return {
    appVersion: input.appVersion,
    exportedAt: input.exportedAt,
    originalName: input.originalName ?? null,
    imageSize: input.imageSize ?? null,
    settings: input.settings,
    calculated: {
      orientation: input.plan.orientation,
      plannedRows: input.plan.rows,
      plannedColumns: input.plan.columns,
      activeRows: input.activeWindow.endRow - input.activeWindow.startRow + 1,
      activeColumns: input.activeWindow.endColumn - input.activeWindow.startColumn + 1,
      exportedPages: input.layout.slices.length,
      plannedPages: input.plan.pageCount,
      pageSizeMm: input.plan.page,
      paletteMm: {
        width: input.activeWindow.widthMm,
        height: input.activeWindow.heightMm,
      },
      fullPlanPaletteMm: {
        width: input.plan.totalWidthMm,
        height: input.plan.totalHeightMm,
      },
      imageFrameMm: input.layout.imageFrameMm,
      outputFrameMm: input.layout.outputFrameMm,
      targetSizeMm: input.targetSize,
    },
    previewCanvas: input.previewCanvas ?? null,
    slices: input.layout.slices.map((slice) => ({
      row: slice.row,
      column: slice.column,
      labelText: slice.labelText,
      destXmm: slice.destXmm,
      destYmm: slice.destYmm,
      destWidthMm: slice.destWidthMm,
      destHeightMm: slice.destHeightMm,
      previewXmm: slice.previewXmm,
      previewYmm: slice.previewYmm,
      previewWidthMm: slice.previewWidthMm,
      previewHeightMm: slice.previewHeightMm,
    })),
    userAgent: input.userAgent ?? null,
  };
}

export function createQaSettingsFilename(originalName?: string) {
  const base = (originalName ?? 'image')
    .replace(/\.[^.]+$/, '')
    .trim()
    .replace(/[^a-zA-Z0-9가-힣_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'image';

  return `${base}-qa-settings.json`;
}
