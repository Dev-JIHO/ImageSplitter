import { useMemo } from 'react';
import { getA4Size, type GridPlan } from '../lib/geometry';
import { resolvePrintScale, type ResolvedPrintScale } from '../lib/printScale';
import type { Settings } from '../types';

/** 실측값 기반 인쇄 배율 보정. 여백 한도를 넘으면 클램프되고 경고 플래그가 선다. */
export function usePrintScale(
  settings: Settings,
  plan: GridPlan | null,
): ResolvedPrintScale {
  return useMemo(
    () =>
      resolvePrintScale({
        measuredMm: settings.measuredSquareMm,
        page: plan?.page ?? getA4Size(settings.orientation),
        printerMarginMm: settings.printerMarginMm,
      }),
    [settings.measuredSquareMm, settings.printerMarginMm, settings.orientation, plan],
  );
}
