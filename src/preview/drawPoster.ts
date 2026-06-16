import type { GridPlan } from '../lib/geometry';
import {
  getGlueMarks,
  getPagePrinterFrame,
  getPreviewPageLabelPosition,
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
 * 미리보기 캔버스의 스케일과 픽셀 크기를 계산한다 (mm 격자 크기 기준).
 * 순수 함수 — Canvas 없이 단위 테스트할 수 있다.
 */
export function computePreviewCanvasSize(area: {
  widthMm: number;
  heightMm: number;
}): PreviewCanvasSize {
  const scale = Math.min(PREVIEW_MAX_WIDTH_PX / area.widthMm, PREVIEW_MAX_SCALE);
  const width = Math.max(320, Math.round(area.widthMm * scale));
  const height = Math.max(220, Math.round(area.heightMm * scale));
  return { scale, width, height };
}

/**
 * 미리보기 캔버스에 포스터 레이아웃을 그린다.
 * 설정한 행×열 격자 전체를 항상 표시하고, 이미지가 들어가지 않는 페이지는
 * '인쇄 안 함'으로 흐리게 표시한다(내보내기에서는 제외).
 */
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

  const gridWidthMm = plan.columns * plan.page.widthMm;
  const gridHeightMm = plan.rows * plan.page.heightMm;
  const { scale, width, height } = computePreviewCanvasSize({
    widthMm: gridWidthMm,
    heightMm: gridHeightMm,
  });
  canvas.width = width;
  canvas.height = height;

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.save();
  context.scale(scale, scale);

  // 격자 전체를 흰색 페이지 배경으로 채운다.
  for (let row = 0; row < plan.rows; row += 1) {
    for (let column = 0; column < plan.columns; column += 1) {
      context.fillStyle = '#ffffff';
      context.fillRect(
        column * plan.page.widthMm,
        row * plan.page.heightMm,
        plan.page.widthMm,
        plan.page.heightMm,
      );
    }
  }

  // 프린터 여백(인쇄 불가 영역) 표시 — 모든 페이지.
  if (settings.printerMarginMm > 0) {
    for (let row = 0; row < plan.rows; row += 1) {
      for (let column = 0; column < plan.columns; column += 1) {
        const pageX = column * plan.page.widthMm;
        const pageY = row * plan.page.heightMm;
        const printerFrame = getPagePrinterFrame(plan, row, column);
        context.fillStyle = 'rgba(126, 87, 194, 0.13)';
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
      }
    }
  }

  // 이미지 슬라이스.
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

  // 풀칠 영역(노란 음영 + 빗금).
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

  // 페이지 경계선(파란 점선).
  context.setLineDash([]);
  context.strokeStyle = 'rgba(11, 94, 215, 0.95)';
  context.lineWidth = Math.max(1 / scale, 0.8);
  context.setLineDash([4 / scale, 3 / scale]);
  for (let column = 1; column < plan.columns; column += 1) {
    const x = column * plan.page.widthMm;
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, gridHeightMm);
    context.stroke();
  }
  for (let row = 1; row < plan.rows; row += 1) {
    const y = row * plan.page.heightMm;
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(gridWidthMm, y);
    context.stroke();
  }

  // 격자 외곽선.
  context.setLineDash([]);
  context.strokeStyle = 'rgba(20, 31, 45, 0.9)';
  context.lineWidth = Math.max(1 / scale, 0.8);
  context.strokeRect(0, 0, gridWidthMm, gridHeightMm);

  // 이미지가 없는 페이지: '인쇄 안 함' 표시.
  const imagePages = new Set(layout.slices.map((slice) => `${slice.row}:${slice.column}`));
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  for (let row = 0; row < plan.rows; row += 1) {
    for (let column = 0; column < plan.columns; column += 1) {
      if (imagePages.has(`${row}:${column}`)) continue;
      const cx = column * plan.page.widthMm + plan.page.widthMm / 2;
      const cy = row * plan.page.heightMm + plan.page.heightMm / 2;
      context.font = `500 ${PAGE_NUMBER_FONT_SIZE_PT * PT_TO_MM}px sans-serif`;
      context.fillStyle = 'rgba(120, 128, 138, 0.6)';
      context.fillText('인쇄 안 함', cx, cy);
    }
  }
  context.textBaseline = 'alphabetic';

  // 페이지 번호(이미지가 있는 페이지, 풀칠 탭 폭 기준 가운데).
  if (settings.showPageNumbers) {
    context.font = `500 ${PAGE_NUMBER_FONT_SIZE_PT * PT_TO_MM}px sans-serif`;
    context.fillStyle = 'rgba(20, 31, 45, 0.82)';
    context.textAlign = 'center';
    layout.slices.forEach((slice) => {
      if (!slice.showLabel) return;
      const label = getPreviewPageLabelPosition(plan, slice);
      context.fillText(slice.labelText, label.x, label.y);
    });
  }
  context.textAlign = 'start';

  context.restore();
}
