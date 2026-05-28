export type ThemeMode = 'dark' | 'light';

export interface AppTheme {
  mode: ThemeMode;
  bg: string;
  card: string;
  cardStrong: string;
  border: string;
  borderSoft: string;
  text: string;
  subtext: string;
  input: string;
  overlay: string;
  modalBg: string;
  modalActive: string;
  modalDivider: string;
  headerButtonBg: string;
  headerButtonText: string;
  headerButtonBorder: string;
  primaryButtonBg: string;
  primaryButtonText: string;
  secondaryButtonBg: string;
  tabBarBg: string;
  tabBarBorder: string;
  tabBarActive: string;
  tabLabel: string;
  tabLabelActive: string;
  accent: string;
  warning: string;
  success: string;
  inactive: string;
  destructive: string;
}

export const THEMES: Record<ThemeMode, AppTheme> = {
  dark: {
    mode: 'dark',
    bg: '#0F0F0F',
    card: 'rgba(255,255,255,0.06)',
    cardStrong: 'rgba(255,255,255,0.1)',
    border: 'rgba(255,255,255,0.1)',
    borderSoft: 'rgba(255,255,255,0.08)',
    text: '#FFFFFF',
    subtext: '#888888',
    input: 'rgba(255,255,255,0.05)',
    overlay: 'rgba(0,0,0,0.72)',
    modalBg: '#181818',
    modalActive: '#232323',
    modalDivider: '#1F1F1F',
    headerButtonBg: '#000000',
    headerButtonText: '#FFFFFF',
    headerButtonBorder: '#FFFFFF55',
    primaryButtonBg: 'rgba(255,255,255,0.92)',
    primaryButtonText: '#000000',
    secondaryButtonBg: 'rgba(255,255,255,0.04)',
    tabBarBg: 'rgba(160, 20, 20, 0.45)',
    tabBarBorder: 'rgba(255, 80, 80, 0.2)',
    tabBarActive: 'rgba(255, 255, 255, 0.1)',
    tabLabel: 'rgba(255,255,255,0.5)',
    tabLabelActive: '#FFFFFF',
    accent: '#FF453A',
    warning: '#FF9F0A',
    success: '#34C759',
    inactive: '#444444',
    destructive: '#FF3B30',
  },
  light: {
    mode: 'light',
    bg: '#F4F4F5',
    card: '#FFFFFF',
    cardStrong: '#EEF0F3',
    border: 'rgba(17,17,17,0.08)',
    borderSoft: 'rgba(17,17,17,0.08)',
    text: '#111111',
    subtext: '#6B7280',
    input: '#FFFFFF',
    overlay: 'rgba(0,0,0,0.32)',
    modalBg: '#FFFFFF',
    modalActive: '#F3F4F6',
    modalDivider: '#E5E7EB',
    headerButtonBg: '#FFFFFF',
    headerButtonText: '#111111',
    headerButtonBorder: 'rgba(17,17,17,0.12)',
    primaryButtonBg: '#111111',
    primaryButtonText: '#FFFFFF',
    secondaryButtonBg: '#F7F7F8',
    tabBarBg: 'rgba(255,255,255,0.96)',
    tabBarBorder: 'rgba(17,17,17,0.1)',
    tabBarActive: 'rgba(17,17,17,0.08)',
    tabLabel: 'rgba(17,17,17,0.55)',
    tabLabelActive: '#111111',
    accent: '#FF453A',
    warning: '#FF9F0A',
    success: '#34C759',
    inactive: '#7C7C7C',
    destructive: '#D92D20',
  },
};

export function getTheme(mode: ThemeMode): AppTheme {
  return THEMES[mode];
}
