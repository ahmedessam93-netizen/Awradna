// Hand-drawn line icons with a gold gradient stroke, for the "glass and light" look.
import React from 'react';
import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { usePalette } from '../theme';

type P = { size?: number; color?: string; active?: boolean; strokeWidth?: number };

function Base({ size = 24, children, gold, id, strokeWidth = 1.6, color }: P & { children: React.ReactNode; gold?: boolean; id: string }) {
  const p = usePalette();
  const stroke = gold ? `url(#${id})` : (color || p.ink);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {gold ? (
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={p.goldHi} />
            <Stop offset="0.55" stopColor={p.gold} />
            <Stop offset="1" stopColor={p.goldDeep} />
          </LinearGradient>
        </Defs>
      ) : null}
      <G stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">{children}</G>
    </Svg>
  );
}

// Mishkat: the hanging lamp. "Today".
export const LampIcon = (p: P) => (
  <Base {...p} gold={p.active} id="gLamp">
    <Path d="M12 1.8v2.2" />
    <Path d="M8.6 7.2c.6-2 1.9-3.1 3.4-3.1s2.8 1.1 3.4 3.1" />
    <Path d="M7.6 7.2h8.8" />
    <Path d="M8.2 7.2l.9 9.6c.1.7.6 1.2 1.3 1.2h3.2c.7 0 1.2-.5 1.3-1.2l.9-9.6" />
    <Path d="M10.6 15.2v-3a1.4 1.4 0 0 1 2.8 0v3" />
    <Path d="M9.4 20.6h5.2" />
    <Path d="M12 18v2.6" />
  </Base>
);

// Crescent with a star. "Week".
export const CrescentIcon = (p: P) => (
  <Base {...p} gold={p.active} id="gCres">
    <Path d="M18.6 15.3A8 8 0 0 1 8.7 5.4 8 8 0 1 0 18.6 15.3z" />
    <Path d="M17 4.2l.6 1.3 1.4.2-1 1 .2 1.4-1.2-.7-1.2.7.2-1.4-1-1 1.4-.2z" strokeWidth={1.1} />
  </Base>
);

// Rub el Hizb: the eight-pointed star. "Settings".
export const StarIcon = (p: P) => (
  <Base {...p} gold={p.active} id="gStar">
    <Rect x="5.6" y="5.6" width="12.8" height="12.8" rx="1.2" />
    <Rect x="5.6" y="5.6" width="12.8" height="12.8" rx="1.2" transform="rotate(45 12 12)" />
    <Circle cx="12" cy="12" r="2.6" />
  </Base>
);

export const BookIcon = (p: P) => (
  <Base {...p} id="gBook">
    <Path d="M12 6.5c-1.8-1.4-4.4-2-7.5-1.8v13c3.1-.2 5.7.4 7.5 1.8 1.8-1.4 4.4-2 7.5-1.8v-13c-3.1-.2-5.7.4-7.5 1.8z" />
    <Path d="M12 6.5v13" />
  </Base>
);

export const CheckIcon = (p: P) => (
  <Base {...p} id="gChk" strokeWidth={p.strokeWidth ?? 2.2}><Path d="M5 12.5l4.2 4.2L19 7" /></Base>
);
export const CloseIcon = (p: P) => (
  <Base {...p} id="gX" strokeWidth={p.strokeWidth ?? 2}><Path d="M6 6l12 12M18 6L6 18" /></Base>
);
export const ZoomIcon = (p: P) => (
  <Base {...p} id="gZ"><Circle cx="10.5" cy="10.5" r="6.5" /><Path d="M20 20l-4.6-4.6M10.5 7.8v5.4M7.8 10.5h5.4" /></Base>
);
export const ChevronIcon = (p: P & { dir?: 'left' | 'right' }) => (
  <Base {...p} id="gCh" strokeWidth={p.strokeWidth ?? 2}><Path d={p.dir === 'right' ? 'M9 6l6 6-6 6' : 'M15 6l-6 6 6 6'} /></Base>
);
export const PinIcon = (p: P) => (
  <Base {...p} id="gPin"><Path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" /><Circle cx="12" cy="10" r="2.3" /></Base>
);
export const BellIcon = (p: P) => (
  <Base {...p} id="gBell"><Path d="M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 1.5H5z" /><Path d="M10 20.5a2.2 2.2 0 0 0 4 0" /></Base>
);
export const SearchIcon = (p: P) => (
  <Base {...p} id="gS"><Circle cx="11" cy="11" r="6.5" /><Path d="M20 20l-4.3-4.3" /></Base>
);

// Times of day, for the prayer orbs.
export const FajrIcon = (p: P) => (
  <Base {...p} id="gF"><Path d="M3.5 17h17" /><Path d="M7.2 17a4.8 4.8 0 0 1 9.6 0" /><Path d="M12 7.5v2.2M6.2 10.4l1.5 1.5M17.8 10.4l-1.5 1.5" /></Base>
);
export const DhuhrIcon = (p: P) => (
  <Base {...p} id="gD"><Circle cx="12" cy="12" r="3.8" /><Path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6L18 18M6 18l1.4-1.4M16.6 7.4L18 6" /></Base>
);
export const AsrIcon = (p: P) => (
  <Base {...p} id="gA"><Circle cx="12" cy="10.5" r="3.6" /><Path d="M12 3.6v1.6M5.6 10.5H4M20 10.5h-1.6M7.3 5.8l1.1 1.1M16.7 5.8l-1.1 1.1" /><Path d="M4 19h16" /><Path d="M7 16h10" strokeOpacity={0.6} /></Base>
);
export const MaghribIcon = (p: P) => (
  <Base {...p} id="gM"><Path d="M3.5 15.5h17" /><Path d="M7.2 15.5a4.8 4.8 0 0 1 9.6 0" /><Path d="M12 5v4.2M10 7.4l2 2 2-2" /><Path d="M7 19h10" strokeOpacity={0.6} /></Base>
);
export const IshaIcon = (p: P) => (
  <Base {...p} id="gI"><Path d="M17.5 14.6A6.6 6.6 0 0 1 9.4 6.5 6.6 6.6 0 1 0 17.5 14.6z" /><Path d="M17.6 5.2v2.4M16.4 6.4h2.4" strokeWidth={1.2} /></Base>
);
export const PRAYER_ICONS = [FajrIcon, DhuhrIcon, AsrIcon, MaghribIcon, IshaIcon];
