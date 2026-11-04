// الورد اليومي: opened only by those who want it, apart from the weekly wird.
import { leave } from '../core/nav';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckIcon, ChevronIcon, MaghribIcon, FajrIcon } from '../components/icons';
import { GoldButton, IconButton, Mark, Panel, Txt, useTap } from '../components/ui';
import { DAILY, DailySection, FAWATIH, sectionDone, sectionSize, Session } from '../core/daily';
import { ar, dailySession, fmtTime, times } from '../core/plan';
import { usePlan, useStore } from '../core/store';
import { F, usePalette } from '../theme';

export default function Daily() {
  const p = usePalette(); const tap = useTap(); const insets = useSafeAreaInsets(); const { width } = useWindowDimensions();
  const { state, now, updateDaily } = useStore(); const P = usePlan();
  const [session, setSession] = useState<Session>(dailySession(state.settings, now));
  const W = Math.min(width, 520) - 48;
  const day = state.daily[P.key] || {};
  const prog = day[session] || {};
  const fawatih = !!prog.fawatih;

  const rows = DAILY.map((s) => {
    const n = sectionSize(s); const done = sectionDone(prog, day.bahr, s);
    return { s, n, done, st: done >= n ? 'done' : done > 0 || (prog[`${s.id}.n`] || 0) > 0 ? 'some' : 'none' };
  });
  const nextRow = rows.find((r) => r.st !== 'done');
  const allDone = !nextRow && fawatih;

  const open = (s: DailySection) => {
    tap('medium');
    if (s.kind === 'count') router.push({ pathname: '/counter', params: { section: s.id, session } });
    else router.push({ pathname: '/book', params: { from: String(s.from), to: String(s.to), title: s.title, section: s.id, session } });
  };
  const t = times(state.settings, P.date) as any;
  const edge: Date | null = session === 'am' ? t.sunrise || null : t.maghrib || null;
  const note = edge ? `المسبّعات ${session === 'am' ? 'قبل الشروق، والشروق اليوم' : 'قبل الغروب، والمغرب اليوم'} ${fmtTime(edge)}` : 'المسبّعات قبل الشروق وقبل الغروب';

  return (
    <ScrollView contentContainerStyle={{ paddingTop: insets.top + 10, paddingBottom: insets.bottom + 40, paddingHorizontal: 24, alignItems: 'center' }} showsVerticalScrollIndicator={false}>
      <View style={{ width: W }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <IconButton label="رجوع" onPress={() => leave('/')}><ChevronIcon dir="right" size={20} color={p.ink} /></IconButton>
          <Txt v="label">يُقرأ صباحًا ومساءً، لمن أراده</Txt>
        </View>
        <Txt v="display" style={{ marginTop: 10 }}>الورد اليومي</Txt>

        {/* morning / evening */}
        <View accessibilityRole="tablist" style={{ marginTop: 14, flexDirection: 'row', gap: 4, padding: 4, borderRadius: 18, backgroundColor: p.chip, borderWidth: 1, borderColor: p.panelBorder }}>
          {(['am', 'pm'] as Session[]).map((k) => {
            const on = k === session; const Icon = k === 'am' ? FajrIcon : MaghribIcon;
            return (
              <Pressable key={k} accessibilityRole="tab" accessibilityState={{ selected: on }} onPress={() => { tap(); setSession(k); }}
                style={{ flex: 1, height: 48, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: on ? (p.dark ? 'rgba(226,188,106,0.16)' : '#FFFFFF') : 'transparent', borderWidth: 1, borderColor: on ? (p.dark ? 'rgba(226,188,106,0.4)' : 'rgba(138,100,32,0.3)') : 'transparent' }}>
                <Icon size={20} color={on ? p.goldLight : p.muted} strokeWidth={1.7} />
                <Text maxFontSizeMultiplier={1.2} style={{ fontFamily: on ? F.uiBold : F.ui, fontSize: 16, color: on ? p.goldLight : p.muted }}>{k === 'am' ? 'الصباح' : 'المساء'}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* the opening: three Fatihas */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <Pressable onPress={() => { tap(fawatih ? 'light' : 'success'); updateDaily(P.key, (d) => ({ ...d, [session]: { ...(d[session] || {}), fawatih: fawatih ? 0 : 1 } })); }}
            accessibilityRole="checkbox" accessibilityState={{ checked: fawatih }} accessibilityLabel="الفواتح، ثلاث مرات"
            style={{ marginTop: 18, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 20, backgroundColor: fawatih ? (p.dark ? 'rgba(226,188,106,0.1)' : 'rgba(138,100,32,0.08)') : p.turqSoft, borderWidth: 1, borderColor: fawatih ? p.panelBorder : (p.dark ? 'rgba(83,205,191,0.35)' : 'rgba(15,122,112,0.3)') }}>
            <Mark size={24} color={fawatih ? p.gold : p.turq} />
            <View style={{ flex: 1 }}>
              <Txt v="h3" style={{ fontSize: 15.5, lineHeight: 24 }}>الفواتح</Txt>
              {FAWATIH.map((f, i) => <Txt key={i} v="label" style={{ lineHeight: 20 }}>{`${['أولًا', 'ثانيًا', 'ثالثًا'][i]}: ${f}`}</Txt>)}
            </View>
            {fawatih ? <CheckIcon size={20} color={p.gold} strokeWidth={2.2} /> : <Text style={{ fontFamily: F.ui, fontSize: 13, color: p.turqHi }}>٣ مرات</Text>}
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(400)}>
          <Panel style={{ marginTop: 14 }}>
            {rows.map(({ s, n, done, st }, k) => (
              <Pressable key={s.id} onPress={() => open(s)} accessibilityRole="button" accessibilityLabel={s.title}
                style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16, opacity: pressed ? 0.7 : 1, borderTopWidth: k === 0 ? 0 : 1, borderTopColor: p.rule })}>
                <Mark color={st === 'done' ? p.gold : st === 'some' ? p.turq : p.goldFaint} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Txt v="h3">{s.title}</Txt>
                  <Txt v="label">{s.sub}</Txt>
                </View>
                <Text maxFontSizeMultiplier={1.2} style={{ fontFamily: F.ui, fontSize: 13, color: st === 'done' ? p.gold : st === 'some' ? p.turqHi : p.faint }}>
                  {st === 'done' ? 'تمّ' : st === 'some' && s.kind === 'count' ? `${ar(done)} من ${ar(n)}` : st === 'some' ? 'بدأت' : 'لم يبدأ'}
                </Text>
              </Pressable>
            ))}
          </Panel>
        </Animated.View>

        <View style={{ marginTop: 18 }}>
          {!allDone ? (
            <GoldButton label={!fawatih && rows.every((r) => r.st === 'none') ? `ابدأ: ${nextRow ? nextRow.s.title : ''}` : nextRow ? `تابع: ${nextRow.s.title}` : 'اقرأ الفواتح'}
              onPress={() => { if (nextRow) open(nextRow.s); else updateDaily(P.key, (d) => ({ ...d, [session]: { ...(d[session] || {}), fawatih: 1 } })); }} />
          ) : (
            <Txt v="h1" align="center" color={p.goldLight}>{session === 'am' ? 'تمّ ورد الصباح' : 'تمّ ورد المساء'}</Txt>
          )}
          <Txt v="label" align="center" style={{ marginTop: 12 }}>{note}</Txt>
        </View>
      </View>
    </ScrollView>
  );
}
