import { useKeepAwake } from 'expo-keep-awake';
import { leave } from '../core/nav';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';
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
import { ar, fmtTime, mins, MN, PG, planForDay } from '../core/plan';
import { itemRead, RItem } from '../core/sittings';
import { useStore } from '../core/store';
import { F, usePalette } from '../theme';

function KeepAwake() { useKeepAwake(); return null; }
const pn = (id: string) => ar(id.replace(/[a-c]$/, ''));
const ZOOMS = [1, 1.25, 1.5];

type Item = { kind: 'page'; it: RItem } | { kind: 'stop'; k: number } | { kind: 'fin' };
// staying this long on a page saves it as your place
const DWELL = 2500;

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
  // day: which day's wird. seg: open at the start of that sitting. page: open at that page.
  // Neither: continue from the saved place.
  const params = useLocalSearchParams<{ day?: string; seg?: string; page?: string }>();
  const { state, markRead, markSitting, completeDay, setSettings, setPlace } = useStore();

  // The day's sittings are fixed, so the reader holds the whole day and you can move freely in it.
  const P = useMemo(() => planForDay(state, params.day || null, new Date()), []); // eslint-disable-line react-hooks/exhaustive-deps
  const items: Item[] = useMemo(() => {
    const out: Item[] = [];
    const nonEmpty = P.segs.map((s, k) => (s.length ? k : -1)).filter((k) => k >= 0);
    nonEmpty.forEach((k, j) => {
      P.segs[k].forEach((it) => out.push({ kind: 'page', it }));
      if (j < nonEmpty.length - 1) out.push({ kind: 'stop', k });
    });
    out.push({ kind: 'fin' });
    return out;
  }, [P]);
  const pageItems = (k: number) => items.filter((x): x is { kind: 'page'; it: RItem } => x.kind === 'page' && x.it.k === k);
  const lastK = useMemo(() => { for (let i = items.length - 1; i >= 0; i--) { const x = items[i]; if (x.kind === 'page') return x.it.k; } return 0; }, [items]);

  const startItem = useMemo(() => {
    const find = (f: (x: Item) => boolean) => items.findIndex(f);
    let i = -1;
    if (params.seg != null) i = find((x) => x.kind === 'page' && x.it.k === Number(params.seg));
    else if (params.page) i = find((x) => x.kind === 'page' && x.it.page.id === params.page);
    else {
      const at = P.at; const read = state.days[P.key]?.read;
      if (at) { i = find((x) => x.kind === 'page' && x.it.key === at); if (i < 0) i = find((x) => x.kind === 'page' && x.it.page.id === at.split('~')[0]); }
      if (i < 0) i = find((x) => x.kind === 'page' && !itemRead(read, x.it));
    }
    return Math.max(0, i);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pager = useRef<PagerHandle>(null);
  const [idx, setIdx] = useState(startItem); const idxRef = useRef(startItem);
  // load the coming pages ahead, so turning a page never waits
  useEffect(() => {
    const ids: number[] = [];
    for (let j = Math.max(0, startItem - 2); j < Math.min(items.length, startItem + 18); j++) { const x = items[j]; if (x.kind === 'page') ids.push(PAGE_IMAGES[x.it.page.id]); }
    prefetchPages(ids);
  }, [items]);

  // ---- saving your place ----
  // A page becomes your place once you stay on it for a moment (a quick flip through pages
  // doesn't move it), and again whenever you leave: closing the reader or leaving the app.
  // A page counts as read once you have stayed on it and then moved on past it.
  const shownAt = useRef(Date.now());
  const dwell = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stayed = useRef<Set<number>>(new Set());
  const savePlace = useCallback((i: number) => {
    const x = items[i]; if (!x || x.kind !== 'page') return;
    setPlace(P.key, x.it.key);
    const keys: string[] = [];
    stayed.current.forEach((j) => { const y = items[j]; if (j < i && y.kind === 'page') { keys.push(y.it.key); stayed.current.delete(j); } });
    if (keys.length) markRead(P.key, keys);
    stayed.current.add(i);
  }, [items, P.key, setPlace, markRead]);
  const startDwell = useCallback((i: number) => {
    if (dwell.current) clearTimeout(dwell.current);
    shownAt.current = Date.now();
    if (items[i]?.kind === 'page') dwell.current = setTimeout(() => { dwell.current = null; savePlace(i); }, DWELL);
  }, [items, savePlace]);
  const flush = useCallback(() => {
    const i = idxRef.current;
    if (dwell.current && Date.now() - shownAt.current >= 1500) { clearTimeout(dwell.current); dwell.current = null; savePlace(i); }
  }, [savePlace]);
  const flushRef = useRef(flush); flushRef.current = flush;
  useEffect(() => {
    startDwell(startItem);
    const sub = AppState.addEventListener('change', (st) => { if (st !== 'active') flushRef.current(); });
    const onHide = () => flushRef.current();
    if (Platform.OS === 'web' && typeof window !== 'undefined') { window.addEventListener('pagehide', onHide); document.addEventListener('visibilitychange', onHide); }
    return () => {
      flushRef.current(); sub.remove();
      if (Platform.OS === 'web' && typeof window !== 'undefined') { window.removeEventListener('pagehide', onHide); document.removeEventListener('visibilitychange', onHide); }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const close = () => { flush(); leave('/'); };

  const zoom = state.settings.pageZoom || 1;
  const [zoomed, setZoomed] = useState(zoom > 1);
  const chrome = useSharedValue(1);
  const [chromeOn, setChromeOn] = useState(true);
  // The page is read on its own, like the printed book. The controls show for a moment when the
  // reader opens and whenever the page is tapped; turning the page hides them again.
  const hideT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showChrome = useCallback((on: boolean) => {
    if (hideT.current) { clearTimeout(hideT.current); hideT.current = null; }
    chrome.value = withTiming(on ? 1 : 0, { duration: 220 }); setChromeOn(on);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { hideT.current = setTimeout(() => showChrome(false), 2600); return () => { if (hideT.current) clearTimeout(hideT.current); }; }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const toggleChrome = useCallback(() => showChrome(!chromeOn), [chromeOn, showChrome]);
  const chromeSt = useAnimatedStyle(() => ({ opacity: chrome.value }));

  const finishSitting = (k: number, nextAt?: string) => {
    markSitting(P.key, P.wins[k].i, pageItems(k).map((x) => x.it.key), nextAt);
  };
  const onSelected = (i: number) => {
    const from = idxRef.current;
    // going back never stops on a "sitting done" screen: straight to the page before it
    if (items[i].kind === 'stop' && i < from) { setTimeout(() => pager.current?.setPage(i - 1), 0); return; }
    setIdx(i); idxRef.current = i; tap();
    setZoomed(items[i].kind === 'page' && zoom > 1);
    startDwell(i);
    const x = items[i];
    if (x.kind === 'stop') {
      // the sitting is done; your place moves to the start of the next one
      const nx = items[i + 1];
      finishSitting(x.k, nx && nx.kind === 'page' ? nx.it.key : undefined);
      stayed.current.clear(); tap('success');
    }
    if (x.kind === 'fin') {
      const keys: string[] = []; stayed.current.forEach((j) => { const y = items[j]; if (y.kind === 'page') keys.push(y.it.key); }); stayed.current.clear();
      if (keys.length) markRead(P.key, keys);
      finishSitting(lastK); tap('success');
    }
    if (chromeOn) showChrome(false);
  };
  const next = () => pager.current?.setPage(Math.min(idx + 1, items.length - 1));
  const prev = () => pager.current?.setPage(Math.max(idx - 1, 0));
  const cycleZoom = () => { const k = ZOOMS.indexOf(zoom); setSettings({ pageZoom: ZOOMS[(k + 1) % ZOOMS.length] }); };

  // once every page is read, the day is complete
  const read = state.days[P.key]?.read;
  const allRead = items.every((x) => x.kind !== 'page' || itemRead(read, x.it));
  const cur = items[idx];
  useEffect(() => { if (cur.kind === 'fin' && allRead) completeDay(P.key, P.wins.map((x) => x.i)); }, [cur.kind, allRead]); // eslint-disable-line react-hooks/exhaustive-deps

  // the sitting the current page belongs to: its pages are fixed
  const k = cur.kind === 'page' ? cur.it.k : cur.kind === 'stop' ? cur.k : lastK;
  const group = pageItems(k);
  const pos = cur.kind === 'page' ? group.findIndex((x) => x.it.key === cur.it.key) : group.length;
  const leftW = group.slice(Math.max(0, pos)).reduce((a, x) => a + x.it.w, 0);
  const areaH = height - insets.top - insets.bottom;
  const tint = p.pageInk;
  const nextNonEmpty = (k0: number) => { for (let j = k0 + 1; j < P.wins.length; j++) if (P.segs[j].length) return j; return -1; };

  const isLastOfSeg = cur.kind === 'page' && pos === group.length - 1;
  const nextLabel = isLastOfSeg ? (nextNonEmpty(k) < 0 ? 'إنهاء الورد' : 'إتمام الجلسة') : 'التالية';
  const otherDay = !!params.day && params.day !== planForDay(state, null, new Date()).key;
  const title = `${otherDay ? `ورد ${P.dayName}، ` : ''}جلسة ${P.wins[k]?.name ?? ''}`;

  // after a sitting: what is left today, and which sitting comes next
  const stopInfo = (k0: number) => {
    const nk = nextNonEmpty(k0); const nw = P.wins[nk >= 0 ? nk : k0];
    const left = items.reduce((a, x) => a + (x.kind === 'page' && !itemRead(read, x.it) ? x.it.w : 0), 0);
    // say where the person is now: the next sitting may already be due, or even behind
    const now = new Date(); let curK = -1;
    P.wins.forEach((w, k) => { if (w.time && w.time <= now) curK = k; });
    const done = state.days[P.key]?.done || {};
    let when: string;
    if (otherDay || !nw.time) when = `التالية جلسة ${nw.name}. ولك أن تكملها الآن، فالجلسات للتيسير فقط.`;
    else if (nw.time > now) when = `التالية جلسة ${nw.name}، بعد ${nw.name} ${fmtTime(nw.time)}. ولك أن تكملها الآن، فالجلسات للتيسير فقط.`;
    else if (curK <= nk) when = `حان وقت جلسة ${nw.name}، فأكملها الآن إن شئت.`;
    else {
      const behind = P.wins.map((w, k) => k).filter((k) => k >= nk && k < curK && P.segs[k].length && !done[P.wins[k].i]).map((k) => P.wins[k].name);
      const names = behind.length ? behind : [nw.name];
      when = `دخل وقت ${P.wins[curK].name}، وما زالت قبله ${names.length > 1 ? 'جلسات' : 'جلسة'} ${names.join('، ')}. أكملها الآن إن شئت، فالجلسات للتيسير فقط.`;
    }
    const line = `${left > 0.5 ? `بقيت ${PG(Math.max(1, Math.round(left)))} من ورد اليوم. ` : ''}${when}`;
    return { title: `أتممتَ جلسة ${P.wins[k0].name}`, line, cont: `أكمل: جلسة ${nw.name}` };
  };
  const finInfo = () => {
    if (allRead) return { title: `تمّ ورد ${P.dayName}`, line: 'ورد الغد يبدأ بعد الفجر.' };
    const missing = P.segs.map((s, j) => (s.length && s.some((it) => !itemRead(read, it)) ? P.wins[j].name : null)).filter(Boolean);
    return { title: `أتممتَ جلسة ${P.wins[lastK].name}`, line: `بقي من ورد ${P.dayName}: ${missing.length > 1 ? 'جلسات' : 'جلسة'} ${missing.join('، ')}. اضغطها في الصفحة الرئيسية متى شئت.` };
  };
  const marks = group.length <= 14;
  const veilFor = (it: RItem) => {
    if (!it.half || !it.cut) return undefined;
    const other = it.half === 'until' ? nextNonEmpty(it.k) : (() => { for (let j = it.k - 1; j >= 0; j--) if (P.segs[j].length) return j; return -1; })();
    const name = other >= 0 ? P.wins[other].name : '';
    return { half: it.half, ...it.cut, color: p.pageBg, line: p.gold, ink: p.muted, label: it.half === 'until' ? `يتبع في جلسة ${name}` : `من جلسة ${name}` };
  };

  return (
    <View style={{ flex: 1, backgroundColor: p.pageBg }}>
      {state.settings.wake !== false && <KeepAwake />}
      <Pager ref={pager} style={{ flex: 1 }} paper={p.pageBg} initialPage={startItem} scrollEnabled={!zoomed} onPageSelected={onSelected}>
        {items.map((x, i) => {
          if (x.kind === 'page') {
            const id = x.it.page.id; const [pw, ph] = PAGE_SIZE[id] || [1110, 1768];
            return (
              <View key={`p${x.it.key}`} style={{ flex: 1, paddingTop: insets.top + 74, paddingBottom: insets.bottom + 88 }}>
                {Math.abs(i - idx) <= 2 ? (
                  <ZoomPage source={PAGE_IMAGES[id]} tint={tint} aspect={pw / ph} width={width} height={areaH - 162} initialScale={zoom} veil={veilFor(x.it)}
                    onZoomChange={(z) => { if (i === idxRef.current) setZoomed(z); }} onTap={toggleChrome} label={`${x.it.page.title}، صفحة ${pn(id)}`} />
                ) : null}
              </View>
            );
          }
          if (x.kind === 'stop') {
            return (
              <View key={`stop${x.k}`} style={{ flex: 1 }}>
                {Math.abs(idx - i) <= 1 ? (() => { const d = stopInfo(x.k); return <Done title={d.title} line={d.line} primary={d.cont} onPrimary={next} secondary="يكفي الآن" onSecondary={close} />; })() : null}
              </View>
            );
          }
          return (
            <View key="fin" style={{ flex: 1 }}>
              {Math.abs(idx - i) <= 1 ? (() => { const d = finInfo(); return <Done title={d.title} line={d.line} primary="العودة" onPrimary={close} />; })() : null}
            </View>
          );
        })}
      </Pager>

      {/* top: where you are */}
      {cur.kind === 'page' && (
        <Animated.View pointerEvents={chromeOn ? 'box-none' : 'none'} style={[{ position: 'absolute', top: insets.top + 8, left: 16, right: 16 }, chromeSt]}>
          <Bar radius={22}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8 }}>
              <IconButton label="إغلاق" onPress={close}><CloseIcon size={20} color={p.ink} /></IconButton>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={1} maxFontSizeMultiplier={1.2} style={{ fontFamily: F.display, fontSize: 17, lineHeight: 24, color: p.ink, textAlign: 'right' }}>{title}</Text>
                <Text numberOfLines={1} maxFontSizeMultiplier={1.2} style={{ fontFamily: F.ui, fontSize: 12.5, lineHeight: 18, color: p.muted, textAlign: 'right' }}>{`${cur.it.page.title}، ص ${pn(cur.it.page.id)}`}</Text>
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
                    {group.map((g, j) => (
                      <Text key={g.it.key} allowFontScaling={false} style={{ fontFamily: F.serif, fontSize: j === pos ? 22 : 17, lineHeight: 24, color: j === pos ? p.turq : itemRead(read, g.it) ? p.gold : p.faint, opacity: j > pos && !itemRead(read, g.it) ? 0.6 : 1 }}>۞</Text>
                    ))}
                  </View>
                ) : null}
                <Text maxFontSizeMultiplier={1.2} style={{ fontFamily: F.ui, fontSize: 12.5, lineHeight: 18, color: p.muted, textAlign: 'right' }}>
                  {`صفحة ${ar(pos + 1)} من ${ar(group.length)}${pos + 1 >= group.length ? '، الأخيرة' : leftW > 0 ? `، بقي نحو ${MN(mins(leftW))}` : ''}`}
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
