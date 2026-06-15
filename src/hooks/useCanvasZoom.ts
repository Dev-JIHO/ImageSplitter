import { useEffect, type Dispatch, type RefObject, type SetStateAction } from 'react';
import { clamp } from '../lib/num';
import type { Settings } from '../types';

/**
 * 마우스 휠로 확대/축소 (cover 모드). 페이지 스크롤을 막아야 해서 non-passive로 등록한다.
 */
export function useCanvasZoom(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  enabled: boolean,
  setSettings: Dispatch<SetStateAction<Settings>>,
) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !enabled) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      setSettings((current) => {
        const next = clamp(current.imageScale + (event.deltaY < 0 ? 0.05 : -0.05), 1, 4);
        return next === current.imageScale ? current : { ...current, imageScale: next };
      });
    };

    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [canvasRef, enabled, setSettings]);
}
