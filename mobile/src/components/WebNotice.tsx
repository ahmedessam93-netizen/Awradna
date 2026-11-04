// Web version only: helps people add Awradna to the Home Screen and turn on notifications.
import React, { useEffect, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { needsHomeScreen, notificationPermission, pushSupported, refreshReminders, sendTest } from '../core/notify';
import { useStore } from '../core/store';
import { F, usePalette } from '../theme';
import { BellIcon, ShareIcon } from './icons';
import { Txt, useTap } from './ui';

export function WebNotice() {
  const p = usePalette(); const tap = useTap(); const { state, setSettings } = useStore();
  const [granted, setGranted] = useState(true);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (Platform.OS !== 'web' || !pushSupported() || needsHomeScreen()) return;
    setGranted(typeof Notification !== 'undefined' && Notification.permission === 'granted');
  }, []);
  if (Platform.OS !== 'web') return null;

  const box = { marginTop: 12, flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12, padding: 14, borderRadius: 18, backgroundColor: p.turqSoft, borderWidth: 1, borderColor: p.turq };
  if (needsHomeScreen()) {
    return (
      <View style={box}>
        <ShareIcon size={22} color={p.turqHi} />
        <View style={{ flex: 1 }}>
          <Txt v="h3" style={{ fontSize: 15 }}>لتصلك الإشعارات على الآيفون</Txt>
          <Txt v="label">اضغط زر المشاركة في سفاري، ثم «إضافة إلى الشاشة الرئيسية»، وافتح أورادنا من أيقونته.</Txt>
        </View>
      </View>
    );
  }
  if (!pushSupported() || granted || state.settings.notif === false) return null;
  return (
    <Pressable accessibilityRole="button" onPress={async () => {
      tap(); setBusy(true);
      const ok = await notificationPermission(true);
      setBusy(false); setGranted(ok);
      if (ok) { setSettings({ notif: true }); refreshReminders({ ...state, settings: { ...state.settings, notif: true } }); sendTest(); }
    }} style={box}>
      <BellIcon size={22} color={p.turqHi} />
      <View style={{ flex: 1 }}>
        <Txt v="h3" style={{ fontSize: 15 }}>فعّل الإشعارات</Txt>
        <Txt v="label">إشعار بعد كل صلاة بجلستها وعدد صفحاتها.</Txt>
      </View>
      <Text style={{ fontFamily: F.uiBold, fontSize: 14, color: p.turqHi }}>{busy ? '…' : 'تفعيل'}</Text>
    </Pressable>
  );
}
