import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BellIcon, ChevronIcon, PinIcon, PRAYER_ICONS } from '../components/icons';
import { Lamp } from '../components/ornaments';
import { GlassButton, GoldButton, Panel, Segmented, Txt, useTap } from '../components/ui';
import { CITIES } from '../core/data';
import { locateMe } from '../core/location';
import { notificationPermission } from '../core/notify';
import { fmtTime, times, WIN_KEYS, WIN_NAMES } from '../core/plan';
import { useStore } from '../core/store';
import { F, usePalette } from '../theme';

export default function Onboarding() {
  const p = usePalette(); const tap = useTap(); const insets = useSafeAreaInsets(); const { width, height } = useWindowDimensions();
  const { state, setSettings } = useStore(); const s = state.settings;
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [notifAsked, setNotifAsked] = useState(false);
  const W = Math.min(width, 480) - 48;

  const hasCity = typeof s.lat === 'number';
  const ensureCity = () => { if (!hasCity) { const c = CITIES[0]; setSettings({ city: 0, cityName: c[0], lat: c[1], lng: c[2], method: c[3] }); } };
  const t = times({ ...s, lat: s.lat ?? CITIES[0][1], lng: s.lng ?? CITIES[0][2], method: hasCity ? s.method : CITIES[0][3] }, new Date());

  const auto = async () => {
    setBusy(true);
    try { const r = await locateMe(); if (r) setSettings({ lat: r.lat, lng: r.lng, method: r.method, city: 'geo', cityName: r.cityName, travel: true }); }
    catch {} finally { setBusy(false); }
  };
  const finish = () => { tap('success'); ensureCity(); setSettings({ onboarded: true }); router.replace('/'); };
  const lampW = Math.min(220, height * 0.26);

  return (
    <View style={{ flex: 1, paddingBottom: insets.bottom + 24, paddingHorizontal: 24, alignItems: 'center' }}>
      <View style={{ width: W, flex: 1, justifyContent: step === 0 ? 'flex-start' : 'center', paddingTop: step === 0 ? 0 : insets.top + 24 }}>
        {step === 0 && (
          <Animated.View key="s0" exiting={FadeOut.duration(200)} style={{ alignItems: 'center' }}>
            <Animated.View entering={FadeIn.duration(1200)}><Lamp width={lampW} /></Animated.View>
            <Animated.View entering={FadeInDown.delay(300).duration(800)} style={{ alignItems: 'center', marginTop: 12 }}>
              <Txt v="meta" align="center" color={p.gold} style={{ fontSize: 14 }}>الطريقة الصديقية الشاذلية</Txt>
              <Txt v="hero" align="center" style={{ textShadowColor: 'rgba(242,196,107,0.35)', textShadowRadius: 24 }}>أورادنا</Txt>
              <Txt v="body" align="center" style={{ fontSize: 17, lineHeight: 30 }}>ورد اليوم كاملًا، في جلسات قصيرة بعد كل صلاة.</Txt>
              <Txt v="meta" align="center" style={{ marginTop: 2, lineHeight: 26 }}>يعرف التطبيق ورد يومك من الكتاب، ويقسّمه على ما بقي من الصلوات، ويحفظ موضعك.</Txt>
            </Animated.View>
          </Animated.View>
        )}

        {step === 1 && (
          <Animated.View key="s1" entering={FadeIn.duration(500)} exiting={FadeOut.duration(200)}>
            <Txt v="display">أين تصلّي؟</Txt>
            <Txt v="meta">لحساب مواقيت الصلاة على هاتفك، دون إنترنت.</Txt>
            <Panel style={{ marginTop: 18 }}>
              <Pressable onPress={() => { tap(); router.push('/city'); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 }} accessibilityRole="button" accessibilityLabel="اختر المدينة">
                <PinIcon size={22} color={p.gold} />
                <View style={{ flex: 1 }}>
                  <Txt v="label">المدينة</Txt>
                  <Txt v="h2">{hasCity ? s.cityName : CITIES[0][0]}</Txt>
                </View>
                <ChevronIcon size={18} color={p.faint} />
              </Pressable>
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
            <GlassButton style={{ marginTop: 12 }} label={busy ? 'جارٍ تحديد موقعك…' : 'استخدم موقعي الحالي'} tone="gold" icon={<PinIcon size={18} color={p.gold} />} onPress={auto} />
            <Txt v="label" style={{ marginTop: 10 }}>إن سمحت بالموقع، تتبعك المواقيت إذا سافرت.</Txt>
          </Animated.View>
        )}

        {step === 2 && (
          <Animated.View key="s2" entering={FadeIn.duration(500)} exiting={FadeOut.duration(200)}>
            <Txt v="display">جلساتك</Txt>
            <Txt v="meta">بعد كل صلاة جلسة قصيرة. إن فاتتك جلسة، يُقسَّم الباقي على ما بقي من اليوم.</Txt>
            <Panel style={{ marginTop: 18 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12 }}>
                <Txt v="h3">عدد الجلسات</Txt>
                <Segmented value={s.sittings} onChange={(v) => setSettings({ sittings: v })} options={[{ v: 5, label: '٥' }, { v: 4, label: '٤' }, { v: 3, label: '٣' }]} />
              </View>
              <Txt v="label" style={{ marginTop: 8, paddingBottom: 12 }}>{s.sittings === 5 ? 'بعد كل صلاة: الأقصر والأسهل (موصى به).' : s.sittings === 4 ? 'الفجر والظهر والمغرب والعشاء.' : 'الفجر والظهر والعشاء.'}</Txt>
            </Panel>
            <Panel style={{ marginTop: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 }}>
                <BellIcon size={22} color={p.gold} />
                <View style={{ flex: 1 }}>
                  <Txt v="h3">تذكير بعد كل صلاة</Txt>
                  <Txt v="label">{notifAsked ? (s.notif ? 'تم. يمكنك تغيير ذلك من الإعدادات.' : 'لم يُسمح بالإشعارات. يمكنك تفعيلها لاحقًا.') : 'إشعار هادئ بالجلسة وعدد صفحاتها.'}</Txt>
                </View>
              </View>
              {!notifAsked ? <GlassButton style={{ marginBottom: 12 }} label="السماح بالإشعارات" tone="gold" onPress={async () => { const ok = await notificationPermission(true); setSettings({ notif: ok }); setNotifAsked(true); }} /> : null}
            </Panel>
          </Animated.View>
        )}
      </View>

      <View style={{ width: W, alignItems: 'center', gap: 18 }}>
        <View style={{ alignSelf: 'stretch', gap: 10 }}>
          <GoldButton label={step === 0 ? 'ابدأ' : step === 1 ? 'التالي' : 'تمّ'} onPress={() => { if (step === 1) ensureCity(); if (step < 2) setStep(step + 1); else finish(); }} />
          {step > 0 ? <GlassButton label="رجوع" onPress={() => setStep(step - 1)} /> : null}
        </View>
        <View accessible accessibilityLabel={`الخطوة ${step + 1} من ٣`} style={{ flexDirection: 'row', gap: 8 }}>
          {[0, 1, 2].map((k) => <View key={k} style={{ width: k === step ? 26 : 8, height: 8, borderRadius: 4, backgroundColor: k === step ? p.gold : p.faint, opacity: k === step ? 1 : 0.6 }} />)}
        </View>
      </View>
    </View>
  );
}
