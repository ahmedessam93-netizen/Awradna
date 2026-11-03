import { useKeepAwake } from 'expo-keep-awake';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import PagerView from 'react-native-pager-view';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BeadRing } from '../components/BeadRing';
import { CheckIcon, ChevronIcon, CloseIcon } from '../components/icons';
import { Glass, GlassButton, GoldButton, Txt, useTap } from '../components/ui';
import { ZoomPage } from '../components/ZoomPage';
import { PAGE_IMAGES, PAGE_IMAGES_NIGHT, PAGE_SIZE } from '../core/pages';
import { ar, cnt, mins, MN, Page, PG, plan, sum } from '../core/plan';
import { useStore } from '../core/store';
import { F, usePalette } from '../theme';

function KeepAwake() { useKeepAwake(); return null; }

type Item = { kind: 'page'; page: Page; n: number } | { kind: 'stop' } | { kind: 'fin' };

export default function Reader() {
  const p = usePalette(); const tap = useTap(); const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const params = useLocalSearchParams<{ start?: string; review?: string }>();
  const { state, markRead, markSitting, completeDay } = useStore();

  // Freeze the plan when the reader opens, so the sitting doesn't shift under the reader's fingers.
  const P = useMemo(() => plan(state, new Date()), []); // eslint-disable-line react-hooks/exhaustive-deps
  const review = params.review === '1';
  const start = Math.max(0, Math.min(Number(params.start || 0), Math.max(0, P.pages.length - 1)));
  const seq = useMemo(() => P.pages.slice(start), [P, start]);
  const stopAfter = useMemo(() => {
    if (review || !P.portion.length) return -1;
    const k = seq.findIndex((x) => x.id === P.portion[P.portion.length - 1].id);
    return k >= 0 && k < seq.length - 1 ? k : -1;
  }, [P, seq, review]);
  const items: Item[] = useMemo(() => {
    const out: Item[] = [];
    seq.forEach((pg, i) => { out.push({ kind: 'page', page: pg, n: i }); if (i === stopAfter) out.push({ kind: 'stop' }); });
    out.push({ kind: 'fin' });
    return out;
  }, [seq, stopAfter]);

  const pager = useRef<PagerView>(null);
  const [idx, setIdx] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const chrome = useSharedValue(1);
  const [chromeOn, setChromeOn] = useState(true);
  const toggleChrome = useCallback(() => { const v = chromeOn ? 0 : 1; chrome.value = withTiming(v, { duration: 220 }); setChromeOn(!chromeOn); }, [chromeOn]);
  const chromeSt = useAnimatedStyle(() => ({ opacity: chrome.value }));

  const winIdx = P.wins[P.nextIdx]?.i ?? 0;
  const onSelected = (i: number) => {
    setIdx(i); tap();
    // everything before the current position has been read
    const ids: string[] = [];
    for (let j = 0; j < i; j++) { const it = items[j]; if (it.kind === 'page') ids.push(it.page.id); }
    if (!review && ids.length) markRead(P.key, ids);
    const it = items[i];
    if (!review && it.kind === 'stop') { markSitting(P.key, winIdx); tap('success'); }
    if (it.kind === 'fin') { if (!review) completeDay(P.key, P.wins.map((x) => x.i)); tap('success'); }
    if (!chromeOn) { chrome.value = withTiming(1); setChromeOn(true); }
  };
  const next = () => pager.current?.setPage(Math.min(idx + 1, items.length - 1));

  const cur = items[idx];
  const sittingLen = stopAfter >= 0 ? stopAfter + 1 : seq.length;
  const posInSitting = cur.kind === 'page' ? cur.n + 1 : cur.kind === 'stop' ? sittingLen : seq.length;
  const den = stopAfter >= 0 && (cur.kind === 'stop' || (cur.kind === 'page' && cur.n <= stopAfter)) ? sittingLen : seq.length;
  const frac = Math.min(1, posInSitting / Math.max(1, den));
  const w = P.wins[P.nextIdx];
  const nightPages = p.pageFilter === 'night';
  const areaH = height - insets.top - insets.bottom;
  const readTotal = useMemo(() => {
    const s = plan(state, new Date()); return { read: s.readW, total: s.total };
  }, [state]);

  const nextLabel = cur.kind === 'page' && stopAfter >= 0 && cur.n === stopAfter ? 'إتمام الجلسة' : cur.kind === 'page' && cur.n === seq.length - 1 ? 'إنهاء الورد' : 'التالي';

  return (
    <View style={{ flex: 1, backgroundColor: nightPages ? '#0D1A17' : '#F5EFE2' }}>
      {state.settings.wake !== false && <KeepAwake />}
      <PagerView ref={pager} style={{ flex: 1 }} initialPage={0} layoutDirection="rtl" offscreenPageLimit={2} scrollEnabled={!zoomed} onPageSelected={(e) => onSelected(e.nativeEvent.position)}>
        {items.map((it, i) => {
          if (it.kind === 'page') {
            const id = it.page.id; const [pw, ph] = PAGE_SIZE[id] || [1110, 1768];
            return (
              <View key={`p${id}`} style={{ flex: 1, paddingTop: insets.top + 6, paddingBottom: insets.bottom + 6 }}>
                {Math.abs(i - idx) <= 2 ? (
                  <ZoomPage source={(nightPages ? PAGE_IMAGES_NIGHT : PAGE_IMAGES)[id]} aspect={pw / ph} width={width} height={areaH - 12}
                    onZoomChange={setZoomed} onTap={toggleChrome} label={`${it.page.title}، صفحة ${id}`} />
                ) : null}
              </View>
            );
          }
          if (it.kind === 'stop') {
            const left = seq.slice(stopAfter + 1); const lw = sum(left); const after = P.wins.length - P.nextIdx - 1;
            return (
              <View key="stop" style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 22 }}>
                <Glass padding={24} style={{ width: '100%', maxWidth: 420 }}>
                  <View style={{ alignItems: 'center' }}>
                    <BeadRing size={170} readFrac={readTotal.total ? readTotal.read / readTotal.total : 0} nowFrac={0}>
                      <CheckIcon size={34} color={p.gold} strokeWidth={2.4} />
                    </BeadRing>
                    <Txt v="title" align="center" style={{ marginTop: 4 }}>{`أتممت جلسة ${w?.name ?? ''}`}</Txt>
                    <Txt v="meta" align="center" style={{ marginTop: 4 }}>{`بقي اليوم ${PG(lw)}، نحو ${MN(mins(lw))}${after > 0 ? `، على ${cnt(after, 'جلسة', 'جلستين', 'جلسات')} قادمة` : ''}.`}</Txt>
                  </View>
                  <View style={{ gap: 10, marginTop: 20 }}>
                    <GoldButton label="أكمل الآن" onPress={next} />
                    <GlassButton label="يكفي الآن" onPress={() => router.back()} />
                  </View>
                </Glass>
              </View>
            );
          }
          return (
            <View key="fin" style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 22 }}>
              <Glass padding={24} style={{ width: '100%', maxWidth: 420 }}>
                <View style={{ alignItems: 'center' }}>
                  <BeadRing size={190} readFrac={1} nowFrac={0} complete>
                    <Txt v="display" align="center" style={{ fontSize: 30, lineHeight: 46 }}>تمّ</Txt>
                  </BeadRing>
                  <Txt v="title" align="center">{review ? 'انتهت المراجعة' : `تمّ ورد يوم ${P.dayName}`}</Txt>
                  <Txt v="meta" align="center" style={{ marginTop: 4 }}>تقبّل الله منك.</Txt>
                </View>
                <View style={{ marginTop: 20 }}><GoldButton label="العودة" onPress={() => router.back()} /></View>
              </Glass>
            </View>
          );
        })}
      </PagerView>

      {/* top bar */}
      <Animated.View pointerEvents={chromeOn ? 'box-none' : 'none'} style={[{ position: 'absolute', top: 0, left: 0, right: 0, paddingTop: insets.top + 6, paddingHorizontal: 12 }, chromeSt]}>
        <Glass radius={22} padding={8} strong>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Pressable onPress={() => router.back()} hitSlop={10} accessibilityRole="button" accessibilityLabel="إغلاق"
              style={{ width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: p.dark ? 'rgba(255,255,255,0.07)' : 'rgba(30,42,35,0.06)' }}>
              <CloseIcon size={20} color={p.ink} />
            </Pressable>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={1} maxFontSizeMultiplier={1.2} style={{ fontFamily: F.uiBold, fontSize: 15, color: p.ink, textAlign: 'right' }}>{review ? `مراجعة ورد ${P.dayName}` : `جلسة ${w?.name ?? ''}، ورد ${P.dayName}`}</Text>
              <Text numberOfLines={1} maxFontSizeMultiplier={1.2} style={{ fontFamily: F.ui, fontSize: 12, color: p.muted, textAlign: 'right' }}>{cur.kind === 'page' ? `${cur.page.title}، ص ${ar(cur.page.id.replace(/[ab]$/, ''))}` : ' '}</Text>
            </View>
          </View>
        </Glass>
      </Animated.View>

      {/* bottom bar */}
      {cur.kind === 'page' && (
        <Animated.View pointerEvents={chromeOn ? 'box-none' : 'none'} style={[{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: insets.bottom + 10, paddingHorizontal: 12 }, chromeSt]}>
          <Glass radius={22} padding={10} strong>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text maxFontSizeMultiplier={1.2} style={{ fontFamily: F.uiMed, fontSize: 13, color: p.muted, minWidth: 56, textAlign: 'right' }}>{`${ar(Math.min(posInSitting, den))} من ${ar(den)}`}</Text>
              <View style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: p.dark ? 'rgba(255,255,255,0.1)' : 'rgba(30,42,35,0.1)', overflow: 'hidden' }}>
                <LinearGradient colors={[p.goldHi, p.gold]} start={{ x: 1, y: 0 }} end={{ x: 0, y: 0 }} style={{ width: `${frac * 100}%`, height: 4 }} />
              </View>
              <Pressable onPress={() => { tap('medium'); next(); }} accessibilityRole="button" accessibilityLabel={nextLabel}>
                <LinearGradient colors={[p.goldHi, p.gold, p.goldDeep]} style={{ height: 42, borderRadius: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text maxFontSizeMultiplier={1.2} style={{ fontFamily: F.uiBold, fontSize: 14.5, color: p.onGold }}>{nextLabel}</Text>
                  <ChevronIcon size={16} color={p.onGold} dir="left" />
                </LinearGradient>
              </Pressable>
            </View>
          </Glass>
        </Animated.View>
      )}
    </View>
  );
}
