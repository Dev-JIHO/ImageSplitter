import { jsPDF } from 'jspdf';
import {
  GLUE_BORDER_LINE_WIDTH_MM,
  GLUE_HATCH_LINE_WIDTH_MM,
  GLUE_HATCH_SPACING_MM,
  PAGE_NUMBER_FONT_SIZE_PT,
} from './renderConstants';
import {
  createSeamTestLayout,
  type SeamRectMm,
  type SeamTestInput,
  type SeamTestLayout,
} from './seamTestLayout';

export interface SeamTestPdfOptions extends SeamTestInput {
  filename?: string;
}

const TEXT_PX_PER_MM = 8;

/** 접합 테스트 PDF(A4 2장)를 생성해 저장한다. 이미지 없이도 동작한다. */
export function exportSeamTestPdf(options: SeamTestPdfOptions) {
  const layout = createSeamTestLayout(options);
  const pdf = new jsPDF({
    orientation: layout.plan.orientation,
    unit: 'mm',
    format: 'a4',
  });

  layout.pages.forEach((page, index) => {
    if (index > 0) {
      pdf.addPage('a4', layout.plan.orientation);
    }

    // 이미지 영역 외곽선 (포스터의 페이지 경계선과 동일한 역할)
    pdf.setDrawColor(35, 45, 57);
    pdf.setLineWidth(0.2);
    pdf.rect(
      page.imageRect.x,
      page.imageRect.y,
      page.imageRect.width,
      page.imageRect.height,
    );

    // 테스트 패턴
    pdf.setDrawColor(20, 40, 60);
    pdf.setLineWidth(0.4);
    page.segments.forEach((seg) => pdf.line(seg.x1, seg.y1, seg.x2, seg.y2));

    // 풀칠 영역 (포스터와 동일한 빗금)
    if (page.glueRect) {
      drawGlueHatch(pdf, page.glueRect);
    }

    // 페이지 라벨
    pdf.setFontSize(PAGE_NUMBER_FONT_SIZE_PT);
    pdf.setTextColor(35, 45, 57);
    pdf.text(page.labelText, page.labelXmm, page.labelYmm);

    if (index === 0) {
      const square = layout.calibrationSquare;
      pdf.setDrawColor(160, 39, 39);
      pdf.setLineWidth(0.5);
      pdf.rect(square.x, square.y, square.width, square.height);
      pdf.setTextColor(160, 39, 39);
      pdf.setFontSize(11);
      pdf.text(`${Math.round(square.width)} mm`, square.x + 4, square.y + 8);

      drawTextBlock(
        pdf,
        createInstructionLines(layout),
        page.imageRect.x + 6,
        page.imageRect.y + 6,
        Math.min(170, page.imageRect.width - 12),
      );
    } else {
      drawTextBlock(
        pdf,
        ['접합 테스트 2번 장 - 1번 장의 빗금(풀칠) 영역 위에 겹쳐 붙이세요.'],
        page.imageRect.x + 6,
        page.imageRect.y + 6,
        Math.min(170, page.imageRect.width - 12),
      );
    }
  });

  pdf.save(options.filename ?? 'A4-seam-test.pdf');
}

function createInstructionLines(layout: SeamTestLayout): string[] {
  const squareMm = Math.round(layout.calibrationSquare.width);
  return [
    '접합 테스트 페이지 (포스터 아님)',
    '1. 이 2장을 "실제 크기(100%)"로 인쇄하세요. "용지에 맞춤"은 끄세요.',
    `2. 빨간 사각형 한 변이 자로 정확히 ${squareMm}mm인지 확인하세요.`,
    '3. 2번 장을 1번 장의 빗금(풀칠) 영역 위에 맞춰 붙이세요.',
    '4. 눈금·원·사선이 어긋남 없이 이어지면 같은 설정으로 포스터를 인쇄하면 됩니다.',
    '크기가 다르거나 어긋나면: 인쇄 창의 실제 크기/100% 선택과 여백 설정을 확인하세요.',
  ];
}

/** jsPDF 기본 폰트는 한글을 지원하지 않으므로 캔버스로 그려 이미지로 넣는다. */
function drawTextBlock(
  pdf: jsPDF,
  lines: string[],
  xMm: number,
  yMm: number,
  widthMm: number,
) {
  const titleMm = 5;
  const fontMm = 3.6;
  const lineGapMm = 1.8;
  const px = (mm: number) => Math.round(mm * TEXT_PX_PER_MM);

  const totalMm =
    lines.reduce(
      (sum, _, i) => sum + (i === 0 ? titleMm : fontMm) + lineGapMm,
      0,
    ) + 2;

  const canvas = document.createElement('canvas');
  canvas.width = px(widthMm);
  canvas.height = px(totalMm);
  const context = canvas.getContext('2d');
  if (!context) return;

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#1f2933';

  let y = 0;
  lines.forEach((line, i) => {
    let size = i === 0 ? titleMm : fontMm;
    context.font = `${i === 0 ? 700 : 500} ${px(size)}px sans-serif`;
    // 줄이 너무 길면 글자 크기를 줄여 영역을 넘지 않게 한다.
    while (size > 2 && context.measureText(line).width > canvas.width) {
      size -= 0.2;
      context.font = `${i === 0 ? 700 : 500} ${px(size)}px sans-serif`;
    }
    y += px(i === 0 ? titleMm : fontMm);
    context.fillText(line, 0, y);
    y += px(lineGapMm);
  });

  pdf.addImage(canvas.toDataURL('image/png'), 'PNG', xMm, yMm, widthMm, totalMm);
}

function drawGlueHatch(pdf: jsPDF, mark: SeamRectMm) {
  pdf.setDrawColor(120, 120, 120);
  pdf.setLineWidth(GLUE_HATCH_LINE_WIDTH_MM);

  for (let offset = -mark.height; offset < mark.width; offset += GLUE_HATCH_SPACING_MM) {
    let x1 = mark.x + offset;
    let y1 = mark.y;
    let x2 = x1 + mark.height;
    let y2 = y1 + mark.height;

    if (x1 < mark.x) {
      y1 += mark.x - x1;
      x1 = mark.x;
    }
    if (x2 > mark.x + mark.width) {
      y2 -= x2 - (mark.x + mark.width);
      x2 = mark.x + mark.width;
    }
    if (y2 > mark.y + mark.height) {
      x2 -= y2 - (mark.y + mark.height);
      y2 = mark.y + mark.height;
    }

    if (x2 > x1 && y2 > y1) {
      pdf.line(x1, y1, x2, y2);
    }
  }

  pdf.setLineWidth(GLUE_BORDER_LINE_WIDTH_MM);
  pdf.rect(mark.x, mark.y, mark.width, mark.height);
}
