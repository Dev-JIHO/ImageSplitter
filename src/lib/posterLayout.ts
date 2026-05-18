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
    x: plan.printerMarginMm,
    y: plan.printerMarginMm,
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
  const slices = createPageSlices(plan, sourceRect, imageFrameMm);

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

  if (plan.printerMarginMm > 0) {
    const width = Math.min(requestedFrame.width, contentFrame.width);
    const height = Math.min(requestedFrame.height, contentFrame.height);
    return {
      x: contentFrame.x + (contentFrame.width - width) / 2,
      y: contentFrame.y + (contentFrame.height - height) / 2,
      width,
      height,
    };
  }

  const physicalPrintableFrame = getPhysicalPrintableFrame(plan);
  const physicalPrintableWidth = physicalPrintableFrame.width;
  const physicalPrintableHeight = physicalPrintableFrame.height;
  const width = Math.min(requestedFrame.width, physicalPrintableWidth);
  const height = Math.min(requestedFrame.height, physicalPrintableHeight);
  return {
    x: (physicalPrintableWidth - width) / 2,
    y: (physicalPrintableHeight - height) / 2,
    width,
    height,
  };
}

export function getGlueMarks(plan: GridPlan): GlueMark[] {
  if (plan.overlapMm <= 0) return [];

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
      const expandedPage: RectMm = {
        x: pageX - (column > 0 ? plan.overlapMm : 0),
        y: pageY - (row > 0 ? plan.overlapMm : 0),
        width:
          plan.page.widthMm +
          (column > 0 ? plan.overlapMm : 0) +
          (column < plan.columns - 1 ? plan.overlapMm : 0),
        height:
          plan.page.heightMm +
          (row > 0 ? plan.overlapMm : 0) +
          (row < plan.rows - 1 ? plan.overlapMm : 0),
      };
      const printerFrame = getPagePrinterFrame(plan, row, column);
      const availablePage =
        plan.printerMarginMm > 0
          ? intersectRects(expandedPage, printerFrame)
          : expandedPage;
      if (!availablePage) continue;
      const visible = intersectRects(availablePage, imageFrameMm);
      if (!visible) continue;

      const source = mapFrameToSource(visible, imageFrameMm, sourceRect);
      const label = createPageLabel(plan, row, column, visible);
      slices.push({
        row,
        column,
        pageNumber: row * plan.columns + column + 1,
        sourceX: source.x,
        sourceY: source.y,
        sourceWidth: source.width,
        sourceHeight: source.height,
        destXmm: visible.x - pageX,
        destYmm: visible.y - pageY,
        destWidthMm: visible.width,
        destHeightMm: visible.height,
        previewXmm: visible.x,
        previewYmm: visible.y,
        previewWidthMm: visible.width,
        previewHeightMm: visible.height,
        labelText: `${row + 1}-${column + 1}`,
        labelXmm: label.x,
        labelYmm: label.y,
      });
    }
  }

  return slices;
}

function createPageLabel(
  plan: GridPlan,
  row: number,
  column: number,
  visible: RectMm,
): Pick<RectMm, 'x' | 'y'> {
  const pageX = column * plan.page.widthMm;
  const pageY = row * plan.page.heightMm;
  const localX = visible.x - pageX;
  const localY = visible.y - pageY;
  const localRight = localX + visible.width;
  const localBottom = localY + visible.height;
  const labelHeight = 5;
  const inset = 4;

  if (plan.page.heightMm - localBottom >= labelHeight + 2) {
    return { x: inset, y: plan.page.heightMm - inset };
  }

  if (localY >= labelHeight + 2) {
    return { x: inset, y: Math.max(inset + labelHeight, localY - 2) };
  }

  if (localX >= 24) {
    return { x: inset, y: plan.page.heightMm - inset };
  }

  if (plan.page.widthMm - localRight >= 24) {
    return { x: localRight + 2, y: plan.page.heightMm - inset };
  }

  return { x: inset, y: plan.page.heightMm - inset };
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
