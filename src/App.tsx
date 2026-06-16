import { useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { ExportConfirmModal } from './components/ExportConfirmModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { initialSettings } from './constants';
import { SettingsPanel } from './controls/SettingsPanel';
import { useImageUpload } from './hooks/useImageUpload';
import { usePasteImage } from './hooks/usePasteImage';
import { usePosterLayout } from './hooks/usePosterLayout';
import { usePreparedImage } from './hooks/usePreparedImage';
import { usePrintScale } from './hooks/usePrintScale';
import { createExportFilename } from './lib/exportFilename';
import { getActivePageWindow } from './lib/posterLayout';
import { exportPosterPdf } from './lib/pdfExport';
import { exportSeamTestPdf } from './lib/seamTestPdf';
import { PreviewPanel } from './preview/PreviewPanel';
import { PreviewSidebar } from './preview/PreviewSidebar';
import { SettingsProvider } from './SettingsContext';
import type { MobilePanel, Settings } from './types';

const PANEL_MIN_PX = 220;
const PANEL_MAX_PX = 560;

export default function App() {
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const [isExporting, setIsExporting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [hasSeamTestExported, setHasSeamTestExported] = useState(false);
  const [activeMobilePanel, setActiveMobilePanel] = useState<MobilePanel>('settings');
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [leftWidth, setLeftWidth] = useState<number | null>(null);
  const [rightWidth, setRightWidth] = useState<number | null>(null);

  function updateSetting<Key extends keyof Settings>(key: Key, value: Settings[Key]) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  const { loadedImage, imageError, handleFileChange } = useImageUpload(() => {
    // 모바일: 이미지를 올리면 바로 미리보기를 보여주고, 조정 값을 초기화한다.
    setActiveMobilePanel('preview');
    setSettings((current) => ({
      ...current,
      rotationDeg: 0,
      imageScale: 1,
      cropFocus: { x: 0.5, y: 0.5 },
    }));
  });

  // 클립보드 이미지 Ctrl+V 붙여넣기 (업로드와 동일 경로 재사용)
  usePasteImage(handleFileChange);

  const preparedImage = usePreparedImage(loadedImage, settings.rotationDeg);
  const layoutState = usePosterLayout(preparedImage, settings);
  const printScale = usePrintScale(settings, layoutState.plan);

  const ready = !!preparedImage && !!layoutState.plan && !!layoutState.layout;
  const canPan =
    !!layoutState.layout &&
    (layoutState.layout.fitMode === 'cover' || settings.imageScale > 1);

  // 좌·우 패널 너비 드래그 조절. 현재 렌더된 폭에서 시작해 포인터 이동량만큼 가감.
  function startResize(side: 'left' | 'right', event: ReactPointerEvent<HTMLDivElement>) {
    event.preventDefault();
    const selector = side === 'left' ? '.control-panel' : '.tools-panel';
    const panel = document.querySelector(selector);
    const startWidth = panel
      ? panel.getBoundingClientRect().width
      : side === 'left'
        ? 320
        : 280;
    const startX = event.clientX;

    const onMove = (moveEvent: globalThis.PointerEvent) => {
      const delta = moveEvent.clientX - startX;
      const raw = side === 'left' ? startWidth + delta : startWidth - delta;
      const width = Math.round(Math.max(PANEL_MIN_PX, Math.min(PANEL_MAX_PX, raw)));
      if (side === 'left') setLeftWidth(width);
      else setRightWidth(width);
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      document.body.style.userSelect = '';
    };

    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  function handleRequestExport() {
    if (!loadedImage || !preparedImage || !layoutState.plan || !layoutState.layout) return;
    setIsConfirmOpen(true);
  }

  async function handleExport() {
    if (!loadedImage || !preparedImage || !layoutState.plan || !layoutState.layout) return;

    setIsExporting(true);
    try {
      // 무거운 캔버스 작업 전에 한 프레임 양보해 'PDF 생성 중' 상태가 화면에 그려지게 한다.
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => setTimeout(resolve, 0)),
      );
      const activeWindow = getActivePageWindow(layoutState.plan, layoutState.layout.slices);
      await exportPosterPdf({
        image: preparedImage.source,
        plan: layoutState.plan,
        layout: layoutState.layout,
        dpi: settings.exportDpi,
        showPageNumbers: settings.showPageNumbers,
        showPageBoundaries: settings.showPageBoundaries,
        showGlueMarks: settings.showGlueMarks,
        printScale: printScale.factor,
        filename: createExportFilename({
          originalName: loadedImage.name,
          rows: activeWindow.endRow - activeWindow.startRow + 1,
          columns: activeWindow.endColumn - activeWindow.startColumn + 1,
          pageCount: layoutState.layout.slices.length,
          targetWidthMm: layoutState.targetSize?.widthMm,
          targetHeightMm: layoutState.targetSize?.heightMm,
        }),
      });
      setIsConfirmOpen(false);
    } finally {
      setIsExporting(false);
    }
  }

  function handleExportSeamTest() {
    setHasSeamTestExported(true);
    exportSeamTestPdf({
      orientation: layoutState.plan?.orientation ?? settings.orientation,
      overlapMm: settings.overlapMm,
      printerMarginMm: settings.printerMarginMm,
      printScale: printScale.factor,
    });
  }

  const shellStyle = {
    '--left-col': leftWidth != null && !leftCollapsed ? `${leftWidth}px` : undefined,
    '--right-col': rightWidth != null && !rightCollapsed ? `${rightWidth}px` : undefined,
  } as CSSProperties;

  return (
    <SettingsProvider value={{ settings, setSettings, updateSetting }}>
      <main
        className="app-shell"
        style={shellStyle}
        data-left-collapsed={leftCollapsed}
        data-right-collapsed={rightCollapsed}
        aria-label="A4 이미지 분할 PDF 생성기"
      >
        <SettingsPanel
          active={activeMobilePanel !== 'preview'}
          collapsed={leftCollapsed}
          onToggleCollapse={() => setLeftCollapsed((value) => !value)}
          loadedImage={loadedImage}
          imageError={imageError}
          onFileSelected={handleFileChange}
          layoutState={layoutState}
          printScale={printScale}
          hasSeamTestExported={hasSeamTestExported}
          onExportSeamTest={handleExportSeamTest}
        />

        {!leftCollapsed ? (
          <div
            className="resize-handle resize-handle-left"
            onPointerDown={(event) => startResize('left', event)}
            role="separator"
            aria-orientation="vertical"
            aria-label="설정 패널 너비 조절"
            title="드래그해 너비 조절"
          />
        ) : null}

        <PreviewPanel
          active={activeMobilePanel === 'preview'}
          image={preparedImage?.source ?? null}
          plan={layoutState.plan}
          layout={layoutState.layout}
          onFileSelected={handleFileChange}
        />

        {!rightCollapsed ? (
          <div
            className="resize-handle resize-handle-right"
            onPointerDown={(event) => startResize('right', event)}
            role="separator"
            aria-orientation="vertical"
            aria-label="도구 패널 너비 조절"
            title="드래그해 너비 조절"
          />
        ) : null}

        <PreviewSidebar
          active={activeMobilePanel === 'preview'}
          collapsed={rightCollapsed}
          onToggleCollapse={() => setRightCollapsed((value) => !value)}
          ready={ready}
          canPan={canPan}
          isExporting={isExporting}
          onRequestExport={handleRequestExport}
        />

        {isConfirmOpen && layoutState.plan && layoutState.layout ? (
          <ExportConfirmModal
            plan={layoutState.plan}
            layout={layoutState.layout}
            settings={settings}
            printScaleFactor={printScale.factor}
            onCancel={() => setIsConfirmOpen(false)}
            onConfirm={handleExport}
            isExporting={isExporting}
          />
        ) : null}

        <MobileBottomNav
          activePanel={activeMobilePanel}
          hasImage={!!loadedImage}
          onSelect={setActiveMobilePanel}
        />
      </main>
    </SettingsProvider>
  );
}
