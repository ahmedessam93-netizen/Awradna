import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Polygon, Rect } from 'react-native-svg';
import { BeadRing } from '../../components/BeadRing';
import { BookIcon, PinIcon } from '../../components/icons';
import { Orb, PrayerPath } from '../../components/PrayerPath';
import { GlassButton, GoldButton, Glass, Txt, useTap } from '../../components/ui';
import { DAYS } from '../../core/data';
import { ar, fmtTime, mins, MN, PG, sum } from '../../core/plan';
import { usePlan, useStore } from '../../core/store';
import { F, usePalette } from '../../theme';

function hijri(d: Date) {
  try { return new Intl.DateTimeFormat('ar-EG-u-ca-islamic-umalqura-nu-arab', { day: 'numeric', month: 'long', year: 'numeric' }).format(d); } catch { return ''; }
}
function greg(d: Date) {
  const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  return `${ar(d.getDate())} ${months[d.getMonth()]}`;
}

function StarBullet({ v, size = 22 }: { v: number; size?: number }) {
  const p = usePalette();
  const full = v >= 100;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={5.5} y={5.5} width={13} height={13} rx={1} fill={full ? p.gold : 'none'} stroke={p.gold} strokeOpacity={full ? 1 : 0.55} strokeWidth={1.3} />
      <Rect x={5.5} y={5.5} width={13} height={13} rx={1} fill={full ? p.gold : 'none'} stroke={p.gold} strokeOpacity={full ? 1 : 0.55} strokeWidth={1.3} transform="rotate(45 12 12)" />
      {!full && v > 0 ? <Circle cx={12} cy={12} r={2 + 3 * (v / 100)} fill={p.gold} fillOpacity={0.85} /> : null}
      {full ? <Polygon points="12,8.6 13,11 15.4,12 13,13 12,15.4 11,13 8.6,12 11,11" fill={p.onGold} /> : null}
    </Svg>
  );
}

export default function Today() {
  const p = usePalette(); const P = usePlan(); const { state, now } = useStore(); const tap = useTap();
  const insets = useSafeAreaInsets(); const { width } = useWindowDimensions();
  const W = Math.min(width, 520) - 32;
  const ring = Math.min(W - 24, 300);

  const portionW = sum(P.portion);
  const w = P.wins[P.nextIdx];
  const isLast = P.nextIdx === P.wins.length - 1;
  const first = P.portion[0], last = P.portion[P.portion.length - 1];
  const pn = (id: string) => ar(id.replace(/[ab]$/, ''));
  const range = !first ? '' : first === last ? `ص ${pn(first.id)}` : `من ص ${pn(first.id)} إلى ص ${pn(last.id)}`;
  const startAt = P.remaining.length ? P.pages.indexOf(P.remaining[0]) : 0;
  const open = (start: number, review = false) => { tap('medium'); router.push({ pathname: '/reader', params: { start: String(start), review: review ? '1' : '0' } }); };

  let eyebrow = '', title = '', extra = '', cta = '', ctaSecondary = false;
  if (!P.pages.length) { eyebrow = 'لا شيء مختار'; title = 'اختر أجزاء الورد'; extra = 'كل الأجزاء مُعطّلة في الإعدادات.'; }
  else if (P.complete) { eyebrow = 'اكتمل الورد'; title = `تمّ ورد يوم ${P.dayName}`; extra = 'تقبّل الله. ورد الغد يبدأ بعد الفجر.'; }
  else if (P.curDone && P.nextIdx > P.cur) { eyebrow = `أتممت جلسة ${P.wins[P.cur].name}`; title = `القادمة: جلسة ${w.name}`; extra = `بعد صلاة ${w.name}، ${fmtTime(w.time)}`; cta = 'اقرأ الآن على أي حال'; ctaSecondary = true; }
  else if (P.curDone && isLast) { eyebrow = `أتممت جلسة ${w.name}`; title = 'ما بقي من ورد اليوم'; extra = 'اقرأه متى تيسّر قبل النوم.'; cta = 'تابع القراءة'; }
  else { eyebrow = `الجلسة الحالية، بعد صلاة ${w.name} ${fmtTime(w.time)}`; title = isLast ? `جلسة ${w.name}، آخر جلسة اليوم` : `جلسة ${w.name}`; cta = P.readW > 0 ? 'تابع القراءة' : 'ابدأ القراءة'; }

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
      const v = pgs.length ? Math.round((read.length / pgs.length) * 100) : 0;
      const rng = typeof a === 'string' ? `ص ${pn(String(a))}` : a === b ? `ص ${ar(a)}` : `ص ${ar(a)}–${ar(b)}`;
      return { idx, ttl, rng, n: sum(pgs), v, firstUnread: P.pages.findIndex((x) => x.item === idx && !ds[x.id]), firstAny: P.pages.findIndex((x) => x.item === idx) };
    }).filter(Boolean) as { idx: number; ttl: string; rng: string; n: number; v: number; firstUnread: number; firstAny: number }[];
  }, [P, state]);

  const city = state.settings.cityName || '';
  return (
    <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 120, paddingHorizontal: 16, alignItems: 'center' }} showsVerticalScrollIndicator={false}>
      <View style={{ width: W }}>
        {/* header */}
        <Animated.View entering={FadeInDown.duration(500)} style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Txt v="label" style={{ color: p.muted }}>{[hijri(P.date), greg(P.date)].filter(Boolean).join('، ')}</Txt>
            <Txt v="display" style={{ marginTop: -6 }}>{`ورد ${P.dayName}`}</Txt>
          </View>
          {city ? (
            <Pressable onPress={() => { tap(); router.push('/city'); }} accessibilityRole="button" accessibilityLabel={`المدينة ${city}`}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, borderWidth: 1, borderColor: p.dark ? 'rgba(240,214,150,0.22)' : 'rgba(150,110,40,0.22)', backgroundColor: p.dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.6)' }}>
              <PinIcon size={14} color={p.gold} />
              <Text maxFontSizeMultiplier={1.15} style={{ fontFamily: F.uiMed, fontSize: 12, color: p.muted }}>{city}</Text>
            </Pressable>
          ) : null}
        </Animated.View>

        {/* hero: misbaha + current sitting */}
        <Animated.View entering={FadeInDown.delay(80).duration(600)}>
          <Glass style={{ marginTop: 10 }} padding={20}>
            <View style={{ alignItems: 'center' }}>
              <BeadRing size={ring} readFrac={P.total ? P.readW / P.total : 0} nowFrac={P.total && !P.complete ? portionW / P.total : 0} complete={P.complete}>
                {P.complete ? (
                  <>
                    <Txt v="display" align="center" style={{ fontSize: 34, lineHeight: 52 }}>تمّ</Txt>
                    <Txt v="meta" align="center">{`${PG(P.total)} اليوم`}</Txt>
                  </>
                ) : (
                  <>
                    <Txt v="num" align="center" style={{ fontSize: 46, lineHeight: 58, color: p.ink }}>{ar(Math.round(P.readW))}</Txt>
                    <Txt v="meta" align="center" style={{ marginTop: -4 }}>{`من ${ar(Math.round(P.total))} صفحة`}</Txt>
                    {P.left > 0 ? <Txt v="label" align="center" style={{ color: p.gold, marginTop: 2 }}>{`بقي نحو ${MN(mins(P.left))}`}</Txt> : null}
                  </>
                )}
              </BeadRing>
            </View>
            <View style={{ marginTop: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: P.complete || P.curDone ? p.gold : p.emerald }} />
                <Txt v="label" style={{ flex: 1 }}>{eyebrow}</Txt>
              </View>
              <Txt v="title" style={{ marginTop: 2 }}>{title}</Txt>
              {!P.complete && P.portion.length > 0 && !(P.curDone && P.nextIdx > P.cur) ? <Txt v="meta">{`${PG(portionW)}، نحو ${MN(mins(portionW))}، ${range}`}</Txt> : null}
              {extra ? <Txt v="meta">{extra}</Txt> : null}
            </View>
            <View style={{ marginTop: 16, gap: 10 }}>
              {!P.pages.length ? <GoldButton label="الإعدادات" onPress={() => router.navigate('/settings')} /> : null}
              {cta && !ctaSecondary ? <GoldButton label={cta} icon={<BookIcon size={20} color={p.onGold} />} onPress={() => open(startAt)} /> : null}
              {cta && ctaSecondary ? <GlassButton label={cta} tone="gold" onPress={() => open(startAt)} /> : null}
              {P.complete ? <GlassButton label="مراجعة ما قرأت" tone="gold" onPress={() => open(0, true)} /> : null}
            </View>
          </Glass>
        </Animated.View>

        {/* the day's path */}
        {P.pages.length > 0 && (
          <Animated.View entering={FadeInDown.delay(160).duration(600)}>
            <Glass style={{ marginTop: 14 }} padding={16}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <Txt v="h2">جلسات اليوم</Txt>
                <Txt v="label">{`${ar(P.wins.length)} جلسات بعد الصلوات`}</Txt>
              </View>
              <View style={{ marginTop: 10 }}>
                <PrayerPath orbs={orbs} width={W - 34} />
              </View>
            </Glass>
          </Animated.View>
        )}

        {/* parts */}
        {parts.length > 0 && (
          <Animated.View entering={FadeInDown.delay(240).duration(600)}>
            <Glass style={{ marginTop: 14 }} padding={6}>
              <Txt v="h2" style={{ paddingHorizontal: 12, paddingTop: 10, paddingBottom: 4 }}>أجزاء ورد اليوم</Txt>
              {parts.map((x, k) => (
                <Pressable key={x.idx} accessibilityRole="button" accessibilityLabel={`${x.ttl}، ${x.v} بالمئة`} onPress={() => open(x.firstUnread >= 0 ? x.firstUnread : x.firstAny, x.firstUnread < 0)}
                  style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 12, borderRadius: 18, backgroundColor: pressed ? (p.dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)') : 'transparent', borderTopWidth: k === 0 ? 0 : 0.5, borderTopColor: p.dark ? 'rgba(240,214,150,0.12)' : 'rgba(30,42,35,0.08)' })}>
                  <StarBullet v={x.v} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Txt v="body" style={{ fontFamily: F.uiMed, fontSize: 15 }} numberOfLines={2}>{x.ttl}</Txt>
                    <Txt v="meta" style={{ fontSize: 12.5 }}>{`${x.rng}، ${PG(x.n)}`}</Txt>
                    <View style={{ height: 3, borderRadius: 2, backgroundColor: p.dark ? 'rgba(255,255,255,0.08)' : 'rgba(30,42,35,0.08)', marginTop: 6, overflow: 'hidden' }}>
                      <View style={{ width: `${x.v}%`, height: 3, backgroundColor: x.v === 100 ? p.gold : p.emerald }} />
                    </View>
                  </View>
                </Pressable>
              ))}
            </Glass>
          </Animated.View>
        )}
      </View>
    </ScrollView>
  );
}
