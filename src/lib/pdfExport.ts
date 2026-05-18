import { jsPDF } from 'jspdf';
import type { GridPlan } from './geometry';
import {
  GLUE_BORDER_LINE_WIDTH_MM,
  GLUE_HATCH_LINE_WIDTH_MM,
  GLUE_HATCH_SPACING_MM,
  PAGE_NUMBER_FONT_SIZE_PT,
} from './renderConstants';
import { getGlueMarks, type PageSlice, type PosterLayout } from './posterLayout';

export interface PdfExportOptions {
  image: CanvasImageSource;
  plan: GridPlan;
  layout: PosterLayout;
  dpi: number;
  showPageNumbers: boolean;
  showPageBoundaries: boolean;
  showGlueMarks: boolean;
  filename?: string;
}

export function exportPosterPdf(options: PdfExportOptions) {
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

  options.layout.slices.forEach((slice, index) => {
    if (index > 0) {
      pdf.addPage('a4', options.plan.orientation);
    }

    const sliceRect = alignedSliceRect(slice, options.dpi);
    scratch.width = sliceRect.width;
    scratch.height = sliceRect.height;
    context.clearRect(0, 0, scratch.width, scratch.height);
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
      slice.destXmm,
      slice.destYmm,
      slice.destWidthMm,
      slice.destHeightMm,
    );

    if (options.showPageBoundaries) {
      pdf.setDrawColor(35, 45, 57);
      pdf.setLineWidth(0.2);
      pdf.rect(
        slice.destXmm,
        slice.destYmm,
        slice.destWidthMm,
        slice.destHeightMm,
      );
    }

    if (options.showGlueMarks) {
      renderGlueMarksToPdf(pdf, options.plan, slice);
    }

    if (options.showPageNumbers) {
      pdf.setFontSize(PAGE_NUMBER_FONT_SIZE_PT);
      pdf.setTextColor(35, 45, 57);
      pdf.text(slice.labelText, slice.labelXmm, slice.labelYmm);
    }
  });

  pdf.save(options.filename ?? 'image-splitter.pdf');
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

function renderGlueMarksToPdf(pdf: jsPDF, plan: GridPlan, slice: PageSlice) {
  getGlueMarks(plan, [slice])
    .forEach((mark) => {
      pdf.setDrawColor(120, 120, 120);

      pdf.setLineWidth(GLUE_HATCH_LINE_WIDTH_MM);
      for (let offset = -mark.heightMm; offset < mark.widthMm; offset += GLUE_HATCH_SPACING_MM) {
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

      pdf.setLineWidth(GLUE_BORDER_LINE_WIDTH_MM);
      pdf.rect(mark.xMm, mark.yMm, mark.widthMm, mark.heightMm);
    });
}
