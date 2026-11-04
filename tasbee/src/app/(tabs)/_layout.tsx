import { Redirect, router, Tabs } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookIcon, CrescentIcon, LampIcon, StarIcon } from '../../components/icons';
import { Bar, useTap } from '../../components/ui';
import { useStore } from '../../core/store';
import { F, usePalette } from '../../theme';

const ITEMS: Record<string, { label: string; Icon: typeof LampIcon }> = {
  index: { label: 'اليوم', Icon: LampIcon },
  week: { label: 'الختمة', Icon: CrescentIcon },
  mushaf: { label: 'المصحف', Icon: BookIcon },
  settings: { label: 'الإعدادات', Icon: StarIcon },
};

const PATHS: Record<string, '/' | '/week' | '/mushaf' | '/settings'> = { index: '/', week: '/week', mushaf: '/mushaf', settings: '/settings' };

function TabBar({ state, navigation }: any) {
  const p = usePalette(); const insets = useSafeAreaInsets(); const tap = useTap();
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: Math.max(insets.bottom - 6, 12) + 8, alignItems: 'center' }}>
      <Bar radius={32}>
        <View style={{ flexDirection: 'row', padding: 6, gap: 4 }}>
          {state.routes.map((route: any, idx: number) => {
            const item = ITEMS[route.name]; if (!item) return null;
            const focused = state.index === idx; const { Icon } = item;
            return (
              <Pressable key={route.key} accessibilityRole="tab" accessibilityState={{ selected: focused }} accessibilityLabel={item.label}
                onPress={() => { tap(); if (focused) return; if (navigation && navigation.navigate) navigation.navigate(route.name); else router.navigate(PATHS[route.name]); }}
                style={{ width: 80, height: 56, borderRadius: 26, alignItems: 'center', justifyContent: 'center', gap: 2, backgroundColor: focused ? (p.dark ? 'rgba(226,188,106,0.14)' : 'rgba(138,100,32,0.1)') : 'transparent' }}>
                <Icon size={24} color={focused ? p.goldLight : p.muted} />
                <Text maxFontSizeMultiplier={1.15} style={{ fontFamily: focused ? F.uiBold : F.ui, fontSize: 12, color: focused ? p.goldLight : p.muted }}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </Bar>
    </View>
  );
}

export default function TabsLayout() {
  const { state } = useStore();
  if (!state.settings.onboarded) return <Redirect href="/onboarding" />;
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: 'transparent' }, animation: 'fade' }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="week" />
      <Tabs.Screen name="mushaf" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
