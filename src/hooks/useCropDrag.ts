import { useRef, type PointerEvent } from 'react';
import type { GridPlan } from '../lib/geometry';
import { clamp } from '../lib/num';
import { type CropFocus, type PosterLayout } from '../lib/posterLayout';
import type { Settings } from '../types';

interface CropDragState {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startFocus: CropFocus;
}

/**
 * 확대된 상태에서 미리보기 캔버스를 드래그해 보이는 위치(crop focus)를 조정하는 핸들러.
 */
export function useCropDrag(
  plan: GridPlan | null,
  layout: PosterLayout | null,
  settings: Settings,
  updateSetting: <Key extends keyof Settings>(key: Key, value: Settings[Key]) => void,
) {
  const cropDragRef = useRef<CropDragState | null>(null);

  function updateCropFocusFromDrag(event: PointerEvent<HTMLCanvasElement>) {
    if (!plan || !layout) return;
    const drag = cropDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    // 미리보기는 전체 격자를 표시하므로 격자 크기 기준으로 픽셀→mm 변환한다.
    const gridWidthMm = plan.columns * plan.page.widthMm;
    const gridHeightMm = plan.rows * plan.page.heightMm;
    const scaleX = gridWidthMm / rect.width;
    const scaleY = gridHeightMm / rect.height;
    const deltaXmm = (event.clientX - drag.startClientX) * scaleX;
    const deltaYmm = (event.clientY - drag.startClientY) * scaleY;
    const frame = layout.imageFrameMm;
    const x = clamp(drag.startFocus.x - deltaXmm / frame.width, 0, 1);
    const y = clamp(drag.startFocus.y - deltaYmm / frame.height, 0, 1);
    updateSetting('cropFocus', { x, y });
  }

  return {
    onPointerDown(event: PointerEvent<HTMLCanvasElement>) {
      // 확대됐거나(자르기 여지 있음) cover(영역 채우기) 모드면 위치 이동이 의미가 있다.
      if (layout?.fitMode !== 'cover' && settings.imageScale <= 1) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      cropDragRef.current = {
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startFocus: settings.cropFocus,
      };
    },
    onPointerMove(event: PointerEvent<HTMLCanvasElement>) {
      if (event.buttons === 1) updateCropFocusFromDrag(event);
    },
    onPointerUp(event: PointerEvent<HTMLCanvasElement>) {
      event.currentTarget.releasePointerCapture(event.pointerId);
      cropDragRef.current = null;
    },
    onPointerCancel() {
      cropDragRef.current = null;
    },
    onDoubleClick() {
      updateSetting('cropFocus', { x: 0.5, y: 0.5 });
    },
  };
}
