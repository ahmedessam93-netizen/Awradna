import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Misbaha } from '../../components/BeadRing';
import { BookIcon, ChevronIcon, MisbahaIcon, PinIcon } from '../../components/icons';
import { Orb, PrayerPath } from '../../components/PrayerPath';
import { GlassButton, GoldButton, Mark, Panel, Txt, useTap } from '../../components/ui';
import { DAYS } from '../../core/data';
import { ar, fmtTime, mins, MN, PG, sum } from '../../core/plan';
import { usePlan, useStore } from '../../core/store';
import { F, usePalette } from '../../theme';

const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
function hijri(d: Date) {
  try { return new Intl.DateTimeFormat('ar-EG-u-ca-islamic-umalqura-nu-arab', { day: 'numeric', month: 'long', year: 'numeric' }).format(d).replace(/\s?هـ$/, ''); } catch { return ''; }
}
const pn = (id: string) => ar(id.replace(/[ab]$/, ''));

export default function Today() {
  const p = usePalette(); const P = usePlan(); const { state, now } = useStore(); const tap = useTap();
  const insets = useSafeAreaInsets(); const { width } = useWindowDimensions();
  const W = Math.min(width, 520) - 48;
  const ring = Math.min(W, 342);

  const portionW = sum(P.portion);
  const w = P.wins[P.nextIdx];
  const isLast = P.nextIdx === P.wins.length - 1;
  const first = P.portion[0], last = P.portion[P.portion.length - 1];
  const range = !first ? '' : first === last ? `ص ${pn(first.id)}` : `من ص ${pn(first.id)} إلى ص ${pn(last.id)}`;
  const startAt = P.remaining.length ? P.pages.indexOf(P.remaining[0]) : 0;
  const open = (start: number, review = false) => { tap('medium'); router.push({ pathname: '/reader', params: { start: String(start), review: review ? '1' : '0' } }); };

  // what the hero says
  let eyebrow = '', title = '', line = '', cta = '', secondary = false, eyeTone: 'now' | 'done' | 'plain' = 'now';
  if (!P.pages.length) { eyebrow = 'لا شيء مختار'; title = 'اختر أجزاء الورد'; line = 'كل الأجزاء مُعطّلة في الإعدادات.'; eyeTone = 'plain'; }
  else if (P.complete) { eyebrow = 'اكتمل الورد'; title = `تمّ ورد ${P.dayName}`; line = 'تقبّل الله. ورد الغد يبدأ بعد الفجر.'; eyeTone = 'done'; }
  else if (P.curDone && P.nextIdx > P.cur) { eyebrow = `أتممت جلسة ${P.wins[P.cur].name}`; title = `القادمة: جلسة ${w.name}`; line = `بعد صلاة ${w.name}، ${fmtTime(w.time)}`; cta = 'اقرأ الآن على أي حال'; secondary = true; eyeTone = 'done'; }
  else if (P.curDone && isLast) { eyebrow = `أتممت جلسة ${w.name}`; title = 'ما بقي من ورد اليوم'; line = `${PG(P.left)}، اقرأها متى تيسّر قبل النوم.`; cta = 'تابع القراءة'; eyeTone = 'done'; }
  else {
    eyebrow = `الآن، بعد صلاة ${w.name}`;
    title = isLast ? `جلسة ${w.name}، الأخيرة` : `جلسة ${w.name}`;
    line = `${PG(portionW)}، نحو ${MN(mins(portionW))}، ${range}`;
    cta = `ابدأ جلسة ${w.name}`;
  }

  const orbs: Orb[] = P.wins.map((x, k) => {
    const done = P.complete || !!(state.days[P.key]?.done || {})[x.i];
    const passed = !!x.time && x.time <= now;
    return { i: x.i, name: x.name, time: x.time, state: done ? 'done' : k === P.nextIdx && !P.complete ? 'current' : passed && k < P.cur ? 'missed' : 'upcoming' };
  });

  const parts = useMemo(() => {
    const ds = state.days[P.key]?.read || {};
    return DAYS[P.wd].items.map((it, idx) => {
      const [part, ttl, a, b] = it; if (!state.settings.parts[part]) return null;
      const pgs = P.pages.filter((x) => x.item === idx); const read = pgs.filter((x) => ds[x.id]);
      const rng = typeof a === 'string' ? `ص ${pn(String(a))}` : a === b ? `ص ${ar(a)}` : `ص ${ar(a)}–${ar(b as number)}`;
      const n = Math.max(1, Math.round(sum(pgs)));
      const sub = part === 'salawat' ? `من صلوات جليلة، ${rng}` : part === 'quran' ? `ورد القرآن، ${rng}` : `${rng}، ${PG(n)}`;
      const inNow = !P.complete && P.portion.some((x) => x.item === idx);
      const st = read.length === pgs.length && pgs.length ? 'done' : read.length ? 'some' : inNow ? 'now' : 'none';
      return { idx, ttl, sub, st, label: st === 'done' ? 'تمّ' : st === 'some' ? `${ar(read.length)} من ${ar(pgs.length)}` : st === 'now' ? 'الآن' : 'لم يبدأ',
        firstUnread: P.pages.findIndex((x) => x.item === idx && !ds[x.id]), firstAny: P.pages.findIndex((x) => x.item === idx) };
    }).filter(Boolean) as { idx: number; ttl: string; sub: string; st: string; label: string; firstUnread: number; firstAny: number }[];
  }, [P, state]);

  const city = state.settings.cityName || '';
  const g = P.date;
  const dateLine = [hijri(g), `${ar(g.getDate())} ${MONTHS[g.getMonth()]}`].filter(Boolean).join('، ');

  return (
    <ScrollView contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: insets.bottom + 130, paddingHorizontal: 24, alignItems: 'center' }} showsVerticalScrollIndicator={false}>
      <View style={{ width: W }}>
        {/* header */}
        <Animated.View entering={FadeInDown.duration(500)} style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Txt v="label">{dateLine}</Txt>
            <Txt v="display">{`ورد ${P.dayName}`}</Txt>
          </View>
          {city ? (
            <Pressable onPress={() => { tap(); router.push('/city'); }} accessibilityRole="button" accessibilityLabel={`المدينة: ${city}`}
              style={{ marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 6, height: 34, paddingHorizontal: 12, borderRadius: 17, borderWidth: 1, borderColor: p.chipBorder, backgroundColor: p.chip }}>
              <PinIcon size={14} color={p.gold} />
              <Text maxFontSizeMultiplier={1.15} numberOfLines={1} style={{ fontFamily: F.ui, fontSize: 13, color: p.muted, maxWidth: 120 }}>{city}</Text>
            </Pressable>
          ) : null}
        </Animated.View>

        {/* the misbaha */}
        <Animated.View entering={FadeInDown.delay(60).duration(600)} style={{ alignItems: 'center', marginTop: 14 }}>
          <Misbaha size={ring} readFrac={P.total ? P.readW / P.total : 0} nowFrac={P.total && !P.complete ? portionW / P.total : 0} complete={P.complete}
            label={`تقدم ورد اليوم: ${ar(Math.round(P.readW))} من ${ar(Math.round(P.total))} صفحة`}>
            {P.complete ? (
              <>
                <Txt v="display" align="center" style={{ fontSize: 44, lineHeight: 60 }}>تمّ</Txt>
                <Txt v="meta" align="center">{`${PG(Math.round(P.total))} اليوم`}</Txt>
              </>
            ) : (
              <>
                <Txt v="num" align="center" style={{ fontSize: ring * 0.21, lineHeight: ring * 0.235 }}>{ar(Math.round(P.readW))}</Txt>
                <Txt v="meta" align="center" style={{ fontSize: 15, lineHeight: 22 }}>{`من ${ar(Math.round(P.total))} صفحة`}</Txt>
                {P.left > 0 ? <Txt v="label" align="center" color={p.gold} style={{ marginTop: 6 }}>{`بقي نحو ${MN(mins(P.left))}`}</Txt> : null}
              </>
            )}
          </Misbaha>
        </Animated.View>

        {/* the current sitting */}
        <Animated.View entering={FadeInDown.delay(120).duration(600)} style={{ alignItems: 'center', marginTop: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: eyeTone === 'now' ? p.turq : eyeTone === 'done' ? p.gold : p.faint}} />
            <Text maxFontSizeMultiplier={1.25} style={{ fontFamily: F.ui, fontSize: 14, lineHeight: 20, color: eyeTone === 'now' ? p.turqHi : eyeTone === 'done' ? p.gold : p.muted }}>{eyebrow}</Text>
          </View>
          <Txt v="h1" align="center" style={{ marginTop: 4 }}>{title}</Txt>
          {line ? <Txt v="meta" align="center" style={{ fontSize: 15, lineHeight: 24 }}>{line}</Txt> : null}
          <View style={{ alignSelf: 'stretch', marginTop: 16, gap: 10 }}>
            {!P.pages.length ? <GoldButton label="الإعدادات" onPress={() => router.navigate('/settings')} /> : null}
            {cta && !secondary ? <GoldButton label={cta} icon={<BookIcon size={22} color={p.onPrimary} />} onPress={() => open(startAt)} /> : null}
            {cta && secondary ? <GlassButton label={cta} tone="gold" onPress={() => open(startAt)} /> : null}
            {P.complete ? <GlassButton label="مراجعة ما قرأت" tone="gold" onPress={() => open(0, true)} /> : null}
          </View>
        </Animated.View>

        {/* the day's horizon */}
        {P.pages.length > 0 && (
          <Animated.View entering={FadeInDown.delay(180).duration(600)} style={{ marginTop: 32 }}>
            <PrayerPath orbs={orbs} width={W} />
          </Animated.View>
        )}

        {/* the parts of today's wird, marked with the book's rosette */}
        {parts.length > 0 && (
          <Animated.View entering={FadeInDown.delay(240).duration(600)}>
            <Panel style={{ marginTop: 20 }}>
              <Txt v="h2" style={{ marginTop: 10, marginBottom: 2 }}>أجزاء ورد اليوم</Txt>
              {parts.map((x, k) => (
                <Pressable key={x.idx} accessibilityRole="button" accessibilityLabel={`${x.ttl}، ${x.label}`} onPress={() => open(x.firstUnread >= 0 ? x.firstUnread : x.firstAny, x.firstUnread < 0)}
                  style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, opacity: pressed ? 0.7 : 1, borderTopWidth: k === 0 ? 0 : 1, borderTopColor: p.rule })}>
                  <Mark color={x.st === 'done' ? p.gold : x.st === 'some' || x.st === 'now' ? p.turq : p.goldFaint} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Txt v="body" style={{ fontFamily: F.uiMed, lineHeight: 24 }} numberOfLines={2}>{x.ttl}</Txt>
                    <Txt v="label" style={{ lineHeight: 19 }}>{x.sub}</Txt>
                  </View>
                  <Text maxFontSizeMultiplier={1.2} style={{ fontFamily: F.ui, fontSize: 13, color: x.st === 'done' ? p.gold : x.st === 'some' || x.st === 'now' ? p.turqHi : p.faint }}>{x.label}</Text>
                </Pressable>
              ))}
            </Panel>
          </Animated.View>
        )}

        {/* the daily wird: separate from the weekly wird, only for those who open it */}
        <Animated.View entering={FadeInDown.delay(300).duration(600)}>
          <Pressable onPress={() => { tap(); router.push('/daily'); }} accessibilityRole="button" accessibilityLabel="الورد اليومي"
            style={({ pressed }) => ({ marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 18, borderRadius: 20, borderWidth: 1, borderStyle: 'dashed', borderColor: p.goldFaint, backgroundColor: pressed ? p.chip : p.dark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.35)' })}>
            <MisbahaIcon size={26} />
            <View style={{ flex: 1 }}>
              <Txt v="body" style={{ fontFamily: F.uiMed, fontSize: 15.5, lineHeight: 23 }}>الورد اليومي</Txt>
              <Txt v="label" style={{ fontSize: 12.5, lineHeight: 18 }}>الأساس، والمسبّعات، والوظيفة، وحزب البحر، مع المسبحة</Txt>
            </View>
            <ChevronIcon size={18} color={p.faint} />
          </Pressable>
        </Animated.View>
      </View>
    </ScrollView>
  );
}
