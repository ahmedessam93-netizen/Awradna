import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextProps, TextStyle, View, ViewStyle, useWindowDimensions } from 'react-native';
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, Pattern, Polygon, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useStore } from '../core/store';
import { F, Palette, usePalette } from '../theme';

// ---------- haptics ----------
export function useTap() {
  const { state } = useStore();
  return (kind: 'light' | 'medium' | 'success' = 'light') => {
    if (state.settings.haptics === false) return;
    if (kind === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    else Haptics.impactAsync(kind === 'medium' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };
}

// ---------- text ----------
type TxtProps = TextProps & { v?: 'display' | 'title' | 'h2' | 'body' | 'meta' | 'label' | 'num'; color?: string; align?: TextStyle['textAlign'] };
export function Txt({ v = 'body', color, align, style, ...rest }: TxtProps) {
  const p = usePalette();
  const base: TextStyle = {
    display: { fontFamily: F.display, fontSize: 40, lineHeight: 64, color: p.gold },
    title: { fontFamily: F.title, fontSize: 26, lineHeight: 40, color: p.ink },
    h2: { fontFamily: F.uiBold, fontSize: 17, lineHeight: 26, color: p.ink },
    body: { fontFamily: F.ui, fontSize: 15.5, lineHeight: 25, color: p.ink },
    meta: { fontFamily: F.ui, fontSize: 13.5, lineHeight: 21, color: p.muted },
    label: { fontFamily: F.uiMed, fontSize: 12.5, lineHeight: 19, color: p.muted },
    num: { fontFamily: F.title, fontSize: 34, lineHeight: 44, color: p.ink },
  }[v];
  return <Text maxFontSizeMultiplier={1.35} {...rest} style={[base, { textAlign: align ?? 'right', writingDirection: 'rtl' }, color ? { color } : null, style]} />;
}

// ---------- sky ----------
function seeded(n: number) { let s = 7; const out: number[] = []; for (let i = 0; i < n; i++) { s = (s * 9301 + 49297) % 233280; out.push(s / 233280); } return out; }

function Star({ x, y, r, delay, color }: { x: number; y: number; r: number; delay: number; color: string }) {
  const o = useSharedValue(0.25);
  useEffect(() => { o.value = withDelay(delay, withRepeat(withSequence(withTiming(0.9, { duration: 2400, easing: Easing.inOut(Easing.sin) }), withTiming(0.2, { duration: 2600, easing: Easing.inOut(Easing.sin) })), -1)); }, []);
  const st = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: x, top: y, width: r * 2, height: r * 2, borderRadius: r, backgroundColor: color }, st]} />;
}

export function Sky() {
  const p = usePalette();
  const { width, height } = useWindowDimensions();
  const stars = useMemo(() => {
    const r = seeded(84); const out = [];
    for (let i = 0; i < 28; i++) out.push({ x: r[i * 3] * width, y: r[i * 3 + 1] * height * 0.55, s: 0.6 + r[i * 3 + 2] * 1.1, d: Math.floor(r[i * 3 + 2] * 3000) });
    return out;
  }, [width, height]);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={p.sky} style={StyleSheet.absoluteFill} />
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="lamp" cx="50%" cy="0%" rx="70%" ry="45%">
            <Stop offset="0" stopColor={p.goldHi} stopOpacity={p.dark ? 0.24 : 0.35} />
            <Stop offset="0.45" stopColor={p.gold} stopOpacity={p.dark ? 0.07 : 0.1} />
            <Stop offset="1" stopColor={p.gold} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="earth" cx="50%" cy="100%" rx="80%" ry="40%">
            <Stop offset="0" stopColor={p.emerald} stopOpacity={p.dark ? 0.16 : 0.1} />
            <Stop offset="1" stopColor={p.emerald} stopOpacity={0} />
          </RadialGradient>
          <Pattern id="lattice" width={72} height={72} patternUnits="userSpaceOnUse">
            <Polygon points="36,14 42,30 58,36 42,42 36,58 30,42 14,36 30,30" fill="none" stroke={p.lattice} strokeWidth={1} />
            <Rect x={25} y={25} width={22} height={22} fill="none" stroke={p.lattice} strokeWidth={1} transform="rotate(45 36 36)" />
            <Rect x={25} y={25} width={22} height={22} fill="none" stroke={p.lattice} strokeWidth={1} />
            <Circle cx={0} cy={0} r={2} fill={p.lattice} /><Circle cx={72} cy={0} r={2} fill={p.lattice} />
            <Circle cx={0} cy={72} r={2} fill={p.lattice} /><Circle cx={72} cy={72} r={2} fill={p.lattice} />
          </Pattern>
        </Defs>
        <Rect x={0} y={0} width={width} height={height} fill="url(#lattice)" />
        <Ellipse cx={width / 2} cy={0} rx={width * 0.95} ry={height * 0.45} fill="url(#lamp)" />
        <Ellipse cx={width / 2} cy={height} rx={width} ry={height * 0.35} fill="url(#earth)" />
      </Svg>
      {p.dark && stars.map((s, i) => <Star key={i} x={s.x} y={s.y} r={s.s} delay={s.d} color={p.goldHi} />)}
    </View>
  );
}

// ---------- glass ----------
export function Glass({ children, style, radius = 28, padding = 18, strong, rim = true }: { children?: React.ReactNode; style?: ViewStyle | ViewStyle[]; radius?: number; padding?: number; strong?: boolean; rim?: boolean }) {
  const p = usePalette();
  const fill = Platform.OS === 'android' ? (p.dark ? (strong ? 'rgba(18, 34, 36, 0.86)' : 'rgba(22, 40, 42, 0.55)') : (strong ? 'rgba(255, 253, 247, 0.92)' : 'rgba(255, 255, 255, 0.62)')) : (strong ? p.glassStrong : p.glass);
  const inner = (
    <View style={{ borderRadius: radius - (rim ? 1 : 0), overflow: 'hidden' }}>
      {Platform.OS === 'ios' && <BlurView intensity={strong ? 60 : 38} tint={p.dark ? 'systemUltraThinMaterialDark' : 'systemUltraThinMaterialLight'} style={StyleSheet.absoluteFill} />}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: fill }]} />
      <LinearGradient colors={[p.dark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.7)', 'rgba(255,255,255,0)']} style={[StyleSheet.absoluteFill, { height: 60 }]} />
      <View style={{ padding }}>{children}</View>
    </View>
  );
  if (!rim) return <View style={[{ borderRadius: radius }, style as ViewStyle]}>{inner}</View>;
  return (
    <LinearGradient colors={[p.rimA, p.rimB, p.rimB, p.rimA]} locations={[0, 0.35, 0.7, 1]} start={{ x: 0.9, y: 0 }} end={{ x: 0.1, y: 1 }} style={[{ borderRadius: radius, padding: 1 }, style as ViewStyle]}>
      {inner}
    </LinearGradient>
  );
}

// ---------- buttons ----------
function usePress() {
  const s = useSharedValue(1);
  const st = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return { st, onPressIn: () => { s.value = withSpring(0.965, { damping: 18, stiffness: 420 }); }, onPressOut: () => { s.value = withSpring(1, { damping: 14, stiffness: 300 }); } };
}

export function GoldButton({ label, onPress, icon, style, small }: { label: string; onPress: () => void; icon?: React.ReactNode; style?: ViewStyle; small?: boolean }) {
  const p = usePalette(); const tap = useTap(); const pr = usePress();
  return (
    <Animated.View style={[pr.st, style, p.dark && Platform.OS === 'ios' ? { shadowColor: p.gold, shadowOpacity: 0.45, shadowRadius: 18, shadowOffset: { width: 0, height: 6 } } : null]}>
      <Pressable accessibilityRole="button" accessibilityLabel={label} onPressIn={pr.onPressIn} onPressOut={pr.onPressOut} onPress={() => { tap('medium'); onPress(); }}>
        <LinearGradient colors={[p.goldHi, p.gold, p.goldDeep]} locations={[0, 0.45, 1]} style={{ height: small ? 44 : 56, borderRadius: small ? 14 : 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 22 }}>
          {icon}
          <Text maxFontSizeMultiplier={1.25} style={{ fontFamily: F.uiBold, fontSize: small ? 15 : 17, color: p.onGold }}>{label}</Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

export function GlassButton({ label, onPress, icon, style, tone }: { label?: string; onPress: () => void; icon?: React.ReactNode; style?: ViewStyle; tone?: 'gold' | 'plain' }) {
  const p = usePalette(); const tap = useTap(); const pr = usePress();
  return (
    <Animated.View style={[pr.st, style]}>
      <Pressable accessibilityRole="button" accessibilityLabel={label} onPressIn={pr.onPressIn} onPressOut={pr.onPressOut} onPress={() => { tap(); onPress(); }}
        style={{ minHeight: 48, borderRadius: 16, paddingHorizontal: label ? 18 : 0, minWidth: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: p.dark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.7)', borderWidth: 1, borderColor: p.dark ? 'rgba(240,214,150,0.22)' : 'rgba(176,132,51,0.22)' }}>
        {icon}
        {label ? <Text maxFontSizeMultiplier={1.25} style={{ fontFamily: F.uiMed, fontSize: 15, color: tone === 'gold' ? p.gold : p.ink }}>{label}</Text> : null}
      </Pressable>
    </Animated.View>
  );
}

// ---------- form controls ----------
export function Segmented<T extends string | number>({ value, options, onChange }: { value: T; options: { v: T; label: string }[]; onChange: (v: T) => void }) {
  const p = usePalette(); const tap = useTap();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: p.dark ? 'rgba(255,255,255,0.06)' : 'rgba(30,42,35,0.06)', borderRadius: 12, padding: 3, gap: 2 }}>
      {options.map((o) => {
        const on = o.v === value;
        return (
          <Pressable key={String(o.v)} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => { tap(); onChange(o.v); }}
            style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 9, backgroundColor: on ? (p.dark ? 'rgba(232,199,124,0.18)' : '#FFFFFF') : 'transparent', borderWidth: on ? 1 : 0, borderColor: p.dark ? 'rgba(232,199,124,0.35)' : 'rgba(176,132,51,0.25)' }}>
            <Text maxFontSizeMultiplier={1.2} style={{ fontFamily: on ? F.uiBold : F.uiMed, fontSize: 14, color: on ? (p.dark ? p.gold : p.ink) : p.muted }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  const p = usePalette(); const tap = useTap();
  const x = useSharedValue(value ? 1 : 0);
  useEffect(() => { x.value = withSpring(value ? 1 : 0, { damping: 16, stiffness: 260 }); }, [value]);
  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: interpolate(x.value, [0, 1], [0, -20]) }] }));
  return (
    <Pressable accessibilityRole="switch" accessibilityLabel={label} accessibilityState={{ checked: value }} onPress={() => { tap(); onChange(!value); }} hitSlop={8}>
      <View style={{ width: 52, height: 32, borderRadius: 16, padding: 3, justifyContent: 'center', backgroundColor: value ? p.gold : (p.dark ? 'rgba(255,255,255,0.12)' : 'rgba(30,42,35,0.12)'), alignItems: 'flex-start' }}>
        <Animated.View style={[{ width: 26, height: 26, borderRadius: 13, backgroundColor: value ? p.goldHi : '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 2 }, knob]} />
      </View>
    </Pressable>
  );
}

export function Row({ title, sub, right, onPress, first }: { title: string; sub?: string; right?: React.ReactNode; onPress?: () => void; first?: boolean }) {
  const p = usePalette(); const tap = useTap();
  const body = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, borderTopWidth: first ? 0 : StyleSheet.hairlineWidth, borderTopColor: p.dark ? 'rgba(240,214,150,0.16)' : 'rgba(30,42,35,0.1)' }}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt v="body" style={{ fontFamily: F.uiMed }}>{title}</Txt>
        {sub ? <Txt v="meta" style={{ fontSize: 12.5, lineHeight: 19 }}>{sub}</Txt> : null}
      </View>
      {right}
    </View>
  );
  return onPress ? <Pressable onPress={() => { tap(); onPress(); }} accessibilityRole="button">{body}</Pressable> : body;
}

export function SectionTitle({ children }: { children: string }) {
  return <Txt v="label" style={{ marginBottom: 8, marginTop: 6, paddingHorizontal: 6 }}>{children}</Txt>;
}

export const useP = usePalette;
export type { Palette };
