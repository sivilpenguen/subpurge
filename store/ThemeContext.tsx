import { createContext, useContext } from 'react';
import { ThemeMode } from '../constants/theme';

export const ThemeContext = createContext<ThemeMode>('dark');

export function useThemeMode(): ThemeMode {
  return useContext(ThemeContext);
}
