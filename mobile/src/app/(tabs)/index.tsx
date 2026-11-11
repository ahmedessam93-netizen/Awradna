import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BellIcon, BookIcon, CrescentIcon, MisbahaIcon, PinIcon, PRAYER_ICONS, ShareIcon } from '../../components/icons';
import { Head, HeroButton, HeroCard, SitRow, StripDay, Tiles, Timeline, WeekStrip } from '../../components/dash';
import { Mark, Panel, Stat, Txt, useTap } from '../../components/ui';
import { dayStat, streak, weekFull } from '../../core/stats';
import { DAYS } from '../../core/data';
import { plan as planToday0 } from '../../core/plan';
const planToday = (st: any, now: Date) => planToday0(st, now).key;
import { addDays, ar, dkey, fmtTime, mins, MN, PG, sum } from '../../core/plan';
import { itemRead, readFrac } from '../../core/sittings';
import { useStore, useViewPlan } from '../../core/store';
import { useUpdate } from '../../core/update';
import { WebNotice } from '../../components/WebNotice';
import { Linking } from 'react-native';
import { F, usePalette } from '../../theme';

const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
function hijri(d: Date) {
  try { return new Intl.DateTimeFormat('ar-EG-u-ca-islamic-umalqura-nu-arab', { day: 'numeric', month: 'long', year: 'numeric' }).format(d).replace(/\s?هـ$/, ''); } catch { return ''; }
}
const pn = (id: string) => ar(id.replace(/[a-c]$/, ''));
const SHORT = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

export default function Today() {
  const p = usePalette(); const P = useViewPlan(); const { state, now, viewDay, setViewDay } = useStore(); const tap = useTap();
  const todayKey = useMemo(() => planToday(state, now), [state, now]);
  const isToday = P.key === todayKey;
  const isPast = !isToday && P.key < todayKey;
  const insets = useSafeAreaInsets(); const { width } = useWindowDimensions();
  const update = useUpdate();
  const W = Math.min(width, 520) - 48;

  const dayRead = state.days[P.key]?.read;
  // what is still unread in the suggested sitting
  const portionW = P.segs[P.nextIdx].reduce((a, it) => a + (itemRead(dayRead, it) ? 0 : it.w), 0);
  const w = P.wins[P.nextIdx];
  const isLast = P.nextIdx === P.wins.length - 1;
  const read = (params: Record<string, string>) => { tap('medium'); router.push({ pathname: '/reader', params: { day: P.key, ...params } }); };
  // continue from the saved place
  const cont = () => read({});
  // each sitting has its own fixed pages, opened from their start, even if already read
  const openSitting = (k: number) => {
    let j = k; while (j < P.segs.length - 1 && !P.segs[j].length) j++;
    read({ seg: String(j) });
  };
  const [ty, tm, td] = todayKey.split('-').map(Number);
  const offset = Math.round((+new Date(P.date) - +new Date(ty, tm - 1, td)) / 864e5);

  // what the hero says. The sittings are only a guide: reading always continues from where
  // the person stopped, and each day starts from the beginning of its wird.
  const placeId = P.at ? P.at.split('~')[0] : P.readW > 0 && P.remaining[0] ? P.remaining[0].id : null;
  const contLabel = placeId ? `تابع من ص ${pn(placeId)}` : `ابدأ من أول ورد ${P.dayName}`;
  let eyebrow = '', title = '', line = '', cta = '', secondary = false, eyeTone: 'now' | 'done' | 'plain' = 'now';
  if (P.pages.length && !isToday && !P.complete) {
    eyebrow = isPast ? (P.readW > 0 ? 'يوم سابق لم يكتمل' : 'يوم سابق') : 'يوم قادم';
    title = isPast ? (P.readW > 0 ? `ما بقي من ورد ${P.dayName}` : `ورد ${P.dayName}`) : `ورد ${P.dayName}`;
    line = isPast ? `${PG(P.left)}، اقرأها متى شئت.` : `${PG(P.total)}، يبدأ بعد فجر ذلك اليوم. يمكنك قراءته الآن إن شئت.`;
    cta = contLabel; eyeTone = 'plain';
  } else if (!P.pages.length) { eyebrow = 'لا شيء مختار'; title = 'اختر أجزاء الورد'; line = 'كل الأجزاء مُعطّلة في الإعدادات.'; eyeTone = 'plain'; }
  else if (P.complete) { eyebrow = 'اكتمل الورد'; title = `تمّ ورد ${P.dayName}`; line = isToday ? 'تقبّل الله. ورد الغد يبدأ بعد الفجر.' : 'تقبّل الله.'; eyeTone = 'done'; }
  else if (P.curDone && P.nextIdx > P.cur) { eyebrow = `أتممت جلسة ${P.wins[P.cur].name}`; title = `القادمة: جلسة ${w.name}`; line = `بعد صلاة ${w.name}، ${fmtTime(w.time)}`; cta = contLabel; secondary = true; eyeTone = 'done'; }
  else if (P.curDone && isLast) { eyebrow = `أتممت جلسة ${w.name}`; title = 'ما بقي من ورد اليوم'; line = `${PG(P.left)}، اقرأها متى تيسّر قبل النوم.`; cta = contLabel; eyeTone = 'done'; }
  else {
    eyebrow = `الآن، بعد صلاة ${w.name}`;
    title = isLast ? `جلسة ${w.name}، الأخيرة` : `جلسة ${w.name}`;
    line = `المقترح الآن: ${PG(portionW)}، نحو ${MN(mins(portionW))}`;
    cta = contLabel;
  }

  // the five sittings of the day, one after each prayer
  const rows: SitRow[] = P.wins.map((x, k) => {
    const done = P.complete || !!(state.days[P.key]?.done || {})[x.i];
    const passed = isPast || (isToday && !!x.time && x.time <= now);
    const st: SitRow['state'] = done ? 'done' : !isToday ? (isPast ? 'missed' : 'upcoming') : k === P.nextIdx ? 'now' : passed && k < P.cur ? 'missed' : 'upcoming';
    const n = P.segs[k].reduce((a, it) => a + it.w, 0);
    return { key: String(x.i), Icon: PRAYER_ICONS[x.i] || PRAYER_ICONS[k], title: `جلسة ${x.name}`, sub: n > 0 ? `${PG(Math.max(1, Math.round(n)))}، نحو ${MN(mins(n))}` : 'لا صفحات في هذه الجلسة',
      right: st === 'done' ? 'تمّ' : st === 'now' ? 'الآن' : st === 'missed' ? 'فاتت' : x.time ? fmtTime(x.time) : '', state: st, onPress: () => openSitting(k),
      a11y: `جلسة ${x.name}، ${st === 'done' ? 'تمّت' : st === 'now' ? 'الآن' : st === 'missed' ? 'فاتت' : 'قادمة'}` };
  });

  const parts = useMemo(() => {
    const ds = state.days[P.key]?.read || {};
    return DAYS[P.wd].items.map((it, idx) => {
      const [part, ttl, a, b] = it; if (!state.settings.parts[part]) return null;
      const pgs = P.pages.filter((x) => x.item === idx); const read = pgs.filter((x) => readFrac(ds, x.id) >= 1);
      const first = pgs[0]?.id ?? String(a), last = pgs[pgs.length - 1]?.id ?? first;
      const rng = pn(first) === pn(last) ? `ص ${pn(first)}` : `ص ${pn(first)}–${pn(last)}`;
      const n = Math.max(1, Math.round(sum(pgs)));
      const sub = part === 'salawat' ? `من صلوات جليلة، ${rng}` : part === 'quran' ? `ورد القرآن، ${rng}` : `${rng}، ${PG(n)}`;
      const inNow = isToday && !P.complete && P.portion.some((x) => x.item === idx);
      const st = read.length === pgs.length && pgs.length ? 'done' : read.length ? 'some' : inNow ? 'now' : 'none';
      return { idx, ttl, sub, st, label: st === 'done' ? 'تمّ' : st === 'some' ? `${ar(read.length)} من ${ar(pgs.length)}` : st === 'now' ? 'الآن' : 'لم يبدأ',
        first: (pgs.find((x) => readFrac(ds, x.id) < 1) || pgs[0])?.id };
    }).filter(Boolean) as { idx: number; ttl: string; sub: string; st: string; label: string; first: string }[];
  }, [P, state]);

  const today = useMemo(() => { const [y, m, d] = todayKey.split('-').map(Number); return new Date(y, m - 1, d); }, [todayKey]);
  const run = useMemo(() => streak(state, today), [state, today]);
  const weekDone = useMemo(() => weekFull(state, today), [state, today]);
  // the week of the book, Monday to Sunday
  const strip: StripDay[] = useMemo(() => {
    const mon = addDays(today, -((today.getDay() + 6) % 7));
    return [0, 1, 2, 3, 4, 5, 6].map((i) => {
      const d = addDays(mon, i); const k = dkey(d); const s = dayStat(state, d);
      return { key: k, name: SHORT[d.getDay()], num: ar(d.getDate()), frac: s.total ? s.read / s.total : 0, full: s.full, today: k === todayKey, selected: k === P.key,
        a11y: `ورد ${DAYS[d.getDay()].name}${k === todayKey ? '، اليوم' : ''}${s.full ? '، مكتمل' : ''}` };
    });
  }, [state, today, todayKey, P.key]);
  const city = state.settings.cityName || '';
  const g = P.date;
  const dateLine = [hijri(g), `${ar(g.getDate())} ${MONTHS[g.getMonth()]}`].filter(Boolean).join('، ');

  return (
    <ScrollView contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: insets.bottom + 150, paddingHorizontal: 24, alignItems: 'center' }} showsVerticalScrollIndicator={false}>
      <View style={{ width: W }}>
        {/* header: the date, the day, the city */}
        <Animated.View entering={FadeInDown.duration(500)} style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Txt v="label">{offset === 0 ? dateLine : `${offset === -1 ? 'أمس' : offset === 1 ? 'غدًا' : offset < 0 ? 'يوم سابق' : 'يوم قادم'}، ${dateLine}`}</Txt>
            <Txt v="display" numberOfLines={1} adjustsFontSizeToFit>{`ورد ${P.dayName}`}</Txt>
          </View>
          {city ? (
            <Pressable onPress={() => { tap(); router.push('/city'); }} accessibilityRole="button" accessibilityLabel={`المدينة: ${city}`}
              style={{ marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 6, height: 34, paddingHorizontal: 12, borderRadius: 17, borderWidth: 1, borderColor: p.chipBorder, backgroundColor: p.chip }}>
              <PinIcon size={14} color={p.gold} />
              <Text maxFontSizeMultiplier={1.15} numberOfLines={1} style={{ fontFamily: F.ui, fontSize: 13, color: p.muted, maxWidth: 120 }}>{city}</Text>
            </Pressable>
          ) : null}
        </Animated.View>

        {/* the week: tap a day to open its wird */}
        <Animated.View entering={FadeInDown.delay(40).duration(500)}>
          <WeekStrip days={strip} onPick={(k) => setViewDay(k === todayKey ? null : k)} />
        </Animated.View>

        <WebNotice />
        {update ? (
          <Pressable onPress={() => { tap(); Linking.openURL(update.url); }} accessibilityRole="button" accessibilityLabel="تحديث التطبيق"
            style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, backgroundColor: p.turqSoft, borderWidth: 1, borderColor: p.turq }}>
            <View style={{ flex: 1 }}>
              <Txt v="h3" style={{ fontSize: 15 }}>{`إصدار جديد من أورادنا (${update.version})`}</Txt>
              <Txt v="label">{update.notes || 'اضغط للتحميل، وسيبقى تقدّمك كما هو.'}</Txt>
            </View>
            <Text style={{ fontFamily: F.uiBold, fontSize: 14, color: p.turqHi }}>تحديث</Text>
          </Pressable>
        ) : null}

        {/* the day's card: what is due now, how far along, and the way in */}
        <Animated.View entering={FadeInDown.delay(80).duration(600)}>
          <HeroCard style={{ marginTop: 16 }} eyebrow={eyebrow} tone={eyeTone} title={title} line={line} done={P.complete}
            frac={P.total ? P.readW / P.total : 0} big={ar(Math.max(1, Math.round(P.left)))} small={P.readW > 0 ? 'صفحة باقية' : 'صفحة'}>
            {!P.pages.length ? <HeroButton label="الإعدادات" onPress={() => router.navigate('/settings')} /> : null}
            {cta && !secondary ? <HeroButton label={cta} icon={<BookIcon size={22} color="#2A1D07" />} onPress={cont} /> : null}
            {cta && secondary ? <HeroButton quiet label={cta} onPress={cont} /> : null}
            {P.complete ? <HeroButton quiet label="مراجعة ما قرأت" onPress={() => read({ seg: '0' })} /> : null}
          </HeroCard>
          {!isToday ? (
            <Pressable onPress={() => { tap(); setViewDay(null); }} accessibilityRole="button"
              style={{ marginTop: 12, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, height: 38, borderRadius: 19, backgroundColor: p.turqSoft, borderWidth: 1, borderColor: p.turq }}>
              <Text style={{ fontFamily: F.uiBold, fontSize: 13.5, color: p.turqHi }}>العودة إلى اليوم</Text>
            </Pressable>
          ) : null}
        </Animated.View>

        {/* a row of small facts: the run of days, this week, today */}
        {P.pages.length > 0 && (
          <Animated.View entering={FadeInDown.delay(130).duration(600)}>
            <Panel style={{ marginTop: 16 }} padding={8}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Stat value={ar(run)} label={run === 1 ? 'يوم متتالٍ' : 'أيام متتالية'} tone={run > 0 ? 'gold' : undefined} />
                <View style={{ width: 1, height: 34, backgroundColor: p.rule }} />
                <Stat value={`${ar(weekDone)} / ٧`} label="أيام هذا الأسبوع" tone={weekDone > 0 ? 'now' : undefined} />
                <View style={{ width: 1, height: 34, backgroundColor: p.rule }} />
                <Stat value={P.left > 0 ? MN(mins(P.left)).replace('نحو ', '') : '٠'} label="باقٍ اليوم" />
              </View>
            </Panel>
          </Animated.View>
        )}

        {/* the day's sittings */}
        {P.pages.length > 0 && (
          <Animated.View entering={FadeInDown.delay(180).duration(600)}>
            <Head title="جلسات اليوم" />
            <Panel padding={14}>
              <View style={{ paddingVertical: 6 }}><Timeline rows={rows} /></View>
            </Panel>
            <Txt v="label" align="center" style={{ marginTop: 10 }}>الجلسات للتيسير فقط: اقرأ الورد دفعة واحدة أو على مهلك، والتطبيق يحفظ الصفحة التي وقفت عندها.</Txt>
          </Animated.View>
        )}

        {/* the parts of today's wird, marked with the book's rosette */}
        {parts.length > 0 && (
          <Animated.View entering={FadeInDown.delay(230).duration(600)}>
            <Head title="أجزاء ورد اليوم" />
            <Panel>
              {parts.map((x, k) => (
                <Pressable key={x.idx} accessibilityRole="button" accessibilityLabel={`${x.ttl}، ${x.label}`} onPress={() => read({ page: x.first })}
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

        {/* shortcuts */}
        <Animated.View entering={FadeInDown.delay(280).duration(600)}>
          <Head title="المزيد" />
          <Tiles items={[
            { key: 'daily', icon: <MisbahaIcon size={24} />, title: 'الورد اليومي', sub: 'الأساس والمسبّعات والوظيفة وحزب البحر', onPress: () => router.push('/daily') },
            { key: 'week', icon: <CrescentIcon size={22} color={p.goldLight} />, title: 'أسبوعك', sub: 'أيام الأسبوع وما اكتمل منها', onPress: () => router.navigate('/week') },
            { key: 'city', icon: <BellIcon size={22} color={p.goldLight} />, title: 'المواقيت والتنبيهات', sub: city ? `مواقيت ${city}` : 'اختر مدينتك', onPress: () => router.navigate('/settings') },
            { key: 'share', icon: <ShareIcon size={22} color={p.goldLight} />, title: 'شارك التطبيق', sub: 'رابط ورمز QR', onPress: () => router.push('/share') },
          ]} />
        </Animated.View>
      </View>
    </ScrollView>
  );
}
