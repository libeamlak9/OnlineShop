import { useApp } from '../context/AppContext';
import { useTelegram } from '../hooks/useTelegram';
import type { ThemeParams as ThemeParamsType } from '@tma.js/types';

export const colors = {
  background: '#F8F9FA',
  surface: '#FFFFFF',
  text: '#1A1A1A',
  textSecondary: '#6C757D',
  primary: '#007AFF',
  primaryDark: '#0056B3',
  price: '#E53935',
  border: '#DEE2E6',
  danger: '#DC3545',
  dangerLight: '#FFF5F5',
  success: '#28A745',
  warning: '#FFC107',
  shadow: '#000000',
};

export const darkColors = {
  background: '#0F0F0F',
  surface: '#1C1C1E',
  text: '#F2F2F7',
  textSecondary: '#8E8E93',
  primary: '#0A84FF',
  primaryDark: '#409CFF',
  price: '#FF453A',
  border: '#38383A',
  danger: '#FF453A',
  dangerLight: '#3A1A1A',
  success: '#32D74B',
  warning: '#FFCC00',
  shadow: '#000000',
};

export type ColorPalette = typeof colors;

function telegramColors(params: ThemeParamsType): ColorPalette | undefined {
  const bg = params.bg_color;
  const text = params.text_color;
  const hint = params.hint_color;
  const button = params.button_color;
  const buttonText = params.button_text_color;
  const destructive = params.destructive_text_color;
  const link = params.link_color;
  const secondaryBg = params.secondary_bg_color;

  if (!bg || !text) return undefined;

  return {
    background: bg,
    surface: secondaryBg ?? bg,
    text,
    textSecondary: hint ?? text,
    primary: button ?? link ?? '#007AFF',
    primaryDark: link ?? button ?? '#0056B3',
    price: destructive ?? '#E53935',
    border: hint ?? '#DEE2E6',
    danger: destructive ?? '#DC3545',
    dangerLight: secondaryBg ?? bg,
    success: '#28A745',
    warning: '#FFC107',
    shadow: '#000000',
  };
}

export function useThemeColors(): ColorPalette {
  const { theme } = useApp();
  const { isInTelegram, themeParams } = useTelegram();

  if (isInTelegram && themeParams) {
    const tg = telegramColors(themeParams);
    if (tg) return tg;
  }

  return theme === 'dark' ? darkColors : colors;
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const fontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
};

export const borderRadius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
};

export const breakpoints = {
  sm: 360,
  md: 768,
  lg: 1024,
};
