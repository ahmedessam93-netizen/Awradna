import { useKeepAwake } from 'expo-keep-awake';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import PagerView from 'react-native-pager-view';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronIcon, CloseIcon } from '../components/icons';
import { Shamsa } from '../components/ornaments';
import { Bar, GlassButton, GoldButton, IconButton, Sky, Txt, useTap } from '../components/ui';
import { LinearGradient } from 'expo-linear-gradient';
import { ZoomPage } from '../components/ZoomPage';
import { PAGE_IMAGES, PAGE_SIZE } from '../core/pages';
import { ar, cnt, fmtTime, mins, MN, Page, PG, plan, sum } from '../core/plan';
import { useStore } from '../core/store';
import { F, usePalette } from '../theme';

function KeepAwake() { useKeepAwake(); return null; }
const pn = (id: string) => ar(id.replace(/[ab]$/, ''));
const ZOOMS = [1, 1.25, 1.5];

type Item = { kind: 'page'; page: Page; n: number } | { kind: 'stop' } | { kind: 'fin' };

// A completed sitting (or day): the shamsa, a blessing, and what is left.
function Done({ title, line, primary, onPrimary, secondary, onSecondary }: { title: string; line: string; primary: string; onPrimary: () => void; secondary?: string; onSecondary?: () => void }) {
  const p = usePalette(); const insets = useSafeAreaInsets(); const { width, height } = useWindowDimensions();
  const s = Math.min(width - 90, 300, height * 0.38);
  return (
    <View style={{ flex: 1 }}>
    <Sky glowAt={height * 0.3} />
    <View style={{ flex: 1, paddingTop: insets.top + 40, paddingBottom: insets.bottom + 28, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'space-between' }}>
      <View style={{ alignItems: 'center' }}>
        <Animated.View entering={FadeIn.duration(900)}><Shamsa size={s} /></Animated.View>
        <Txt v="display" align="center" style={{ fontSize: 32, lineHeight: 46, marginTop: 18 }}>{title}</Txt>
        <Text maxFontSizeMultiplier={1.3} style={{ fontFamily: F.serif, fontSize: 21, lineHeight: 34, color: p.ink, textAlign: 'center' }}>تقبّل الله منك</Text>
        <Txt v="meta" align="center" style={{ marginTop: 8, fontSize: 15, lineHeight: 24 }}>{line}</Txt>
      </View>
      <View style={{ alignSelf: 'stretch', gap: 12, maxWidth: 480, width: '100%' }}>
        <GoldButton label={primary} onPress={onPrimary} />
        {secondary && onSecondary ? <GlassButton label={secondary} onPress={onSecondary} /> : null}
      </View>
    </View>
    </View>
  );
}

export default function Reader() {
  const p = usePalette(); const tap = useTap(); const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const params = useLocalSearchParams<{ start?: string; review?: string }>();
  const { state, markRead, markSitting, completeDay, setSettings } = useStore();

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
  const [idx, setIdx] = useState(0); const idxRef = useRef(0);
  const zoom = state.settings.pageZoom || 1;
  const [zoomed, setZoomed] = useState(zoom > 1);
  const chrome = useSharedValue(1);
  const [chromeOn, setChromeOn] = useState(true);
  const toggleChrome = useCallback(() => { const v = chromeOn ? 0 : 1; chrome.value = withTiming(v, { duration: 220 }); setChromeOn(!chromeOn); }, [chromeOn]);
  const chromeSt = useAnimatedStyle(() => ({ opacity: chrome.value }));

  const w = P.wins[P.nextIdx];
  const winIdx = w?.i ?? 0;
  const onSelected = (i: number) => {
    setIdx(i); idxRef.current = i; tap();
    setZoomed(items[i].kind === 'page' && zoom > 1);
    const ids: string[] = [];
    for (let j = 0; j < i; j++) { const it = items[j]; if (it.kind === 'page') ids.push(it.page.id); }
    if (!review && ids.length) markRead(P.key, ids);
    const it = items[i];
    if (!review && it.kind === 'stop') { markSitting(P.key, winIdx); tap('success'); }
    if (it.kind === 'fin') { if (!review) completeDay(P.key, P.wins.map((x) => x.i)); tap('success'); }
    if (!chromeOn) { chrome.value = withTiming(1); setChromeOn(true); }
  };
  const next = () => pager.current?.setPage(Math.min(idx + 1, items.length - 1));
  const cycleZoom = () => { const k = ZOOMS.indexOf(zoom); setSettings({ pageZoom: ZOOMS[(k + 1) % ZOOMS.length] }); };

  const cur = items[idx];
  const inSitting = stopAfter >= 0 && (cur.kind === 'stop' || (cur.kind === 'page' && cur.n <= stopAfter));
  const group = inSitting ? seq.slice(0, stopAfter + 1) : stopAfter >= 0 ? seq.slice(stopAfter + 1) : seq;
  const base = inSitting || stopAfter < 0 ? 0 : stopAfter + 1;
  const pos = cur.kind === 'page' ? cur.n - base : group.length;
  const leftW = sum(group.slice(Math.max(0, pos)));
  const areaH = height - insets.top - insets.bottom;
  const tint = p.pageInk;

  const nextLabel = cur.kind === 'page' && stopAfter >= 0 && cur.n === stopAfter ? 'إتمام الجلسة' : cur.kind === 'page' && cur.n === seq.length - 1 ? 'إنهاء الورد' : 'التالية';
  const title = review ? `مراجعة ورد ${P.dayName}` : P.complete ? `ورد ${P.dayName}` : `جلسة ${w?.name ?? ''}`;

  // after the sitting: what is left today
  const afterLeft = seq.slice(stopAfter + 1); const lw = sum(afterLeft); const after = P.wins.length - P.nextIdx - 1;
  const nextWin = P.wins[P.nextIdx + 1];
  const stopLine = `بقيت ${PG(Math.round(lw))} من ورد اليوم${after > 0 ? `، على ${cnt(after, 'جلسة قادمة', 'جلستين قادمتين', 'جلسات قادمة')}` : ''}.${nextWin ? ` التالية بعد ${nextWin.name}، ${fmtTime(nextWin.time)}.` : ''}`;
  const marks = group.length <= 14;

  return (
    <View style={{ flex: 1, backgroundColor: p.pageBg }}>
      {state.settings.wake !== false && <KeepAwake />}
      <PagerView ref={pager} style={{ flex: 1 }} initialPage={0} layoutDirection="rtl" offscreenPageLimit={2} scrollEnabled={!zoomed} onPageSelected={(e) => onSelected(e.nativeEvent.position)}>
        {items.map((it, i) => {
          if (it.kind === 'page') {
            const id = it.page.id; const [pw, ph] = PAGE_SIZE[id] || [1110, 1768];
            return (
              <View key={`p${id}`} style={{ flex: 1, paddingTop: insets.top + 74, paddingBottom: insets.bottom + 88 }}>
                {Math.abs(i - idx) <= 2 ? (
                  <ZoomPage source={PAGE_IMAGES[id]} tint={tint} aspect={pw / ph} width={width} height={areaH - 162} initialScale={zoom}
                    onZoomChange={(z) => { if (i === idxRef.current) setZoomed(z); }} onTap={toggleChrome} label={`${it.page.title}، صفحة ${pn(id)}`} />
                ) : null}
              </View>
            );
          }
          if (it.kind === 'stop') {
            return (
              <View key="stop" style={{ flex: 1 }}>
                {idx === i ? <Done title={`أتممتَ جلسة ${w?.name ?? ''}`} line={stopLine} primary="أكمل الآن" onPrimary={next} secondary="يكفي الآن" onSecondary={() => router.back()} /> : null}
              </View>
            );
          }
          return (
            <View key="fin" style={{ flex: 1 }}>
              {idx === i ? <Done title={review ? 'انتهت المراجعة' : `تمّ ورد ${P.dayName}`} line={review ? 'جزاك الله خيرًا.' : 'ورد الغد يبدأ بعد الفجر.'} primary="العودة" onPrimary={() => router.back()} /> : null}
            </View>
          );
        })}
      </PagerView>

      {/* top: where you are */}
      {cur.kind === 'page' && (
        <Animated.View pointerEvents={chromeOn ? 'box-none' : 'none'} style={[{ position: 'absolute', top: insets.top + 8, left: 16, right: 16 }, chromeSt]}>
          <Bar radius={22}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8 }}>
              <IconButton label="إغلاق" onPress={() => router.back()}><CloseIcon size={20} color={p.ink} /></IconButton>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={1} maxFontSizeMultiplier={1.2} style={{ fontFamily: F.display, fontSize: 17, lineHeight: 24, color: p.ink, textAlign: 'right' }}>{title}</Text>
                <Text numberOfLines={1} maxFontSizeMultiplier={1.2} style={{ fontFamily: F.ui, fontSize: 12.5, lineHeight: 18, color: p.muted, textAlign: 'right' }}>{`${cur.page.title}، ص ${pn(cur.page.id)}`}</Text>
              </View>
              <IconButton label={`حجم الصفحة: ${zoom === 1 ? 'عادي' : zoom < 1.4 ? 'كبير' : 'أكبر'}`} onPress={cycleZoom}>
                <Text allowFontScaling={false} style={{ fontFamily: F.title, color: p.ink, fontSize: 18 }}>أ<Text style={{ fontSize: 12 }}>أ</Text></Text>
              </IconButton>
            </View>
          </Bar>
        </Animated.View>
      )}

      {/* bottom: the sitting as a row of rosettes, one per page */}
      {cur.kind === 'page' && (
        <Animated.View pointerEvents={chromeOn ? 'box-none' : 'none'} style={[{ position: 'absolute', bottom: insets.bottom + 14, left: 16, right: 16 }, chromeSt]}>
          <Bar radius={24}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 }}>
              <View style={{ flex: 1, paddingStart: 6, gap: 4 }} accessible accessibilityLabel={`الصفحة ${ar(pos + 1)} من ${ar(group.length)}`}>
                {marks ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                    {group.map((g, k) => (
                      <Text key={g.id} allowFontScaling={false} style={{ fontFamily: F.serif, fontSize: k === pos ? 22 : 17, lineHeight: 24, color: k < pos ? p.gold : k === pos ? p.turq : p.faint, opacity: k > pos ? 0.6 : 1 }}>۞</Text>
                    ))}
                  </View>
                ) : null}
                <Text maxFontSizeMultiplier={1.2} style={{ fontFamily: F.ui, fontSize: 12.5, lineHeight: 18, color: p.muted, textAlign: 'right' }}>
                  {`صفحة ${ar(pos + 1)} من ${ar(group.length)}${leftW > 0 ? `، ${pos + 1 >= group.length ? 'الأخيرة' : `بقي نحو ${MN(mins(leftW))}`}` : ''}`}
                </Text>
              </View>
              <Pressable onPress={() => { tap('medium'); next(); }} accessibilityRole="button" accessibilityLabel={nextLabel}>
                {({ pressed }) => (
                  <LinearGradient colors={p.primary} locations={[0, 0.48, 1]} style={{ height: 52, paddingHorizontal: 20, borderRadius: 17, flexDirection: 'row', alignItems: 'center', gap: 8, opacity: pressed ? 0.85 : 1 }}>
                    <Text maxFontSizeMultiplier={1.2} style={{ fontFamily: F.uiBold, fontSize: 16, color: p.onPrimary }}>{nextLabel}</Text>
                    <ChevronIcon size={18} color={p.onPrimary} strokeWidth={2.2} />
                  </LinearGradient>
                )}
              </Pressable>
            </View>
          </Bar>
        </Animated.View>
      )}
    </View>
  );
}
