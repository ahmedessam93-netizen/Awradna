import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronIcon } from '../../components/icons';
import { PetalState, WeekRosette } from '../../components/ornaments';
import { GlassButton, Mark, Panel, Txt, useTap } from '../../components/ui';
import { ar, cnt, DAY_NAMES, ORDINALS, PG, weekOf } from '../../core/plan';
import { usePlan, useStore } from '../../core/store';
import { F, usePalette } from '../../theme';

export default function Week() {
  const p = usePalette(); const P = usePlan(); const { state, setViewDay } = useStore(); const tap = useTap(); const insets = useSafeAreaInsets(); const { width } = useWindowDimensions();
  const W = Math.min(width, 520) - 48;
  const days = weekOf(state, P).map((x) => {
    const today = x.key === P.key; const future = x.date > P.date;
    const st: PetalState = x.full ? 'done' : today ? 'today' : future ? 'future' : 'missed';
    return { ...x, today, st, name: DAY_NAMES[x.date.getDay()] };
  });
  const full = days.filter((x) => x.st === 'done').length;
  const size = Math.min(W, 300);

  return (
    <ScrollView contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: insets.bottom + 130, paddingHorizontal: 24, alignItems: 'center' }} showsVerticalScrollIndicator={false}>
      <View style={{ width: W }}>
        <Animated.View entering={FadeInDown.duration(500)}>
          <Txt v="label">{`يبدأ التسبيع يوم ${DAY_NAMES[state.settings.startDay]}`}</Txt>
          <Txt v="display">ختمة الأسبوع</Txt>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(600)} style={{ alignItems: 'center', marginTop: 18 }}>
          <View accessible accessibilityLabel={`أتممت ${cnt(full, 'جزءًا واحدًا', 'جزأين', 'أجزاء')} من سبعة هذا الأسبوع`}>
            <WeekRosette size={size} names={days.map((x) => x.name)} states={days.map((x) => x.st)}>
              <Text allowFontScaling={false} style={{ fontFamily: F.title, fontSize: 40 * (size / 300), lineHeight: 46 * (size / 300), color: '#F3EAD7', textAlign: 'center' }}>{ar(full)}</Text>
              <Text allowFontScaling={false} style={{ fontFamily: F.ui, fontSize: 12, lineHeight: 16, color: 'rgba(243,234,215,0.7)', textAlign: 'center' }}>من ٧ أجزاء</Text>
            </WeekRosette>
          </View>
          <Txt v="meta" align="center" style={{ marginTop: 14, fontSize: 15 }}>{state.khatma.count ? `ختمات مكتملة: ${ar(state.khatma.count)}` : 'لم تكتمل ختمة بعد'}</Txt>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(160).duration(600)}>
          <Panel style={{ marginTop: 22 }}>
            {days.map((x, i) => {
              const label = x.st === 'done' ? 'اكتمل' : x.st === 'today' ? `${ar(x.n)} من ٥ جلسات` : x.st === 'missed' ? (x.n ? `${ar(x.n)} من ٥` : 'فات') : PG(Math.round(x.part.w / 15));
              const color = x.st === 'done' ? p.gold : x.st === 'today' ? p.turqHi : p.faint;
              return (
                <Pressable key={x.key} onPress={() => { tap(); setViewDay(x.today ? null : x.key); router.navigate('/'); }} accessibilityRole="button" accessibilityLabel={`افتح الجزء ${ORDINALS[x.d]}، ${x.name}`}
                  style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, opacity: pressed ? 0.6 : 1, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: p.rule })}>
                  <Mark size={24} color={x.st === 'done' ? p.gold : x.st === 'today' ? p.turq : p.goldFaint} />
                  <View style={{ flex: 1 }}>
                    <Txt v="body" style={{ fontFamily: x.today ? F.uiBold : F.uiMed, color: x.st === 'future' ? p.muted : p.ink }}>{`${x.name}${x.today ? '، اليوم' : ''}`}</Txt>
                    <Txt v="label" style={{ lineHeight: 19 }}>{`الجزء ${ORDINALS[x.d]}: ${x.part.name}`}</Txt>
                  </View>
                  <Text maxFontSizeMultiplier={1.2} style={{ fontFamily: F.ui, fontSize: 13, color }}>{label}</Text>
                  <ChevronIcon size={16} color={p.faint} />
                </Pressable>
              );
            })}
          </Panel>
        </Animated.View>

        <GlassButton style={{ marginTop: 16 }} label="دعاء ختم القرآن" tone="gold" onPress={() => { tap(); router.push('/khatma'); }} />
        <Txt v="label" style={{ marginTop: 16, marginHorizontal: 4, lineHeight: 21 }}>لكل يوم جزؤه، ويبدأ بعد الفجر. اضغط أي يوم لتفتحه؛ ما فاتك يبقى متاحًا، وتكتمل الختمة حين تكتمل الأجزاء السبعة.</Txt>
      </View>
    </ScrollView>
  );
}
