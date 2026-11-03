import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BeadRing } from '../components/BeadRing';
import { BellIcon, ChevronIcon, LampIcon, PinIcon, PRAYER_ICONS } from '../components/icons';
import { Glass, GlassButton, GoldButton, Segmented, Txt, useTap } from '../components/ui';
import { CITIES } from '../core/data';
import { locateMe } from '../core/location';
import { notificationPermission } from '../core/notify';
import { fmtTime, times, WIN_KEYS, WIN_NAMES } from '../core/plan';
import { useStore } from '../core/store';
import { F, usePalette } from '../theme';

export default function Onboarding() {
  const p = usePalette(); const tap = useTap(); const insets = useSafeAreaInsets(); const { width } = useWindowDimensions();
  const { state, setSettings } = useStore(); const s = state.settings;
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [notifAsked, setNotifAsked] = useState(false);
  const W = Math.min(width, 480) - 40;

  // default city: Cairo, until the person picks
  const hasCity = typeof s.lat === 'number';
  const ensureCity = () => { if (!hasCity) { const c = CITIES[0]; setSettings({ city: 0, cityName: c[0], lat: c[1], lng: c[2], method: c[3] }); } };
  const t = times({ ...s, lat: s.lat ?? CITIES[0][1], lng: s.lng ?? CITIES[0][2], method: hasCity ? s.method : CITIES[0][3] }, new Date());

  const auto = async () => {
    setBusy(true);
    try { const r = await locateMe(); if (r) setSettings({ lat: r.lat, lng: r.lng, method: r.method, city: 'geo', cityName: r.cityName }); }
    catch {} finally { setBusy(false); }
  };
  const finish = () => { tap('success'); ensureCity(); setSettings({ onboarded: true }); router.replace('/'); };

  const Dots = () => (
    <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center', marginTop: 18 }}>
      {[0, 1, 2].map((k) => <View key={k} style={{ width: k === step ? 22 : 7, height: 7, borderRadius: 4, backgroundColor: k === step ? p.gold : p.faint }} />)}
    </View>
  );

  return (
    <View style={{ flex: 1, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 20, paddingHorizontal: 20, alignItems: 'center' }}>
      <View style={{ width: W, flex: 1, justifyContent: 'center' }}>
        {step === 0 && (
          <Animated.View key="s0" entering={FadeInDown.duration(700)} exiting={FadeOut.duration(200)} style={{ alignItems: 'center' }}>
            <BeadRing size={Math.min(W, 280)} readFrac={0.55} nowFrac={0.2}>
              <LampIcon size={64} active strokeWidth={1.2} />
            </BeadRing>
            <Txt v="label" align="center" style={{ color: p.gold, marginTop: 6 }}>الطريقة الصديقية الشاذلية</Txt>
            <Txt v="display" align="center" style={{ fontSize: 54, lineHeight: 84 }}>أورادنا</Txt>
            <Txt v="body" align="center" style={{ color: p.muted, marginTop: 2 }}>ورد اليوم كاملًا، في جلسات قصيرة بعد كل صلاة. يعرف التطبيق ورد يومك، ويقسّمه على ما بقي من الصلوات، ويحفظ موضعك.</Txt>
          </Animated.View>
        )}

        {step === 1 && (
          <Animated.View key="s1" entering={FadeIn.duration(500)} exiting={FadeOut.duration(200)}>
            <Txt v="display" style={{ fontSize: 36, lineHeight: 58 }}>أين تصلّي؟</Txt>
            <Txt v="meta">لحساب مواقيت الصلاة على هاتفك، دون إنترنت.</Txt>
            <Glass style={{ marginTop: 16 }} padding={16}>
              <Pressable onPress={() => { tap(); router.push('/city'); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 }} accessibilityRole="button">
                <PinIcon size={22} color={p.gold} />
                <View style={{ flex: 1 }}>
                  <Txt v="label">المدينة</Txt>
                  <Txt v="h2" style={{ color: p.gold }}>{hasCity ? s.cityName : CITIES[0][0]}</Txt>
                </View>
                <ChevronIcon size={18} color={p.faint} />
              </Pressable>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 }}>
                {WIN_KEYS.map((k, i) => { const Icon = PRAYER_ICONS[i]; return (
                  <View key={k} style={{ alignItems: 'center', flex: 1 }}>
                    <Icon size={20} color={p.gold} />
                    <Text maxFontSizeMultiplier={1.1} style={{ fontFamily: F.uiMed, fontSize: 11.5, color: p.muted, marginTop: 4 }}>{WIN_NAMES[i]}</Text>
                    <Text maxFontSizeMultiplier={1.1} style={{ fontFamily: F.uiBold, fontSize: 13, color: p.ink }}>{fmtTime(t[k])}</Text>
                  </View>
                ); })}
              </View>
            </Glass>
            <GlassButton style={{ marginTop: 12 }} label={busy ? 'جارٍ تحديد موقعك…' : 'استخدم موقعي الحالي'} tone="gold" icon={<PinIcon size={18} color={p.gold} />} onPress={auto} />
          </Animated.View>
        )}

        {step === 2 && (
          <Animated.View key="s2" entering={FadeIn.duration(500)} exiting={FadeOut.duration(200)}>
            <Txt v="display" style={{ fontSize: 36, lineHeight: 58 }}>جلساتك</Txt>
            <Txt v="meta">بعد كل صلاة جلسة قصيرة. إن فاتتك جلسة، يُقسَّم الباقي على ما بقي من اليوم.</Txt>
            <Glass style={{ marginTop: 16 }} padding={16}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Txt v="h2">عدد الجلسات</Txt>
                <Segmented value={s.sittings} onChange={(v) => setSettings({ sittings: v })} options={[{ v: 5, label: '٥' }, { v: 4, label: '٤' }, { v: 3, label: '٣' }]} />
              </View>
              <Txt v="meta" style={{ marginTop: 8 }}>{s.sittings === 5 ? 'بعد كل صلاة: الأقصر والأسهل. (موصى به)' : s.sittings === 4 ? 'الفجر والظهر والمغرب والعشاء.' : 'الفجر والظهر والعشاء.'}</Txt>
            </Glass>
            <Glass style={{ marginTop: 12 }} padding={16}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <BellIcon size={22} color={p.gold} />
                <View style={{ flex: 1 }}>
                  <Txt v="h2">تذكير بعد كل صلاة</Txt>
                  <Txt v="meta">{notifAsked ? 'تم. يمكنك تغيير ذلك من الإعدادات.' : 'إشعار هادئ بالجلسة وعدد صفحاتها.'}</Txt>
                </View>
              </View>
              {!notifAsked ? <GlassButton style={{ marginTop: 12 }} label="السماح بالإشعارات" tone="gold" onPress={async () => { const ok = await notificationPermission(true); setSettings({ notif: ok }); setNotifAsked(true); }} /> : null}
            </Glass>
          </Animated.View>
        )}
      </View>

      <View style={{ width: W }}>
        <GoldButton label={step < 2 ? 'التالي' : 'ابدأ'} onPress={() => { if (step === 1) ensureCity(); if (step < 2) setStep(step + 1); else finish(); }} />
        {step > 0 ? <GlassButton style={{ marginTop: 10 }} label="رجوع" onPress={() => setStep(step - 1)} /> : null}
        <Dots />
      </View>
    </View>
  );
}
