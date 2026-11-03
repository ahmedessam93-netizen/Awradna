// One book page: fits the screen, pinch or double-tap to zoom, drag when zoomed.
// While zoomed, page swiping is paused so the drag moves the page instead.
import { Image } from 'expo-image';
import React from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

type Props = { source: number; aspect: number; width: number; height: number; onZoomChange: (zoomed: boolean) => void; onTap: () => void; label: string };

export function ZoomPage({ source, aspect, width, height, onZoomChange, onTap, label }: Props) {
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

  const gesture = Gesture.Simultaneous(pinch, pan, Gesture.Exclusive(doubleTap, singleTap));
  const st = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }] }));

  return (
    <GestureDetector gesture={gesture}>
      <View style={{ width, height, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }} accessible accessibilityLabel={label}>
        <Animated.View style={[{ width: fitW, height: fitH }, st]}>
          <Image source={source} style={{ width: fitW, height: fitH }} contentFit="contain" transition={120} cachePolicy="memory-disk" />
        </Animated.View>
      </View>
    </GestureDetector>
  );
}
