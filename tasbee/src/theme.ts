// Design tokens, from the approved canvas.
// Night (default): lapis night sky, lamp-gold light, amber beads, turquoise for "now".
// Dawn: a pale morning sky, lapis ink, deep gold, sea-turquoise.
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
  gold: string; goldHi: string; goldDeep: string; goldLight: string; onGold: string;
  goldFaint: string;
  turq: string; turqHi: string; turqSoft: string;
  danger: string;
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
  ink: '#F3EAD7', muted: 'rgba(243,234,215,0.62)', faint: 'rgba(243,234,215,0.42)',
  gold: '#E2BC6A', goldHi: '#F7E2A6', goldDeep: '#B48A36', goldLight: '#E9C677', onGold: '#2A1D07',
  goldFaint: 'rgba(226,188,106,0.35)',
  turq: '#53CDBF', turqHi: '#7FE3D7', turqSoft: 'rgba(83,205,191,0.16)',
  danger: '#F2A39A',
  primary: ['#F7E2A6', '#E2BC6A', '#B48A36'], onPrimary: '#2A1D07',
  chip: 'rgba(255,255,255,0.05)', chipBorder: 'rgba(226,188,106,0.28)',
  statusBar: 'light', night: true, pageBg: '#0B1329', pageInk: '#F0E4CB',
};

export const DAWN: Palette = {
  dark: false,
  sky: ['#C7D4EE', '#DCE3F1', '#EDEBEA', '#F5EFE5'],
  lamp: 'rgba(242,190,100,0.38)',
  lattice: '#8A6420',
  star: '#FFFFFF',
  panel: ['rgba(255,255,255,0.72)', 'rgba(255,255,255,0.5)'],
  panelBorder: 'rgba(138,100,32,0.22)', panelInner: 'rgba(138,100,32,0.07)',
  bar: 'rgba(250,247,240,0.94)',
  rule: 'rgba(20,38,80,0.09)',
  ink: '#142650', muted: 'rgba(20,38,80,0.64)', faint: 'rgba(20,38,80,0.42)',
  gold: '#8A6420', goldHi: '#E9C677', goldDeep: '#6E4E14', goldLight: '#8A6420', onGold: '#FFF8E8',
  goldFaint: 'rgba(138,100,32,0.32)',
  turq: '#0F7A70', turqHi: '#0F7A70', turqSoft: 'rgba(15,122,112,0.12)',
  danger: '#B4483C',
  primary: ['#2B4C9A', '#1B3577', '#142650'], onPrimary: '#F7EFD9',
  chip: 'rgba(255,255,255,0.6)', chipBorder: 'rgba(138,100,32,0.25)',
  statusBar: 'dark', night: false, pageBg: '#F7F2E8', pageInk: '#1B2436',
};

export function usePalette(): Palette {
  const scheme = useColorScheme();
  const { state } = useStore();
  const pref = state.settings.theme || 'auto';
  const dark = pref === 'dark' || (pref === 'auto' && scheme !== 'light');
  return dark ? NIGHT : DAWN;
}
