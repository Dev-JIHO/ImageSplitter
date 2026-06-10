import { describe, expect, test } from 'vitest';
import { getA4Size } from './geometry';
import {
  maxPrintScaleFactor,
  resolvePrintScale,
  scaleAboutPageCenter,
} from './printScale';

describe('printScale', () => {
  const portrait = getA4Size('portrait');

  test('실측 97mm이면 약 103.1% 보정 (Epson Smart Panel 사례)', () => {
    const result = resolvePrintScale({
      measuredMm: 97,
      page: portrait,
      printerMarginMm: 5,
    });
    expect(result.requestedFactor).toBeCloseTo(100 / 97, 6);
    expect(result.factor).toBeCloseTo(100 / 97, 6);
    expect(result.clamped).toBe(false);
  });

  test('실측 100mm이면 보정 없음', () => {
    const result = resolvePrintScale({
      measuredMm: 100,
      page: portrait,
      printerMarginMm: 5,
    });
    expect(result.factor).toBe(1);
    expect(result.clamped).toBe(false);
  });

  test('여백 한도를 넘는 확대는 잘리고 clamped 표시', () => {
    // 여백 5mm 세로 A4: 최대 배율 = min(105/100, 148.5/143.5) ≈ 1.0348
    const max = maxPrintScaleFactor(portrait, 5);
    expect(max).toBeCloseTo(148.5 / 143.5, 6);

    const result = resolvePrintScale({
      measuredMm: 95, // 요구 배율 1.0526 > 한도
      page: portrait,
      printerMarginMm: 5,
    });
    expect(result.requestedFactor).toBeCloseTo(100 / 95, 6);
    expect(result.factor).toBeCloseTo(max, 6);
    expect(result.clamped).toBe(true);
  });

  test('여백 0이면 확대 불가 (한도 1)', () => {
    expect(maxPrintScaleFactor(portrait, 0)).toBe(1);
    const result = resolvePrintScale({
      measuredMm: 97,
      page: portrait,
      printerMarginMm: 0,
    });
    expect(result.factor).toBe(1);
    expect(result.clamped).toBe(true);
  });

  test('축소(실측 > 100mm)는 여백과 무관하게 허용', () => {
    const result = resolvePrintScale({
      measuredMm: 105,
      page: portrait,
      printerMarginMm: 0,
    });
    expect(result.factor).toBeCloseTo(100 / 105, 6);
    expect(result.clamped).toBe(false);
  });

  test('비정상 입력은 1 또는 안전 범위로 처리', () => {
    expect(
      resolvePrintScale({ measuredMm: 0, page: portrait, printerMarginMm: 5 })
        .factor,
    ).toBe(1);
    expect(
      resolvePrintScale({ measuredMm: NaN, page: portrait, printerMarginMm: 5 })
        .factor,
    ).toBe(1);
    // 50mm 측정 → 2배 요구지만 1.25로 제한 후 여백 한도로 다시 제한
    const extreme = resolvePrintScale({
      measuredMm: 50,
      page: portrait,
      printerMarginMm: 5,
    });
    expect(extreme.requestedFactor).toBe(1.25);
    expect(extreme.clamped).toBe(true);
  });

  test('scaleAboutPageCenter: 중심은 불변, 가장자리는 비례 이동', () => {
    expect(scaleAboutPageCenter(105, 210, 1.03)).toBe(105);
    expect(scaleAboutPageCenter(5, 210, 100 / 97)).toBeCloseTo(
      105 - 100 * (100 / 97),
      6,
    );
    expect(scaleAboutPageCenter(205, 210, 100 / 97)).toBeCloseTo(
      105 + 100 * (100 / 97),
      6,
    );
  });
});
