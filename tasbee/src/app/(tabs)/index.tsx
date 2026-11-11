import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { Linking, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookIcon, ChevronIcon, PinIcon } from '../../components/icons';
import { Orb, PrayerPath } from '../../components/PrayerPath';
import { Ring } from '../../components/Ring';
import { GlassButton, GoldButton, Mark, Panel, Txt, useTap } from '../../components/ui';
import { addDays, ar, dkey, fmtTime, MN, ORDINALS, PG, plan, sitLabel, sitPages, weekOf } from '../../core/plan';
import { useStore, useViewPlan } from '../../core/store';
import { useUpdate } from '../../core/update';
import { minutesFor } from '../../quran';
import { F, usePalette } from '../../theme';

const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
function hijri(d: Date) {
  try { return new Intl.DateTimeFormat('ar-EG-u-ca-islamic-umalqura-nu-arab', { day: 'numeric', month: 'long', year: 'numeric' }).format(d).replace(/\s?هـ$/, ''); } catch { return ''; }
}
const pages = (lines: number) => Math.round(lines / 15);

export default function Today() {
  const p = usePalette(); const P = useViewPlan(); const { state, now, setViewDay } = useStore(); const tap = useTap();
  const todayKey = useMemo(() => plan(state, now).key, [state, now]);
  const isToday = P.key === todayKey;
  const isPast = !isToday && P.key < todayKey;
  const insets = useSafeAreaInsets(); const { width } = useWindowDimensions();
  const update = useUpdate();
  const W = Math.min(width, 520) - 48;
  const ring = Math.min(W, 320);

  const read = (params: Record<string, string>) => { tap('medium'); router.push({ pathname: '/reader', params: { day: P.key, ...params } }); };
  const cont = () => read({});
  const openSitting = (k: number) => read({ seg: String(k) });
  const shiftDay = (n: number) => {
    const [y, m, d] = P.key.split('-').map(Number);
    const k = dkey(addDays(new Date(y, m - 1, d), n));
    tap(); setViewDay(k === todayKey ? null : k);
  };
  const [ty, tm, td] = todayKey.split('-').map(Number);
  const offset = Math.round((+new Date(P.date) - +new Date(ty, tm - 1, td)) / 864e5);

  const w = P.wins[P.nextIdx];
  const isLast = P.nextIdx === 4;
  const placePage = P.at ? Number(P.at.split(':')[1]) : null;
  const contLabel = placePage ? `تابع من ص ${ar(placePage)}` : `ابدأ الحزب ${ORDINALS[P.d]}`;
  const portion = P.part.sittings[P.nextIdx];
  let eyebrow = '', title = '', line = '', cta = '', secondary = false, eyeTone: 'now' | 'done' | 'plain' = 'now';
  if (!isToday && !P.complete) {
    eyebrow = isPast ? (P.readW > 0 ? 'يوم سابق لم يكتمل' : 'يوم سابق') : 'يوم قادم';
    title = `الحزب ${ORDINALS[P.d]}`;
    line = isPast ? `بقي ${PG(Math.max(1, pages(P.left)))}، اقرأها متى شئت.` : `${PG(pages(P.total))}، يبدأ بعد فجر ذلك اليوم. يمكنك قراءته الآن إن شئت.`;
    cta = contLabel; eyeTone = 'plain';
  } else if (P.complete) { eyebrow = 'اكتمل حزب اليوم'; title = `تمّ الحزب ${ORDINALS[P.d]}`; line = isToday ? 'تقبّل الله. حزب الغد يبدأ بعد الفجر.' : 'تقبّل الله.'; eyeTone = 'done'; }
  else if (P.curDone && P.nextIdx > P.cur) { eyebrow = `أتممت جلسة ${P.wins[P.cur].name}`; title = `القادمة: جلسة ${w.name}`; line = `بعد صلاة ${w.name}، ${fmtTime(w.time)}`; cta = contLabel; secondary = true; eyeTone = 'done'; }
  else {
    eyebrow = `الآن، بعد صلاة ${w.name}`;
    title = isLast ? `جلسة ${w.name}، الأخيرة` : `جلسة ${w.name}`;
    line = `${sitLabel(P.part, P.nextIdx)}\n${PG(sitPages(P.part, P.nextIdx))}، نحو ${MN(minutesFor(portion.w))}`;
    cta = contLabel;
  }

  const orbs: Orb[] = P.wins.map((x, k) => {
    const done = P.complete || !!P.done[k];
    const passed = isPast || (isToday && !!x.time && x.time <= now);
    if (!isToday) return { i: x.i, name: x.name, time: x.time, state: done ? 'done' : isPast ? 'missed' : 'upcoming' };
    return { i: x.i, name: x.name, time: x.time, state: done ? 'done' : k === P.nextIdx && !P.complete ? 'current' : passed && k < P.cur ? 'missed' : 'upcoming' };
  });

  const week = weekOf(state, P);
  const weekDone = week.filter((x) => x.full).length;
  const partial = (() => {
    if (!P.at) return 0;
    const [ak, ap] = P.at.split(':').map(Number);
    if (ak !== P.nextIdx) return 0;
    const st = P.part.sittings[ak];
    return (ap - st.from[0]) / (st.to[0] - st.from[0] + 1);
  })();

  const city = state.settings.cityName || '';
  const g = P.date;
  const dateLine = [hijri(g), `${ar(g.getDate())} ${MONTHS[g.getMonth()]}`].filter(Boolean).join('، ');

  return (
    <ScrollView contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: insets.bottom + 130, paddingHorizontal: 24, alignItems: 'center' }} showsVerticalScrollIndicator={false}>
      <View style={{ width: W }}>
        <Animated.View entering={FadeInDown.duration(500)} style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Txt v="label">{offset === 0 ? dateLine : `${offset === -1 ? 'أمس' : offset === 1 ? 'غدًا' : offset < 0 ? 'يوم سابق' : 'يوم قادم'}، ${dateLine}`}</Txt>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Pressable onPress={() => shiftDay(-1)} disabled={offset <= -6} hitSlop={10} accessibilityRole="button" accessibilityLabel="اليوم السابق" style={{ opacity: offset <= -6 ? 0.3 : 1 }}>
                <ChevronIcon dir="right" size={22} color={p.gold} />
              </Pressable>
              <Txt v="display" style={{ flexShrink: 1 }} numberOfLines={1} adjustsFontSizeToFit>{`${P.dayName}`}</Txt>
              <Pressable onPress={() => shiftDay(1)} disabled={offset >= 6} hitSlop={10} accessibilityRole="button" accessibilityLabel="اليوم التالي" style={{ opacity: offset >= 6 ? 0.3 : 1 }}>
                <ChevronIcon size={22} color={p.gold} />
              </Pressable>
            </View>
          </View>
          {city ? (
            <Pressable onPress={() => { tap(); router.push('/city'); }} accessibilityRole="button" accessibilityLabel={`المدينة: ${city}`}
              style={{ marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 6, height: 34, paddingHorizontal: 12, borderRadius: 17, borderWidth: 1, borderColor: p.chipBorder, backgroundColor: p.chip }}>
              <PinIcon size={14} color={p.gold} />
              <Text maxFontSizeMultiplier={1.15} numberOfLines={1} style={{ fontFamily: F.ui, fontSize: 13, color: p.muted, maxWidth: 120 }}>{city}</Text>
            </Pressable>
          ) : null}
        </Animated.View>

        {!isToday ? (
          <Pressable onPress={() => { tap(); setViewDay(null); }} accessibilityRole="button"
            style={{ marginTop: 10, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, height: 36, borderRadius: 18, backgroundColor: p.turqSoft, borderWidth: 1, borderColor: p.turq }}>
            <Text style={{ fontFamily: F.uiBold, fontSize: 13.5, color: p.turqHi }}>العودة إلى اليوم</Text>
          </Pressable>
        ) : null}
        {update ? (
          <Pressable onPress={() => { tap(); Linking.openURL(update.url); }} accessibilityRole="button" accessibilityLabel="تحديث التطبيق"
            style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, backgroundColor: p.turqSoft, borderWidth: 1, borderColor: p.turq }}>
            <View style={{ flex: 1 }}>
              <Txt v="h3" style={{ fontSize: 15 }}>{`إصدار جديد (${update.version})`}</Txt>
              <Txt v="label">{update.notes || 'اضغط للتحميل، وسيبقى تقدّمك كما هو.'}</Txt>
            </View>
            <Text style={{ fontFamily: F.uiBold, fontSize: 14, color: p.turqHi }}>تحديث</Text>
          </Pressable>
        ) : null}

        <Animated.View entering={FadeInDown.delay(60).duration(600)} style={{ alignItems: 'center', marginTop: 16 }}>
          <Ring size={ring} shares={P.part.sittings.map((s) => s.w)} done={[0, 1, 2, 3, 4].map((k) => P.complete || !!P.done[k])} partial={partial} current={P.complete ? -1 : P.nextIdx}
            label={`الحزب ${ORDINALS[P.d]}: قُرئ ${ar(pages(P.readW))} من ${ar(pages(P.total))} صفحة`}>
            <Txt v="label" align="center" color={p.gold}>{`الحزب ${ORDINALS[P.d]} من سبعة`}</Txt>
            <Text maxFontSizeMultiplier={1.2} style={{ fontFamily: F.title, fontSize: ring * 0.085, lineHeight: ring * 0.13, color: p.ink, textAlign: 'center', marginHorizontal: ring * 0.16 }}>{P.part.name}</Text>
            {P.complete ? (
              <Txt v="meta" align="center" color={p.gold}>تمّ، تقبّل الله</Txt>
            ) : (
              <Txt v="meta" align="center">{`${ar(pages(P.readW))} من ${ar(pages(P.total))} صفحة`}</Txt>
            )}
          </Ring>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(600)} style={{ alignItems: 'center', marginTop: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: eyeTone === 'now' ? p.turq : eyeTone === 'done' ? p.gold : p.faint }} />
            <Text maxFontSizeMultiplier={1.25} style={{ fontFamily: F.ui, fontSize: 14, lineHeight: 20, color: eyeTone === 'now' ? p.turqHi : eyeTone === 'done' ? p.gold : p.muted }}>{eyebrow}</Text>
          </View>
          <Txt v="h1" align="center" style={{ marginTop: 4 }}>{title}</Txt>
          {line ? <Txt v="meta" align="center" style={{ fontSize: 15, lineHeight: 24 }}>{line}</Txt> : null}
          <View style={{ alignSelf: 'stretch', marginTop: 16, gap: 10 }}>
            {cta && !secondary ? <GoldButton label={cta} icon={<BookIcon size={22} color={p.onPrimary} />} onPress={cont} /> : null}
            {cta && secondary ? <GlassButton label={cta} tone="gold" onPress={cont} /> : null}
            {P.complete ? <GlassButton label="مراجعة الحزب" tone="gold" onPress={() => read({ seg: '0' })} /> : null}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(180).duration(600)} style={{ marginTop: 30 }}>
          <PrayerPath orbs={orbs} width={W} onPress={openSitting} />
          <Txt v="label" align="center" style={{ marginTop: 2 }}>اضغط أي صلاة لقراءة جلستها، ولو فاتت.</Txt>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(240).duration(600)}>
          <Panel style={{ marginTop: 20 }}>
            <Txt v="h2" style={{ marginTop: 10, marginBottom: 2 }}>جلسات اليوم</Txt>
            {P.part.sittings.map((st, k) => {
              const done = P.complete || !!P.done[k];
              const now_ = isToday && !P.complete && k === P.nextIdx;
              return (
                <Pressable key={k} accessibilityRole="button" accessibilityLabel={`جلسة ${P.wins[k].name}: ${sitLabel(P.part, k)}`} onPress={() => openSitting(k)}
                  style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 13, opacity: pressed ? 0.7 : 1, borderTopWidth: k === 0 ? 0 : 1, borderTopColor: p.rule })}>
                  <Mark color={done ? p.gold : now_ ? p.turq : p.goldFaint} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Txt v="body" style={{ fontFamily: F.uiMed, lineHeight: 24 }}>{`بعد ${P.wins[k].name}`}</Txt>
                    <Txt v="label" style={{ lineHeight: 19 }} numberOfLines={2}>{`${sitLabel(P.part, k)}، ${PG(sitPages(P.part, k))}`}</Txt>
                  </View>
                  <Text maxFontSizeMultiplier={1.2} style={{ fontFamily: F.ui, fontSize: 13, color: done ? p.gold : now_ ? p.turqHi : p.faint }}>{done ? 'تمّ' : now_ ? 'الآن' : `ص ${ar(st.from[0])}`}</Text>
                </Pressable>
              );
            })}
          </Panel>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(600)}>
          <Pressable onPress={() => { tap(); router.navigate('/week'); }} accessibilityRole="button"
            style={({ pressed }) => ({ marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 18, borderRadius: 20, borderWidth: 1, borderStyle: 'dashed', borderColor: p.goldFaint, backgroundColor: pressed ? p.chip : 'transparent' })}>
            <Text allowFontScaling={false} style={{ fontFamily: F.title, fontSize: 26, color: p.gold }}>{ar(state.khatma.count + 1)}</Text>
            <View style={{ flex: 1 }}>
              <Txt v="body" style={{ fontFamily: F.uiMed, fontSize: 15.5, lineHeight: 23 }}>{state.khatma.count ? `الختمة رقم ${ar(state.khatma.count + 1)}` : 'ختمتك الأولى'}</Txt>
              <Txt v="label" style={{ fontSize: 12.5, lineHeight: 18 }}>{`هذا الأسبوع: ${weekDone === 0 ? 'لم يكتمل حزب بعد' : `${ar(weekDone)} من ٧ أحزاب`}`}</Txt>
            </View>
            <ChevronIcon size={18} color={p.faint} />
          </Pressable>
        </Animated.View>
        <Pressable onPress={() => { tap(); router.push('/idea'); }} accessibilityRole="button" hitSlop={8} style={{ marginTop: 18, alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 14 }}>
          <Txt v="label" align="center" color={p.gold} style={{ fontSize: 13.5 }}>على منهاج الصحابة: لماذا سبعة أيام؟</Txt>
        </Pressable>
      </View>
    </ScrollView>
  );
}
