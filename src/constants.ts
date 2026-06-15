import type { Settings } from './types';

export const initialSettings: Settings = {
  mode: 'manual',
  targetSizeMode: 'height',
  orientation: 'portrait',
  rows: 2,
  columns: 2,
  targetWidthMm: 420,
  targetHeightMm: 594,
  overlapMm: 10,
  // 일반 프린터는 가장자리 3~5mm를 인쇄하지 못하므로 안전한 5mm를 기본값으로 한다.
  printerMarginMm: 5,
  exportDpi: 200,
  measuredSquareMm: 100,
  rotationDeg: 0,
  imageScale: 1,
  cropFocus: { x: 0.5, y: 0.5 },
  showPageNumbers: true,
  showPageBoundaries: true,
  showGlueMarks: true,
};

export const supportedImageAccept =
  'image/jpeg,image/png,image/webp,image/gif,image/avif';
export const supportedImageText = 'JPG, PNG, WebP, GIF, AVIF 지원';
