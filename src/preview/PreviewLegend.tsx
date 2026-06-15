export function PreviewLegend() {
  return (
    <div className="preview-legend" aria-label="미리보기 영역 설명">
      <span>
        <i className="legend-swatch red" /> 페이지 경계선
      </span>
      <span>
        <i className="legend-swatch blue" /> A4 용지
      </span>
      <span>
        <i className="legend-swatch yellow" /> 분할된 이미지 영역
      </span>
      <span>
        <i className="legend-swatch purple" /> 페이지 번호
      </span>
      <span>
        <i className="legend-swatch black" /> 풀칠 영역
      </span>
      <span>1-1, 1-2: 붙이는 순서</span>
    </div>
  );
}
