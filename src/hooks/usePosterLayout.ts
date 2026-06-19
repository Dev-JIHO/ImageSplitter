import { useMemo } from 'react';
import { createManualGridPlan, recommendTargetGrid } from '../lib/geometry';
import type { PreparedImage } from '../lib/imageSource';
import { createPosterLayout } from '../lib/posterLayout';
import { resolveTargetSize } from '../lib/targetSize';
import type { LayoutState, Settings } from '../types';

/** settings + preparedImage로부터 그리드 플랜과 포스터 레이아웃을 산출한다. */
export function usePosterLayout(
  preparedImage: PreparedImage | null,
  settings: Settings,
): LayoutState {
  return useMemo<LayoutState>(() => {
    if (!preparedImage) {
      return { plan: null, layout: null, targetSize: null, error: '' };
    }

    try {
      const targetSize =
        settings.mode === 'target'
          ? resolveTargetSize({
              widthMm: settings.targetWidthMm,
              heightMm: settings.targetHeightMm,
            })
          : null;
      const plan = targetSize
        ? recommendTargetGrid({
            targetWidthMm: targetSize.widthMm,
            targetHeightMm: targetSize.heightMm,
            overlapMm: settings.overlapMm,
            printerMarginMm: settings.printerMarginMm,
            orientation: settings.targetOrientation,
          })
        : createManualGridPlan({
            orientation: settings.orientation,
            rows: settings.rows,
            columns: settings.columns,
            overlapMm: settings.overlapMm,
            printerMarginMm: settings.printerMarginMm,
          });
      // 완성 크기 모드(정확한 크기·가로/세로 기준)는 입력한 완성 크기를 항상
      // 그대로 유지해야 하므로 영역을 고정하는 cover 배치를 쓴다(확대는 영역
      // 안에서 잘라내기로만 작동). 수동(A4 장수) 모드만 비율 유지(contain).
      const layout = createPosterLayout(plan, {
        image: preparedImage.size,
        fitMode: targetSize ? 'cover' : 'fit',
        cropFocus: settings.cropFocus,
        imageScale: settings.imageScale,
        outputFrameMm: targetSize
          ? { width: targetSize.widthMm, height: targetSize.heightMm }
          : undefined,
      });
      return { plan, layout, targetSize, error: '' };
    } catch (error) {
      return {
        plan: null,
        layout: null,
        targetSize: null,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      };
    }
  }, [preparedImage, settings]);
}
