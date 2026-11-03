// The day as the sun's path: one glass orb per sitting, from Fajr (right) to Isha (left).
// Done = gold with a check, current = emerald glow, missed = dim, upcoming = clear glass.
import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { fmtTime } from '../core/plan';
import { F, usePalette } from '../theme';
import { CheckIcon, PRAYER_ICONS } from './icons';

export type Orb = { i: number; name: string; time: Date | null; state: 'done' | 'current' | 'missed' | 'upcoming' };

function Pulse({ color }: { color: string }) {
  const s = useSharedValue(0);
  useEffect(() => { s.value = withRepeat(withSequence(withTiming(1, { duration: 1600, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 0 })), -1); }, []);
  const st = useAnimatedStyle(() => ({ opacity: 0.55 * (1 - s.value), transform: [{ scale: 1 + s.value * 0.55 }] }));
  return <Animated.View pointerEvents="none" style={[{ position: 'absolute', width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: color }, st]} />;
}

export function PrayerPath({ orbs, width }: { orbs: Orb[]; width: number }) {
  const p = usePalette();
  const n = orbs.length; const H = 26; const top = 8; const orb = 50; const pad = orb / 2 + 2;
  // distance from the start edge (the right edge in Arabic), so Fajr sits at the start
  const xs = orbs.map((_, k) => pad + ((width - pad * 2) * k) / Math.max(1, n - 1));
  const ys = orbs.map((_, k) => top + H - Math.sin((Math.PI * (k + 0.5)) / n) * H);
  const d = `M ${width - 6} ${top + H + 6} Q ${width / 2} ${top - H - 4} 6 ${top + H + 6}`;
  return (
    <View style={{ width, height: top + H + orb + 46 }}>
      <Svg width={width} height={top + H + orb} style={{ position: 'absolute', top: orb / 2 - 4 }}>
        <Path d={d} stroke={p.gold} strokeOpacity={0.35} strokeWidth={1.2} strokeDasharray="2 6" strokeLinecap="round" fill="none" />
      </Svg>
      {orbs.map((o, k) => {
        const Icon = PRAYER_ICONS[o.i];
        const done = o.state === 'done', cur = o.state === 'current', missed = o.state === 'missed';
        const bg = done ? p.gold : cur ? (p.dark ? 'rgba(111,220,166,0.18)' : 'rgba(29,122,82,0.12)') : (p.dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.75)');
        const border = done ? p.goldHi : cur ? p.emerald : (p.dark ? 'rgba(240,214,150,0.28)' : 'rgba(150,110,40,0.25)');
        const iconColor = done ? p.onGold : cur ? p.emerald : missed ? p.faint : p.muted;
        return (
          <View key={o.i} style={{ position: 'absolute', start: xs[k] - 40, top: ys[k], width: 80, alignItems: 'center' }}
            accessible accessibilityLabel={`${o.name} ${fmtTime(o.time)} ${done ? 'تمت' : cur ? 'الآن' : missed ? 'فاتت' : 'قادمة'}`}>
            <View style={{ width: orb, height: orb, alignItems: 'center', justifyContent: 'center' }}>
              {cur && <Pulse color={p.emerald} />}
              <View style={{ width: orb, height: orb, borderRadius: orb / 2, backgroundColor: bg, borderWidth: 1.2, borderColor: border, alignItems: 'center', justifyContent: 'center', opacity: missed ? 0.55 : 1 }}>
                <Icon size={24} color={iconColor} />
              </View>
              {done && (
                <View style={{ position: 'absolute', bottom: -2, end: 0, width: 20, height: 20, borderRadius: 10, backgroundColor: p.dark ? '#0B1A15' : '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: p.gold }}>
                  <CheckIcon size={12} color={p.gold} strokeWidth={3} />
                </View>
              )}
            </View>
            <Text maxFontSizeMultiplier={1.2} style={{ fontFamily: cur ? F.uiBold : F.uiMed, fontSize: 13, color: cur ? p.emerald : done ? p.gold : p.ink, marginTop: 6, opacity: missed ? 0.6 : 1 }}>{o.name}</Text>
            <Text maxFontSizeMultiplier={1.2} style={{ fontFamily: F.ui, fontSize: 11.5, color: p.muted }}>{fmtTime(o.time)}</Text>
          </View>
        );
      })}
    </View>
  );
}
