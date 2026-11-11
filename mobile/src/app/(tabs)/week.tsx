import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Head, Heat, HeatCell, HeroCard, Meter } from '../../components/dash';
import { Panel, Txt, useTap } from '../../components/ui';
import { ChevronIcon } from '../../components/icons';
import { addDays, ar, atMidnight, cnt, dayPages, dkey, PG, sum } from '../../core/plan';
import { usePlan, useStore } from '../../core/store';
import { readFrac } from '../../core/sittings';
import { F, usePalette } from '../../theme';

const NAMES = ['الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'];
function monday(d: Date) { const x = atMidnight(d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; }

export default function Week() {
  const p = usePalette(); const P = usePlan(); const { state, setViewDay } = useStore(); const tap = useTap(); const insets = useSafeAreaInsets(); const { width } = useWindowDimensions();
  const W = Math.min(width, 520) - 48;
  const stat = (d: Date) => {
    const pages = dayPages(state.settings, d.getDay());
    const ds = state.days[dkey(d)];
    const read = ds ? pages.reduce((a, x) => a + x.w * readFrac(ds.read, x.id), 0) : 0;
    return { total: sum(pages), read, full: pages.length > 0 && read >= sum(pages) - 1e-9 };
  };
  const mon = monday(P.date);
  const days = useMemo(() => NAMES.map((n, i) => {
    const d = addDays(mon, i); const s = stat(d);
    const today = dkey(d) === P.key; const future = d > P.date;
    const st: 'done' | 'today' | 'future' | 'missed' = s.full ? 'done' : today ? 'today' : future ? 'future' : 'missed';
    return { n, d, s, st, today };
  }), [state, P.key]);
  const full = days.filter((x) => x.st === 'done').length;
  const monthDone = useMemo(() => {
    let n = 0; const d0 = new Date(P.date.getFullYear(), P.date.getMonth(), 1);
    for (let d = d0; d <= P.date; d = addDays(d, 1)) if (stat(d).full) n++;
    return n;
  }, [state, P.key]);
  const pagesRead = days.reduce((a, x) => a + x.s.read, 0); const pagesAll = days.reduce((a, x) => a + x.s.total, 0);
  // the last five weeks, Monday to Sunday, ending with this one
  const heat: HeatCell[][] = useMemo(() => [4, 3, 2, 1, 0].map((w) => [0, 1, 2, 3, 4, 5, 6].map((i) => {
    const d = addDays(mon, i - 7 * w); const s = stat(d); const future = d > P.date;
    return { key: dkey(d), num: ar(d.getDate()), today: dkey(d) === P.key, state: future ? 'future' : s.full ? 'full' : s.read > 0 ? 'some' : 'none' } as HeatCell;
  })), [state, P.key]);

  return (
    <ScrollView contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: insets.bottom + 150, paddingHorizontal: 24, alignItems: 'center' }} showsVerticalScrollIndicator={false}>
      <View style={{ width: W }}>
        <Animated.View entering={FadeInDown.duration(500)}>
          <Txt v="label">من الإثنين إلى الأحد، كما في الكتاب</Txt>
          <Txt v="display">الأسبوع</Txt>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(70).duration(600)}>
          <View accessible accessibilityLabel={`أتممت ${cnt(full, 'يومًا واحدًا', 'يومين', 'أيام')} من سبعة هذا الأسبوع`}>
            <HeroCard style={{ marginTop: 14 }} eyebrow="هذا الأسبوع" tone={full > 0 ? 'done' : 'plain'}
              title={full === 7 ? 'اكتمل الأسبوع' : full === 0 ? 'أسبوع جديد' : cnt(full, 'يوم مكتمل', 'يومان مكتملان', 'أيام مكتملة')}
              line={`قرأت ${ar(Math.round(pagesRead))} من ${ar(Math.round(pagesAll))} صفحة. ${monthDone === 0 ? 'لا أيام مكتملة هذا الشهر بعد.' : `هذا الشهر: ${cnt(monthDone, 'يوم مكتمل', 'يومان مكتملان', 'أيام مكتملة')}.`}`}
              frac={full / 7} done={full === 7} big={full ? ar(full) : '–'} small="من ٧ أيام" />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(140).duration(600)}>
          <Head title="أيام الأسبوع" />
          <Panel>
            {days.map((x, i) => {
              const label = x.st === 'done' ? 'اكتمل' : x.st === 'today' ? (Math.round(x.s.read) > 0 ? `${ar(Math.round(x.s.read))} من ${ar(Math.round(x.s.total))} صفحة` : PG(Math.round(x.s.total))) : x.st === 'missed' ? (x.s.read > 0 ? `${ar(Math.round(x.s.read))} من ${ar(Math.round(x.s.total))}` : 'فات') : PG(Math.round(x.s.total));
              const color = x.st === 'done' ? p.gold : x.st === 'today' ? p.turqHi : p.faint;
              return (
                <Pressable key={x.n} onPress={() => { tap(); setViewDay(x.today ? null : dkey(x.d)); router.navigate('/'); }} accessibilityRole="button" accessibilityLabel={`افتح ورد ${x.n}`}
                  style={({ pressed }) => ({ paddingVertical: 13, opacity: pressed ? 0.6 : 1, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: p.rule })}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Txt v="body" style={{ flex: 1, fontFamily: x.today ? F.uiBold : F.uiMed, color: x.st === 'future' ? p.muted : p.ink }}>{x.n + (x.today ? '، اليوم' : '')}</Txt>
                    <Text maxFontSizeMultiplier={1.2} style={{ fontFamily: x.today ? F.uiBold : F.ui, fontSize: 13, color }}>{label}</Text>
                    <ChevronIcon size={16} color={p.faint} />
                  </View>
                  <View style={{ marginTop: 8 }}><Meter frac={x.s.total ? x.s.read / x.s.total : 0} color={x.st === 'done' ? p.gold : p.turq} height={5} /></View>
                </Pressable>
              );
            })}
          </Panel>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(600)}>
          <Head title="آخر خمسة أسابيع" />
          <Panel padding={14}>
            <View style={{ paddingVertical: 8 }}><Heat head={['إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت', 'أحد']} weeks={heat} /></View>
          </Panel>
        </Animated.View>

        <Txt v="label" style={{ marginTop: 16, marginHorizontal: 4, lineHeight: 21 }}>لكل يوم ورده، ويبدأ بعد الفجر. اضغط أي يوم لتفتحه، وما فاتك يبقى متاحًا لتقرأه.</Txt>
      </View>
    </ScrollView>
  );
}
