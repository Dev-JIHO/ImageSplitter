import { useEffect } from 'react';

/** 모달이 떠 있는 동안 배경 페이지가 함께 스크롤되지 않도록 막는다. */
export function useBodyScrollLock() {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);
}
