import { jsPDF } from 'jspdf';
import type { GridPlan } from './geometry';
import { getGlueMarks, type PosterLayout } from './posterLayout';

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

    scratch.width = mmToPixels(slice.destWidthMm, options.dpi);
    scratch.height = mmToPixels(slice.destHeightMm, options.dpi);
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
      getGlueMarks(options.plan)
        .filter((mark) => mark.row === slice.row && mark.column === slice.column)
        .forEach((mark) => {
          pdf.setFillColor(245, 245, 245);
          pdf.setDrawColor(120, 120, 120);
          pdf.rect(mark.xMm, mark.yMm, mark.widthMm, mark.heightMm, 'F');
          pdf.setLineWidth(0.10);
          const hatchSpacing = 3;
          for (let offset = -mark.heightMm; offset < mark.widthMm; offset += hatchSpacing) {
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

            pdf.line(x1, y1, x2, y2);
          }
          pdf.setLineWidth(0.25);
          pdf.rect(mark.xMm, mark.yMm, mark.widthMm, mark.heightMm);
        });
    }

    if (options.showPageNumbers) {
      pdf.setFontSize(9);
      pdf.setTextColor(35, 45, 57);
      pdf.text(slice.labelText, slice.labelXmm, slice.labelYmm);
    }
  });

  pdf.save(options.filename ?? 'image-splitter.pdf');
}

export function mmToPixels(mm: number, dpi: number) {
  return Math.max(1, Math.round((mm / 25.4) * dpi));
}
