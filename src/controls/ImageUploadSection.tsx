import { supportedImageAccept, supportedImageText } from '../constants';
import type { LoadedImage } from '../lib/imageLoader';

export function ImageUploadSection({
  loadedImage,
  imageError,
  onFileSelected,
}: {
  loadedImage: LoadedImage | null;
  imageError: string;
  onFileSelected: (file: File | undefined) => void;
}) {
  return (
    <>
      <div className="step-heading">
        <span className={loadedImage ? 'done' : ''}>{loadedImage ? '✓' : '1'}</span>
        <strong>이미지 선택</strong>
      </div>
      <div className="upload-row" data-tour="upload">
        <label className="upload-button">
          사진 선택
          <input
            type="file"
            accept={supportedImageAccept}
            onChange={(event) => onFileSelected(event.target.files?.[0])}
          />
        </label>
        <span className="upload-filename" title={loadedImage?.name}>
          {loadedImage ? loadedImage.name : '선택된 사진 없음'}
        </span>
      </div>
      <p className="hint-text">
        오른쪽 미리보기 영역에 사진을 끌어다 놓거나, 복사한 이미지를 붙여넣기(Ctrl+V)
        해도 됩니다. {supportedImageText}.
      </p>
      {imageError ? <p className="error-text">{imageError}</p> : null}
    </>
  );
}
