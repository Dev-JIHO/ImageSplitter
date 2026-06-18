import { useState } from 'react';
import type { GridPlan } from '../lib/geometry';
import type { PosterLayout } from '../lib/posterLayout';
import { EmptyPreview } from './EmptyPreview';
import { PreviewCanvas } from './PreviewCanvas';
import { PreviewLegend } from './PreviewLegend';

export function PreviewPanel({
  active,
  image,
  plan,
  layout,
  onFileSelected,
}: {
  active: boolean;
  image: CanvasImageSource | null;
  plan: GridPlan | null;
  layout: PosterLayout | null;
  onFileSelected: (file: File | undefined) => void;
}) {
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const ready = !!image && !!plan && !!layout;

  return (
    <section
      className={`preview-panel ${isDraggingFile ? 'is-dropping' : ''}`}
      data-mobile-active={active}
      data-tour="preview"
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
      <div className="preview-scroll">
        {ready && image && plan && layout ? (
          <PreviewCanvas image={image} plan={plan} layout={layout} />
        ) : (
          <EmptyPreview />
        )}
      </div>
      <PreviewLegend />
    </section>
  );
}
