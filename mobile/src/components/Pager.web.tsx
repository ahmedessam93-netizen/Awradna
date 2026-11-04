// Book pager for the web version: one page at a time. Swipe left-to-right for the next page
// (as in an Arabic book), right-to-left to go back; arrow keys work too.
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { View, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

export type PagerHandle = { setPage: (i: number) => void };
type Props = { style?: ViewStyle; initialPage?: number; scrollEnabled?: boolean; onPageSelected: (i: number) => void; children: React.ReactNode[] };

export const Pager = forwardRef<PagerHandle, Props>(function Pager({ style, initialPage = 0, scrollEnabled = true, onPageSelected, children }, ref) {
  const kids = React.Children.toArray(children);
  const [page, setPageState] = useState(initialPage);
  const pageRef = useRef(initialPage);
  const fade = useSharedValue(1);
  const go = useCallback((i: number) => {
    const n = Math.max(0, Math.min(kids.length - 1, i));
    if (n === pageRef.current) return;
    pageRef.current = n; setPageState(n); onPageSelected(n);
    fade.value = 0.35; fade.value = withTiming(1, { duration: 220 });
  }, [kids.length, onPageSelected]);
  useImperativeHandle(ref, () => ({ setPage: go }), [go]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'ArrowLeft') go(pageRef.current + 1); if (e.key === 'ArrowRight') go(pageRef.current - 1); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  const swipe = Gesture.Pan().enabled(scrollEnabled).activeOffsetX([-30, 30]).failOffsetY([-25, 25])
    .onEnd((e) => {
      if (e.translationX > 60 || e.velocityX > 600) runOnJS(go)(pageRef.current + 1);
      else if (e.translationX < -60 || e.velocityX < -600) runOnJS(go)(pageRef.current - 1);
    });
  const st = useAnimatedStyle(() => ({ opacity: fade.value }));

  return (
    <GestureDetector gesture={swipe}>
      <View style={[{ flex: 1 }, style]}>
        <Animated.View style={[{ flex: 1 }, st]}>{kids[page]}</Animated.View>
      </View>
    </GestureDetector>
  );
});
