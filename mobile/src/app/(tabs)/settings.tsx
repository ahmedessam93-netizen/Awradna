import * as Location from 'expo-location';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronIcon, PRAYER_ICONS, ShareIcon } from '../../components/icons';
import { Panel, Row, SectionTitle, Segmented, Toggle, Txt, useTap } from '../../components/ui';
import { PARTS, PART_ORDER } from '../../core/data';
import { notificationPermission } from '../../core/notify';
import { ar, fmtTime, SCHED, times, WIN_KEYS, WIN_NAMES } from '../../core/plan';
import PT from '../../core/prayer';
import { usePlan, useStore } from '../../core/store';
import { F, usePalette } from '../../theme';

const PART_SUB: Record<string, string> = {
  salawat: 'جزء مختلف كل يوم، فتكتمل في الأسبوع',
  ahzab: 'النصر، الشكوى، الإخفاء، اللطف، الحفظ، النجاة، الكفاية',
  quran: 'سورة اليوم: يس، طه، مريم، الكهف، الدخان، النور، الرحمن',
};

export default function Settings() {
  const p = usePalette(); const tap = useTap(); const insets = useSafeAreaInsets(); const { width } = useWindowDimensions();
  const { state, setSettings, resetDay } = useStore(); const P = usePlan(); const s = state.settings;
  const W = Math.min(width, 520) - 48;
  const [methodsOpen, setMethodsOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [note, setNote] = useState<{ k: string; t: string } | null>(null);
  const t = times(s, new Date());

  const toggleNotif = async (v: boolean) => {
    if (v && !(await notificationPermission(true))) { setNote({ k: 'notif', t: 'الإشعارات مغلقة لهذا التطبيق في إعدادات الهاتف. افتحها من هناك ثم عد.' }); setSettings({ notif: true }); return; }
    setNote(null); setSettings({ notif: v });
  };
  const toggleTravel = async (v: boolean) => {
    if (v) {
      const r = await Location.requestForegroundPermissionsAsync().catch(() => null);
      if (!r || !r.granted) { setNote({ k: 'travel', t: 'يحتاج هذا إلى إذن الموقع. افتحه من إعدادات الهاتف.' }); }
      else setNote(null);
    }
    setSettings({ travel: v });
  };

  const methodName = (PT.METHODS as Record<string, { name: string }>)[s.method]?.name;
  const NoteLine = ({ k }: { k: string }) => note && note.k === k ? (
    <Pressable onPress={() => Linking.openSettings()}><Txt v="label" color={p.danger} style={{ marginBottom: 8 }}>{note.t}</Txt></Pressable>
  ) : null;

  return (
    <ScrollView contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: insets.bottom + 130, paddingHorizontal: 24, alignItems: 'center' }} showsVerticalScrollIndicator={false}>
      <View style={{ width: W }}>
        <Animated.View entering={FadeInDown.duration(500)}><Txt v="display">الإعدادات</Txt></Animated.View>

        <SectionTitle>المكان والمواقيت</SectionTitle>
        <Panel>
          <Row first title="المدينة" sub="تُحسب المواقيت على هاتفك دون إنترنت" onPress={() => router.push('/city')}
            right={<View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Txt v="meta" color={p.gold}>{s.cityName || '—'}</Txt><ChevronIcon size={16} color={p.faint} /></View>} />
          <Row title="تحديث المدينة عند السفر" sub="تتغير المواقيت تلقائيًا إذا انتقلت إلى مدينة أخرى" right={<Toggle label="تحديث المدينة عند السفر" value={s.travel !== false} onChange={toggleTravel} />}>
            <NoteLine k="travel" />
          </Row>
          <Row title="طريقة الحساب" onPress={() => setMethodsOpen(!methodsOpen)}
            right={<View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: '58%' }}><Txt v="meta" numberOfLines={1} color={p.gold}>{methodName}</Txt><ChevronIcon size={16} color={p.faint} /></View>} />
          {methodsOpen && Object.entries(PT.METHODS).map(([k, m]: [string, any]) => (
            <Pressable key={k} onPress={() => { tap(); setSettings({ method: k }); setMethodsOpen(false); }} accessibilityRole="button" accessibilityState={{ selected: k === s.method }}
              style={{ paddingVertical: 10, paddingHorizontal: 10, borderRadius: 12, backgroundColor: k === s.method ? p.turqSoft : 'transparent' }}>
              <Txt v="body" style={{ fontSize: 15, color: k === s.method ? p.goldLight : p.ink }}>{m.name}</Txt>
            </Pressable>
          ))}
          <View style={{ flexDirection: 'row', paddingVertical: 12, borderTopWidth: 1, borderTopColor: p.rule }}>
            {WIN_KEYS.map((k, i) => { const Icon = PRAYER_ICONS[i]; return (
              <View key={k} style={{ alignItems: 'center', flex: 1 }}>
                <Icon size={20} color={p.gold} />
                <Text maxFontSizeMultiplier={1.1} style={{ fontFamily: F.ui, fontSize: 11.5, color: p.muted, marginTop: 4 }}>{WIN_NAMES[i]}</Text>
                <Text maxFontSizeMultiplier={1.1} style={{ fontFamily: F.uiBold, fontSize: 13, color: p.ink }}>{fmtTime(t[k])}</Text>
              </View>
            ); })}
          </View>
        </Panel>

        <SectionTitle>الجلسات</SectionTitle>
        <Panel>
          <Row first title="عدد الجلسات" sub="بعد الصلوات، والباقي يُقسَّم تلقائيًا"
            right={<Segmented value={s.sittings} onChange={(v) => setSettings({ sittings: v })} options={[{ v: 5, label: '٥' }, { v: 4, label: '٤' }, { v: 3, label: '٣' }]} />} />
          <Row title="جلسة الفجر أطول" sub="نحو ٤٠٪ من الورد بعد الفجر" right={<Toggle label="جلسة الفجر أطول" value={!!s.fajrHeavy} onChange={(v) => setSettings({ fajrHeavy: v })} />} />
          <Txt v="label" style={{ paddingBottom: 10, fontSize: 12.5 }}>{`الجلسات بعد: ${SCHED[s.sittings].map((i) => WIN_NAMES[i]).join('، ')}. لا يُنقل شيء إلى الغد.`}</Txt>
        </Panel>

        <SectionTitle>ما يظهر في ورد اليوم</SectionTitle>
        <Panel>
          {PART_ORDER.map((k, i) => (
            <Row key={k} first={i === 0} title={PARTS[k].title} sub={PART_SUB[k]}
              right={<Toggle label={PARTS[k].title} value={!!s.parts[k]} onChange={(v) => setSettings({ parts: { ...s.parts, [k]: v } })} />} />
          ))}
        </Panel>

        <SectionTitle>التذكير</SectionTitle>
        <Panel>
          <Row first title="تذكير بعد كل صلاة" sub="لا يصل إن أتممت ورد اليوم" right={<Toggle label="تذكير بعد كل صلاة" value={s.notif !== false} onChange={toggleNotif} />}>
            <NoteLine k="notif" />
          </Row>
          <Row title="بعد الأذان بـ" right={
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Pressable accessibilityRole="button" accessibilityLabel="أقل" hitSlop={6} onPress={() => { tap(); setSettings({ offset: Math.max(0, (s.offset || 0) - 5) }); }} style={{ width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: p.chip, borderWidth: 1, borderColor: p.chipBorder }}><Text style={{ color: p.ink, fontSize: 18 }}>−</Text></Pressable>
              <Text maxFontSizeMultiplier={1.15} style={{ fontFamily: F.uiBold, fontSize: 15, color: p.gold, minWidth: 70, textAlign: 'center' }}>{s.offset ? `${ar(s.offset)} دقيقة` : 'مع الأذان'}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="أكثر" hitSlop={6} onPress={() => { tap(); setSettings({ offset: Math.min(90, (s.offset || 0) + 5) }); }} style={{ width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: p.chip, borderWidth: 1, borderColor: p.chipBorder }}><Text style={{ color: p.ink, fontSize: 18 }}>+</Text></Pressable>
            </View>} />
        </Panel>

        <SectionTitle>القراءة والعرض</SectionTitle>
        <Panel>
          <Row first title="المظهر" right={<Segmented value={s.theme || 'auto'} onChange={(v) => setSettings({ theme: v })} options={[{ v: 'auto', label: 'تلقائي' }, { v: 'dark', label: 'الليل' }, { v: 'light', label: 'الفجر' }]} />} />
          <Row title="حجم الصفحة" right={<Segmented value={s.pageZoom || 1} onChange={(v) => setSettings({ pageZoom: v })} options={[{ v: 1, label: 'عادي' }, { v: 1.25, label: 'كبير' }, { v: 1.5, label: 'أكبر' }]} />} />
          <Row title="إبقاء الشاشة مضاءة" sub="أثناء القراءة" right={<Toggle label="إبقاء الشاشة مضاءة" value={s.wake !== false} onChange={(v) => setSettings({ wake: v })} />} />
          <Row title="اهتزاز خفيف" sub="عند اللمس، ومع كل حبة في المسبحة" right={<Toggle label="الاهتزاز" value={s.haptics !== false} onChange={(v) => setSettings({ haptics: v })} />} />
        </Panel>

        <SectionTitle>أورادنا</SectionTitle>
        <Panel>
          <Row first title="شارك التطبيق" sub="رابط ورمز QR" onPress={() => router.push('/share')} right={<ShareIcon size={20} color={p.gold} />} />
          {!confirmReset ? (
            <Row title="مسح تقدّم اليوم" sub={`ورد ${P.dayName}`} onPress={() => setConfirmReset(true)} right={<Txt v="meta" color={p.danger}>مسح</Txt>} />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: p.rule }}>
              <Txt v="body" style={{ flex: 1 }}>مسح تقدّم اليوم؟</Txt>
              <Pressable accessibilityRole="button" onPress={() => { tap('medium'); resetDay(P.key); setConfirmReset(false); }} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: p.danger }}><Text style={{ fontFamily: F.uiBold, color: '#fff' }}>نعم، امسح</Text></Pressable>
              <Pressable accessibilityRole="button" onPress={() => setConfirmReset(false)} style={{ paddingHorizontal: 12, paddingVertical: 8 }}><Text style={{ fontFamily: F.uiMed, color: p.muted }}>إلغاء</Text></Pressable>
            </View>
          )}
        </Panel>

        <Txt v="label" style={{ marginTop: 18, marginHorizontal: 6, lineHeight: 21 }}>أوراد الطريقة الصديقية الشاذلية، للإمام الأستاذ الدكتور نور الدين علي جمعة. أرقام الصفحات هي أرقام الكتاب المطبوع. يعمل التطبيق على هاتفك بالكامل، دون حساب ودون إرسال أي بيانات.</Txt>
      </View>
    </ScrollView>
  );
}
