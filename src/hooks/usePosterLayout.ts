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
              mode: settings.targetSizeMode,
              widthMm: settings.targetWidthMm,
              heightMm: settings.targetHeightMm,
              image: preparedImage.size,
            })
          : null;
      const plan = targetSize
        ? recommendTargetGrid({
            targetWidthMm: targetSize.widthMm,
            targetHeightMm: targetSize.heightMm,
            overlapMm: settings.overlapMm,
            printerMarginMm: settings.printerMarginMm,
          })
        : createManualGridPlan({
            orientation: settings.orientation,
            rows: settings.rows,
            columns: settings.columns,
            overlapMm: settings.overlapMm,
            printerMarginMm: settings.printerMarginMm,
          });
      const layout = createPosterLayout(plan, {
        image: preparedImage.size,
        // 통합 배치 모델: 항상 contain 기반(fit) + 확대/위치 조정
        fitMode: 'fit',
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
