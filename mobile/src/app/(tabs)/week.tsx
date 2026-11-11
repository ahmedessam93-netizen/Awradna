import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PetalState, WeekRosette } from '../../components/ornaments';
import { Mark, Panel, Txt, useTap } from '../../components/ui';
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
    const st: PetalState = s.full ? 'done' : today ? 'today' : future ? 'future' : 'missed';
    return { n, d, s, st, today };
  }), [state, P.key]);
  const full = days.filter((x) => x.st === 'done').length;
  const monthDone = useMemo(() => {
    let n = 0; const d0 = new Date(P.date.getFullYear(), P.date.getMonth(), 1);
    for (let d = d0; d <= P.date; d = addDays(d, 1)) if (stat(d).full) n++;
    return n;
  }, [state, P.key]);
  const size = Math.min(W, 300);

  return (
    <ScrollView contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: insets.bottom + 130, paddingHorizontal: 24, alignItems: 'center' }} showsVerticalScrollIndicator={false}>
      <View style={{ width: W }}>
        <Animated.View entering={FadeInDown.duration(500)}>
          <Txt v="label">من الإثنين إلى الأحد، كما في الكتاب</Txt>
          <Txt v="display">الأسبوع</Txt>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(600)} style={{ alignItems: 'center', marginTop: 18 }}>
          <View accessible accessibilityLabel={`أتممت ${cnt(full, 'يومًا واحدًا', 'يومين', 'أيام')} من سبعة هذا الأسبوع`}>
            <WeekRosette size={size} names={NAMES} states={days.map((x) => x.st)}>
              <Text allowFontScaling={false} style={{ fontFamily: F.title, fontSize: 40 * (size / 300), lineHeight: 46 * (size / 300), color: '#F3EAD7', textAlign: 'center' }}>{full ? ar(full) : '–'}</Text>
              <Text allowFontScaling={false} style={{ fontFamily: F.ui, fontSize: 12, lineHeight: 16, color: 'rgba(243,234,215,0.7)', textAlign: 'center' }}>من ٧ أيام</Text>
            </WeekRosette>
          </View>
          <Txt v="meta" align="center" style={{ marginTop: 14, fontSize: 15 }}>{`هذا الشهر: ${monthDone === 0 ? 'لا أيام مكتملة بعد' : cnt(monthDone, 'يوم مكتمل', 'يومان مكتملان', 'أيام مكتملة')}`}</Txt>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(160).duration(600)}>
          <Panel style={{ marginTop: 22 }}>
            {days.map((x, i) => {
              const label = x.st === 'done' ? 'اكتمل' : x.st === 'today' ? (Math.round(x.s.read) > 0 ? `${ar(Math.round(x.s.read))} من ${ar(Math.round(x.s.total))} صفحة` : PG(Math.round(x.s.total))) : x.st === 'missed' ? (x.s.read > 0 ? `${ar(Math.round(x.s.read))} من ${ar(Math.round(x.s.total))}` : 'فات') : PG(Math.round(x.s.total));
              const color = x.st === 'done' ? p.gold : x.st === 'today' ? p.turqHi : p.faint;
              return (
                <Pressable key={x.n} onPress={() => { tap(); setViewDay(x.today ? null : dkey(x.d)); router.navigate('/'); }} accessibilityRole="button" accessibilityLabel={`افتح ورد ${x.n}`}
                  style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, opacity: pressed ? 0.6 : 1, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: p.rule })}>
                  <Mark size={24} color={x.st === 'done' ? p.gold : x.st === 'today' ? p.turq : p.goldFaint} />
                  <Txt v="body" style={{ flex: 1, fontFamily: x.today ? F.uiBold : F.uiMed, color: x.st === 'future' ? p.muted : p.ink }}>{x.n + (x.today ? '، اليوم' : '')}</Txt>
                  <Text maxFontSizeMultiplier={1.2} style={{ fontFamily: F.ui, fontSize: 13, color }}>{label}</Text>
                  <ChevronIcon size={16} color={p.faint} />
                </Pressable>
              );
            })}
          </Panel>
        </Animated.View>

        <Txt v="label" style={{ marginTop: 16, marginHorizontal: 4, lineHeight: 21 }}>لكل يوم ورده، ويبدأ بعد الفجر. اضغط أي يوم لتفتحه، وما فاتك يبقى متاحًا لتقرأه.</Txt>
      </View>
    </ScrollView>
  );
}
