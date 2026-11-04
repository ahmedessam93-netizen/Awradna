// The tasbih: tap the misbaha (or anywhere around it) once per dhikr. A light tick each bead,
// a firmer one at each round of 33, and a gentle success when a dhikr is complete.
import { leave } from '../core/nav';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useRef } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Misbaha } from '../components/BeadRing';
import { CloseIcon, UndoIcon } from '../components/icons';
import { Shamsa } from '../components/ornaments';
import { GlassButton, GoldButton, IconButton, Sky, Txt, useTap } from '../components/ui';
import { BeadState, BEAD_COUNT } from '../core/beads';
import { DAILY, Session } from '../core/daily';
import { ar } from '../core/plan';
import { usePlan, useStore } from '../core/store';
import { F, usePalette } from '../theme';

const ROUND = ['الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة'];
const TIMES = (n: number) => (n === 100 ? 'مئة مرة' : n === 7 ? 'سبع مرات' : `${ar(n)} مرة`);

export default function Counter() {
  const p = usePalette(); const tap = useTap(); const insets = useSafeAreaInsets(); const { width, height } = useWindowDimensions();
  const params = useLocalSearchParams<{ section?: string; session?: string }>();
  const session = (params.session === 'pm' ? 'pm' : 'am') as Session;
  const section = DAILY.find((s) => s.id === params.section && s.kind === 'count');
  const { state, updateDaily } = useStore(); const P = usePlan();
  const prog = (state.daily[P.key] || {})[session] || {};
  const items = section && section.kind === 'count' ? section.items : [];
  const i = Math.min(prog[section?.id || ''] || 0, items.length);
  const n = prog[`${section?.id}.n`] || 0;
  const item = items[i];
  const done = !item;
  const busy = useRef(false);

  const pulse = useSharedValue(1);
  const pulseSt = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  const save = (ni: number, nn: number) => {
    if (!section) return;
    updateDaily(P.key, (d) => ({ ...d, [session]: { ...(d[session] || {}), [section.id]: ni, [`${section.id}.n`]: nn } }));
  };
  const count = () => {
    if (!item || busy.current) return;
    const c = n + 1;
    pulse.value = withSequence(withTiming(1.08, { duration: 70 }), withTiming(1, { duration: 160 }));
    if (c >= item.count) {
      tap('success'); busy.current = true;
      save(i, c);
      setTimeout(() => { save(i + 1, 0); busy.current = false; }, 650);
    } else {
      tap(c % 33 === 0 ? 'rigid' : 'light');
      save(i, c);
    }
  };
  const undo = () => {
    if (n > 0) save(i, n - 1);
    else if (i > 0) save(i - 1, Math.max(0, items[i - 1].count - 1));
    tap();
  };
  const skip = () => { if (item) { tap('medium'); save(i + 1, 0); } };

  const states: BeadState[] = useMemo(() => {
    if (!item) return Array(BEAD_COUNT).fill('read');
    const span = Math.min(item.count, BEAD_COUNT);
    const inRound = n >= item.count ? span : n % BEAD_COUNT;
    return Array.from({ length: BEAD_COUNT }, (_, k) => (k >= span ? 'rest' : k < inRound ? 'read' : k === inRound ? 'now' : 'rest')) as BeadState[];
  }, [item, n]);

  const size = Math.min(width - 48, 342, height * 0.42);
  const showLast = item && item.last && n === item.count - 1;
  const round = item && item.count > BEAD_COUNT ? Math.floor(Math.min(n, item.count - 1) / BEAD_COUNT) : -1;

  if (!section) return null;
  return (
    <View style={{ flex: 1 }}>
      <Sky glowAt={height * 0.55} />
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <IconButton label="إغلاق" onPress={() => leave('/daily')}><CloseIcon size={20} color={p.ink} /></IconButton>
        <View style={{ flex: 1 }}>
          <Text maxFontSizeMultiplier={1.2} style={{ fontFamily: F.display, fontSize: 17, lineHeight: 24, color: p.ink, textAlign: 'right' }}>{`${section.title}، ${session === 'am' ? 'الصباح' : 'المساء'}`}</Text>
          <Text maxFontSizeMultiplier={1.2} style={{ fontFamily: F.ui, fontSize: 12.5, lineHeight: 18, color: p.muted, textAlign: 'right' }}>{done ? 'تمّ' : `الذكر ${ar(i + 1)} من ${ar(items.length)}`}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 5 }} accessible={false}>
          {items.length <= 12 && items.map((_, k) => <View key={k} style={{ width: items.length > 5 ? 10 : 22, height: 6, borderRadius: 3, backgroundColor: k < i ? p.gold : k === i ? p.turq : p.faint, opacity: k > i ? 0.45 : 1 }} />)}
        </View>
      </View>

      {done ? (
        <Animated.View entering={FadeIn.duration(600)} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingBottom: insets.bottom + 24 }}>
          <Shamsa size={Math.min(width - 120, 240)} />
          <Txt v="display" align="center" style={{ marginTop: 18, fontSize: 30, lineHeight: 44 }}>{`تمّ ${section.title}`}</Txt>
          <Text style={{ fontFamily: F.serif, fontSize: 21, lineHeight: 34, color: p.ink, textAlign: 'center' }}>تقبّل الله منك</Text>
          <View style={{ alignSelf: 'stretch', gap: 12, marginTop: 28 }}>
            <GoldButton label="العودة إلى الورد اليومي" onPress={() => leave('/daily')} />
            <GlassButton label="تراجع" icon={<UndoIcon size={18} color={p.ink} />} onPress={undo} />
          </View>
        </Animated.View>
      ) : (
        <>
          <Pressable onPress={count} accessibilityRole="button" accessibilityLabel={`تسبيحة واحدة. العدد ${ar(n)} من ${ar(item.count)}`} style={{ flex: 1 }}>
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'space-evenly', paddingHorizontal: 24 }}>
              <View style={{ minHeight: 120, justifyContent: 'center' }}>
                {item.surah ? (
                  <>
                    <Txt v="display" align="center" style={{ fontSize: 34, lineHeight: 52 }}>{item.text}</Txt>
                    <Txt v="meta" align="center">{`${TIMES(item.count)}، من حفظك أو من المصحف`}</Txt>
                  </>
                ) : (
                  <>
                    <Txt v="sacred" align="center" numberOfLines={7} adjustsFontSizeToFit style={{ fontSize: item.text.length > 160 ? 19 : 23, lineHeight: item.text.length > 160 ? 36 : 44 }}>{showLast ? item.last : item.text}</Txt>
                    {showLast ? <Txt v="label" align="center" color={p.turqHi}>وفي آخر مرة</Txt> : null}
                  </>
                )}
              </View>
              <Animated.View style={pulseSt}>
                <Misbaha size={size} states={states}>
                  <Text allowFontScaling={false} style={{ fontFamily: F.title, fontSize: size * 0.24, lineHeight: size * 0.27, color: p.ink, textAlign: 'center' }}>{ar(n)}</Text>
                  <Text allowFontScaling={false} style={{ fontFamily: F.ui, fontSize: 15, lineHeight: 22, color: p.muted, textAlign: 'center' }}>{`من ${ar(item.count)}`}</Text>
                  {round >= 0 ? <Text allowFontScaling={false} style={{ marginTop: 4, fontFamily: F.ui, fontSize: 12.5, lineHeight: 18, color: p.gold, textAlign: 'center' }}>{`الدورة ${ROUND[round]}`}</Text> : null}
                </Misbaha>
              </Animated.View>
              <Txt v="label" align="center">المس المسبحة أو أي مكان حولها. اهتزازة خفيفة مع كل حبة.</Txt>
            </View>
          </Pressable>
          <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 24, paddingBottom: insets.bottom + 18, paddingTop: 8 }}>
            <GlassButton style={{ flex: 1 }} label="تراجع حبة" icon={<UndoIcon size={18} color={p.ink} />} onPress={undo} />
            <GlassButton style={{ flex: 1 }} label={i === items.length - 1 ? 'إتمام' : 'الذكر التالي'} onPress={skip} />
          </View>
        </>
      )}
    </View>
  );
}
