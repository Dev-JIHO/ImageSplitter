import { createContext, useContext, type Dispatch, type SetStateAction } from 'react';
import type { Settings } from './types';

export interface SettingsContextValue {
  settings: Settings;
  setSettings: Dispatch<SetStateAction<Settings>>;
  updateSetting: <Key extends keyof Settings>(key: Key, value: Settings[Key]) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export const SettingsProvider = SettingsContext.Provider;

export function useSettings(): SettingsContextValue {
  const value = useContext(SettingsContext);
  if (!value) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return value;
}
