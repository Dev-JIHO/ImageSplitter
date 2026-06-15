import { useRef, type PointerEvent } from 'react';
import type { GridPlan } from '../lib/geometry';
import { clamp } from '../lib/num';
import {
  getActivePageWindow,
  type CropFocus,
  type PosterLayout,
} from '../lib/posterLayout';
import type { Settings } from '../types';

interface CropDragState {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startFocus: CropFocus;
}

/**
 * cover 모드에서 미리보기 캔버스를 드래그해 crop focus를 조정하는 포인터 핸들러 모음.
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
    const activeWindow = getActivePageWindow(plan, layout.slices);
    const scaleX = activeWindow.widthMm / rect.width;
    const scaleY = activeWindow.heightMm / rect.height;
    const deltaXmm = (event.clientX - drag.startClientX) * scaleX;
    const deltaYmm = (event.clientY - drag.startClientY) * scaleY;
    const frame = layout.imageFrameMm;
    const x = clamp(drag.startFocus.x - deltaXmm / frame.width, 0, 1);
    const y = clamp(drag.startFocus.y - deltaYmm / frame.height, 0, 1);
    updateSetting('cropFocus', { x, y });
  }

  return {
    onPointerDown(event: PointerEvent<HTMLCanvasElement>) {
      // 확대된 상태(팔레트보다 큰 이미지)에서만 위치 이동이 의미가 있다.
      if (settings.imageScale <= 1) return;
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
