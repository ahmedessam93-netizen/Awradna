// Design tokens.
// Night: a deep night sky, lamp-gold light, a clear accent for "now".
// Day: an illuminated page: warm ivory paper, deep ink, burnished gold.
// Awradna is lapis blue; Tasbee is the green of the Madinah mushaf.
import { useColorScheme } from 'react-native';
import { useStore } from './core/store';

export const F = {
  display: 'ReemKufi_600SemiBold',   // Fatimid Kufic: titles
  displayBold: 'ReemKufi_700Bold',
  title: 'Amiri_700Bold',            // sacred text, numerals
  serif: 'Amiri_400Regular',
  ui: 'IBMPlexSansArabic_400Regular',
  uiMed: 'IBMPlexSansArabic_500Medium',
  uiBold: 'IBMPlexSansArabic_600SemiBold',
};

export type Palette = {
  dark: boolean;
  sky: [string, string, string, string];   // background, top → bottom
  lamp: string;                            // lamp light from above
  lattice: string;                         // khatam lattice stroke
  star: string;
  panel: [string, string];                 // panel fill gradient
  panelBorder: string; panelInner: string;
  bar: string;                             // floating bars (tab bar, reader)
  rule: string;                            // hairlines inside panels
  ink: string; muted: string; faint: string;
  title: string;                           // screen titles
  card: string;                            // solid card behind panels (day), '' at night
  gold: string; goldHi: string; goldDeep: string; goldLight: string; onGold: string;
  goldFaint: string;
  turq: string; turqHi: string; turqSoft: string;
  danger: string;
  hero: [string, string, string];          // the deep card that holds the day's reading
  primary: [string, string, string];       // main button gradient
  onPrimary: string;
  chip: string; chipBorder: string;
  statusBar: 'light' | 'dark';
  night: boolean;                          // book pages: ivory on lapis
  pageBg: string; pageInk: string;
};

export const NIGHT: Palette = {
  dark: true,
  sky: ['#132350', '#0C1733', '#0A1226', '#070C1A'],
  lamp: 'rgba(242,196,107,0.30)',
  lattice: '#E2BC6A',
  star: '#F7E2A6',
  panel: ['rgba(255,255,255,0.065)', 'rgba(255,255,255,0.025)'],
  panelBorder: 'rgba(226,188,106,0.22)', panelInner: 'rgba(226,188,106,0.08)',
  bar: 'rgba(12,22,48,0.86)',
  rule: 'rgba(226,188,106,0.12)',
  ink: '#F3EAD7', muted: 'rgba(243,234,215,0.68)', faint: 'rgba(243,234,215,0.45)',
  title: '#E9C677', card: '',
  gold: '#E2BC6A', goldHi: '#F7E2A6', goldDeep: '#B48A36', goldLight: '#E9C677', onGold: '#2A1D07',
  goldFaint: 'rgba(226,188,106,0.35)',
  turq: '#53CDBF', turqHi: '#7FE3D7', turqSoft: 'rgba(83,205,191,0.16)',
  danger: '#F2A39A',
  primary: ['#F7E2A6', '#E2BC6A', '#B48A36'], onPrimary: '#2A1D07',
  chip: 'rgba(255,255,255,0.05)', chipBorder: 'rgba(226,188,106,0.28)',
  hero: ['#27469A', '#182E6C', '#0F1D4A'],
  statusBar: 'light', night: true, pageBg: '#0B1329', pageInk: '#F0E4CB',
};

export const DAWN: Palette = {
  dark: false,
  sky: ['#FBF5E6', '#F9F2E3', '#F6EEDD', '#F2E8D4'],
  lamp: 'rgba(226,170,70,0.30)',
  lattice: '#9A6B14',
  star: '#FFFFFF',
  panel: ['#FFFEFA', '#FFFBF2'],
  panelBorder: 'rgba(154,107,20,0.20)', panelInner: 'rgba(154,107,20,0)',
  bar: 'rgba(255,252,244,0.96)',
  rule: 'rgba(16,31,71,0.08)',
  ink: '#101F47', muted: 'rgba(16,31,71,0.70)', faint: 'rgba(16,31,71,0.46)',
  title: '#17306F', card: '#FFFDF6',
  gold: '#946410', goldHi: '#E9C677', goldDeep: '#6E4E14', goldLight: '#8A5C0C', onGold: '#FFF8E8',
  goldFaint: 'rgba(148,100,16,0.34)',
  turq: '#0B7268', turqHi: '#0B6A61', turqSoft: 'rgba(11,114,104,0.10)',
  danger: '#B4483C',
  primary: ['#2C4FA3', '#1B3577', '#122456'], onPrimary: '#FBF3DC',
  chip: '#FFFDF6', chipBorder: 'rgba(154,107,20,0.26)',
  hero: ['#2C4FA3', '#1B3577', '#122456'],
  statusBar: 'dark', night: false, pageBg: '#FBF6EA', pageInk: '#1B2436',
};

export function usePalette(): Palette {
  const scheme = useColorScheme();
  const { state } = useStore();
  const pref = state.settings.theme || 'auto';
  const dark = pref === 'dark' || (pref === 'auto' && scheme !== 'light');
  return dark ? NIGHT : DAWN;
}
