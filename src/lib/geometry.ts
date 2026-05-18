export type Orientation = 'portrait' | 'landscape';

export interface PageSize {
  widthMm: number;
  heightMm: number;
}

export interface ManualGridInput {
  orientation: Orientation;
  rows: number;
  columns: number;
  marginMm: number;
  overlapMm: number;
}

export interface TargetSizeInput {
  targetWidthMm: number;
  targetHeightMm: number;
  marginMm: number;
  overlapMm: number;
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
  assertNonNegative(input.marginMm, 'Margin');
  const page = getA4Size(input.orientation);
  assertOverlap(input.overlapMm, page);

  const totalWidthMm = page.widthMm * input.columns;
  const totalHeightMm = page.heightMm * input.rows;
  const contentWidthMm = totalWidthMm - input.marginMm * 2;
  const contentHeightMm = totalHeightMm - input.marginMm * 2;

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
    marginMm: input.marginMm,
    overlapMm: input.overlapMm,
  };
}

export function recommendTargetGrid(input: TargetSizeInput): GridPlan {
  assertPositiveNumber(input.targetWidthMm, 'Target width');
  assertPositiveNumber(input.targetHeightMm, 'Target height');
  assertNonNegative(input.marginMm, 'Margin');

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
  assertOverlap(input.overlapMm, page);

  const maxColumns = Math.max(1, Math.ceil(input.targetWidthMm / page.widthMm) + 2);
  const maxRows = Math.max(1, Math.ceil(input.targetHeightMm / page.heightMm) + 2);
  const candidates: GridPlan[] = [];

  for (let rows = 1; rows <= maxRows; rows += 1) {
    for (let columns = 1; columns <= maxColumns; columns += 1) {
      const totalWidthMm = page.widthMm * columns;
      const totalHeightMm = page.heightMm * rows;
      const contentWidthMm =
        page.widthMm + (columns - 1) * (page.widthMm - input.overlapMm) -
        input.marginMm * 2;
      const contentHeightMm =
        page.heightMm + (rows - 1) * (page.heightMm - input.overlapMm) -
        input.marginMm * 2;

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
          marginMm: input.marginMm,
          overlapMm: input.overlapMm,
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
