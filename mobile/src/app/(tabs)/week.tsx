import React, { useMemo } from 'react';
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { BeadRing } from '../../components/BeadRing';
import { Glass, Txt } from '../../components/ui';
import { DAYS } from '../../core/data';
import { addDays, ar, atMidnight, cnt, dayPages, dkey, PG, sum } from '../../core/plan';
import { usePlan, useStore } from '../../core/store';
import { F, usePalette } from '../../theme';

const NAMES = ['الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'];
function monday(d: Date) { const x = atMidnight(d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; }

function MiniRing({ v, size, today, future }: { v: number; size: number; today?: boolean; future?: boolean }) {
  const p = usePalette(); const r = size / 2 - 3; const c = 2 * Math.PI * r;
  return (
    <Svg width={size} height={size}>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={p.dark ? 'rgba(255,255,255,0.1)' : 'rgba(30,42,35,0.1)'} strokeWidth={3} fill={v >= 100 ? p.gold : 'none'} fillOpacity={v >= 100 ? 0.95 : 0} />
      {!future && v > 0 && v < 100 ? <Circle cx={size / 2} cy={size / 2} r={r} stroke={p.gold} strokeWidth={3} fill="none" strokeDasharray={`${(c * v) / 100} ${c}`} strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`} /> : null}
      {today ? <Circle cx={size / 2} cy={size / 2} r={r + 2.5} stroke={p.emerald} strokeWidth={1.2} fill="none" /> : null}
    </Svg>
  );
}

export default function Week() {
  const p = usePalette(); const P = usePlan(); const { state } = useStore(); const insets = useSafeAreaInsets(); const { width } = useWindowDimensions();
  const W = Math.min(width, 520) - 32;
  const pct = (d: Date) => {
    const pages = dayPages(state.settings, d.getDay()); if (!pages.length) return 0;
    const ds = state.days[dkey(d)]; if (!ds) return 0;
    return Math.round((sum(pages.filter((x) => ds.read[x.id])) / sum(pages)) * 100);
  };
  const mon = monday(P.date);
  const days = useMemo(() => NAMES.map((n, i) => { const d = addDays(mon, i); return { n, d, v: pct(d), today: dkey(d) === P.key, future: d > P.date }; }), [state, P.key]);
  const full = days.filter((x) => x.v === 100).length;
  const weeks = useMemo(() => {
    const out = [];
    for (let k = 1; k <= 8; k++) {
      const m = addDays(mon, -7 * k); const vs = NAMES.map((_, i) => pct(addDays(m, i)));
      if (vs.some((v) => v > 0) || k <= 2) out.push({ m, vs });
    }
    return out;
  }, [state, P.key]);
  // month total
  const monthDone = useMemo(() => {
    let n = 0; const d0 = new Date(P.date.getFullYear(), P.date.getMonth(), 1);
    for (let d = d0; d <= P.date; d = addDays(d, 1)) if (pct(d) === 100) n++;
    return n;
  }, [state, P.key]);
  const todayPages = sum(dayPages(state.settings, P.wd));
  const ring = Math.min(W * 0.62, 220);
  const cell = (W - 34 - 6 * 6) / 7;

  return (
    <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 120, paddingHorizontal: 16, alignItems: 'center' }} showsVerticalScrollIndicator={false}>
      <View style={{ width: W }}>
        <Animated.View entering={FadeInDown.duration(500)}>
          <Txt v="label">من الإثنين إلى الأحد، كما في الكتاب</Txt>
          <Txt v="display" style={{ marginTop: -6 }}>الأسبوع</Txt>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(600)}>
          <Glass style={{ marginTop: 10 }} padding={18}>
            <View style={{ alignItems: 'center' }}>
              <BeadRing size={ring} readFrac={full / 7} nowFrac={0}>
                <Txt v="num" align="center" style={{ fontSize: 42, lineHeight: 52 }}>{ar(full)}</Txt>
                <Txt v="meta" align="center" style={{ marginTop: -4 }}>من ٧ أيام</Txt>
              </BeadRing>
              <Txt v="h2" align="center" style={{ marginTop: 4 }}>{full === 0 ? 'هذا الأسبوع' : `هذا الأسبوع: ${cnt(full, 'يوم مكتمل', 'يومان مكتملان', 'أيام مكتملة')}`}</Txt>
              <Txt v="meta" align="center">{`هذا الشهر: ${cnt(monthDone, 'يوم مكتمل', 'يومان مكتملان', 'أيام مكتملة')}`}</Txt>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 }}>
              {days.map((x) => (
                <View key={x.n} style={{ width: cell, alignItems: 'center' }} accessible accessibilityLabel={`${x.n} ${x.future ? 'لم يأت بعد' : `${x.v} بالمئة`}`}>
                  <View style={{ opacity: x.future ? 0.4 : 1 }}><MiniRing v={x.v} size={Math.min(38, cell)} today={x.today} future={x.future} /></View>
                  <Text maxFontSizeMultiplier={1.1} numberOfLines={1} adjustsFontSizeToFit style={{ fontFamily: x.today ? F.uiBold : F.uiMed, fontSize: 11, color: x.today ? p.emerald : p.muted, marginTop: 6 }}>{x.n}</Text>
                  <Text maxFontSizeMultiplier={1.1} style={{ fontFamily: F.ui, fontSize: 10.5, color: p.faint }}>{x.future ? ' ' : `${ar(x.v)}٪`}</Text>
                </View>
              ))}
            </View>
          </Glass>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(160).duration(600)}>
          <Glass style={{ marginTop: 14 }} padding={16}>
            <Txt v="h2">الأسابيع السابقة</Txt>
            {weeks.map(({ m, vs }, k) => (
              <View key={k} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
                <Text maxFontSizeMultiplier={1.1} style={{ width: 64, fontFamily: F.ui, fontSize: 12, color: p.muted, textAlign: 'right' }}>{`${ar(m.getDate())}/${ar(m.getMonth() + 1)}`}</Text>
                <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
                  {vs.map((v, i) => <MiniRing key={i} v={v} size={20} />)}
                </View>
              </View>
            ))}
          </Glass>
        </Animated.View>

        <Txt v="meta" style={{ marginTop: 14, paddingHorizontal: 6 }}>{`كل يوم له وِرده (اليوم ${DAYS[P.wd].name}، ${PG(todayPages)}). ما فات لا يُنقل إلى الغد، وكل يوم يبدأ بعد الفجر.`}</Txt>
      </View>
    </ScrollView>
  );
}
