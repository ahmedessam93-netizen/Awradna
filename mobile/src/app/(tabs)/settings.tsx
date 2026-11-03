import { router } from 'expo-router';
import React, { useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronIcon, PinIcon, PRAYER_ICONS } from '../../components/icons';
import { Glass, Row, SectionTitle, Segmented, Toggle, Txt, useTap } from '../../components/ui';
import { PARTS, PART_ORDER } from '../../core/data';
import { locateMe } from '../../core/location';
import { notificationPermission } from '../../core/notify';
import { ar, fmtTime, SCHED, times, WIN_KEYS, WIN_NAMES } from '../../core/plan';
import PT from '../../core/prayer';
import { usePlan, useStore } from '../../core/store';
import { F, usePalette } from '../../theme';

export default function Settings() {
  const p = usePalette(); const tap = useTap(); const insets = useSafeAreaInsets(); const { width } = useWindowDimensions();
  const { state, setSettings, resetDay } = useStore(); const P = usePlan(); const s = state.settings;
  const W = Math.min(width, 520) - 32;
  const [methodsOpen, setMethodsOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [locating, setLocating] = useState(false);
  const [notifNote, setNotifNote] = useState('');
  const t = times(s, new Date());

  const locate = async () => {
    setLocating(true);
    try { const r = await locateMe(); if (r) setSettings({ lat: r.lat, lng: r.lng, method: r.method, city: 'geo', cityName: r.cityName }); }
    catch {} finally { setLocating(false); }
  };
  const toggleNotif = async (v: boolean) => {
    if (v) {
      const ok = await notificationPermission(true);
      if (!ok) { setNotifNote('الإشعارات مغلقة لهذا التطبيق في إعدادات الهاتف. افتحها من هناك ثم عد.'); setSettings({ notif: true }); return; }
    }
    setNotifNote(''); setSettings({ notif: v });
  };

  return (
    <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 120, paddingHorizontal: 16, alignItems: 'center' }} showsVerticalScrollIndicator={false}>
      <View style={{ width: W }}>
        <Animated.View entering={FadeInDown.duration(500)}>
          <Txt v="display">الإعدادات</Txt>
        </Animated.View>

        <SectionTitle>الموقع ومواقيت الصلاة</SectionTitle>
        <Glass padding={16} style={{ marginBottom: 12 }}>
          <Row first title="المدينة" sub="تُحسب المواقيت على هاتفك دون إنترنت" onPress={() => router.push('/city')}
            right={<View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Txt v="meta" style={{ color: p.gold }}>{s.cityName || '—'}</Txt><ChevronIcon size={16} color={p.faint} /></View>} />
          <Row title="تحديد موقعي تلقائيًا" sub="أدق لمن هو خارج القائمة" onPress={locate}
            right={<View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><PinIcon size={18} color={p.gold} /><Txt v="meta" style={{ color: p.gold }}>{locating ? '…' : 'تحديد'}</Txt></View>} />
          <Row title="طريقة الحساب" onPress={() => setMethodsOpen(!methodsOpen)}
            right={<View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: '58%' }}><Txt v="meta" numberOfLines={1} style={{ color: p.gold }}>{(PT.METHODS as Record<string, { name: string }>)[s.method]?.name}</Txt><ChevronIcon size={16} color={p.faint} /></View>} />
          {methodsOpen && Object.entries(PT.METHODS).map(([k, m]: [string, any]) => (
            <Pressable key={k} onPress={() => { tap(); setSettings({ method: k }); setMethodsOpen(false); }} style={{ paddingVertical: 10, paddingHorizontal: 8, borderRadius: 12, backgroundColor: k === s.method ? (p.dark ? 'rgba(232,199,124,0.12)' : 'rgba(169,121,42,0.08)') : 'transparent' }}>
              <Txt v="body" style={{ color: k === s.method ? p.gold : p.ink, fontSize: 14.5 }}>{m.name}</Txt>
            </Pressable>
          ))}
          <Row title="العصر" right={<Segmented value={s.asr} onChange={(v) => setSettings({ asr: v })} options={[{ v: 1, label: 'الجمهور' }, { v: 2, label: 'الحنفية' }]} />} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
            {WIN_KEYS.map((k, i) => { const Icon = PRAYER_ICONS[i]; return (
              <View key={k} style={{ alignItems: 'center', flex: 1 }}>
                <Icon size={20} color={p.gold} />
                <Text maxFontSizeMultiplier={1.1} style={{ fontFamily: F.uiMed, fontSize: 11.5, color: p.muted, marginTop: 4 }}>{WIN_NAMES[i]}</Text>
                <Text maxFontSizeMultiplier={1.1} style={{ fontFamily: F.uiBold, fontSize: 13, color: p.ink }}>{fmtTime(t[k])}</Text>
              </View>
            ); })}
          </View>
        </Glass>

        <SectionTitle>الجلسات</SectionTitle>
        <Glass padding={16} style={{ marginBottom: 12 }}>
          <Row first title="عدد الجلسات" sub="بعد الصلوات، والمتبقي يُعاد تقسيمه تلقائيًا"
            right={<Segmented value={s.sittings} onChange={(v) => setSettings({ sittings: v })} options={[{ v: 5, label: '٥' }, { v: 4, label: '٤' }, { v: 3, label: '٣' }]} />} />
          <Row title="جلسة الفجر أطول" sub="نحو ٤٠٪ من الورد بعد الفجر" right={<Toggle label="جلسة الفجر أطول" value={!!s.fajrHeavy} onChange={(v) => setSettings({ fajrHeavy: v })} />} />
          <Txt v="meta" style={{ marginTop: 6, fontSize: 12.5 }}>{`الجلسات بعد: ${SCHED[s.sittings].map((i) => WIN_NAMES[i]).join('، ')}. لا يُنقل شيء إلى الغد.`}</Txt>
        </Glass>

        <SectionTitle>ما يظهر في ورد اليوم</SectionTitle>
        <Glass padding={16} style={{ marginBottom: 12 }}>
          {PART_ORDER.map((k, i) => (
            <Row key={k} first={i === 0} title={PARTS[k].title} sub={k === 'ahzab' ? 'النصر، الشكوى، الإخفاء، اللطف، الحفظ، النجاة، الكفاية' : k === 'salawat' ? 'جزء مختلف كل يوم، فتكتمل في الأسبوع' : undefined}
              right={<Toggle label={PARTS[k].title} value={!!s.parts[k]} onChange={(v) => setSettings({ parts: { ...s.parts, [k]: v } })} />} />
          ))}
        </Glass>

        <SectionTitle>الإشعارات</SectionTitle>
        <Glass padding={16} style={{ marginBottom: 12 }}>
          <Row first title="تذكير بعد كل صلاة" sub="لا يصل إن أتممت ورد اليوم" right={<Toggle label="الإشعارات" value={s.notif !== false} onChange={toggleNotif} />} />
          {notifNote ? (
            <Pressable onPress={() => Linking.openSettings()}><Txt v="meta" style={{ color: p.danger, marginBottom: 6 }}>{notifNote}</Txt></Pressable>
          ) : null}
          <Row title="بعد الأذان بـ" right={
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Pressable accessibilityLabel="أقل" onPress={() => { tap(); setSettings({ offset: Math.max(0, (s.offset || 0) - 5) }); }} style={{ width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: p.dark ? 'rgba(255,255,255,0.08)' : 'rgba(30,42,35,0.06)' }}><Text style={{ color: p.ink, fontSize: 18 }}>−</Text></Pressable>
              <Text maxFontSizeMultiplier={1.15} style={{ fontFamily: F.uiBold, fontSize: 15, color: p.gold, minWidth: 64, textAlign: 'center' }}>{`${ar(s.offset || 0)} دقيقة`}</Text>
              <Pressable accessibilityLabel="أكثر" onPress={() => { tap(); setSettings({ offset: Math.min(90, (s.offset || 0) + 5) }); }} style={{ width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: p.dark ? 'rgba(255,255,255,0.08)' : 'rgba(30,42,35,0.06)' }}><Text style={{ color: p.ink, fontSize: 18 }}>+</Text></Pressable>
            </View>} />
        </Glass>

        <SectionTitle>العرض</SectionTitle>
        <Glass padding={16} style={{ marginBottom: 12 }}>
          <Row first title="المظهر" right={<Segmented value={s.theme || 'auto'} onChange={(v) => setSettings({ theme: v })} options={[{ v: 'auto', label: 'تلقائي' }, { v: 'dark', label: 'الليل' }, { v: 'light', label: 'الفجر' }]} />} />
          <Row title="إبقاء الشاشة مضاءة أثناء القراءة" right={<Toggle label="إبقاء الشاشة مضاءة" value={s.wake !== false} onChange={(v) => setSettings({ wake: v })} />} />
          <Row title="اهتزاز خفيف عند اللمس" right={<Toggle label="الاهتزاز" value={s.haptics !== false} onChange={(v) => setSettings({ haptics: v })} />} />
        </Glass>

        <SectionTitle>البيانات</SectionTitle>
        <Glass padding={16} style={{ marginBottom: 12 }}>
          {!confirmReset ? (
            <Row first title="مسح تقدّم اليوم" sub={`ورد ${P.dayName}`} onPress={() => setConfirmReset(true)} right={<Txt v="meta" style={{ color: p.danger }}>مسح</Txt>} />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 }}>
              <Txt v="body" style={{ flex: 1 }}>مسح تقدّم اليوم؟</Txt>
              <Pressable onPress={() => { tap('medium'); resetDay(P.key); setConfirmReset(false); }} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: p.danger }}><Text style={{ fontFamily: F.uiBold, color: '#fff' }}>نعم، امسح</Text></Pressable>
              <Pressable onPress={() => setConfirmReset(false)} style={{ paddingHorizontal: 14, paddingVertical: 8 }}><Text style={{ fontFamily: F.uiMed, color: p.muted }}>إلغاء</Text></Pressable>
            </View>
          )}
        </Glass>

        <Glass padding={18} style={{ marginTop: 6 }}>
          <Txt v="title" style={{ color: p.gold }}>أورادنا</Txt>
          <Txt v="meta">أوراد الطريقة الصديقية الشاذلية، للإمام الأستاذ الدكتور نور الدين علي جمعة. أرقام الصفحات هي أرقام الكتاب المطبوع نفسها.</Txt>
          <Txt v="meta" style={{ marginTop: 6 }}>يعمل التطبيق على هاتفك بالكامل: لا حساب، ولا إنترنت، ولا تُرسل أي بيانات.</Txt>
        </Glass>
      </View>
    </ScrollView>
  );
}
