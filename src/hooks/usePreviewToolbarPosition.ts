import { useEffect, useState, type RefObject } from 'react';
import {
  calculatePreviewToolbarPosition,
  type ToolbarPosition,
} from '../lib/previewToolbar';
import type { Settings } from '../types';

interface Params {
  enabled: boolean;
  /** 툴바 크기에 영향을 주는 설정 변화에 재계산이 따라오도록 의존성으로 받는다. */
  settings: Settings;
  previewPanelRef: RefObject<HTMLElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  toolbarRef: RefObject<HTMLDivElement | null>;
  exportNavRef: RefObject<HTMLDivElement | null>;
}

/** 미리보기 툴바와 내보내기 영역의 위치를 캔버스/패널 위치에 맞춰 계산한다. */
export function usePreviewToolbarPosition({
  enabled,
  settings,
  previewPanelRef,
  canvasRef,
  toolbarRef,
  exportNavRef,
}: Params) {
  const [toolbarPosition, setToolbarPosition] = useState<ToolbarPosition>({
    top: 12,
    right: 12,
  });
  const [exportNavPosition, setExportNavPosition] = useState({ top: 12, right: 12 });

  useEffect(() => {
    if (!enabled) return;

    const updateToolbarPosition = () => {
      const panel = previewPanelRef.current;
      const canvas = canvasRef.current;
      const toolbar = toolbarRef.current;
      const exportNav = exportNavRef.current;
      if (!panel || !canvas || !toolbar || !exportNav) return;
      const panelRect = panel.getBoundingClientRect();
      const canvasRect = canvas.getBoundingClientRect();

      setToolbarPosition(
        calculatePreviewToolbarPosition(
          panelRect,
          canvasRect,
          toolbar.getBoundingClientRect(),
        ),
      );
      setExportNavPosition({
        top: Math.max(12, canvasRect.bottom - panelRect.top + 8),
        right: Math.max(0, panelRect.right - canvasRect.right),
      });
    };

    updateToolbarPosition();
    window.addEventListener('resize', updateToolbarPosition);

    const panel = previewPanelRef.current;
    panel?.addEventListener('scroll', updateToolbarPosition, { passive: true });

    // 창 크기 외에 패널/캔버스 자체 크기 변화(모바일 패널 전환 등)에도 반응한다.
    let observer: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(updateToolbarPosition);
      if (panel) observer.observe(panel);
      if (canvasRef.current) observer.observe(canvasRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateToolbarPosition);
      panel?.removeEventListener('scroll', updateToolbarPosition);
      observer?.disconnect();
    };
  }, [enabled, settings, previewPanelRef, canvasRef, toolbarRef, exportNavRef]);

  return { toolbarPosition, exportNavPosition };
}
