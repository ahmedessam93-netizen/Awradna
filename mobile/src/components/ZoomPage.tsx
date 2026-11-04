// One book page: fits the screen, pinch or double-tap to zoom, drag when zoomed.
// While zoomed, page swiping is paused so the drag moves the page instead.
import { PageImage } from './PageImage';
import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import { F } from '../theme';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

// Part of a page that belongs to another sitting: veiled, with a short note.
export type Veil = { half: 'until' | 'from'; top: number; bottom: number; x: number; color: string; line: string; ink: string; label: string };
type Props = { veil?: Veil; source: number; aspect: number; width: number; height: number; onZoomChange: (zoomed: boolean) => void; onTap: () => void; label: string; tint: string; initialScale?: number };

export function ZoomPage({ veil, source, aspect, width, height, onZoomChange, onTap, label, tint, initialScale = 1 }: Props) {
  // fit inside the area, keeping the page's proportions
  const fitW = Math.min(width, height * aspect);
  const fitH = fitW / aspect;
  const scale = useSharedValue(1); const savedScale = useSharedValue(1);
  const tx = useSharedValue(0); const ty = useSharedValue(0); const sx = useSharedValue(0); const sy = useSharedValue(0);
  const zoomed = useSharedValue(false);

  const clamp = (v: number, max: number) => { 'worklet'; return Math.max(-max, Math.min(max, v)); };
  const limits = (s: number) => { 'worklet'; return { mx: Math.max(0, (fitW * s - width) / 2), my: Math.max(0, (fitH * s - height) / 2) }; };
  const setZoomed = (z: boolean) => { 'worklet'; if (zoomed.value !== z) { zoomed.value = z; runOnJS(onZoomChange)(z); } };

  const pinch = Gesture.Pinch()
    .onUpdate((e) => { scale.value = Math.max(0.9, Math.min(4, savedScale.value * e.scale)); })
    .onEnd(() => {
      if (scale.value < 1.05) { scale.value = withSpring(1); tx.value = withSpring(0); ty.value = withSpring(0); savedScale.value = 1; setZoomed(false); }
      else { savedScale.value = scale.value; const { mx, my } = limits(scale.value); tx.value = withSpring(clamp(tx.value, mx)); ty.value = withSpring(clamp(ty.value, my)); setZoomed(true); }
    });

  const pan = Gesture.Pan()
    .averageTouches(true)
    .manualActivation(true)
    .onTouchesMove((_e, mgr) => { if (zoomed.value) mgr.activate(); else mgr.fail(); })
    .onStart(() => { sx.value = tx.value; sy.value = ty.value; })
    .onUpdate((e) => { const { mx, my } = limits(scale.value); tx.value = clamp(sx.value + e.translationX, mx + 40); ty.value = clamp(sy.value + e.translationY, my + 40); })
    .onEnd(() => { const { mx, my } = limits(scale.value); tx.value = withSpring(clamp(tx.value, mx)); ty.value = withSpring(clamp(ty.value, my)); });

  const doubleTap = Gesture.Tap().numberOfTaps(2).maxDuration(260)
    .onEnd((e) => {
      if (scale.value > 1.05) { scale.value = withTiming(1); savedScale.value = 1; tx.value = withTiming(0); ty.value = withTiming(0); setZoomed(false); }
      else {
        const s = 2.2; scale.value = withTiming(s); savedScale.value = s;
        const { mx, my } = limits(s);
        tx.value = withTiming(clamp((width / 2 - e.x) * (s - 1), mx)); ty.value = withTiming(clamp((height / 2 - e.y) * (s - 1), my));
        setZoomed(true);
      }
    });
  const singleTap = Gesture.Tap().maxDuration(220).requireExternalGestureToFail(doubleTap).onEnd(() => { runOnJS(onTap)(); });

  // a larger page size opens the page already enlarged, at its top
  useEffect(() => {
    const s0 = Math.max(1, initialScale);
    scale.value = withTiming(s0, { duration: 180 }); savedScale.value = s0;
    const { my } = limits(s0); tx.value = 0; ty.value = withTiming(my, { duration: 180 });
    zoomed.value = s0 > 1.05; onZoomChange(s0 > 1.05);
  }, [initialScale]);

  const gesture = Gesture.Simultaneous(pinch, pan, Gesture.Exclusive(doubleTap, singleTap));
  const st = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }] }));

  return (
    <GestureDetector gesture={gesture}>
      <View style={{ width, height, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }} accessible accessibilityLabel={label}>
        <Animated.View style={[{ width: fitW, height: fitH }, st]}>
          <PageImage source={source} tint={tint} width={fitW} height={fitH} />
          {veil ? <PageVeil v={veil} w={fitW} h={fitH} /> : null}
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

function PageVeil({ v, w, h }: { v: Veil; w: number; h: number }) {
  const lineEnd = v.x <= 0.08; // the prayer ends at the end of its line
  const top = v.top * h, bot = v.bottom * h, x = v.x * w;
  const box = (l: number, t: number, ww: number, hh: number, k: string) => (
    <View key={k} pointerEvents="none" style={{ position: 'absolute', left: l, top: t, width: Math.max(0, ww), height: Math.max(0, hh), backgroundColor: v.color, opacity: 0.88 }} />
  );
  const parts = v.half === 'until'
    ? [box(0, bot, w, h - bot, 'a'), lineEnd ? null : box(0, top, x, bot - top, 'b')]
    : [box(0, 0, w, lineEnd ? bot : top, 'a'), lineEnd ? null : box(x, top, w - x, bot - top, 'b')];
  const edge = v.half === 'until' ? bot : lineEnd ? bot : top;
  return (
    <>
      {parts}
      <View pointerEvents="none" style={{ position: 'absolute', left: w * 0.06, right: w * 0.06, top: edge - 0.5, height: 1, backgroundColor: v.line, opacity: 0.7 }} />
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, alignItems: 'center', ...(v.half === 'until' ? { top: edge + 10 } : { top: Math.max(4, edge - 34) }) }}>
        <Text allowFontScaling={false} style={{ fontFamily: F.uiMed, fontSize: 13, lineHeight: 20, color: v.ink, paddingHorizontal: 12, paddingVertical: 3, borderRadius: 12, borderWidth: 1, borderColor: v.line, overflow: 'hidden' }}>{v.label}</Text>
      </View>
    </>
  );
}
