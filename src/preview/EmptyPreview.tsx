import { supportedImageAccept } from '../constants';

export function EmptyPreview({
  onFileSelected,
}: {
  onFileSelected: (file: File | undefined) => void;
}) {
  return (
    <div className="empty-preview">
      <strong>사진을 <span className="pointer-fine-only">이 영역에 끌어다 놓거나 </span>아래에서 선택하면 시작돼요.</strong>
      <label className="upload-button">
        사진 선택
        <input
          type="file"
          accept={supportedImageAccept}
          onChange={(event) => onFileSelected(event.target.files?.[0])}
        />
      </label>
      <ol className="empty-steps">
        <li>A4 장수 또는 완성 크기를 정하세요.</li>
        <li>미리보기를 확인하고 PDF로 내보내세요.</li>
        <li>인쇄한 뒤 1-1부터 번호 순서대로 풀칠해 붙이세요.</li>
      </ol>
      <span>처음이라면 “고급 설정” 탭의 프린터 테스트로 인쇄 크기를 먼저 확인해보세요.</span>
    </div>
  );
}
