// The amber misbaha (same geometry as core/beads.ts and the widgets).
// On open the beads light one by one; the current beads breathe softly.
// `states` lets the tasbih counter drive every bead directly.
import React, { useEffect } from 'react';
import { Platform, View } from 'react-native';

const WEB = Platform.OS === 'web';
import Animated, { Easing, Extrapolation, interpolate, SharedValue, useAnimatedProps, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, G, Line, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';
import { AMBER, beadLayout, BeadState, BEAD_COUNT, TURQ } from '../core/beads';
import { usePalette } from '../theme';

const ACircle = Animated.createAnimatedComponent(Circle);

function BeadDot({ i, x, y, r, state, reveal, breath, rest }: { i: number; x: number; y: number; r: number; state: BeadState; reveal: SharedValue<number>; breath: SharedValue<number>; rest: string }) {
  const bead = useAnimatedProps(() => {
    const t = interpolate(reveal.value * (BEAD_COUNT + 6) - i, [0, 6], [0, 1], Extrapolation.CLAMP);
    const grow = state === 'now' ? 1.08 + 0.06 * breath.value : 1;
    return { opacity: 0.3 + 0.7 * t, r: r * (0.72 + 0.28 * t) * grow };
  });
  const halo = useAnimatedProps(() => {
    const t = interpolate(reveal.value * (BEAD_COUNT + 6) - i, [0, 6], [0, 1], Extrapolation.CLAMP);
    const b = state === 'now' ? 0.55 + 0.45 * breath.value : state === 'read' ? 0.9 : 0;
    return { opacity: b * t };
  });
  const fill = state === 'read' ? 'url(#mA)' : state === 'now' ? 'url(#mT)' : 'url(#mC)';
  return (
    <G>
      {state !== 'rest' && <ACircle cx={x} cy={y} r={r * 2.1} fill={state === 'read' ? 'url(#gA)' : 'url(#gT)'} animatedProps={halo} />}
      <ACircle cx={x} cy={y} r={r} fill={fill} stroke={state === 'rest' ? rest : 'none'} strokeWidth={state === 'rest' ? 0.8 : 0} animatedProps={bead} />
      <Ellipse cx={x - r * 0.32} cy={y - r * 0.42} rx={r * 0.36} ry={r * 0.22} fill="#FFFFFF" fillOpacity={state === 'rest' ? 0.35 : 0.75} />
    </G>
  );
}

type Props = { size: number; readFrac?: number; nowFrac?: number; complete?: boolean; states?: BeadState[]; children?: React.ReactNode; label?: string; animateKey?: string | number };

export function Misbaha({ size, readFrac = 0, nowFrac = 0, complete, states, children, label, animateKey }: Props) {
  const p = usePalette();
  const { beads, head, R, cx, cy, r } = beadLayout(size, complete ? 1 : readFrac, complete ? 0 : nowFrac, states);
  const k = size / 342;
  const reveal = useSharedValue(states || WEB ? 1 : 0);
  const breath = useSharedValue(0);
  useEffect(() => {
    if (states || WEB) return;
    reveal.value = 0;
    reveal.value = withDelay(120, withTiming(1, { duration: 1100, easing: Easing.out(Easing.cubic) }));
  }, [readFrac, nowFrac, complete, animateKey]);
  useEffect(() => {
    if (WEB) return; // a breathing loop re-draws every bead each frame in a browser
    breath.value = withRepeat(withSequence(withTiming(1, { duration: 1700, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 1700, easing: Easing.inOut(Easing.sin) })), -1);
  }, []);
  const restStroke = p.dark ? 'rgba(226,188,106,0.35)' : 'rgba(138,100,32,0.35)';
  const hx = head.x, hy = head.y;
  return (
    <View style={{ width: size, height: size }} accessible accessibilityLabel={label}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id="mA" cx="34%" cy="28%" r="78%"><Stop offset="0" stopColor={AMBER[0]} /><Stop offset="0.38" stopColor={AMBER[1]} /><Stop offset="0.8" stopColor={AMBER[2]} /><Stop offset="1" stopColor={AMBER[3]} /></RadialGradient>
          <RadialGradient id="mT" cx="34%" cy="28%" r="78%"><Stop offset="0" stopColor={TURQ[0]} /><Stop offset="0.42" stopColor={TURQ[1]} /><Stop offset="0.85" stopColor={TURQ[2]} /><Stop offset="1" stopColor={TURQ[3]} /></RadialGradient>
          <RadialGradient id="mC" cx="34%" cy="28%" r="80%">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={p.dark ? 0.42 : 0.95} />
            <Stop offset="0.6" stopColor={p.dark ? '#9FB3E0' : '#DCE3F1'} stopOpacity={p.dark ? 0.1 : 0.7} />
            <Stop offset="1" stopColor={p.dark ? '#FFFFFF' : '#B9C6E2'} stopOpacity={p.dark ? 0.05 : 0.8} />
          </RadialGradient>
          <RadialGradient id="gA" cx="50%" cy="50%" r="50%"><Stop offset="0" stopColor="#F2B24E" stopOpacity={0.55} /><Stop offset="1" stopColor="#F2B24E" stopOpacity={0} /></RadialGradient>
          <RadialGradient id="gT" cx="50%" cy="50%" r="50%"><Stop offset="0" stopColor="#53CDBF" stopOpacity={0.6} /><Stop offset="1" stopColor="#53CDBF" stopOpacity={0} /></RadialGradient>
          <RadialGradient id="heart" cx="50%" cy="50%" r="50%"><Stop offset="0" stopColor="#F2C46B" stopOpacity={p.dark ? 0.16 : 0.22} /><Stop offset="1" stopColor="#F2C46B" stopOpacity={0} /></RadialGradient>
          <LinearGradient id="goldV" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#F7E2A6" /><Stop offset="0.5" stopColor="#E2BC6A" /><Stop offset="1" stopColor="#9C7428" /></LinearGradient>
        </Defs>
        <Circle cx={cx} cy={cy} r={118 * k} fill="url(#heart)" />
        <Circle cx={cx} cy={cy} r={R} fill="none" stroke={p.dark ? '#E2BC6A' : '#8A6420'} strokeOpacity={0.32} strokeWidth={1.2 * k} />
        {beads.map((b, i) => <BeadDot key={i} i={i} x={b.x} y={b.y} r={b.r} state={b.state} reveal={reveal} breath={breath} rest={restStroke} />)}
        {/* head bead (imam), cap and tassel */}
        <Ellipse cx={hx} cy={hy} rx={12 * k} ry={19 * k} fill="url(#mA)" />
        <Ellipse cx={hx - 5 * k} cy={hy - 9 * k} rx={3.6 * k} ry={6 * k} fill="#FFFFFF" fillOpacity={0.55} />
        <Rect x={hx - 6 * k} y={hy + 19 * k} width={12 * k} height={7 * k} rx={2 * k} fill="url(#goldV)" />
        {Array.from({ length: 11 }, (_, i) => { const d = (i - 5) / 5; return (
          <Line key={i} x1={hx + d * 5 * k} y1={hy + 26 * k} x2={hx + d * 11 * k} y2={hy + (48 - Math.abs(d) * 4) * k} stroke="url(#goldV)" strokeWidth={1.3 * k} strokeLinecap="round" />
        ); })}
      </Svg>
      <View pointerEvents="none" style={{ position: 'absolute', left: cx - 100 * k, top: cy - 98 * k, width: 200 * k, height: 196 * k, alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </View>
    </View>
  );
}
export const BeadRing = Misbaha;
