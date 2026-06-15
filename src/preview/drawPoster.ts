import type { GridPlan } from '../lib/geometry';
import {
  getActivePageWindow,
  getGlueMarks,
  getPagePrinterFrame,
  getPreviewPageLabelPosition,
  type ActivePageWindow,
  type PosterLayout,
} from '../lib/posterLayout';
import {
  GLUE_BORDER_LINE_WIDTH_MM,
  GLUE_HATCH_LINE_WIDTH_MM,
  GLUE_HATCH_SPACING_MM,
  PAGE_NUMBER_FONT_SIZE_PT,
  PT_TO_MM,
} from '../lib/renderConstants';
import type { Settings } from '../types';

const PREVIEW_MAX_WIDTH_PX = 1200;
const PREVIEW_MAX_SCALE = 2.1;

export interface PreviewCanvasSize {
  scale: number;
  width: number;
  height: number;
}

/**
 * 활성 페이지 윈도우(mm)로부터 미리보기 캔버스의 스케일과 픽셀 크기를 계산한다.
 * 순수 함수 — Canvas 없이 단위 테스트할 수 있다.
 */
export function computePreviewCanvasSize(
  activeWindow: ActivePageWindow,
): PreviewCanvasSize {
  const scale = Math.min(
    PREVIEW_MAX_WIDTH_PX / activeWindow.widthMm,
    PREVIEW_MAX_SCALE,
  );
  const width = Math.max(320, Math.round(activeWindow.widthMm * scale));
  const height = Math.max(220, Math.round(activeWindow.heightMm * scale));
  return { scale, width, height };
}

/** 미리보기 캔버스에 포스터 레이아웃을 그린다. */
export function drawPoster(
  canvas: HTMLCanvasElement | null,
  image: CanvasImageSource,
  plan: GridPlan,
  layout: PosterLayout,
  settings: Settings,
) {
  if (!canvas) return;
  const context = canvas.getContext('2d');
  if (!context) return;

  const activeWindow = getActivePageWindow(plan, layout.slices);
  const { scale, width, height } = computePreviewCanvasSize(activeWindow);
  canvas.width = width;
  canvas.height = height;

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.save();
  context.scale(scale, scale);
  context.translate(-activeWindow.xMm, -activeWindow.yMm);

  context.fillStyle = 'rgba(229, 76, 76, 0.12)';
  context.fillRect(
    activeWindow.xMm,
    activeWindow.yMm,
    activeWindow.widthMm,
    activeWindow.heightMm,
  );
  context.clearRect(
    activeWindow.xMm,
    activeWindow.yMm,
    activeWindow.widthMm,
    activeWindow.heightMm,
  );
  context.fillStyle = '#ffffff';
  context.fillRect(
    activeWindow.xMm,
    activeWindow.yMm,
    activeWindow.widthMm,
    activeWindow.heightMm,
  );

  const renderedPages = new Set<string>();
  layout.slices.forEach((slice) => {
    const pageKey = `${slice.row}:${slice.column}`;
    if (renderedPages.has(pageKey)) return;
    renderedPages.add(pageKey);

    const pageX = slice.column * plan.page.widthMm;
    const pageY = slice.row * plan.page.heightMm;
    context.fillStyle = '#ffffff';
    context.fillRect(pageX, pageY, plan.page.widthMm, plan.page.heightMm);
  });

  if (settings.printerMarginMm > 0) {
    context.fillStyle = 'rgba(126, 87, 194, 0.13)';
    renderedPages.forEach((pageKey) => {
      const [row, column] = pageKey.split(':').map(Number);
      const pageX = column * plan.page.widthMm;
      const pageY = row * plan.page.heightMm;
      const printerFrame = getPagePrinterFrame(plan, row, column);
      context.fillRect(pageX, pageY, plan.page.widthMm, settings.printerMarginMm);
      context.fillRect(
        pageX,
        pageY + plan.page.heightMm - settings.printerMarginMm,
        plan.page.widthMm,
        settings.printerMarginMm,
      );
      context.fillRect(pageX, pageY, settings.printerMarginMm, plan.page.heightMm);
      context.fillRect(
        pageX + plan.page.widthMm - settings.printerMarginMm,
        pageY,
        settings.printerMarginMm,
        plan.page.heightMm,
      );
      context.strokeStyle = 'rgba(126, 87, 194, 0.7)';
      context.lineWidth = Math.max(1 / scale, 0.6);
      context.strokeRect(
        printerFrame.x,
        printerFrame.y,
        printerFrame.width,
        printerFrame.height,
      );
    });
  }

  layout.slices.forEach((slice) => {
    context.drawImage(
      image,
      slice.sourceX,
      slice.sourceY,
      slice.sourceWidth,
      slice.sourceHeight,
      slice.previewXmm,
      slice.previewYmm,
      slice.previewWidthMm,
      slice.previewHeightMm,
    );
  });

  if (settings.showGlueMarks && settings.overlapMm > 0) {
    context.fillStyle = 'rgba(255, 180, 0, 0.12)';
    layout.slices.forEach((slice) => {
      context.fillRect(
        slice.previewXmm,
        slice.previewYmm,
        slice.previewWidthMm,
        slice.previewHeightMm,
      );
    });
  }

  if (settings.showGlueMarks && settings.overlapMm > 0) {
    const glueStroke = 'rgba(0, 0, 0, 0.55)';

    const glueMarks = getGlueMarks(plan, layout.slices);
    context.strokeStyle = glueStroke;
    context.lineWidth = Math.max(GLUE_HATCH_LINE_WIDTH_MM, 1 / scale);

    glueMarks.forEach((mark) => {
      context.save();
      context.beginPath();
      context.rect(mark.previewXmm, mark.previewYmm, mark.widthMm, mark.heightMm);
      context.clip();

      context.beginPath();
      for (let offset = -mark.heightMm; offset < mark.widthMm; offset += GLUE_HATCH_SPACING_MM) {
        context.moveTo(mark.previewXmm + offset, mark.previewYmm);
        context.lineTo(mark.previewXmm + offset + mark.heightMm, mark.previewYmm + mark.heightMm);
      }
      context.stroke();
      context.restore();

      context.strokeStyle = glueStroke;
      context.lineWidth = Math.max(GLUE_BORDER_LINE_WIDTH_MM, 1 / scale);
      context.strokeRect(mark.previewXmm, mark.previewYmm, mark.widthMm, mark.heightMm);
    });
  }

  context.setLineDash([]);
  context.strokeStyle = 'rgba(229, 76, 76, 0.95)';
  context.lineWidth = Math.max(1 / scale, 0.8);
  context.strokeRect(
    activeWindow.xMm,
    activeWindow.yMm,
    activeWindow.widthMm,
    activeWindow.heightMm,
  );

  context.strokeStyle = 'rgba(11, 94, 215, 0.95)';
  context.lineWidth = Math.max(1 / scale, 0.8);
  context.setLineDash([4 / scale, 3 / scale]);

  for (let column = 1; column < plan.columns; column += 1) {
    const x = column * plan.page.widthMm;
    if (x <= activeWindow.xMm || x >= activeWindow.xMm + activeWindow.widthMm) continue;
    context.beginPath();
    context.moveTo(x, activeWindow.yMm);
    context.lineTo(x, activeWindow.yMm + activeWindow.heightMm);
    context.stroke();
  }
  for (let row = 1; row < plan.rows; row += 1) {
    const y = row * plan.page.heightMm;
    if (y <= activeWindow.yMm || y >= activeWindow.yMm + activeWindow.heightMm) continue;
    context.beginPath();
    context.moveTo(activeWindow.xMm, y);
    context.lineTo(activeWindow.xMm + activeWindow.widthMm, y);
    context.stroke();
  }

  context.setLineDash([]);
  context.strokeStyle = 'rgba(20, 31, 45, 0.9)';
  context.strokeRect(
    activeWindow.xMm,
    activeWindow.yMm,
    activeWindow.widthMm,
    activeWindow.heightMm,
  );

  if (settings.showPageNumbers) {
    context.font = `500 ${PAGE_NUMBER_FONT_SIZE_PT * PT_TO_MM}px sans-serif`;
    context.fillStyle = 'rgba(20, 31, 45, 0.82)';
    context.textAlign = 'center';
    layout.slices.forEach((slice) => {
      // 풀칠 탭이 없어 번호 둘 공간이 없는 페이지는 번호를 표시하지 않는다.
      if (!slice.showLabel) return;
      const label = getPreviewPageLabelPosition(plan, slice);
      context.fillText(slice.labelText, label.x, label.y);
    });
    context.textAlign = 'start';
  }

  context.restore();
}
