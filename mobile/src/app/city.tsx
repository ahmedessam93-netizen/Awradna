import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckIcon, PinIcon, SearchIcon } from '../components/icons';
import { Txt, useTap } from '../components/ui';
import { CITIES } from '../core/data';
import { useStore } from '../core/store';
import { F, usePalette } from '../theme';
import { locateMe } from '../core/location';

const norm = (s: string) => s.replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').trim();

export default function CityPicker() {
  const p = usePalette(); const tap = useTap(); const insets = useSafeAreaInsets();
  const { state, setSettings } = useStore();
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const list = useMemo(() => {
    const nq = norm(q);
    return CITIES.map((c, i) => ({ c, i })).filter(({ c }) => !nq || norm(c[0]).includes(nq));
  }, [q]);
  const pick = (i: number) => { tap('medium'); const c = CITIES[i]; setSettings({ city: i, cityName: c[0], lat: c[1], lng: c[2], method: c[3] }); router.back(); };
  const auto = async () => {
    setBusy(true);
    try { const r = await locateMe(); if (r) { setSettings({ lat: r.lat, lng: r.lng, method: r.method, city: 'geo', cityName: r.cityName, travel: true }); router.back(); } }
    catch {} finally { setBusy(false); }
  };
  return (
    <View style={{ flex: 1, paddingTop: 18, paddingHorizontal: 16 }}>
      <View style={{ alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: p.faint, marginBottom: 14 }} />
      <Txt v="display" style={{ fontSize: 30, lineHeight: 42 }}>اختر مدينتك</Txt>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, paddingHorizontal: 12, height: 46, borderRadius: 14, backgroundColor: p.chip, borderWidth: 1, borderColor: p.chipBorder }}>
        <SearchIcon size={18} color={p.muted} />
        <TextInput value={q} onChangeText={setQ} placeholder="ابحث عن مدينة" placeholderTextColor={p.faint} style={{ flex: 1, fontFamily: F.ui, fontSize: 16, color: p.ink, textAlign: 'right', writingDirection: 'rtl' }} autoCorrect={false} returnKeyType="search" />
      </View>
      <Pressable onPress={auto} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, paddingHorizontal: 6 }} accessibilityRole="button">
        <PinIcon size={20} color={p.gold} />
        <Text style={{ fontFamily: F.uiBold, fontSize: 15, color: p.gold }}>{busy ? 'جارٍ تحديد موقعك…' : 'استخدم موقعي الحالي'}</Text>
      </Pressable>
      <FlatList data={list} keyExtractor={(x) => String(x.i)} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        renderItem={({ item, index }) => {
          const on = state.settings.city === item.i;
          const showHeader = index === 0 || (list[index - 1].c[3] === 'egypt') !== (item.c[3] === 'egypt');
          return (
            <View>
              {showHeader && !q ? <Txt v="label" style={{ marginTop: 12, marginBottom: 4, paddingHorizontal: 6 }}>{item.c[3] === 'egypt' ? 'مصر' : 'مدن أخرى'}</Txt> : null}
              <Pressable onPress={() => pick(item.i)} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 8, borderRadius: 12, backgroundColor: on ? p.turqSoft : pressed ? p.chip : 'transparent' })}>
                <Txt v="body" style={{ flex: 1, color: on ? p.goldLight : p.ink, fontFamily: on ? F.uiBold : F.ui }}>{item.c[0]}</Txt>
                {on ? <CheckIcon size={18} color={p.gold} /> : null}
              </Pressable>
            </View>
          );
        }} />
    </View>
  );
}
