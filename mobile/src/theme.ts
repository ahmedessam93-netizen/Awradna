// Design tokens. Two worlds: "night" (the mystic default) and "dawn" (light).
// Night: deep emerald-to-indigo sky, gold light, clear glass. Dawn: ivory mist, deep gold, green ink.
import { useColorScheme } from 'react-native';
import { useStore } from './core/store';

export const F = {
  display: 'ArefRuqaa_700Bold',     // calligraphic day titles
  title: 'Amiri_700Bold',           // headings, numerals
  serif: 'Amiri_400Regular',
  ui: 'IBMPlexSansArabic_400Regular',
  uiMed: 'IBMPlexSansArabic_500Medium',
  uiBold: 'IBMPlexSansArabic_600SemiBold',
};

export type Palette = {
  dark: boolean;
  sky: [string, string, string];      // background gradient top → bottom
  glow: string;                       // lamp light at the top
  lattice: string;                    // star-lattice stroke
  glass: string;                      // glass fill
  glassStrong: string;
  rimA: string; rimB: string;         // gold rim gradient
  ink: string; muted: string; faint: string;
  gold: string; goldHi: string; goldDeep: string; onGold: string;
  emerald: string; emeraldSoft: string;
  danger: string;
  blurTint: 'dark' | 'light';
  statusBar: 'light' | 'dark';
  pageFilter: 'night' | 'none';
};

export const NIGHT: Palette = {
  dark: true,
  sky: ['#0A1F19', '#0B1624', '#0E1030'],
  glow: 'rgba(232, 199, 124, 0.20)',
  lattice: 'rgba(232, 199, 124, 0.055)',
  glass: 'rgba(255, 255, 255, 0.06)',
  glassStrong: 'rgba(14, 28, 30, 0.72)',
  rimA: 'rgba(240, 214, 150, 0.55)', rimB: 'rgba(240, 214, 150, 0.06)',
  ink: '#F4EBD6', muted: 'rgba(244, 235, 214, 0.66)', faint: 'rgba(244, 235, 214, 0.38)',
  gold: '#E8C77C', goldHi: '#FFF1C7', goldDeep: '#B08433', onGold: '#21170A',
  emerald: '#6FDCA6', emeraldSoft: 'rgba(111, 220, 166, 0.16)',
  danger: '#F2A39A',
  blurTint: 'dark', statusBar: 'light', pageFilter: 'night',
};

export const DAWN: Palette = {
  dark: false,
  sky: ['#F7F1E4', '#EEF0E6', '#E2EBE6'],
  glow: 'rgba(214, 166, 72, 0.22)',
  lattice: 'rgba(150, 110, 40, 0.07)',
  glass: 'rgba(255, 255, 255, 0.55)',
  glassStrong: 'rgba(255, 253, 247, 0.86)',
  rimA: 'rgba(176, 132, 51, 0.55)', rimB: 'rgba(176, 132, 51, 0.08)',
  ink: '#1E2A23', muted: 'rgba(30, 42, 35, 0.66)', faint: 'rgba(30, 42, 35, 0.4)',
  gold: '#A9792A', goldHi: '#E9C77D', goldDeep: '#7C5616', onGold: '#FFF8E8',
  emerald: '#1D7A52', emeraldSoft: 'rgba(29, 122, 82, 0.12)',
  danger: '#B4483C',
  blurTint: 'light', statusBar: 'dark', pageFilter: 'none',
};

export function usePalette(): Palette {
  const scheme = useColorScheme();
  const { state } = useStore();
  const pref = state.settings.theme || 'auto';
  const dark = pref === 'dark' || (pref === 'auto' && scheme !== 'light');
  return dark ? NIGHT : DAWN;
}
