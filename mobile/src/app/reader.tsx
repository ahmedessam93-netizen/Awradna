import { useKeepAwake } from 'expo-keep-awake';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { Pager, PagerHandle } from '../components/Pager';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronIcon, CloseIcon } from '../components/icons';
import { Shamsa } from '../components/ornaments';
import { Bar, GlassButton, GoldButton, IconButton, Sky, Txt, useTap } from '../components/ui';
import { LinearGradient } from 'expo-linear-gradient';
import { ZoomPage } from '../components/ZoomPage';
import { PAGE_IMAGES, PAGE_SIZE } from '../core/pages';
import { prefetchPages } from '../core/prefetch';
import { ar, cnt, fmtTime, mins, MN, Page, PG, planForDay, sittingPortion, sum } from '../core/plan';
import { useStore } from '../core/store';
import { F, usePalette } from '../theme';

function KeepAwake() { useKeepAwake(); return null; }
const pn = (id: string) => ar(id.replace(/[ab]$/, ''));
const ZOOMS = [1, 1.25, 1.5];

type Item = { kind: 'page'; page: Page; n: number } | { kind: 'stop'; k: number; after: number } | { kind: 'fin' };

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
  const params = useLocalSearchParams<{ start?: string; review?: string; day?: string; win?: string }>();
  const { state, markRead, markSitting, completeDay, setSettings } = useStore();

  // Freeze the plan when the reader opens, so the sitting doesn't shift under the reader's fingers.
  // A chosen day (any day can be opened) and, optionally, a chosen sitting (even a missed one).
  const P = useMemo(() => {
    const base = planForDay(state, params.day || null, new Date());
    if (params.win == null || params.review === '1') return base;
    const k = Math.max(0, Math.min(base.wins.length - 1, Number(params.win)));
    return { ...base, portion: sittingPortion(base, k), nextIdx: k, curDone: false };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const review = params.review === '1';
  const start = Math.max(0, Math.min(Number(params.start || 0), Math.max(0, P.pages.length - 1)));
  // the whole day is in the reader, so you can always go back; it opens at your place
  const seq = P.pages;
  const startN = start;
  // Step by step: the reading stops after each sitting's share. The first stop ends the sitting
  // being read; the rest of the day is divided evenly over the sittings still to come.
  const stops = useMemo(() => {
    const out: { after: number; k: number }[] = [];
    if (review || !P.portion.length) return out;
    const first = seq.findIndex((x, i) => i >= startN && x.id === P.portion[P.portion.length - 1].id);
    if (first < 0 || first >= seq.length - 1) return out;
    out.push({ after: first, k: P.nextIdx });
    const done = state.days[P.key]?.done || {};
    const later = P.wins.map((w, k) => ({ w, k })).filter((x) => x.k > P.nextIdx && !done[x.w.i]);
    if (later.length > 1) {
      const read = state.days[P.key]?.read || {};
      const rest = seq.slice(first + 1).filter((x) => !read[x.id]);
      const share = sum(rest) / later.length;
      let acc = 0, j = 0;
      for (let i = first + 1; i < seq.length - 1 && j < later.length - 1; i++) {
        if (!read[seq[i].id]) acc += seq[i].w;
        if (acc >= share * (j + 1) - 1e-9) { out.push({ after: i, k: later[j].k }); j++; }
      }
    }
    return out;
  }, [P, seq, review, startN]); // eslint-disable-line react-hooks/exhaustive-deps
  const items: Item[] = useMemo(() => {
    const out: Item[] = [];
    seq.forEach((pg, i) => { out.push({ kind: 'page', page: pg, n: i }); const st = stops.find((x) => x.after === i); if (st) out.push({ kind: 'stop', k: st.k, after: i }); });
    out.push({ kind: 'fin' });
    return out;
  }, [seq, stops]);

  const pager = useRef<PagerHandle>(null);
  // load the coming pages ahead, so turning a page never waits
  useEffect(() => { prefetchPages(seq.slice(Math.max(0, startN - 2), startN + 16).map((x) => PAGE_IMAGES[x.id])); }, [seq]);
  const startItem = Math.max(0, items.findIndex((it) => it.kind === 'page' && it.n === startN));
  const [idx, setIdx] = useState(startItem); const idxRef = useRef(startItem);
  const zoom = state.settings.pageZoom || 1;
  const [zoomed, setZoomed] = useState(zoom > 1);
  const chrome = useSharedValue(1);
  const [chromeOn, setChromeOn] = useState(true);
  const toggleChrome = useCallback(() => { const v = chromeOn ? 0 : 1; chrome.value = withTiming(v, { duration: 220 }); setChromeOn(!chromeOn); }, [chromeOn]);
  const chromeSt = useAnimatedStyle(() => ({ opacity: chrome.value }));

  const cur = items[idx];
  // the sitting the current page belongs to
  const segIdx = cur.kind === 'page' ? stops.findIndex((x) => cur.n <= x.after) : cur.kind === 'stop' ? stops.findIndex((x) => x.after === cur.after) : -1;
  const seg = segIdx >= 0 ? stops[segIdx] : null;
  const before = cur.kind === 'page' && cur.n < startN; // a page before where you opened
  const segStart = before ? 0 : segIdx > 0 ? stops[segIdx - 1].after + 1 : seg ? startN : stops.length ? stops[stops.length - 1].after + 1 : startN;
  const segEnd = before ? startN - 1 : seg ? seg.after : seq.length - 1;
  const lastK = (() => { const done = state.days[P.key]?.done || {}; const used = new Set(stops.map((x) => x.k)); const rest = P.wins.map((w, k) => k).filter((k) => k >= P.nextIdx && !used.has(k) && !done[P.wins[k].i]); return rest.length ? rest[rest.length - 1] : P.nextIdx; })();
  const w = P.wins[seg ? seg.k : stops.length ? lastK : P.nextIdx];
  const onSelected = (i: number) => {
    setIdx(i); idxRef.current = i; tap();
    setZoomed(items[i].kind === 'page' && zoom > 1);
    const ids: string[] = [];
    // only the pages you have moved past since opening count as read (going back changes nothing)
    for (let j = startItem; j < i; j++) { const it = items[j]; if (it.kind === 'page') ids.push(it.page.id); }
    // save after the page has turned, so saving never delays the turn
    if (!review && ids.length) setTimeout(() => markRead(P.key, ids), 400);
    const it = items[i];
    if (!review && it.kind === 'stop') { markSitting(P.key, P.wins[it.k].i); tap('success'); }
    if (it.kind === 'fin') { if (!review) completeDay(P.key, P.wins.map((x) => x.i)); tap('success'); }
    if (!chromeOn) { chrome.value = withTiming(1); setChromeOn(true); }
  };
  const next = () => pager.current?.setPage(Math.min(idx + 1, items.length - 1));
  const prev = () => pager.current?.setPage(Math.max(idx - 1, 0));
  const cycleZoom = () => { const k = ZOOMS.indexOf(zoom); setSettings({ pageZoom: ZOOMS[(k + 1) % ZOOMS.length] }); };

  const group = seq.slice(segStart, segEnd + 1);
  const pos = cur.kind === 'page' ? cur.n - segStart : group.length;
  const leftW = sum(group.slice(Math.max(0, pos)));
  const areaH = height - insets.top - insets.bottom;
  const tint = p.pageInk;

  const nextLabel = cur.kind === 'page' && seg && cur.n === seg.after ? 'إتمام الجلسة' : cur.kind === 'page' && cur.n === seq.length - 1 ? 'إنهاء الورد' : 'التالية';
  const otherDay = !!params.day && params.day !== planForDay(state, null, new Date()).key;
  const title = review ? `مراجعة ورد ${P.dayName}` : P.complete || (otherDay && params.win == null) ? `ورد ${P.dayName}` : `جلسة ${w?.name ?? ''}`;

  // after a sitting: what is left today, and which sitting comes next
  const stopInfo = (st: { k: number; after: number }) => {
    const lw = sum(seq.slice(st.after + 1));
    const j = stops.findIndex((x) => x.after === st.after);
    const nk = j >= 0 && j + 1 < stops.length ? stops[j + 1].k : lastK;
    const nw = P.wins[nk];
    const line = `بقيت ${PG(Math.round(lw))} من ورد اليوم. التالية جلسة ${nw.name}${nw.time ? `، بعد ${nw.name} ${fmtTime(nw.time)}` : ''}. ولك أن تكملها الآن، فالجلسات للتيسير فقط.`;
    return { title: `أتممتَ جلسة ${P.wins[st.k].name}`, line, cont: `أكمل: جلسة ${nw.name}` };
  };
  const marks = !before && group.length <= 14;

  return (
    <View style={{ flex: 1, backgroundColor: p.pageBg }}>
      {state.settings.wake !== false && <KeepAwake />}
      <Pager ref={pager} style={{ flex: 1 }} initialPage={startItem} scrollEnabled={!zoomed} onPageSelected={onSelected}>
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
              <View key={`stop${it.after}`} style={{ flex: 1 }}>
                {idx === i ? (() => { const d = stopInfo(it); return <Done title={d.title} line={d.line} primary={d.cont} onPrimary={next} secondary="يكفي الآن" onSecondary={() => router.back()} />; })() : null}
              </View>
            );
          }
          return (
            <View key="fin" style={{ flex: 1 }}>
              {idx === i ? <Done title={review ? 'انتهت المراجعة' : `تمّ ورد ${P.dayName}`} line={review ? 'جزاك الله خيرًا.' : 'ورد الغد يبدأ بعد الفجر.'} primary="العودة" onPrimary={() => router.back()} /> : null}
            </View>
          );
        })}
      </Pager>

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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 }}>
              <Pressable onPress={() => { tap(); prev(); }} disabled={idx === 0} accessibilityRole="button" accessibilityLabel="الصفحة السابقة" hitSlop={6}
                style={({ pressed }) => ({ width: 48, height: 52, borderRadius: 17, alignItems: 'center', justifyContent: 'center', opacity: idx === 0 ? 0.35 : pressed ? 0.7 : 1, backgroundColor: p.chip, borderWidth: 1, borderColor: p.chipBorder })}>
                <ChevronIcon dir="right" size={20} color={p.ink} strokeWidth={2.2} />
              </Pressable>
              <View style={{ flex: 1, paddingStart: 2, gap: 4 }} accessible accessibilityLabel={`الصفحة ${ar(pos + 1)} من ${ar(group.length)}`}>
                {marks ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                    {group.map((g, k) => (
                      <Text key={g.id} allowFontScaling={false} style={{ fontFamily: F.serif, fontSize: k === pos ? 22 : 17, lineHeight: 24, color: k < pos ? p.gold : k === pos ? p.turq : p.faint, opacity: k > pos ? 0.6 : 1 }}>۞</Text>
                    ))}
                  </View>
                ) : null}
                <Text maxFontSizeMultiplier={1.2} style={{ fontFamily: F.ui, fontSize: 12.5, lineHeight: 18, color: p.muted, textAlign: 'right' }}>
                  {before ? 'مما قرأته من قبل' : `صفحة ${ar(pos + 1)} من ${ar(group.length)}${leftW > 0 ? `، ${pos + 1 >= group.length ? 'الأخيرة' : `بقي نحو ${MN(mins(leftW))}`}` : ''}`}
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
