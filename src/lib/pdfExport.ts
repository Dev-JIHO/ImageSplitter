import { jsPDF } from 'jspdf';
import type { GridPlan } from './geometry';
import {
  GLUE_BORDER_LINE_WIDTH_MM,
  GLUE_HATCH_LINE_WIDTH_MM,
  GLUE_HATCH_SPACING_MM,
  PAGE_NUMBER_FONT_SIZE_PT,
} from './renderConstants';
import { getGlueMarks, type PageSlice, type PosterLayout } from './posterLayout';
import { scaleAboutPageCenter } from './printScale';

export interface PdfExportOptions {
  image: CanvasImageSource;
  plan: GridPlan;
  layout: PosterLayout;
  dpi: number;
  showPageNumbers: boolean;
  showPageBoundaries: boolean;
  showGlueMarks: boolean;
  /** 인쇄 배율 보정 (배율 고정 인쇄 앱 대응, 기본 1) */
  printScale?: number;
  filename?: string;
}

export async function exportPosterPdf(options: PdfExportOptions) {
  const pdf = new jsPDF({
    orientation: options.plan.orientation,
    unit: 'mm',
    format: 'a4',
  });
  const scratch = document.createElement('canvas');
  const context = scratch.getContext('2d');
  if (!context) {
    throw new Error('Canvas를 사용할 수 없습니다.');
  }

  // 인쇄 배율 보정: 페이지 중심 기준으로 모든 mm 좌표를 확대/축소
  const k = options.printScale ?? 1;
  const sx = (value: number) => scaleAboutPageCenter(value, options.plan.page.widthMm, k);
  const sy = (value: number) => scaleAboutPageCenter(value, options.plan.page.heightMm, k);

  for (let index = 0; index < options.layout.slices.length; index += 1) {
    const slice = options.layout.slices[index];
    if (index > 0) {
      pdf.addPage('a4', options.plan.orientation);
    }

    const sliceRect = alignedSliceRect(slice, options.dpi);
    scratch.width = sliceRect.width;
    scratch.height = sliceRect.height;
    // JPEG는 알파 채널이 없으므로 투명 영역이 검게 변하지 않도록 흰색으로 채운다.
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, scratch.width, scratch.height);
    context.drawImage(
      options.image,
      slice.sourceX,
      slice.sourceY,
      slice.sourceWidth,
      slice.sourceHeight,
      0,
      0,
      scratch.width,
      scratch.height,
    );

    const dataUrl = scratch.toDataURL('image/jpeg', 0.92);
    pdf.addImage(
      dataUrl,
      'JPEG',
      sx(slice.destXmm),
      sy(slice.destYmm),
      slice.destWidthMm * k,
      slice.destHeightMm * k,
    );

    if (options.showPageBoundaries) {
      pdf.setDrawColor(35, 45, 57);
      pdf.setLineWidth(0.2);
      pdf.rect(
        sx(slice.destXmm),
        sy(slice.destYmm),
        slice.destWidthMm * k,
        slice.destHeightMm * k,
      );
    }

    if (options.showGlueMarks) {
      renderGlueMarksToPdf(pdf, options.plan, slice, k);
    }

    // 풀칠 탭이 없어 번호 둘 공간이 없는 페이지는 번호를 표시하지 않는다.
    // labelXmm은 탭 폭의 중앙 좌표이므로 가운데 정렬로 그린다.
    if (options.showPageNumbers && slice.showLabel) {
      pdf.setFontSize(PAGE_NUMBER_FONT_SIZE_PT * k);
      pdf.setTextColor(35, 45, 57);
      pdf.text(slice.labelText, sx(slice.labelXmm), sy(slice.labelYmm), {
        align: 'center',
      });
    }

    // 페이지 사이마다 브라우저에 제어권을 넘겨 진행 표시(isExporting)가 렌더링되도록 한다.
    await yieldToBrowser();
  }

  pdf.save(options.filename ?? 'image-splitter.pdf');
}

function yieldToBrowser() {
  return new Promise<void>((resolve) => {
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => resolve());
      return;
    }
    setTimeout(resolve, 0);
  });
}

export function mmToPixels(mm: number, dpi: number) {
  return Math.max(1, Math.round((mm / 25.4) * dpi));
}

export function alignedSliceRect(
  slice: Pick<PageSlice, 'previewXmm' | 'previewYmm' | 'previewWidthMm' | 'previewHeightMm'>,
  dpi: number,
) {
  const pxPerMm = dpi / 25.4;
  const x = Math.floor(slice.previewXmm * pxPerMm);
  const y = Math.floor(slice.previewYmm * pxPerMm);
  const right = Math.ceil((slice.previewXmm + slice.previewWidthMm) * pxPerMm);
  const bottom = Math.ceil((slice.previewYmm + slice.previewHeightMm) * pxPerMm);
  return {
    x,
    y,
    width: Math.max(1, right - x),
    height: Math.max(1, bottom - y),
  };
}

function renderGlueMarksToPdf(
  pdf: jsPDF,
  plan: GridPlan,
  slice: PageSlice,
  printScale = 1,
) {
  getGlueMarks(plan, [slice])
    .forEach((rawMark) => {
      const mark = {
        xMm: scaleAboutPageCenter(rawMark.xMm, plan.page.widthMm, printScale),
        yMm: scaleAboutPageCenter(rawMark.yMm, plan.page.heightMm, printScale),
        widthMm: rawMark.widthMm * printScale,
        heightMm: rawMark.heightMm * printScale,
      };
      const spacing = GLUE_HATCH_SPACING_MM * printScale;
      pdf.setDrawColor(120, 120, 120);

      pdf.setLineWidth(GLUE_HATCH_LINE_WIDTH_MM);
      for (let offset = -mark.heightMm; offset < mark.widthMm; offset += spacing) {
        let x1 = mark.xMm + offset;
        let y1 = mark.yMm;
        let x2 = x1 + mark.heightMm;
        let y2 = y1 + mark.heightMm;

        if (x1 < mark.xMm) {
          y1 += mark.xMm - x1;
          x1 = mark.xMm;
        }
        if (x2 > mark.xMm + mark.widthMm) {
          y2 -= x2 - (mark.xMm + mark.widthMm);
          x2 = mark.xMm + mark.widthMm;
        }
        if (y2 > mark.yMm + mark.heightMm) {
          x2 -= y2 - (mark.yMm + mark.heightMm);
          y2 = mark.yMm + mark.heightMm;
        }

        if (x2 > x1 && y2 > y1) {
          pdf.line(x1, y1, x2, y2);
        }
      }
    });
}
