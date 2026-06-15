export function EmptyPreview() {
  return (
    <div className="empty-preview">
      <strong>사진을 이 영역에 끌어다 놓으면 바로 시작됩니다.</strong>
      <ol className="empty-steps">
        <li>사진을 여기에 끌어다 놓거나, 붙여넣기(Ctrl+V)하거나, 왼쪽에서 선택하세요.</li>
        <li>A4 장수 또는 완성 크기를 정하세요.</li>
        <li>미리보기를 확인하고 PDF로 내보내세요.</li>
        <li>인쇄한 뒤 1-1부터 번호 순서대로 풀칠해 붙이세요.</li>
      </ol>
      <span>처음이라면 왼쪽 위 프린터 테스트로 인쇄 크기를 먼저 확인해보세요.</span>
    </div>
  );
}
