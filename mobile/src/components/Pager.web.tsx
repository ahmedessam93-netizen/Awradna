// Book pager for the web version. The current page and its neighbours are all mounted
// (neighbours invisible), so the next page is already loaded and turns instantly.
// Swipe left-to-right for the next page (as in an Arabic book); arrow keys work too.
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { View, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

export type PagerHandle = { setPage: (i: number) => void };
type Props = { style?: ViewStyle; initialPage?: number; scrollEnabled?: boolean; onPageSelected: (i: number) => void; children: React.ReactNode[] };

export const Pager = forwardRef<PagerHandle, Props>(function Pager({ style, initialPage = 0, scrollEnabled = true, onPageSelected, children }, ref) {
  const kids = React.Children.toArray(children);
  const [page, setPageState] = useState(initialPage);
  const pageRef = useRef(initialPage);
  const go = useCallback((i: number) => {
    const n = Math.max(0, Math.min(kids.length - 1, i));
    if (n === pageRef.current) return;
    pageRef.current = n; setPageState(n); onPageSelected(n);
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

  return (
    <GestureDetector gesture={swipe}>
      <View style={[{ flex: 1 }, style]}>
        {kids.map((k, i) => (Math.abs(i - page) <= 2 ? (
          <View key={i} pointerEvents={i === page ? 'auto' : 'none'}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: i === page ? 1 : 0, zIndex: i === page ? 1 : 0 }}>
            {k}
          </View>
        ) : null))}
      </View>
    </GestureDetector>
  );
});
