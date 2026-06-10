import type { GridPlan } from './geometry';

export type FitMode = 'cover' | 'fit';

export interface ImageSize {
  widthPx: number;
  heightPx: number;
}

export interface RectMm {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CropFocus {
  x: number;
  y: number;
}

export interface PageSlice {
  row: number;
  column: number;
  pageNumber: number;
  sourceX: number;
  sourceY: number;
  sourceWidth: number;
  sourceHeight: number;
  destXmm: number;
  destYmm: number;
  destWidthMm: number;
  destHeightMm: number;
  previewXmm: number;
  previewYmm: number;
  previewWidthMm: number;
  previewHeightMm: number;
  labelText: string;
  labelXmm: number;
  labelYmm: number;
  /** 풀칠 탭이 없어 라벨을 이미지 위에 옅게 표시해야 하는 경우 */
  labelSubtle: boolean;
}

export interface GlueMark {
  row: number;
  column: number;
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
  previewXmm: number;
  previewYmm: number;
}

export interface ActivePageWindow {
  startRow: number;
  endRow: number;
  startColumn: number;
  endColumn: number;
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
  pageCount: number;
}

export interface PosterLayout {
  fitMode: FitMode;
  sourceX: number;
  sourceY: number;
  sourceWidth: number;
  sourceHeight: number;
  outputFrameMm: RectMm;
  imageFrameMm: RectMm;
  slices: PageSlice[];
}

export interface PosterLayoutInput {
  image: ImageSize;
  fitMode: FitMode;
  cropFocus?: CropFocus;
  imageScale?: number;
  outputFrameMm?: Pick<RectMm, 'width' | 'height'>;
}

export function createPosterLayout(
  plan: GridPlan,
  input: PosterLayoutInput,
): PosterLayout {
  const { image, fitMode } = input;
  if (image.widthPx <= 0 || image.heightPx <= 0) {
    throw new Error('Image dimensions must be positive.');
  }

  const contentFrame: RectMm = {
    x: 0,
    y: 0,
    width: plan.contentWidthMm,
    height: plan.contentHeightMm,
  };
  const outputFrameMm = createOutputFrame(plan, contentFrame, input.outputFrameMm);
  const sourceRect = createSourceRect(
    outputFrameMm,
    image,
    fitMode,
    input.cropFocus,
    input.imageScale,
  );
  const imageFrameMm = createImageFrame(outputFrameMm, image, fitMode);
  const slices = normalizeSliceLabels(createPageSlices(plan, sourceRect, imageFrameMm));

  return {
    fitMode,
    sourceX: sourceRect.x,
    sourceY: sourceRect.y,
    sourceWidth: sourceRect.width,
    sourceHeight: sourceRect.height,
    outputFrameMm,
    imageFrameMm,
    slices,
  };
}

export function getPhysicalPrintableFrame(plan: GridPlan): RectMm {
  return {
    x: 0,
    y: 0,
    width: plan.totalWidthMm,
    height: plan.totalHeightMm,
  };
}

export function getPagePrinterFrame(
  plan: GridPlan,
  row: number,
  column: number,
): RectMm {
  return {
    x: column * plan.page.widthMm + plan.printerMarginMm,
    y: row * plan.page.heightMm + plan.printerMarginMm,
    width: plan.page.widthMm - plan.printerMarginMm * 2,
    height: plan.page.heightMm - plan.printerMarginMm * 2,
  };
}

function createSourceRect(
  outputFrameMm: RectMm,
  image: ImageSize,
  fitMode: FitMode,
  cropFocus: CropFocus = { x: 0.5, y: 0.5 },
  imageScale = 1,
): RectMm {
  if (fitMode === 'fit') {
    return {
      x: 0,
      y: 0,
      width: image.widthPx,
      height: image.heightPx,
    };
  }

  const contentRatio = outputFrameMm.width / outputFrameMm.height;
  const imageRatio = image.widthPx / image.heightPx;
  const focus = {
    x: clamp(cropFocus.x, 0, 1),
    y: clamp(cropFocus.y, 0, 1),
  };
  const scale = Math.max(1, imageScale);

  if (imageRatio > contentRatio) {
    const width = (image.heightPx * contentRatio) / scale;
    const height = image.heightPx / scale;
    return {
      x: (image.widthPx - width) * focus.x,
      y: (image.heightPx - height) * focus.y,
      width,
      height,
    };
  }

  if (imageRatio < contentRatio) {
    const width = image.widthPx / scale;
    const height = (image.widthPx / contentRatio) / scale;
    return {
      x: (image.widthPx - width) * focus.x,
      y: (image.heightPx - height) * focus.y,
      width,
      height,
    };
  }

  if (scale > 1) {
    const width = image.widthPx / scale;
    const height = image.heightPx / scale;
    return {
      x: (image.widthPx - width) * focus.x,
      y: (image.heightPx - height) * focus.y,
      width,
      height,
    };
  }

  return {
    x: 0,
    y: 0,
    width: image.widthPx,
    height: image.heightPx,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function createImageFrame(
  outputFrameMm: RectMm,
  image: ImageSize,
  fitMode: FitMode,
): RectMm {
  if (fitMode === 'cover') {
    return outputFrameMm;
  }

  const imageRatio = image.widthPx / image.heightPx;
  const contentRatio = outputFrameMm.width / outputFrameMm.height;
  const width =
    imageRatio >= contentRatio
      ? outputFrameMm.width
      : outputFrameMm.height * imageRatio;
  const height =
    imageRatio >= contentRatio
      ? outputFrameMm.width / imageRatio
      : outputFrameMm.height;

  return {
    x: outputFrameMm.x + (outputFrameMm.width - width) / 2,
    y: outputFrameMm.y + (outputFrameMm.height - height) / 2,
    width,
    height,
  };
}

function createOutputFrame(
  plan: GridPlan,
  contentFrame: RectMm,
  requestedFrame?: Pick<RectMm, 'width' | 'height'>,
): RectMm {
  if (!requestedFrame) {
    return contentFrame;
  }

  const width = Math.min(requestedFrame.width, contentFrame.width);
  const height = Math.min(requestedFrame.height, contentFrame.height);
  return {
    x: contentFrame.x + (contentFrame.width - width) / 2,
    y: contentFrame.y + (contentFrame.height - height) / 2,
    width,
    height,
  };
}

export function getGlueMarks(plan: GridPlan, slices?: PageSlice[]): GlueMark[] {
  if (plan.overlapMm <= 0) return [];

  if (slices) {
    return slices.flatMap((slice) => {
      const marks: GlueMark[] = [];

      if (slice.column < plan.columns - 1) {
        const widthMm = Math.min(plan.overlapMm, slice.destWidthMm);
        const xMm = clamp(
          slice.destXmm + slice.destWidthMm,
          0,
          plan.page.widthMm - widthMm,
        );
        const yMm = clamp(slice.destYmm, 0, plan.page.heightMm);
        marks.push({
          row: slice.row,
          column: slice.column,
          xMm,
          yMm,
          widthMm,
          heightMm: Math.min(slice.destHeightMm, plan.page.heightMm - yMm),
          previewXmm: slice.column * plan.page.widthMm + xMm,
          previewYmm: slice.row * plan.page.heightMm + yMm,
        });
      }

      if (slice.row < plan.rows - 1) {
        const heightMm = Math.min(plan.overlapMm, slice.destHeightMm);
        const xMm = clamp(slice.destXmm, 0, plan.page.widthMm);
        const yMm = clamp(
          slice.destYmm + slice.destHeightMm,
          0,
          plan.page.heightMm - heightMm,
        );
        marks.push({
          row: slice.row,
          column: slice.column,
          xMm,
          yMm,
          widthMm: Math.min(slice.destWidthMm, plan.page.widthMm - xMm),
          heightMm,
          previewXmm: slice.column * plan.page.widthMm + xMm,
          previewYmm: slice.row * plan.page.heightMm + yMm,
        });
      }

      return marks;
    });
  }

  const marks: GlueMark[] = [];
  for (let row = 0; row < plan.rows; row += 1) {
    for (let column = 0; column < plan.columns; column += 1) {
      const pageX = column * plan.page.widthMm;
      const pageY = row * plan.page.heightMm;

      if (column < plan.columns - 1) {
        marks.push({
          row,
          column,
          xMm: plan.page.widthMm - plan.overlapMm,
          yMm: 0,
          widthMm: plan.overlapMm,
          heightMm: plan.page.heightMm,
          previewXmm: pageX + plan.page.widthMm - plan.overlapMm,
          previewYmm: pageY,
        });
      }

      if (row < plan.rows - 1) {
        marks.push({
          row,
          column,
          xMm: 0,
          yMm: plan.page.heightMm - plan.overlapMm,
          widthMm: plan.page.widthMm,
          heightMm: plan.overlapMm,
          previewXmm: pageX,
          previewYmm: pageY + plan.page.heightMm - plan.overlapMm,
        });
      }
    }
  }

  return marks;
}

export function getPreviewPageLabelPosition(plan: GridPlan, slice: PageSlice) {
  return {
    x: slice.column * plan.page.widthMm + slice.labelXmm,
    y: slice.row * plan.page.heightMm + slice.labelYmm,
  };
}

export function getActivePageWindow(plan: GridPlan, slices: PageSlice[]): ActivePageWindow {
  if (slices.length === 0) {
    return {
      startRow: 0,
      endRow: plan.rows - 1,
      startColumn: 0,
      endColumn: plan.columns - 1,
      xMm: 0,
      yMm: 0,
      widthMm: plan.totalWidthMm,
      heightMm: plan.totalHeightMm,
      pageCount: 0,
    };
  }

  const startRow = Math.min(...slices.map((slice) => slice.row));
  const endRow = Math.max(...slices.map((slice) => slice.row));
  const startColumn = Math.min(...slices.map((slice) => slice.column));
  const endColumn = Math.max(...slices.map((slice) => slice.column));

  return {
    startRow,
    endRow,
    startColumn,
    endColumn,
    xMm: startColumn * plan.page.widthMm,
    yMm: startRow * plan.page.heightMm,
    widthMm: (endColumn - startColumn + 1) * plan.page.widthMm,
    heightMm: (endRow - startRow + 1) * plan.page.heightMm,
    pageCount: slices.length,
  };
}

function normalizeSliceLabels(slices: PageSlice[]): PageSlice[] {
  if (slices.length === 0) return slices;

  const startRow = Math.min(...slices.map((slice) => slice.row));
  const startColumn = Math.min(...slices.map((slice) => slice.column));

  return slices.map((slice) => ({
    ...slice,
    labelText: `${slice.row - startRow + 1}-${slice.column - startColumn + 1}`,
  }));
}

function createPageSlices(
  plan: GridPlan,
  sourceRect: RectMm,
  imageFrameMm: RectMm,
): PageSlice[] {
  const slices: PageSlice[] = [];

  for (let row = 0; row < plan.rows; row += 1) {
    for (let column = 0; column < plan.columns; column += 1) {
      const pageX = column * plan.page.widthMm;
      const pageY = row * plan.page.heightMm;
      const printableWidth = plan.page.widthMm - plan.printerMarginMm * 2;
      const printableHeight = plan.page.heightMm - plan.printerMarginMm * 2;
      const imageWidth = printableWidth - (column < plan.columns - 1 ? plan.overlapMm : 0);
      const imageHeight = printableHeight - (row < plan.rows - 1 ? plan.overlapMm : 0);
      const logicalPage: RectMm = {
        x: column * (printableWidth - plan.overlapMm),
        y: row * (printableHeight - plan.overlapMm),
        width: imageWidth,
        height: imageHeight,
      };
      const visible = intersectRects(logicalPage, imageFrameMm);
      if (!visible) continue;

      const source = mapFrameToSource(visible, imageFrameMm, sourceRect);
      const localX = visible.x - logicalPage.x;
      const localY = visible.y - logicalPage.y;
      const destXmm = plan.printerMarginMm + localX;
      const destYmm = plan.printerMarginMm + localY;
      const label = createPageLabel(plan, {
        x: destXmm,
        y: destYmm,
        width: visible.width,
        height: visible.height,
      });
      slices.push({
        row,
        column,
        pageNumber: row * plan.columns + column + 1,
        sourceX: source.x,
        sourceY: source.y,
        sourceWidth: source.width,
        sourceHeight: source.height,
        destXmm,
        destYmm,
        destWidthMm: visible.width,
        destHeightMm: visible.height,
        previewXmm: pageX + destXmm,
        previewYmm: pageY + destYmm,
        previewWidthMm: visible.width,
        previewHeightMm: visible.height,
        labelText: `${row + 1}-${column + 1}`,
        labelXmm: label.x,
        labelYmm: label.y,
        labelSubtle: label.subtle,
      });
    }
  }

  return slices;
}

interface PageLabelPlacement {
  x: number;
  y: number;
  subtle: boolean;
}

const LABEL_HEIGHT_MM = 5;

/**
 * 페이지 번호 위치.
 *
 * 인쇄 가능 영역 안에서 이미지 밖의 빈 공간(풀칠 탭 또는 fit 모드의 여백)을
 * 아래 → 오른쪽 → 위 → 왼쪽 순서로 찾는다. 마지막 장처럼 이미지가 인쇄
 * 영역을 꽉 채워 빈 공간이 전혀 없으면, 이미지 안쪽 모서리에 작고 옅은
 * 글씨(subtle)로 표시한다.
 *
 * 참고: "모든 페이지에 풀칠 탭이 생기도록 재분배"하는 방안은 네 페이지가
 * 만나는 교차점에서 탭 소유권이 바람개비 모양으로 순환할 수밖에 없어
 * 이미지에 빈 구멍이 생기므로 기하학적으로 불가능하다.
 */
function createPageLabel(
  plan: GridPlan,
  dest: RectMm,
): PageLabelPlacement {
  const printableLeft = plan.printerMarginMm;
  const printableTop = plan.printerMarginMm;
  const printableRight = plan.page.widthMm - plan.printerMarginMm;
  const printableBottom = plan.page.heightMm - plan.printerMarginMm;
  const left = dest.x;
  const top = dest.y;
  const right = dest.x + dest.width;
  const bottom = dest.y + dest.height;

  // 1) 이미지 아래의 빈 공간 (아래 풀칠 탭 또는 fit 모드의 빈 영역)
  if (printableBottom - bottom >= LABEL_HEIGHT_MM + 1.5) {
    return {
      x: Math.max(printableLeft + 0.5, left),
      y: bottom + LABEL_HEIGHT_MM + 0.5,
      subtle: false,
    };
  }

  // 2) 이미지 오른쪽의 빈 공간 (오른쪽 풀칠 탭 등)
  if (printableRight - right >= 6) {
    return {
      x: right + 1,
      y: clamp(top + LABEL_HEIGHT_MM + 2, printableTop + LABEL_HEIGHT_MM, printableBottom - 1),
      subtle: false,
    };
  }

  // 3) 이미지 위의 빈 공간
  if (top - printableTop >= LABEL_HEIGHT_MM + 1.5) {
    return {
      x: Math.max(printableLeft + 0.5, left),
      y: top - 1.5,
      subtle: false,
    };
  }

  // 4) 이미지 왼쪽의 빈 공간
  if (left - printableLeft >= 6) {
    return {
      x: Math.max(printableLeft + 0.5, left - 6),
      y: clamp(top + LABEL_HEIGHT_MM + 2, printableTop + LABEL_HEIGHT_MM, printableBottom - 1),
      subtle: false,
    };
  }

  // 5) 빈 공간이 없으면(마지막 장, 풀칠 0mm 등): 이미지 안쪽 모서리에 옅게
  return {
    x: Math.max(left + 1.5, right - 14),
    y: Math.max(top + LABEL_HEIGHT_MM, bottom - 2),
    subtle: true,
  };
}

function mapFrameToSource(
  frameRect: RectMm,
  imageFrameMm: RectMm,
  sourceRect: RectMm,
): RectMm {
  const scaleX = sourceRect.width / imageFrameMm.width;
  const scaleY = sourceRect.height / imageFrameMm.height;

  return {
    x: sourceRect.x + (frameRect.x - imageFrameMm.x) * scaleX,
    y: sourceRect.y + (frameRect.y - imageFrameMm.y) * scaleY,
    width: frameRect.width * scaleX,
    height: frameRect.height * scaleY,
  };
}

function intersectRects(a: RectMm, b: RectMm): RectMm | null {
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  const right = Math.min(a.x + a.width, b.x + b.width);
  const bottom = Math.min(a.y + a.height, b.y + b.height);

  if (right <= x || bottom <= y) {
    return null;
  }

  return {
    x,
    y,
    width: right - x,
    height: bottom - y,
  };
}
