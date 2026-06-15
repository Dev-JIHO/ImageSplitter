import { useRef, useState } from 'react';
import type { GridPlan } from '../lib/geometry';
import type { PosterLayout } from '../lib/posterLayout';
import { useSettings } from '../SettingsContext';
import { usePreviewToolbarPosition } from '../hooks/usePreviewToolbarPosition';
import { EmptyPreview } from './EmptyPreview';
import { PreviewCanvas } from './PreviewCanvas';
import { PreviewExportNav } from './PreviewExportNav';
import { PreviewLegend } from './PreviewLegend';
import { PreviewToolbar } from './PreviewToolbar';

export function PreviewPanel({
  active,
  image,
  plan,
  layout,
  isExporting,
  onFileSelected,
  onRequestExport,
}: {
  active: boolean;
  image: CanvasImageSource | null;
  plan: GridPlan | null;
  layout: PosterLayout | null;
  isExporting: boolean;
  onFileSelected: (file: File | undefined) => void;
  onRequestExport: () => void;
}) {
  const { settings } = useSettings();
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const previewPanelRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const exportNavRef = useRef<HTMLDivElement | null>(null);

  const ready = !!image && !!plan && !!layout;

  const { toolbarPosition, exportNavPosition } = usePreviewToolbarPosition({
    enabled: ready,
    settings,
    previewPanelRef,
    canvasRef,
    toolbarRef,
    exportNavRef,
  });

  return (
    <section
      ref={previewPanelRef}
      className={`preview-panel ${isDraggingFile ? 'is-dropping' : ''}`}
      data-mobile-active={active}
      aria-label="분할 미리보기"
      onDragEnter={(event) => {
        event.preventDefault();
        setIsDraggingFile(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
          setIsDraggingFile(false);
        }
      }}
      onDrop={(event) => {
        event.preventDefault();
        setIsDraggingFile(false);
        onFileSelected(event.dataTransfer.files[0]);
      }}
    >
      {isDraggingFile ? (
        <div className="drop-overlay" aria-hidden>
          사진을 여기에 놓으면 불러옵니다
        </div>
      ) : null}
      <PreviewLegend />
      {ready && image && plan && layout ? (
        <>
          <PreviewToolbar position={toolbarPosition} toolbarRef={toolbarRef} />
          <PreviewCanvas
            image={image}
            plan={plan}
            layout={layout}
            canvasRef={canvasRef}
          />
          <PreviewExportNav
            position={exportNavPosition}
            exportNavRef={exportNavRef}
            disabled={isExporting}
            isExporting={isExporting}
            onRequestExport={onRequestExport}
          />
        </>
      ) : (
        <EmptyPreview />
      )}
    </section>
  );
}
