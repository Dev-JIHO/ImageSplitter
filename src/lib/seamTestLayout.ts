import {
  createManualGridPlan,
  type GridPlan,
  type Orientation,
} from './geometry';

/**
 * 접합 테스트 페이지 레이아웃 (순수 계산).
 *
 * 실제 포스터와 동일한 기하(인쇄 가능 영역, 풀칠 겹침)를 가진 1행 2열
 * 테스트 패턴을 만든다. 사용자는 2장만 인쇄해 붙여서
 * (1) 크기가 정확한지(100mm 기준 사각형),
 * (2) 이음새가 매끄럽게 이어지는지(눈금자·원·사선)
 * 를 포스터 인쇄 전에 확인할 수 있다.
 */

export interface SeamTestInput {
  orientation: Orientation;
  overlapMm: number;
  printerMarginMm: number;
}

export interface SegmentMm {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface SeamRectMm {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SeamTestPage {
  column: number;
  labelText: string;
  labelXmm: number;
  labelYmm: number;
  /** 페이지 좌표(mm) 기준 이미지(콘텐츠) 영역 */
  imageRect: SeamRectMm;
  /** 페이지 좌표(mm) 기준 풀칠 영역 (없으면 null) */
  glueRect: SeamRectMm | null;
  /** 페이지 좌표(mm) 기준 테스트 패턴 선분 */
  segments: SegmentMm[];
}

export interface SeamTestLayout {
  plan: GridPlan;
  /** 논리(이어붙인) 좌표 기준 이음새 위치 */
  seamXmm: number;
  /** 1번 장의 페이지 좌표 기준 크기 확인용 사각형 */
  calibrationSquare: SeamRectMm;
  pages: [SeamTestPage, SeamTestPage];
}

/** Liang-Barsky 선분-사각형 클리핑 */
export function clipSegmentToRect(
  seg: SegmentMm,
  rect: SeamRectMm,
): SegmentMm | null {
  const dx = seg.x2 - seg.x1;
  const dy = seg.y2 - seg.y1;
  let t0 = 0;
  let t1 = 1;
  const p = [-dx, dx, -dy, dy];
  const q = [
    seg.x1 - rect.x,
    rect.x + rect.width - seg.x1,
    seg.y1 - rect.y,
    rect.y + rect.height - seg.y1,
  ];

  for (let i = 0; i < 4; i += 1) {
    if (p[i] === 0) {
      if (q[i] < 0) return null;
    } else {
      const r = q[i] / p[i];
      if (p[i] < 0) {
        if (r > t1) return null;
        if (r > t0) t0 = r;
      } else {
        if (r < t0) return null;
        if (r < t1) t1 = r;
      }
    }
  }

  if (t1 - t0 <= 1e-9) return null;

  return {
    x1: seg.x1 + t0 * dx,
    y1: seg.y1 + t0 * dy,
    x2: seg.x1 + t1 * dx,
    y2: seg.y1 + t1 * dy,
  };
}

/** 이음새(seamXmm)를 중심으로 한 테스트 패턴을 논리 좌표(mm)로 생성 */
export function createSeamTestPattern(
  seamXmm: number,
  contentHeightMm: number,
): SegmentMm[] {
  const H = contentHeightMm;
  const segments: SegmentMm[] = [];

  // 1) 가로 눈금자: 이음새 좌우 60mm, 10mm 간격 (간격이 일정한지 확인)
  const rulerY = H * 0.33;
  const rulerHalf = 60;
  segments.push({
    x1: seamXmm - rulerHalf,
    y1: rulerY,
    x2: seamXmm + rulerHalf,
    y2: rulerY,
  });
  for (let offset = -rulerHalf; offset <= rulerHalf; offset += 10) {
    const tall = offset % 50 === 0 ? 8 : 4;
    segments.push({
      x1: seamXmm + offset,
      y1: rulerY - tall,
      x2: seamXmm + offset,
      y2: rulerY,
    });
  }

  // 2) 이음새 수직 기준선
  segments.push({ x1: seamXmm, y1: rulerY + 6, x2: seamXmm, y2: rulerY + 26 });

  // 3) 이음새를 중심에 둔 원 (조금만 어긋나도 곡선이 꺾여 보임)
  const radius = Math.min(35, H * 0.16);
  const cy = H * 0.55;
  const steps = 72;
  for (let i = 0; i < steps; i += 1) {
    const a0 = (i / steps) * Math.PI * 2;
    const a1 = ((i + 1) / steps) * Math.PI * 2;
    segments.push({
      x1: seamXmm + radius * Math.cos(a0),
      y1: cy + radius * Math.sin(a0),
      x2: seamXmm + radius * Math.cos(a1),
      y2: cy + radius * Math.sin(a1),
    });
  }

  // 4) 45도 사선 묶음 (상하 어긋남 확인)
  const bandTop = H * 0.78;
  const bandHeight = 22;
  for (let k = -4; k <= 4; k += 1) {
    const cx = seamXmm + k * 8;
    segments.push({
      x1: cx - bandHeight / 2,
      y1: bandTop,
      x2: cx + bandHeight / 2,
      y2: bandTop + bandHeight,
    });
  }

  return segments;
}

export function createSeamTestLayout(input: SeamTestInput): SeamTestLayout {
  const plan = createManualGridPlan({
    orientation: input.orientation,
    rows: 1,
    columns: 2,
    overlapMm: input.overlapMm,
    printerMarginMm: input.printerMarginMm,
  });

  const margin = plan.printerMarginMm;
  const printableW = plan.page.widthMm - margin * 2;
  const printableH = plan.page.heightMm - margin * 2;
  const seamXmm = printableW - plan.overlapMm;
  const pattern = createSeamTestPattern(seamXmm, printableH);

  const pages = [0, 1].map((column) => {
    const logicalRect: SeamRectMm = {
      x: column * seamXmm,
      y: 0,
      width: column === 0 ? seamXmm : printableW,
      height: printableH,
    };

    const segments = pattern
      .map((seg) => clipSegmentToRect(seg, logicalRect))
      .filter((seg): seg is SegmentMm => seg !== null)
      .map((seg) => ({
        x1: seg.x1 - logicalRect.x + margin,
        y1: seg.y1 + margin,
        x2: seg.x2 - logicalRect.x + margin,
        y2: seg.y2 + margin,
      }));

    const page: SeamTestPage = {
      column,
      labelText: `1-${column + 1}`,
      labelXmm: margin + 4,
      labelYmm: margin + printableH - 4,
      imageRect: {
        x: margin,
        y: margin,
        width: logicalRect.width,
        height: printableH,
      },
      glueRect:
        column === 0 && plan.overlapMm > 0
          ? {
              x: margin + seamXmm,
              y: margin,
              width: plan.overlapMm,
              height: printableH,
            }
          : null,
      segments,
    };
    return page;
  }) as [SeamTestPage, SeamTestPage];

  // 크기 확인용 기준 사각형 (1번 장, 기본 100mm)
  const squareSize = Math.max(20, Math.min(100, seamXmm - 30, printableH - 30));
  const calibrationSquare: SeamRectMm = {
    x: margin + 15,
    y: margin + printableH - squareSize - 12,
    width: squareSize,
    height: squareSize,
  };

  return { plan, seamXmm, calibrationSquare, pages };
}
