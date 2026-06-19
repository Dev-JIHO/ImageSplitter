import { InfoHint } from '../components/InfoHint';
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
        <span className={loadedImage ? 'done' : ''}>{loadedImage ? '✓' : ''}</span>
        <strong>사진 선택</strong>
      </div>

      <div className="upload-group" data-tour="upload">
        <div className="upload-row">
          <label className="upload-button">
            사진 선택
            <input
              type="file"
              accept={supportedImageAccept}
              onChange={(event) => onFileSelected(event.target.files?.[0])}
            />
          </label>
          {!loadedImage ? <span className="upload-empty">선택된 사진 없음</span> : null}
        </div>
        {loadedImage ? (
          <p className="upload-filename" title={loadedImage.name}>
            {loadedImage.name}
          </p>
        ) : null}
      </div>

      <p className="hint-text">
        끌어다 놓기·붙여넣기(Ctrl+V)도 돼요
        <InfoHint>
          오른쪽 미리보기 영역에 사진을 끌어다 놓거나, 복사한 이미지를 Ctrl+V로
          붙여넣을 수 있어요. 지원 형식: {supportedImageText}.
        </InfoHint>
      </p>
      {imageError ? <p className="error-text">{imageError}</p> : null}
    </>
  );
}
