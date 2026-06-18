import { useSettings } from '../SettingsContext';

export function PreviewLegend() {
  const { settings } = useSettings();
  const showGlue = settings.showGlueMarks && settings.overlapMm > 0;
  const showMargin = settings.printerMarginMm > 0;

  return (
    <div className="preview-legend" aria-label="미리보기 범례">
      <span>
        <i className="legend-swatch boundary" aria-hidden /> 페이지 경계선
      </span>
      {showMargin ? (
        <span>
          <i className="legend-swatch margin" aria-hidden /> 프린터 여백
        </span>
      ) : null}
      {showGlue ? (
        <span>
          <i className="legend-swatch glue" aria-hidden /> 풀칠 영역
        </span>
      ) : null}
      {settings.showPageNumbers ? <span>1-1, 1-2 : 붙이는 순서</span> : null}
    </div>
  );
}
