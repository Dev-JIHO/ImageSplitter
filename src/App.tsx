import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import {
  createManualGridPlan,
  recommendTargetGrid,
  type GridPlan,
  type Orientation,
} from './lib/geometry';
import { loadImageFile, type LoadedImage } from './lib/imageLoader';
import { exportPosterPdf } from './lib/pdfExport';
import {
  createPosterLayout,
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
  marginMm: number;
  overlapMm: number;
  exportDpi: number;
  rotationDeg: number;
  imageScale: number;
  cropFocus: CropFocus;
  showPageNumbers: boolean;
  showPageBoundaries: boolean;
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
  marginMm: 10,
  overlapMm: 10,
  exportDpi: 200,
  rotationDeg: 0,
  imageScale: 1,
  cropFocus: { x: 0.5, y: 0.5 },
  showPageNumbers: true,
  showPageBoundaries: true,
};

export default function App() {
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const [loadedImage, setLoadedImage] = useState<LoadedImage | null>(null);
  const [imageError, setImageError] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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
            marginMm: settings.marginMm,
            overlapMm: settings.overlapMm,
          })
        : createManualGridPlan({
            orientation: settings.orientation,
            rows: settings.rows,
            columns: settings.columns,
            marginMm: settings.marginMm,
            overlapMm: settings.overlapMm,
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
        error: error instanceof Error ? error.message : '설정을 확인해주세요.',
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
      setImageError(error instanceof Error ? error.message : '이미지 업로드 실패');
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
        filename: `${stripExtension(loadedImage.name)}-a4-split.pdf`,
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
          <p>큰 이미지를 여러 장의 A4로 나누어 인쇄할 PDF를 만듭니다.</p>
        </div>

        <div className="step-heading">
          <span>1</span>
          <strong>이미지 선택</strong>
        </div>
        <label className="field">
          <span>나눌 이미지</span>
          <input
            type="file"
            accept="image/*"
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
        <div className="image-adjust-panel">
          <div className="button-row">
            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                setSettings((current) => ({
                  ...current,
                  rotationDeg: normalizeRotation(current.rotationDeg - 90),
                  cropFocus: { x: 0.5, y: 0.5 },
                }))
              }
            >
              왼쪽 90도
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                setSettings((current) => ({
                  ...current,
                  rotationDeg: normalizeRotation(current.rotationDeg + 90),
                  cropFocus: { x: 0.5, y: 0.5 },
                }))
              }
            >
              오른쪽 90도
            </button>
          </div>
          <div className="range-field">
            <label htmlFor="image-scale">이미지 확대율</label>
            <div>
              <input
                id="image-scale"
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
              <span>{Math.round(settings.imageScale * 100)}%</span>
            </div>
          </div>
          <button
            type="button"
            className="secondary-button"
            disabled={settings.fitMode !== 'cover'}
            onClick={() =>
              setSettings((current) => ({
                ...current,
                imageScale: 1,
                cropFocus: { x: 0.5, y: 0.5 },
              }))
            }
          >
            위치와 크기 초기화
          </button>
          {layoutState.layout?.fitMode === 'cover' ? (
            <p className="hint-text">
              미리보기의 이미지를 누르거나 드래그해서 인쇄될 영역을 옮길 수 있습니다.
            </p>
          ) : null}
        </div>

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
            label="바깥 여백(mm)"
            value={settings.marginMm}
            min={0}
            step={1}
            onChange={(value) => updateSetting('marginMm', value)}
          />
          <NumberField
            label="겹쳐 붙일 폭(mm)"
            value={settings.overlapMm}
            min={0}
            step={1}
            onChange={(value) => updateSetting('overlapMm', value)}
          />
        </div>
        <p className="hint-text">
          프린터가 가장자리를 잘라내면 바깥 여백을 15mm 이상으로 늘리세요.
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

      <section className="preview-panel" aria-label="분할 미리보기">
        <PreviewLegend />
        {loadedImage && layoutState.plan && layoutState.layout ? (
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
        ) : (
          <div className="empty-preview">
            <strong>이미지를 업로드하면 미리보기가 표시됩니다.</strong>
            <span>A4 경계, 페이지 번호, 여백 적용 결과를 확인할 수 있습니다.</span>
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
    <div className="preview-legend" aria-label="미리보기 표시 설명">
      <span>
        <i className="legend-swatch red" /> 바깥 여백
      </span>
      <span>
        <i className="legend-swatch blue" /> A4 경계
      </span>
      <span>
        <i className="legend-swatch yellow" /> 겹쳐 붙일 영역
      </span>
      <span>1-1, 1-2: 붙이는 순서</span>
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
            <dd>
              {round(layout.imageFrameMm.width)} x {round(layout.imageFrameMm.height)}mm
            </dd>
          </div>
          <div>
            <dt>페이지 번호</dt>
            <dd>{settings.showPageNumbers ? '표시' : '숨김'}</dd>
          </div>
          <div>
            <dt>회전</dt>
            <dd>{settings.rotationDeg}도</dd>
          </div>
          <div>
            <dt>확대율</dt>
            <dd>{Math.round(settings.imageScale * 100)}%</dd>
          </div>
          <div>
            <dt>출력 해상도</dt>
            <dd>{settings.exportDpi} DPI</dd>
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

  return (
    <label className="field">
      <span>{props.label}</span>
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
        <dd>
          {plan.orientation === 'portrait' ? 'A4 세로' : 'A4 가로'} · {plan.rows}행 x{' '}
          {plan.columns}열
        </dd>
      </div>
      <div>
        <dt>PDF</dt>
        <dd>{plan.pageCount}장</dd>
      </div>
      <div>
        <dt>팔레트</dt>
        <dd>
          {round(plan.totalWidthMm)} x {round(plan.totalHeightMm)}mm
        </dd>
      </div>
      <div>
        <dt>이미지 배치</dt>
        <dd>
          {round(layout.imageFrameMm.width)} x {round(layout.imageFrameMm.height)}mm
        </dd>
      </div>
      {targetSize ? (
        <div>
          <dt>요청 크기</dt>
          <dd>
            {round(targetSize.widthMm)} x {round(targetSize.heightMm)}mm
          </dd>
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
    throw new Error('이미지를 회전할 수 없습니다.');
  }

  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate((rotation * Math.PI) / 180);
  context.drawImage(image, -sourceWidth / 2, -sourceHeight / 2);

  return {
    source: canvas as CanvasImageSource,
    size: { widthPx: canvas.width, heightPx: canvas.height },
  };
}

function stripExtension(name: string) {
  return name.replace(/\.[^.]+$/, '') || 'image';
}
