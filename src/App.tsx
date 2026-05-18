import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import type { Dispatch, RefObject, SetStateAction } from 'react';
import {
  createManualGridPlan,
  recommendTargetGrid,
  type GridPlan,
  type Orientation,
} from './lib/geometry';
import { createExportFilename } from './lib/exportFilename';
import { loadImageFile, type LoadedImage } from './lib/imageLoader';
import { exportPosterPdf } from './lib/pdfExport';
import {
  calculatePreviewToolbarPosition,
  type ToolbarPosition,
} from './lib/previewToolbar';
import {
  createPosterLayout,
  getGlueMarks,
  getPagePrinterFrame,
  getPhysicalPrintableFrame,
  type CropFocus,
  type FitMode,
  type PosterLayout,
} from './lib/posterLayout';
import {
  resolveTargetSize,
  type TargetSizeMode,
  type ResolvedTargetSize,
} from './lib/targetSize';

type SizingMode = 'manual' | 'target';

interface Settings {
  mode: SizingMode;
  fitMode: FitMode;
  targetSizeMode: TargetSizeMode;
  orientation: Orientation;
  rows: number;
  columns: number;
  targetWidthMm: number;
  targetHeightMm: number;
  overlapMm: number;
  printerMarginMm: number;
  exportDpi: number;
  rotationDeg: number;
  imageScale: number;
  cropFocus: CropFocus;
  showPageNumbers: boolean;
  showPageBoundaries: boolean;
  showGlueMarks: boolean;
}

const initialSettings: Settings = {
  mode: 'manual',
  fitMode: 'cover',
  targetSizeMode: 'both',
  orientation: 'portrait',
  rows: 2,
  columns: 2,
  targetWidthMm: 420,
  targetHeightMm: 594,
  overlapMm: 10,
  printerMarginMm: 0,
  exportDpi: 200,
  rotationDeg: 0,
  imageScale: 1,
  cropFocus: { x: 0.5, y: 0.5 },
  showPageNumbers: true,
  showPageBoundaries: true,
  showGlueMarks: true,
};

const supportedImageAccept = 'image/jpeg,image/png,image/webp,image/gif,image/avif';
const supportedImageText = 'JPG, PNG, WebP, GIF, AVIF 지원';

export default function App() {
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const [loadedImage, setLoadedImage] = useState<LoadedImage | null>(null);
  const [imageError, setImageError] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState<ToolbarPosition>({
    top: 12,
    right: 12,
  });
  const previewPanelRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const toolbarRef = useRef<HTMLDivElement | null>(null);

  const preparedImage = useMemo(() => {
    if (!loadedImage) return null;
    return createRotatedImageSource(loadedImage.image, settings.rotationDeg);
  }, [loadedImage, settings.rotationDeg]);

  const layoutState = useMemo(() => {
    if (!preparedImage) {
      return { plan: null, layout: null, targetSize: null, error: '' };
    }

    try {
      const targetSize =
        settings.mode === 'target'
          ? resolveTargetSize({
              mode: settings.targetSizeMode,
              widthMm: settings.targetWidthMm,
              heightMm: settings.targetHeightMm,
              image: preparedImage.size,
            })
          : null;
      const effectiveFitMode = settings.fitMode;
      const plan = targetSize
        ? recommendTargetGrid({
            targetWidthMm: targetSize.widthMm,
            targetHeightMm: targetSize.heightMm,
            overlapMm: settings.overlapMm,
            printerMarginMm: settings.printerMarginMm,
          })
        : createManualGridPlan({
            orientation: settings.orientation,
            rows: settings.rows,
            columns: settings.columns,
            overlapMm: settings.overlapMm,
            printerMarginMm: settings.printerMarginMm,
          });
      const layout = createPosterLayout(plan, {
        image: preparedImage.size,
        fitMode: effectiveFitMode,
        cropFocus: effectiveFitMode === 'cover' ? settings.cropFocus : undefined,
        imageScale: effectiveFitMode === 'cover' ? settings.imageScale : 1,
        outputFrameMm: targetSize
          ? { width: targetSize.widthMm, height: targetSize.heightMm }
          : undefined,
      });
      return { plan, layout, targetSize, error: '' };
    } catch (error) {
      return {
        plan: null,
        layout: null,
        targetSize: null,
        error: error instanceof Error ? error.message : '?ㅼ젙???뺤씤?댁＜?몄슂.',
      };
    }
  }, [preparedImage, settings]);

  useEffect(() => {
    if (!preparedImage || !layoutState.plan || !layoutState.layout) return;
    renderPreview(
      canvasRef.current,
      preparedImage.source,
      layoutState.plan,
      layoutState.layout,
      settings,
    );
  }, [preparedImage, layoutState.plan, layoutState.layout, settings]);

  useEffect(() => {
    if (!loadedImage || !layoutState.plan || !layoutState.layout) return;

    const updateToolbarPosition = () => {
      const panel = previewPanelRef.current;
      const canvas = canvasRef.current;
      const toolbar = toolbarRef.current;
      if (!panel || !canvas || !toolbar) return;

      setToolbarPosition(
        calculatePreviewToolbarPosition(
          panel.getBoundingClientRect(),
          canvas.getBoundingClientRect(),
          toolbar.getBoundingClientRect(),
        ),
      );
    };

    updateToolbarPosition();
    window.addEventListener('resize', updateToolbarPosition);
    return () => window.removeEventListener('resize', updateToolbarPosition);
  }, [loadedImage, layoutState.plan, layoutState.layout, settings]);

  async function handleFileChange(file: File | undefined) {
    setImageError('');
    if (!file) return;

    try {
      const nextImage = await loadImageFile(file);
      setLoadedImage((previous) => {
        if (previous) URL.revokeObjectURL(previous.url);
        return nextImage;
      });
      setSettings((current) => ({
        ...current,
        rotationDeg: 0,
        imageScale: 1,
        cropFocus: { x: 0.5, y: 0.5 },
      }));
    } catch (error) {
      setImageError(error instanceof Error ? error.message : '?대?吏 ?낅줈???ㅽ뙣');
    }
  }

  function updateSetting<Key extends keyof Settings>(
    key: Key,
    value: Settings[Key],
  ) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  function handleRequestExport() {
    if (!loadedImage || !preparedImage || !layoutState.plan || !layoutState.layout) return;
    setIsConfirmOpen(true);
  }

  function handleExport() {
    if (!loadedImage || !preparedImage || !layoutState.plan || !layoutState.layout) return;

    setIsExporting(true);
    try {
      exportPosterPdf({
        image: preparedImage.source,
        plan: layoutState.plan,
        layout: layoutState.layout,
        dpi: settings.exportDpi,
        showPageNumbers: settings.showPageNumbers,
        showPageBoundaries: settings.showPageBoundaries,
        showGlueMarks: settings.showGlueMarks,
        filename: createExportFilename({
          originalName: loadedImage.name,
          rows: layoutState.plan.rows,
          columns: layoutState.plan.columns,
          pageCount: layoutState.plan.pageCount,
          targetWidthMm: layoutState.targetSize?.widthMm,
          targetHeightMm: layoutState.targetSize?.heightMm,
        }),
      });
      setIsConfirmOpen(false);
    } finally {
      setIsExporting(false);
    }
  }

  function updateCropFocusFromPointer(event: PointerEvent<HTMLCanvasElement>) {
    if (!layoutState.plan || !layoutState.layout || layoutState.layout.fitMode !== 'cover') {
      return;
    }

    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width / (canvas.width / layoutState.plan.totalWidthMm);
    const scaleY = canvas.height / rect.height / (canvas.height / layoutState.plan.totalHeightMm);
    const xMm = (event.clientX - rect.left) * scaleX;
    const yMm = (event.clientY - rect.top) * scaleY;
    const frame = layoutState.layout.imageFrameMm;
    const x = clamp((xMm - frame.x) / frame.width, 0, 1);
    const y = clamp((yMm - frame.y) / frame.height, 0, 1);
    updateSetting('cropFocus', { x, y });
  }

  return (
    <main className="app-shell" aria-label="A4 이미지 분할 PDF 생성기">
      <section className="control-panel" aria-label="분할 설정">
        <div className="title-block">
          <h1>A4 이미지 분할</h1>
          <p>큰 이미지를 여러 장의 A4로 나누어 인쇄용 PDF를 만듭니다.</p>
        </div>

        <div className="step-heading">
          <span>1</span>
          <strong>이미지 선택</strong>
        </div>
        <label
          className={`upload-drop-zone ${isDraggingFile ? 'is-dragging' : ''}`}
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDraggingFile(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            if (event.currentTarget === event.target) {
              setIsDraggingFile(false);
            }
          }}
          onDrop={(event) => {
            event.preventDefault();
            setIsDraggingFile(false);
            handleFileChange(event.dataTransfer.files[0]);
          }}
        >
          <strong>
            {loadedImage ? loadedImage.name : '이미지를 끌어오거나 클릭해서 선택'}
          </strong>
          <span>여러 장의 A4로 나눌 사진 파일을 넣어주세요.</span>
          <small>{supportedImageText}</small>
          <input
            type="file"
            accept={supportedImageAccept}
            onChange={(event) => handleFileChange(event.target.files?.[0])}
          />
        </label>
        {imageError ? <p className="error-text">{imageError}</p> : null}

        <div className="step-heading">
          <span>2</span>
          <strong>크기 정하기</strong>
        </div>
        <fieldset className="segmented">
          <legend>어떻게 크게 만들까요?</legend>
          <button
            type="button"
            className={settings.mode === 'manual' ? 'active' : ''}
            onClick={() => updateSetting('mode', 'manual')}
          >
            A4 장수로 만들기
          </button>
          <button
            type="button"
            className={settings.mode === 'target' ? 'active' : ''}
            onClick={() => updateSetting('mode', 'target')}
          >
            완성 크기로 만들기
          </button>
        </fieldset>
        <p className="hint-text">
          장수를 알면 왼쪽, 원하는 포스터 크기를 알면 오른쪽을 고르세요.
        </p>

        <div className="step-heading">
          <span>3</span>
          <strong>인쇄 설정</strong>
        </div>
        <fieldset className="segmented">
          <legend>이미지 배치</legend>
          <button
            type="button"
            className={settings.fitMode === 'cover' ? 'active' : ''}
            onClick={() => updateSetting('fitMode', 'cover')}
          >
            빈칸 없이 채우기
          </button>
          <button
            type="button"
            className={settings.fitMode === 'fit' ? 'active' : ''}
            onClick={() => updateSetting('fitMode', 'fit')}
          >
            이미지 안 자르기
          </button>
        </fieldset>
        <p className="hint-text">
          빈칸 없이 채우기는 일부가 잘릴 수 있고, 이미지 안 자르기는 빈칸이 생길 수 있습니다.
        </p>
        <p className="hint-text">
          회전, 확대, 위치 조정은 오른쪽 미리보기 위의 작은 도구에서 할 수 있습니다.
        </p>

        {settings.mode === 'manual' ? (
          <>
            <label className="field">
              <span>A4 방향</span>
              <select
                value={settings.orientation}
                onChange={(event) =>
                  updateSetting('orientation', event.target.value as Orientation)
                }
              >
                <option value="portrait">세로</option>
                <option value="landscape">가로</option>
              </select>
            </label>
            <div className="field-grid">
              <NumberField
                label="행"
                value={settings.rows}
                min={1}
                step={1}
                onChange={(value) => updateSetting('rows', Math.round(value))}
              />
              <NumberField
                label="열"
                value={settings.columns}
                min={1}
                step={1}
                onChange={(value) => updateSetting('columns', Math.round(value))}
              />
            </div>
            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                setSettings((current) => ({
                  ...current,
                  rows: current.columns,
                  columns: current.rows,
                  orientation:
                    current.orientation === 'portrait' ? 'landscape' : 'portrait',
                }))
              }
            >
              행/열과 A4 방향 바꾸기
            </button>
          </>
        ) : (
          <>
            <fieldset className="segmented segmented-three">
              <legend>입력 기준</legend>
              <button
                type="button"
                className={settings.targetSizeMode === 'width' ? 'active' : ''}
                onClick={() => updateSetting('targetSizeMode', 'width')}
              >
                가로만
              </button>
              <button
                type="button"
                className={settings.targetSizeMode === 'height' ? 'active' : ''}
                onClick={() => updateSetting('targetSizeMode', 'height')}
              >
                세로만
              </button>
              <button
                type="button"
                className={settings.targetSizeMode === 'both' ? 'active' : ''}
                onClick={() => updateSetting('targetSizeMode', 'both')}
              >
                가로+세로
              </button>
            </fieldset>
            <div className="field-grid">
              <NumberField
                label="완성 가로(mm)"
                value={settings.targetWidthMm}
                min={1}
                step={1}
                disabled={settings.targetSizeMode === 'height'}
                onChange={(value) => updateSetting('targetWidthMm', value)}
              />
              <NumberField
                label="완성 세로(mm)"
                value={settings.targetHeightMm}
                min={1}
                step={1}
                disabled={settings.targetSizeMode === 'width'}
                onChange={(value) => updateSetting('targetHeightMm', value)}
              />
            </div>
          </>
        )}

        <div className="field-grid">
          <NumberField
            label="겹침 여백(mm)"
            value={settings.overlapMm}
            min={0}
            step={1}
            onChange={(value) => updateSetting('overlapMm', value)}
          />
        </div>
        <p className="hint-text">
          한쪽 겹침 영역을 남겨 풀칠하고, 다른 쪽은 잘라내 이어붙일 수 있습니다.
        </p>

        <fieldset className="segmented segmented-three">
          <legend>프린터 여백 보정</legend>
          {[0, 3, 5].map((margin) => (
            <button
              key={margin}
              type="button"
              className={settings.printerMarginMm === margin ? 'active' : ''}
              onClick={() => updateSetting('printerMarginMm', margin)}
            >
              {margin === 0 ? '없음' : `${margin}mm`}
            </button>
          ))}
        </fieldset>
        <NumberField
          label="직접 입력(mm)"
          value={settings.printerMarginMm}
          min={0}
          step={1}
          onChange={(value) => updateSetting('printerMarginMm', value)}
        />
        <p className="hint-text">
          일반 프린터는 3~5mm를 권장합니다. 켜면 같은 크기에 더 많은 A4가 필요할 수 있습니다.
        </p>

        <fieldset className="segmented segmented-three">
          <legend>출력 해상도</legend>
          {[150, 200, 300].map((dpi) => (
            <button
              key={dpi}
              type="button"
              className={settings.exportDpi === dpi ? 'active' : ''}
              onClick={() => updateSetting('exportDpi', dpi)}
            >
              {dpi} DPI
            </button>
          ))}
        </fieldset>
        <p className="hint-text">
          300 DPI는 더 선명하지만 PDF 생성이 느려질 수 있습니다.
        </p>

        <label className="check-field">
          <input
            type="checkbox"
            checked={settings.showPageNumbers}
            onChange={(event) =>
              updateSetting('showPageNumbers', event.target.checked)
            }
          />
          <span>페이지 번호 표시</span>
        </label>
        <label className="check-field">
          <input
            type="checkbox"
            checked={settings.showPageBoundaries}
            onChange={(event) =>
              updateSetting('showPageBoundaries', event.target.checked)
            }
          />
          <span>페이지 경계선 표시</span>
        </label>
        <label className="check-field">
          <input
            type="checkbox"
            checked={settings.showGlueMarks}
            onChange={(event) => updateSetting('showGlueMarks', event.target.checked)}
          />
          <span>풀칠 영역 표시</span>
        </label>

        <p className="print-note">
          인쇄 창에서 반드시 실제 크기 또는 100%를 선택하고, 용지에 맞춤은 꺼주세요.
        </p>

        <Summary
          plan={layoutState.plan}
          layout={layoutState.layout}
          targetSize={layoutState.targetSize}
          error={layoutState.error}
        />

        <button
          type="button"
          className="export-button"
          disabled={!loadedImage || !layoutState.plan || !layoutState.layout || isExporting}
          onClick={handleRequestExport}
        >
          {isExporting ? 'PDF 생성 중' : 'PDF 내보내기'}
        </button>
      </section>

      <section
        ref={previewPanelRef}
        className="preview-panel"
        aria-label="분할 미리보기"
      >
        <PreviewLegend />
        {loadedImage && layoutState.plan && layoutState.layout ? (
          <>
            <PreviewToolbar
              settings={settings}
              updateSetting={updateSetting}
              setSettings={setSettings}
              position={toolbarPosition}
              toolbarRef={toolbarRef}
            />
            <canvas
              ref={canvasRef}
              className={`preview-canvas ${
                layoutState.layout.fitMode === 'cover' ? 'is-draggable' : ''
              }`}
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                updateCropFocusFromPointer(event);
              }}
              onPointerMove={(event) => {
                if (event.buttons === 1) updateCropFocusFromPointer(event);
              }}
              onPointerUp={(event) => {
                event.currentTarget.releasePointerCapture(event.pointerId);
              }}
            />
          </>
        ) : (
          <div className="empty-preview">
            <strong>?대?吏瑜??낅줈?쒗븯硫?誘몃━蹂닿린媛 ?쒖떆?⑸땲??</strong>
            <span>A4 寃쎄퀎, ?섏씠吏 踰덊샇, ?щ갚 ?곸슜 寃곌낵瑜??뺤씤?????덉뒿?덈떎.</span>
          </div>
        )}
      </section>
      {isConfirmOpen && layoutState.plan && layoutState.layout ? (
        <ExportConfirmModal
          plan={layoutState.plan}
          layout={layoutState.layout}
          settings={settings}
          onCancel={() => setIsConfirmOpen(false)}
          onConfirm={handleExport}
          isExporting={isExporting}
        />
      ) : null}
    </main>
  );
}

function PreviewLegend() {
  return (
    <div className="preview-legend" aria-label="誘몃━蹂닿린 ?쒖떆 ?ㅻ챸">
      <span>
        <i className="legend-swatch red" /> 諛붽묑 ?щ갚
      </span>
      <span>
        <i className="legend-swatch blue" /> A4 寃쎄퀎
      </span>
      <span>
        <i className="legend-swatch yellow" /> 寃뱀퀜 遺숈씪 ?곸뿭
      </span>
      <span>
        <i className="legend-swatch purple" /> ?꾨┛???щ갚
      </span>
      <span>
        <i className="legend-swatch green" /> 풀칠 영역
      </span>
      <span>1-1, 1-2: 遺숈씠???쒖꽌</span>
    </div>
  );
}

function PreviewToolbar({
  settings,
  updateSetting,
  setSettings,
  position,
  toolbarRef,
}: {
  settings: Settings;
  updateSetting: <Key extends keyof Settings>(
    key: Key,
    value: Settings[Key],
  ) => void;
  setSettings: Dispatch<SetStateAction<Settings>>;
  position: ToolbarPosition;
  toolbarRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      ref={toolbarRef}
      className="preview-toolbar"
      style={{ top: position.top, right: position.right }}
      aria-label="?대?吏 誘몃━蹂닿린 議곗젙"
    >
      <button
        type="button"
        className="toolbar-button"
        onClick={() =>
          setSettings((current) => ({
            ...current,
            rotationDeg: normalizeRotation(current.rotationDeg - 90),
            cropFocus: { x: 0.5, y: 0.5 },
          }))
        }
      >
        ?쇱そ 90??      </button>
      <button
        type="button"
        className="toolbar-button"
        onClick={() =>
          setSettings((current) => ({
            ...current,
            rotationDeg: normalizeRotation(current.rotationDeg + 90),
            cropFocus: { x: 0.5, y: 0.5 },
          }))
        }
      >
        ?ㅻⅨ履?90??      </button>
      <label className="toolbar-range">
        <span>?뺣?</span>
        <input
          type="range"
          min={1}
          max={2}
          step={0.01}
          value={settings.imageScale}
          disabled={settings.fitMode !== 'cover'}
          onChange={(event) =>
            updateSetting('imageScale', Number(event.target.value))
          }
        />
        <strong>{Math.round(settings.imageScale * 100)}%</strong>
      </label>
      <button
        type="button"
        className="toolbar-button"
        disabled={settings.fitMode !== 'cover'}
        onClick={() => updateSetting('cropFocus', { x: 0.5, y: 0.5 })}
      >
        媛?대뜲 留욎땄
      </button>
      <button
        type="button"
        className="toolbar-button"
        disabled={settings.fitMode !== 'cover'}
        onClick={() => updateSetting('imageScale', 1)}
      >
        ?뺣? 珥덇린??      </button>
      {settings.fitMode === 'cover' ? (
        <span className="toolbar-hint">?ъ쭊???쒕옒洹명빐???꾩튂 議곗젙</span>
      ) : null}
    </div>
  );
}

function ExportConfirmModal({
  plan,
  layout,
  settings,
  onCancel,
  onConfirm,
  isExporting,
}: {
  plan: GridPlan;
  layout: PosterLayout;
  settings: Settings;
  onCancel: () => void;
  onConfirm: () => void;
  isExporting: boolean;
}) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="export-title">
        <h2 id="export-title">PDF 만들기 전 확인</h2>
        <dl className="confirm-list">
          <div>
            <dt>A4 방향</dt>
            <dd>{plan.orientation === 'portrait' ? '세로' : '가로'}</dd>
          </div>
          <div>
            <dt>총 장수</dt>
            <dd>{plan.pageCount}장</dd>
          </div>
          <div>
            <dt>배치</dt>
            <dd>{settings.fitMode === 'cover' ? '빈칸 없이 채우기' : '이미지 안 자르기'}</dd>
          </div>
          <div>
            <dt>이미지 크기</dt>
            <dd>{round(layout.imageFrameMm.width)} x {round(layout.imageFrameMm.height)}mm</dd>
          </div>
          <div>
            <dt>페이지 번호</dt>
            <dd>{settings.showPageNumbers ? '표시' : '숨김'}</dd>
          </div>
          <div>
            <dt>풀칠 영역</dt>
            <dd>{settings.showGlueMarks ? '표시' : '숨김'}</dd>
          </div>
          <div>
            <dt>회전</dt>
            <dd>{settings.rotationDeg}도</dd>
          </div>
          <div>
            <dt>확대</dt>
            <dd>{Math.round(settings.imageScale * 100)}%</dd>
          </div>
          <div>
            <dt>출력 해상도</dt>
            <dd>{settings.exportDpi} DPI</dd>
          </div>
          <div>
            <dt>프린터 여백 보정</dt>
            <dd>{settings.printerMarginMm > 0 ? `${settings.printerMarginMm}mm` : '없음'}</dd>
          </div>
        </dl>
        <p className="modal-warning">
          인쇄 창에서 실제 크기 또는 100%를 선택하고, 용지에 맞춤은 꺼야 완성 크기가 유지됩니다.
        </p>
        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onCancel}>
            다시 확인하기
          </button>
          <button type="button" className="export-button" onClick={onConfirm} disabled={isExporting}>
            {isExporting ? 'PDF 생성 중' : '확인하고 PDF 만들기'}
          </button>
        </div>
      </section>
    </div>
  );
}

function NumberField(props: {
  label: string;
  value: number;
  min: number;
  step: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  const [draft, setDraft] = useState(String(props.value));

  useEffect(() => {
    setDraft(String(props.value));
  }, [props.value]);

  function commitDraft(nextDraft: string) {
    const normalized = normalizeNumberDraft(nextDraft);
    setDraft(normalized);
    if (normalized === '') return;

    const nextValue = Number(normalized);
    if (Number.isFinite(nextValue)) {
      props.onChange(Math.max(props.min, nextValue));
    }
  }

  function handleBlur() {
    if (draft === '' || !Number.isFinite(Number(draft))) {
      setDraft(String(props.value));
      return;
    }
    setDraft(String(Math.max(props.min, Number(draft))));
  }

  function stepDraft(direction: 1 | -1) {
    const base = draft === '' || !Number.isFinite(Number(draft)) ? props.value : Number(draft);
    const nextValue = Math.max(props.min, roundNumber(base + props.step * direction));
    setDraft(String(nextValue));
    props.onChange(nextValue);
  }

  return (
    <label className="field">
      <span>{props.label}</span>
      <div className="number-input-control">
        <input
          type="text"
          inputMode="decimal"
          min={props.min}
          step={props.step}
          value={draft}
          disabled={props.disabled}
          onChange={(event) => commitDraft(event.target.value)}
          onBlur={handleBlur}
        />
        <div className="number-stepper" aria-hidden={props.disabled}>
          <button
            type="button"
            tabIndex={-1}
            disabled={props.disabled}
            aria-label={`${props.label} 利앷?`}
            onClick={() => stepDraft(1)}
          >
            ??          </button>
          <button
            type="button"
            tabIndex={-1}
            disabled={props.disabled}
            aria-label={`${props.label} 媛먯냼`}
            onClick={() => stepDraft(-1)}
          >
            ??          </button>
        </div>
      </div>
    </label>
  );
}

function Summary({
  plan,
  layout,
  targetSize,
  error,
}: {
  plan: GridPlan | null;
  layout: PosterLayout | null;
  targetSize: ResolvedTargetSize | null;
  error: string;
}) {
  if (error) {
    return <p className="error-text">{error}</p>;
  }

  if (!plan || !layout) {
    return <p className="hint-text">이미지를 업로드하고 설정을 입력해주세요.</p>;
  }

  return (
    <dl className="summary">
      <div>
        <dt>추천/설정</dt>
        <dd>{plan.orientation === 'portrait' ? 'A4 세로' : 'A4 가로'} · {plan.rows}행 x {plan.columns}열</dd>
      </div>
      <div>
        <dt>PDF</dt>
        <dd>{plan.pageCount}장</dd>
      </div>
      <div>
        <dt>팔레트</dt>
        <dd>{round(plan.totalWidthMm)} x {round(plan.totalHeightMm)}mm</dd>
      </div>
      <div>
        <dt>이미지 배치</dt>
        <dd>{round(layout.imageFrameMm.width)} x {round(layout.imageFrameMm.height)}mm</dd>
      </div>
      {targetSize ? (
        <div>
          <dt>요청 크기</dt>
          <dd>{round(targetSize.widthMm)} x {round(targetSize.heightMm)}mm</dd>
        </div>
      ) : null}
    </dl>
  );
}

function renderPreview(
  canvas: HTMLCanvasElement | null,
  image: CanvasImageSource,
  plan: GridPlan,
  layout: PosterLayout,
  settings: Settings,
) {
  if (!canvas) return;
  const context = canvas.getContext('2d');
  if (!context) return;

  const maxWidth = 1200;
  const scale = Math.min(maxWidth / plan.totalWidthMm, 2.1);
  canvas.width = Math.max(320, Math.round(plan.totalWidthMm * scale));
  canvas.height = Math.max(220, Math.round(plan.totalHeightMm * scale));

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.save();
  context.scale(scale, scale);

  context.fillStyle = 'rgba(229, 76, 76, 0.12)';
  context.fillRect(0, 0, plan.totalWidthMm, plan.totalHeightMm);
  const printableFrame = getPhysicalPrintableFrame(plan);
  context.clearRect(
    printableFrame.x,
    printableFrame.y,
    printableFrame.width,
    printableFrame.height,
  );
  context.fillStyle = '#ffffff';
  context.fillRect(
    printableFrame.x,
    printableFrame.y,
    printableFrame.width,
    printableFrame.height,
  );

  if (settings.printerMarginMm > 0) {
    context.fillStyle = 'rgba(126, 87, 194, 0.13)';
    for (let row = 0; row < plan.rows; row += 1) {
      for (let column = 0; column < plan.columns; column += 1) {
        const pageX = column * plan.page.widthMm;
        const pageY = row * plan.page.heightMm;
        const printerFrame = getPagePrinterFrame(plan, row, column);
        context.fillRect(pageX, pageY, plan.page.widthMm, settings.printerMarginMm);
        context.fillRect(
          pageX,
          pageY + plan.page.heightMm - settings.printerMarginMm,
          plan.page.widthMm,
          settings.printerMarginMm,
        );
        context.fillRect(pageX, pageY, settings.printerMarginMm, plan.page.heightMm);
        context.fillRect(
          pageX + plan.page.widthMm - settings.printerMarginMm,
          pageY,
          settings.printerMarginMm,
          plan.page.heightMm,
        );
        context.strokeStyle = 'rgba(126, 87, 194, 0.7)';
        context.lineWidth = Math.max(1 / scale, 0.6);
        context.strokeRect(
          printerFrame.x,
          printerFrame.y,
          printerFrame.width,
          printerFrame.height,
        );
      }
    }
  }

  context.drawImage(
    image,
    layout.sourceX,
    layout.sourceY,
    layout.sourceWidth,
    layout.sourceHeight,
    layout.imageFrameMm.x,
    layout.imageFrameMm.y,
    layout.imageFrameMm.width,
    layout.imageFrameMm.height,
  );

  if (settings.overlapMm > 0) {
    context.fillStyle = 'rgba(255, 180, 0, 0.12)';
    layout.slices.forEach((slice) => {
      context.fillRect(
        slice.previewXmm,
        slice.previewYmm,
        slice.previewWidthMm,
        slice.previewHeightMm,
      );
    });
  }

  if (settings.showGlueMarks && settings.overlapMm > 0) {
    context.fillStyle = 'rgba(47, 125, 84, 0.18)';
    context.strokeStyle = 'rgba(26, 96, 65, 0.8)';
    context.lineWidth = Math.max(1 / scale, 0.8);
    getGlueMarks(plan).forEach((mark) => {
      context.fillRect(mark.previewXmm, mark.previewYmm, mark.widthMm, mark.heightMm);
      context.strokeRect(mark.previewXmm, mark.previewYmm, mark.widthMm, mark.heightMm);
    });
  }

  context.setLineDash([]);
  context.strokeStyle = 'rgba(229, 76, 76, 0.95)';
  context.lineWidth = Math.max(1 / scale, 0.8);
  context.strokeRect(
    printableFrame.x,
    printableFrame.y,
    printableFrame.width,
    printableFrame.height,
  );

  if (
    layout.outputFrameMm.x !== printableFrame.x ||
    layout.outputFrameMm.y !== printableFrame.y ||
    layout.outputFrameMm.width !== printableFrame.width ||
    layout.outputFrameMm.height !== printableFrame.height
  ) {
    context.strokeStyle = 'rgba(20, 31, 45, 0.55)';
    context.lineWidth = Math.max(1 / scale, 0.7);
    context.strokeRect(
      layout.outputFrameMm.x,
      layout.outputFrameMm.y,
      layout.outputFrameMm.width,
      layout.outputFrameMm.height,
    );
  }

  context.strokeStyle = 'rgba(11, 94, 215, 0.95)';
  context.lineWidth = Math.max(1 / scale, 0.8);
  context.setLineDash([4 / scale, 3 / scale]);

  for (let column = 1; column < plan.columns; column += 1) {
    const x = column * plan.page.widthMm;
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, plan.totalHeightMm);
    context.stroke();
  }
  for (let row = 1; row < plan.rows; row += 1) {
    const y = row * plan.page.heightMm;
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(plan.totalWidthMm, y);
    context.stroke();
  }

  context.setLineDash([]);
  context.strokeStyle = 'rgba(20, 31, 45, 0.9)';
  context.strokeRect(0, 0, plan.totalWidthMm, plan.totalHeightMm);

  if (settings.showPageNumbers) {
    context.font = `${Math.max(11 / scale, 7)}px sans-serif`;
    context.fillStyle = 'rgba(20, 31, 45, 0.82)';
    for (let row = 0; row < plan.rows; row += 1) {
      for (let column = 0; column < plan.columns; column += 1) {
        context.fillText(
          `${row + 1}-${column + 1}`,
          column * plan.page.widthMm + 5 / scale,
          row * plan.page.heightMm + 15 / scale,
        );
      }
    }
  }

  context.restore();
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}

function roundNumber(value: number) {
  return Math.round(value * 1000) / 1000;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeNumberDraft(value: string) {
  const cleaned = value.replace(/[^\d.]/g, '');
  if (cleaned === '') return '';

  const [integerPart, ...decimalParts] = cleaned.split('.');
  const integer = integerPart.replace(/^0+(?=\d)/, '') || '0';
  const decimal = decimalParts.join('');
  return cleaned.includes('.') ? `${integer}.${decimal}` : integer;
}

function normalizeRotation(value: number) {
  return ((value % 360) + 360) % 360;
}

function createRotatedImageSource(image: HTMLImageElement, rotationDeg: number) {
  const rotation = normalizeRotation(rotationDeg);
  const sourceWidth = image.naturalWidth;
  const sourceHeight = image.naturalHeight;

  if (rotation === 0) {
    return {
      source: image as CanvasImageSource,
      size: { widthPx: sourceWidth, heightPx: sourceHeight },
    };
  }

  const canvas = document.createElement('canvas');
  const swapsAxes = rotation === 90 || rotation === 270;
  canvas.width = swapsAxes ? sourceHeight : sourceWidth;
  canvas.height = swapsAxes ? sourceWidth : sourceHeight;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('?대?吏瑜??뚯쟾?????놁뒿?덈떎.');
  }

  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate((rotation * Math.PI) / 180);
  context.drawImage(image, -sourceWidth / 2, -sourceHeight / 2);

  return {
    source: canvas as CanvasImageSource,
    size: { widthPx: canvas.width, heightPx: canvas.height },
  };
}
