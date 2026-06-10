import { describe, expect, test } from 'vitest';
import {
  clipSegmentToRect,
  createSeamTestLayout,
  createSeamTestPattern,
  type SeamTestInput,
} from './seamTestLayout';

const EPS = 1e-6;

describe('clipSegmentToRect', () => {
  const rect = { x: 0, y: 0, width: 100, height: 100 };

  test('완전히 안에 있는 선분은 그대로 반환', () => {
    const seg = { x1: 10, y1: 10, x2: 90, y2: 90 };
    expect(clipSegmentToRect(seg, rect)).toEqual(seg);
  });

  test('완전히 밖에 있는 선분은 null', () => {
    expect(
      clipSegmentToRect({ x1: 110, y1: 0, x2: 150, y2: 100 }, rect),
    ).toBeNull();
  });

  test('경계를 가로지르는 선분은 잘라서 반환', () => {
    const clipped = clipSegmentToRect({ x1: -50, y1: 50, x2: 50, y2: 50 }, rect);
    expect(clipped).not.toBeNull();
    expect(clipped!.x1).toBeCloseTo(0, 6);
    expect(clipped!.x2).toBeCloseTo(50, 6);
  });
});

describe('seam test layout', () => {
  const cases: SeamTestInput[] = [];
  (['portrait', 'landscape'] as const).forEach((orientation) => {
    [0, 10, 20].forEach((overlapMm) => {
      [0, 3, 5].forEach((printerMarginMm) => {
        cases.push({ orientation, overlapMm, printerMarginMm });
      });
    });
  });

  test('패턴이 이음새를 가로지른다', () => {
    const pattern = createSeamTestPattern(200, 287);
    // 이음새를 완전히 가로지르는 선분 (눈금자, 가운데 사선 등)
    const crossing = pattern.filter(
      (seg) => Math.min(seg.x1, seg.x2) < 200 - EPS && Math.max(seg.x1, seg.x2) > 200 + EPS,
    );
    // 이음새에 닿는 선분 (원 폴리라인은 꼭짓점이 이음새 위에 놓임)
    const touching = pattern.filter(
      (seg) => Math.min(seg.x1, seg.x2) <= 200 + EPS && Math.max(seg.x1, seg.x2) >= 200 - EPS,
    );
    expect(crossing.length).toBeGreaterThanOrEqual(4);
    expect(touching.length).toBeGreaterThanOrEqual(10);
  });

  test('모든 선분이 각 페이지의 이미지 영역 안에 있다', () => {
    cases.forEach((input) => {
      const layout = createSeamTestLayout(input);
      layout.pages.forEach((page) => {
        page.segments.forEach((seg) => {
          [seg.x1, seg.x2].forEach((x) => {
            expect(x).toBeGreaterThanOrEqual(page.imageRect.x - EPS);
            expect(x).toBeLessThanOrEqual(
              page.imageRect.x + page.imageRect.width + EPS,
            );
          });
          [seg.y1, seg.y2].forEach((y) => {
            expect(y).toBeGreaterThanOrEqual(page.imageRect.y - EPS);
            expect(y).toBeLessThanOrEqual(
              page.imageRect.y + page.imageRect.height + EPS,
            );
          });
        });
      });
    });
  });

  test('이음새 연속성: 1번 장 끝점과 2번 장 시작점이 정확히 이어진다', () => {
    cases.forEach((input) => {
      const layout = createSeamTestLayout(input);
      const margin = layout.plan.printerMarginMm;
      const [page0, page1] = layout.pages;
      const seamLocal0 = margin + layout.seamXmm; // 1번 장에서 이음새의 페이지 좌표
      const seamLocal1 = margin; // 2번 장에서 이음새의 페이지 좌표

      // 1번 장에서 이음새 위에 끝나는 점들의 y 좌표 집합
      const endYs = page0.segments
        .flatMap((seg) => [
          Math.abs(seg.x1 - seamLocal0) < 1e-4 ? seg.y1 : null,
          Math.abs(seg.x2 - seamLocal0) < 1e-4 ? seg.y2 : null,
        ])
        .filter((y): y is number => y !== null)
        .sort((a, b) => a - b);

      // 2번 장에서 이음새 위에서 시작하는 점들의 y 좌표 집합
      const startYs = page1.segments
        .flatMap((seg) => [
          Math.abs(seg.x1 - seamLocal1) < 1e-4 ? seg.y1 : null,
          Math.abs(seg.x2 - seamLocal1) < 1e-4 ? seg.y2 : null,
        ])
        .filter((y): y is number => y !== null)
        .sort((a, b) => a - b);

      expect(endYs.length).toBeGreaterThan(5);
      expect(startYs.length).toBe(endYs.length);
      endYs.forEach((y, i) => expect(y).toBeCloseTo(startYs[i], 4));
    });
  });

  test('기준 사각형은 1번 장 이미지 영역 안에 있고 기본 설정에서 100mm', () => {
    const layout = createSeamTestLayout({
      orientation: 'portrait',
      overlapMm: 10,
      printerMarginMm: 5,
    });
    const square = layout.calibrationSquare;
    const rect = layout.pages[0].imageRect;
    expect(square.width).toBe(100);
    expect(square.height).toBe(100);
    expect(square.x).toBeGreaterThanOrEqual(rect.x);
    expect(square.y).toBeGreaterThanOrEqual(rect.y);
    expect(square.x + square.width).toBeLessThanOrEqual(rect.x + rect.width);
    expect(square.y + square.height).toBeLessThanOrEqual(rect.y + rect.height);
  });

  test('풀칠 영역은 1번 장에만 있고 겹침 0이면 없다', () => {
    const withOverlap = createSeamTestLayout({
      orientation: 'portrait',
      overlapMm: 10,
      printerMarginMm: 5,
    });
    expect(withOverlap.pages[0].glueRect).not.toBeNull();
    expect(withOverlap.pages[0].glueRect!.width).toBe(10);
    expect(withOverlap.pages[1].glueRect).toBeNull();

    const noOverlap = createSeamTestLayout({
      orientation: 'portrait',
      overlapMm: 0,
      printerMarginMm: 5,
    });
    expect(noOverlap.pages[0].glueRect).toBeNull();
  });
});
