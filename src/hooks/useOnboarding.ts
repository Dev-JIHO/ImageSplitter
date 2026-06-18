import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'imagesplitter:onboarded';
const VERSION = 'v1';

function readDone(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === VERSION;
  } catch {
    return false;
  }
}

function writeDone() {
  try {
    localStorage.setItem(STORAGE_KEY, VERSION);
  } catch {
    // localStorage 차단(시크릿 모드 등) — 무시
  }
}

/** 첫 방문 감지 + 온보딩 투어 상태. 완료/건너뛰기 시 버전 플래그를 저장한다. */
export function useOnboarding() {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!readDone()) {
      setStep(0);
      setActive(true);
    }
  }, []);

  const start = useCallback(() => {
    setStep(0);
    setActive(true);
  }, []);
  const close = useCallback(() => {
    setActive(false);
    writeDone();
  }, []);
  const next = useCallback(() => setStep((value) => value + 1), []);
  const prev = useCallback(() => setStep((value) => Math.max(0, value - 1)), []);

  return { active, step, start, close, next, prev };
}
