export type Orientation = 'portrait' | 'landscape';

export interface PageSize {
  widthMm: number;
  heightMm: number;
}

export interface ManualGridInput {
  orientation: Orientation;
  rows: number;
  columns: number;
  marginMm?: number;
  overlapMm: number;
  printerMarginMm?: number;
}

export interface TargetSizeInput {
  targetWidthMm: number;
  targetHeightMm: number;
  marginMm?: number;
  overlapMm: number;
  printerMarginMm?: number;
  /** 지정하면 해당 용지 방향으로만 격자를 계산한다. 생략 시 두 방향 중 최적 선택. */
  orientation?: Orientation;
}

export interface GridPlan {
  orientation: Orientation;
  rows: number;
  columns: number;
  page: PageSize;
  totalWidthMm: number;
  totalHeightMm: number;
  contentWidthMm: number;
  contentHeightMm: number;
  pageCount: number;
  marginMm: number;
  overlapMm: number;
  printerMarginMm: number;
}

const A4: Record<Orientation, PageSize> = {
  portrait: { widthMm: 210, heightMm: 297 },
  landscape: { widthMm: 297, heightMm: 210 },
};

/** 행/열 각각의 입력 상한. 이보다 큰 값은 캔버스·메모리 한계를 넘길 수 있다. */
export const MAX_GRID_DIMENSION = 30;
/** 전체 인쇄 페이지 수 상한. */
export const MAX_PAGE_COUNT = 100;

export function getA4Size(orientation: Orientation): PageSize {
  return { ...A4[orientation] };
}

export function createManualGridPlan(input: ManualGridInput): GridPlan {
  assertGrid(input.rows, input.columns);
  const printerMarginMm = input.printerMarginMm ?? 0;
  assertPrinterMargin(printerMarginMm);
  const page = getA4Size(input.orientation);
  assertOverlap(input.overlapMm, page);

  const totalWidthMm = page.widthMm * input.columns;
  const totalHeightMm = page.heightMm * input.rows;
  const printableWidthMm = page.widthMm - printerMarginMm * 2;
  const printableHeightMm = page.heightMm - printerMarginMm * 2;
  const contentWidthMm =
    printableWidthMm + (input.columns - 1) * (printableWidthMm - input.overlapMm);
  const contentHeightMm =
    printableHeightMm + (input.rows - 1) * (printableHeightMm - input.overlapMm);

  if (contentWidthMm <= 0 || contentHeightMm <= 0) {
    throw new Error('여백 값이 선택한 격자 크기에 비해 너무 큽니다.');
  }

  return {
    orientation: input.orientation,
    rows: input.rows,
    columns: input.columns,
    page,
    totalWidthMm,
    totalHeightMm,
    contentWidthMm,
    contentHeightMm,
    pageCount: input.rows * input.columns,
    marginMm: 0,
    overlapMm: input.overlapMm,
    printerMarginMm,
  };
}

export function recommendTargetGrid(input: TargetSizeInput): GridPlan {
  assertPositiveNumber(input.targetWidthMm, '완성 가로');
  assertPositiveNumber(input.targetHeightMm, '완성 세로');
  assertPrinterMargin(input.printerMarginMm ?? 0);

  const orientations: readonly Orientation[] = input.orientation
    ? [input.orientation]
    : (['portrait', 'landscape'] as const);
  const candidates = orientations.flatMap((orientation) =>
    createTargetCandidates(orientation, input),
  );

  candidates.sort((a, b) => {
    const pageDiff = a.pageCount - b.pageCount;
    if (pageDiff !== 0) return pageDiff;

    const unusedA =
      a.contentWidthMm * a.contentHeightMm -
      input.targetWidthMm * input.targetHeightMm;
    const unusedB =
      b.contentWidthMm * b.contentHeightMm -
      input.targetWidthMm * input.targetHeightMm;
    if (unusedA !== unusedB) return unusedA - unusedB;

    const targetRatio = input.targetWidthMm / input.targetHeightMm;
    const ratioA = a.contentWidthMm / a.contentHeightMm;
    const ratioB = b.contentWidthMm / b.contentHeightMm;
    return Math.abs(ratioA - targetRatio) - Math.abs(ratioB - targetRatio);
  });

  const best = candidates[0];
  if (!best) {
    throw new Error('요청한 크기로 만들 수 있는 격자를 계산하지 못했습니다.');
  }
  if (best.pageCount > MAX_PAGE_COUNT) {
    throw new Error(
      `요청한 완성 크기를 만들려면 ${best.pageCount}장이 필요합니다(최대 ${MAX_PAGE_COUNT}장). 완성 크기를 줄이거나 여백·풀칠 값을 조정해주세요.`,
    );
  }
  return best;
}

function createTargetCandidates(
  orientation: Orientation,
  input: TargetSizeInput,
): GridPlan[] {
  const page = getA4Size(orientation);
  const printerMarginMm = input.printerMarginMm ?? 0;
  assertOverlap(input.overlapMm, page);
  const printableWidthMm = page.widthMm - printerMarginMm * 2;
  const printableHeightMm = page.heightMm - printerMarginMm * 2;

  const maxColumns = Math.max(1, Math.ceil(input.targetWidthMm / printableWidthMm) + 2);
  const maxRows = Math.max(1, Math.ceil(input.targetHeightMm / printableHeightMm) + 2);
  const candidates: GridPlan[] = [];

  for (let rows = 1; rows <= maxRows; rows += 1) {
    for (let columns = 1; columns <= maxColumns; columns += 1) {
      const totalWidthMm = page.widthMm * columns;
      const totalHeightMm = page.heightMm * rows;
      const contentWidthMm =
        printableWidthMm + (columns - 1) * (printableWidthMm - input.overlapMm);
      const contentHeightMm =
        printableHeightMm + (rows - 1) * (printableHeightMm - input.overlapMm);

      if (
        contentWidthMm >= input.targetWidthMm &&
        contentHeightMm >= input.targetHeightMm
      ) {
        candidates.push({
          orientation,
          rows,
          columns,
          page,
          totalWidthMm,
          totalHeightMm,
          contentWidthMm,
          contentHeightMm,
          pageCount: rows * columns,
          marginMm: 0,
          overlapMm: input.overlapMm,
          printerMarginMm,
        });
      }
    }
  }

  return candidates;
}

function assertGrid(rows: number, columns: number) {
  if (!Number.isInteger(rows) || !Number.isInteger(columns) || rows < 1 || columns < 1) {
    throw new Error('행과 열은 1 이상의 정수여야 합니다.');
  }
  if (rows > MAX_GRID_DIMENSION || columns > MAX_GRID_DIMENSION) {
    throw new Error(`행과 열은 각각 최대 ${MAX_GRID_DIMENSION}까지 입력할 수 있습니다.`);
  }
  if (rows * columns > MAX_PAGE_COUNT) {
    throw new Error(
      `전체 페이지 수는 최대 ${MAX_PAGE_COUNT}장까지 지원합니다. 행·열 값을 줄여주세요.`,
    );
  }
}

function assertOverlap(overlapMm: number, page: PageSize) {
  assertNonNegative(overlapMm, '겹침(풀칠) 값');
  if (overlapMm >= page.widthMm || overlapMm >= page.heightMm) {
    throw new Error('겹침(풀칠) 값은 용지의 가로·세로 길이보다 작아야 합니다.');
  }
}

function assertPrinterMargin(printerMarginMm: number) {
  assertNonNegative(printerMarginMm, '프린터 여백');
  if (printerMarginMm >= A4.portrait.widthMm / 2) {
    throw new Error('프린터 여백 값이 너무 큽니다.');
  }
}

function assertNonNegative(value: number, label: string) {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label}은(는) 0 이상의 숫자여야 합니다.`);
  }
}

function assertPositiveNumber(value: number, label: string) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label}은(는) 0보다 큰 숫자여야 합니다.`);
  }
}
