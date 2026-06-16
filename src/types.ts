import type { GridPlan, Orientation } from './lib/geometry';
import type { CropFocus, PosterLayout } from './lib/posterLayout';
import type { ResolvedTargetSize } from './lib/targetSize';

export type SizingMode = 'manual' | 'target';
export type MobilePanel = 'settings' | 'preview';

/** preparedImage + settings로부터 산출되는 레이아웃 파생 상태. */
export interface LayoutState {
  plan: GridPlan | null;
  layout: PosterLayout | null;
  targetSize: ResolvedTargetSize | null;
  error: string;
}

export interface Settings {
  mode: SizingMode;
  orientation: Orientation;
  rows: number;
  columns: number;
  targetWidthMm: number;
  targetHeightMm: number;
  overlapMm: number;
  printerMarginMm: number;
  exportDpi: number;
  /** 접합 테스트 100mm 사각형의 실측값 (인쇄 배율 보정용) */
  measuredSquareMm: number;
  rotationDeg: number;
  imageScale: number;
  cropFocus: CropFocus;
  showPageNumbers: boolean;
  showPageBoundaries: boolean;
  showGlueMarks: boolean;
}
