// The misbaha ring for today's wird (same geometry as core/beads.ts and the widgets).
// On open, the beads light up one by one; the current sitting's beads breathe softly.
import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, interpolate, useAnimatedProps, useSharedValue, withDelay, withRepeat, withSequence, withTiming, Extrapolation, SharedValue } from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, G, Line, Path, RadialGradient, Stop } from 'react-native-svg';
import { beadLayout, BEAD_COUNT } from '../core/beads';
import { usePalette } from '../theme';

const ACircle = Animated.createAnimatedComponent(Circle);

function BeadDot({ i, x, y, r, state, reveal, breath, rest }: { i: number; x: number; y: number; r: number; state: 'read' | 'now' | 'rest'; reveal: SharedValue<number>; breath: SharedValue<number>; rest: string }) {
  const bead = useAnimatedProps(() => {
    const t = interpolate(reveal.value * (BEAD_COUNT + 6) - i, [0, 6], [0, 1], Extrapolation.CLAMP);
    return { opacity: 0.25 + 0.75 * t, r: r * (0.7 + 0.3 * t) };
  });
  const halo = useAnimatedProps(() => {
    const t = interpolate(reveal.value * (BEAD_COUNT + 6) - i, [0, 6], [0, 1], Extrapolation.CLAMP);
    const b = state === 'now' ? 0.25 + 0.35 * breath.value : state === 'read' ? 0.22 : 0;
    return { opacity: b * t };
  });
  const fill = state === 'read' ? 'url(#bGold)' : state === 'now' ? 'url(#bEm)' : 'url(#bGlass)';
  return (
    <G>
      {state !== 'rest' && <ACircle cx={x} cy={y} r={r * 2.1} fill={state === 'read' ? 'url(#hGold)' : 'url(#hEm)'} animatedProps={halo} />}
      <ACircle cx={x} cy={y} r={r} fill={fill} stroke={state === 'rest' ? rest : 'none'} strokeWidth={state === 'rest' ? 0.8 : 0} animatedProps={bead} />
    </G>
  );
}

export function BeadRing({ size, readFrac, nowFrac, complete, children }: { size: number; readFrac: number; nowFrac: number; complete?: boolean; children?: React.ReactNode }) {
  const p = usePalette();
  const { beads, head, R, cx, cy } = beadLayout(size, complete ? 1 : readFrac, complete ? 0 : nowFrac);
  const r = beads[0].r;
  const reveal = useSharedValue(0);
  const breath = useSharedValue(0);
  useEffect(() => {
    reveal.value = 0;
    reveal.value = withDelay(120, withTiming(1, { duration: 1100, easing: Easing.out(Easing.cubic) }));
  }, [readFrac, nowFrac, complete]);
  useEffect(() => {
    breath.value = withRepeat(withSequence(withTiming(1, { duration: 1700, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 1700, easing: Easing.inOut(Easing.sin) })), -1);
  }, []);
  const gold = [p.goldHi, p.gold, p.goldDeep];
  const em = p.dark ? ['#E6FFF2', '#6FDCA6', '#1D7A52'] : ['#BFF2D6', '#2F9E6C', '#13583A'];
  const restStroke = p.dark ? 'rgba(240,214,150,0.38)' : 'rgba(150,110,40,0.35)';
  const hy = head.y;
  return (
    <View style={{ width: size, height: size }} accessible accessibilityLabel={`تقدم ورد اليوم ${Math.round((complete ? 1 : readFrac) * 100)} بالمئة`}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id="bGold" cx="35%" cy="30%" r="75%"><Stop offset="0" stopColor={gold[0]} /><Stop offset="0.45" stopColor={gold[1]} /><Stop offset="1" stopColor={gold[2]} /></RadialGradient>
          <RadialGradient id="bEm" cx="35%" cy="30%" r="75%"><Stop offset="0" stopColor={em[0]} /><Stop offset="0.45" stopColor={em[1]} /><Stop offset="1" stopColor={em[2]} /></RadialGradient>
          <RadialGradient id="bGlass" cx="35%" cy="30%" r="80%"><Stop offset="0" stopColor="#FFFFFF" stopOpacity={p.dark ? 0.5 : 0.95} /><Stop offset="1" stopColor={p.dark ? '#FFFFFF' : '#E9E1CF'} stopOpacity={p.dark ? 0.06 : 0.6} /></RadialGradient>
          <RadialGradient id="hGold" cx="50%" cy="50%" r="50%"><Stop offset="0" stopColor={p.gold} stopOpacity={0.9} /><Stop offset="1" stopColor={p.gold} stopOpacity={0} /></RadialGradient>
          <RadialGradient id="hEm" cx="50%" cy="50%" r="50%"><Stop offset="0" stopColor={em[1]} stopOpacity={0.9} /><Stop offset="1" stopColor={em[1]} stopOpacity={0} /></RadialGradient>
          <RadialGradient id="core" cx="50%" cy="50%" r="50%"><Stop offset="0" stopColor={p.gold} stopOpacity={p.dark ? 0.13 : 0.12} /><Stop offset="1" stopColor={p.gold} stopOpacity={0} /></RadialGradient>
        </Defs>
        <Circle cx={cx} cy={cy} r={R * 0.92} fill="url(#core)" />
        <Circle cx={cx} cy={cy} r={R} fill="none" stroke={p.gold} strokeOpacity={0.22} strokeWidth={size * 0.005} />
        {beads.map((b, i) => <BeadDot key={i} i={i} x={b.x} y={b.y} r={b.r} state={b.state} reveal={reveal} breath={breath} rest={restStroke} />)}
        {/* head bead (imam) with cap and tassel */}
        <Ellipse cx={head.x} cy={hy} rx={r * 1.18} ry={r * 1.95} fill="url(#bGold)" />
        <Circle cx={head.x} cy={hy + r * 2.25} r={r * 0.45} fill={p.gold} />
        <Path d={`M${head.x - r * 0.55} ${hy + r * 2.6} L${head.x + r * 0.55} ${hy + r * 2.6} L${head.x + r * 1.1} ${hy + r * 4.9} L${head.x - r * 1.1} ${hy + r * 4.9} Z`} fill={p.gold} fillOpacity={0.35} />
        {[-0.9, -0.45, 0, 0.45, 0.9].map((d, k) => (
          <Line key={k} x1={head.x + d * 0.5 * r} y1={hy + r * 2.7} x2={head.x + d * r * 1.05} y2={hy + r * 4.9} stroke={p.gold} strokeWidth={size * 0.0035} strokeLinecap="round" />
        ))}
      </Svg>
      <View pointerEvents="none" style={{ position: 'absolute', left: cx - R * 0.78, top: cy - R * 0.78, width: R * 1.56, height: R * 1.56, alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </View>
    </View>
  );
}
