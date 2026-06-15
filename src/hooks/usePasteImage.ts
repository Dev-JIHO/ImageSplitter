import { useEffect } from 'react';

/**
 * 클립보드에 복사된 이미지를 Ctrl+V(또는 붙여넣기)로 불러온다.
 * 이미지 항목이 있을 때만 처리하므로 입력칸의 텍스트 붙여넣기는 방해하지 않는다.
 */
export function usePasteImage(onFile: (file: File) => void) {
  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i += 1) {
        const item = items[i];
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (!file) continue;
          event.preventDefault();
          // 클립보드 이미지는 이름이 비어 있는 경우가 많아 기본 이름을 부여한다.
          const named =
            file.name && file.name.trim() !== ''
              ? file
              : new File([file], `clipboard.${extensionFromType(file.type)}`, {
                  type: file.type,
                });
          onFile(named);
          return;
        }
      }
    };

    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [onFile]);
}

function extensionFromType(type: string) {
  const subtype = type.split('/')[1] ?? 'png';
  return subtype === 'jpeg' ? 'jpg' : subtype;
}
