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
    throw new Error('Margin is too large for the selected grid.');
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
  assertPositiveNumber(input.targetWidthMm, 'Target width');
  assertPositiveNumber(input.targetHeightMm, 'Target height');
  assertPrinterMargin(input.printerMarginMm ?? 0);

  const candidates = (['portrait', 'landscape'] as const).flatMap((orientation) =>
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
    throw new Error('Could not calculate a target grid.');
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
    throw new Error('Rows and columns must be positive integers.');
  }
}

function assertOverlap(overlapMm: number, page: PageSize) {
  assertNonNegative(overlapMm, 'Overlap');
  if (overlapMm >= page.widthMm || overlapMm >= page.heightMm) {
    throw new Error('Overlap must be smaller than both page dimensions.');
  }
}

function assertPrinterMargin(printerMarginMm: number) {
  assertNonNegative(printerMarginMm, 'Printer margin');
  if (printerMarginMm >= A4.portrait.widthMm / 2) {
    throw new Error('Printer margin is too large.');
  }
}

function assertNonNegative(value: number, label: string) {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a non-negative number.`);
  }
}

function assertPositiveNumber(value: number, label: string) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be a positive number.`);
  }
}
