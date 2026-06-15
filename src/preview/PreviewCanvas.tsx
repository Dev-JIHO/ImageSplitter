import { useEffect, type RefObject } from 'react';
import type { GridPlan } from '../lib/geometry';
import type { PosterLayout } from '../lib/posterLayout';
import { useSettings } from '../SettingsContext';
import { useCanvasZoom } from '../hooks/useCanvasZoom';
import { useCropDrag } from '../hooks/useCropDrag';
import { drawPoster } from './drawPoster';

export function PreviewCanvas({
  image,
  plan,
  layout,
  canvasRef,
}: {
  image: CanvasImageSource;
  plan: GridPlan;
  layout: PosterLayout;
  canvasRef: RefObject<HTMLCanvasElement | null>;
}) {
  const { settings, setSettings, updateSetting } = useSettings();

  useEffect(() => {
    drawPoster(canvasRef.current, image, plan, layout, settings);
  }, [canvasRef, image, plan, layout, settings]);

  useCanvasZoom(canvasRef, true, setSettings);
  const dragHandlers = useCropDrag(plan, layout, settings, updateSetting);

  return (
    <canvas
      ref={canvasRef}
      className={`preview-canvas ${settings.imageScale > 1 ? 'is-draggable' : ''}`}
      aria-label="미리보기 이미지 위치 조정"
      {...dragHandlers}
    />
  );
}
