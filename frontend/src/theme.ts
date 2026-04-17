import { ThemeMode } from './types';

export const palettes = {
  light: {
    background: '#FAFAFA',
    surface: '#FFFFFF',
    surfaceAlt: '#F4F4F5',
    primary: '#002BF6',
    primaryText: '#FFFFFF',
    owesMe: '#00A848',
    iOwe: '#E11D2A',
    textMain: '#111111',
    textMuted: '#737373',
    border: '#E5E5E5',
    borderStrong: '#111111',
    overlay: 'rgba(0,0,0,0.5)',
  },
  dark: {
    background: '#0A0A0A',
    surface: '#141414',
    surfaceAlt: '#1F1F1F',
    primary: '#3A86FF',
    primaryText: '#FFFFFF',
    owesMe: '#06D6A0',
    iOwe: '#EF233C',
    textMain: '#F5F5F5',
    textMuted: '#A3A3A3',
    border: '#262626',
    borderStrong: '#F5F5F5',
    overlay: 'rgba(0,0,0,0.7)',
  },
} as const;

export type Palette = typeof palettes.light;

export function getPalette(theme: ThemeMode): Palette {
  return palettes[theme];
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  pill: 999,
};
