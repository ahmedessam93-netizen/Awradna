import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CrescentIcon, LampIcon, StarIcon } from '../../components/icons';
import { useTap } from '../../components/ui';
import { useStore } from '../../core/store';
import { F, usePalette } from '../../theme';

const ITEMS: Record<string, { label: string; Icon: typeof LampIcon }> = {
  index: { label: 'اليوم', Icon: LampIcon },
  week: { label: 'الأسبوع', Icon: CrescentIcon },
  settings: { label: 'الإعدادات', Icon: StarIcon },
};

function GlassTabBar({ state, navigation }: any) {
  const p = usePalette(); const insets = useSafeAreaInsets(); const tap = useTap();
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: Math.max(insets.bottom, 10) + 6, alignItems: 'center' }}>
      <LinearGradient colors={[p.rimA, p.rimB, p.rimA]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 30, padding: 1, shadowColor: '#000', shadowOpacity: p.dark ? 0.45 : 0.12, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 10 }}>
        <View style={{ borderRadius: 29, overflow: 'hidden', flexDirection: 'row', paddingHorizontal: 8, paddingVertical: 6, gap: 4 }}>
          {Platform.OS === 'ios' && <BlurView intensity={55} tint={p.dark ? 'systemUltraThinMaterialDark' : 'systemUltraThinMaterialLight'} style={StyleSheet.absoluteFill} />}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: Platform.OS === 'ios' ? (p.dark ? 'rgba(10,24,22,0.45)' : 'rgba(255,255,255,0.45)') : (p.dark ? 'rgba(14,30,30,0.94)' : 'rgba(255,253,247,0.96)') }]} />
          {state.routes.map((route: any, idx: number) => {
            const item = ITEMS[route.name]; if (!item) return null;
            const focused = state.index === idx; const { Icon } = item;
            return (
              <Pressable key={route.key} accessibilityRole="tab" accessibilityState={{ selected: focused }} accessibilityLabel={item.label}
                onPress={() => { tap(); if (!focused) navigation.navigate(route.name); }}
                style={{ width: 92, height: 54, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: focused ? (p.dark ? 'rgba(232,199,124,0.13)' : 'rgba(169,121,42,0.10)') : 'transparent' }}>
                <Icon size={24} active={focused} color={p.muted} />
                <Text maxFontSizeMultiplier={1.15} style={{ fontFamily: focused ? F.uiBold : F.uiMed, fontSize: 11.5, marginTop: 2, color: focused ? p.gold : p.muted }}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </LinearGradient>
    </View>
  );
}

export default function TabsLayout() {
  const { state } = useStore();
  if (!state.settings.onboarded) return <Redirect href="/onboarding" />;
  return (
    <Tabs tabBar={(props) => <GlassTabBar {...props} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: 'transparent' }, animation: 'fade' }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="week" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
