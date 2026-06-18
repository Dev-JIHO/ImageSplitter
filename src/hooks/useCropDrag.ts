import { useRef, type Dispatch, type PointerEvent, type SetStateAction } from 'react';
import type { GridPlan } from '../lib/geometry';
import { clamp } from '../lib/num';
import { type CropFocus, type PosterLayout } from '../lib/posterLayout';
import type { Settings } from '../types';

const MIN_ZOOM = 1;
const MAX_ZOOM = 8;

interface PanState {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startFocus: CropFocus;
}

interface PinchState {
  startDist: number;
  startScale: number;
}

/**
 * 미리보기 캔버스 제스처: 한 손가락(또는 마우스) 드래그로 위치(crop focus) 이동,
 * 두 손가락 핀치로 확대/축소. 포인터 이벤트 기반이라 마우스·터치 모두 처리한다.
 */
export function useCropDrag(
  plan: GridPlan | null,
  layout: PosterLayout | null,
  settings: Settings,
  updateSetting: <Key extends keyof Settings>(key: Key, value: Settings[Key]) => void,
  setSettings: Dispatch<SetStateAction<Settings>>,
) {
  const panRef = useRef<PanState | null>(null);
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchRef = useRef<PinchState | null>(null);

  function pointerDistance() {
    const points = [...pointers.current.values()];
    if (points.length < 2) return 0;
    return Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
  }

  function updateCropFocusFromDrag(event: PointerEvent<HTMLCanvasElement>) {
    if (!plan || !layout) return;
    const drag = panRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
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
      pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

      // 두 번째 손가락이 닿으면 핀치 시작 — 진행 중이던 드래그는 취소한다.
      if (pointers.current.size >= 2) {
        panRef.current = null;
        pinchRef.current = { startDist: pointerDistance(), startScale: settings.imageScale };
        return;
      }

      // 한 손가락: 확대됐거나 cover 모드일 때만 위치 이동이 의미가 있다.
      if (layout?.fitMode !== 'cover' && settings.imageScale <= 1) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      panRef.current = {
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startFocus: settings.cropFocus,
      };
    },

    onPointerMove(event: PointerEvent<HTMLCanvasElement>) {
      if (pointers.current.has(event.pointerId)) {
        pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
      }

      if (pinchRef.current && pointers.current.size >= 2) {
        const dist = pointerDistance();
        const { startDist, startScale } = pinchRef.current;
        if (startDist > 0) {
          const next = clamp((startScale * dist) / startDist, MIN_ZOOM, MAX_ZOOM);
          setSettings((current) =>
            next === current.imageScale ? current : { ...current, imageScale: next },
          );
        }
        return;
      }

      if (event.buttons === 1 && panRef.current) updateCropFocusFromDrag(event);
    },

    onPointerUp(event: PointerEvent<HTMLCanvasElement>) {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        /* 캡처되지 않은 포인터는 무시 */
      }
      pointers.current.delete(event.pointerId);
      if (pointers.current.size < 2) pinchRef.current = null;
      if (panRef.current?.pointerId === event.pointerId) panRef.current = null;
    },

    onPointerCancel(event: PointerEvent<HTMLCanvasElement>) {
      pointers.current.delete(event.pointerId);
      pinchRef.current = null;
      panRef.current = null;
    },

    onDoubleClick() {
      updateSetting('cropFocus', { x: 0.5, y: 0.5 });
    },
  };
}
