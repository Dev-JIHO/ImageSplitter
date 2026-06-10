import type { PageSize } from './geometry';

/**
 * 인쇄 배율 보정.
 *
 * 일부 인쇄 앱(예: Epson Smart Panel)은 페이지를 인쇄 가능 영역에 맞춰
 * 강제로 축소(~97%)하며 배율을 조정할 수 없다. 축소가 페이지 전체에
 * 균일하게 적용되므로, 접합 테스트의 100mm 기준 사각형 실측값으로
 * 역배율을 계산해 PDF 콘텐츠를 미리 확대하면 실제 크기로 인쇄된다.
 *
 * 확대는 페이지 중심 기준이므로, 콘텐츠가 종이를 벗어나지 않도록
 * 프린터 여백이 만드는 한도(maxPrintScaleFactor)로 제한한다.
 */

export const PRINT_SCALE_REFERENCE_MM = 100;

export interface ResolvedPrintScale {
  /** 실제 적용할 배율 (한도 적용 후) */
  factor: number;
  /** 실측값이 요구하는 배율 (한도 적용 전) */
  requestedFactor: number;
  /** 여백 한도 때문에 배율이 줄었는지 */
  clamped: boolean;
}

export interface ResolvePrintScaleInput {
  /** 100mm 기준 사각형의 실측 길이(mm) */
  measuredMm: number;
  page: PageSize;
  printerMarginMm: number;
}

/** 콘텐츠가 종이 밖으로 나가지 않는 최대 확대 배율 */
export function maxPrintScaleFactor(
  page: PageSize,
  printerMarginMm: number,
): number {
  const halfW = page.widthMm / 2;
  const halfH = page.heightMm / 2;
  const extentW = halfW - printerMarginMm;
  const extentH = halfH - printerMarginMm;
  if (extentW <= 0 || extentH <= 0) return 1;
  return Math.min(halfW / extentW, halfH / extentH);
}

export function resolvePrintScale(
  input: ResolvePrintScaleInput,
): ResolvedPrintScale {
  const measured = input.measuredMm;
  let requestedFactor =
    !Number.isFinite(measured) || measured <= 0
      ? 1
      : PRINT_SCALE_REFERENCE_MM / measured;
  // 비정상 입력 방어: 80~125% 범위만 허용
  requestedFactor = Math.min(1.25, Math.max(0.8, requestedFactor));

  const max = maxPrintScaleFactor(input.page, input.printerMarginMm);
  const factor = Math.min(requestedFactor, max);

  return {
    factor,
    requestedFactor,
    clamped: requestedFactor > max + 1e-9,
  };
}

/** 페이지 중심을 기준으로 좌표를 배율 변환 */
export function scaleAboutPageCenter(
  valueMm: number,
  pageDimensionMm: number,
  factor: number,
): number {
  const center = pageDimensionMm / 2;
  return center + (valueMm - center) * factor;
}
