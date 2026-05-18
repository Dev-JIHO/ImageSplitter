interface PanelRect {
  top: number;
  right: number;
}

interface CanvasRect {
  top: number;
  right: number;
}

interface ToolbarRect {
  height: number;
}

export interface ToolbarPosition {
  top: number;
  right: number;
}

export function calculatePreviewToolbarPosition(
  panelRect: PanelRect,
  canvasRect: CanvasRect,
  toolbarRect: ToolbarRect,
  gap = 8,
  inset = 12,
): ToolbarPosition {
  return {
    top: Math.max(inset, canvasRect.top - panelRect.top - toolbarRect.height - gap),
    right: Math.max(0, panelRect.right - canvasRect.right),
  };
}
