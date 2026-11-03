import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as BackgroundTask from 'expo-background-task';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as TaskManager from 'expo-task-manager';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Sky } from '../components/ui';
import { configureNotifications, refreshReminders } from '../core/notify';
import { loadState, StoreProvider, useStore } from '../core/store';
import { refreshWidgets } from '../core/widgets';
import { usePalette } from '../theme';

SplashScreen.preventAutoHideAsync().catch(() => {});
configureNotifications();

// Runs every few hours even when the app is closed: keeps the rolling window of
// reminders filled and the widgets on the right sitting.
const REFRESH_TASK = 'awradna-refresh';
TaskManager.defineTask(REFRESH_TASK, async () => {
  try {
    const s = await loadState();
    await refreshReminders(s);
    await refreshWidgets(s);
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

function Shell() {
  const p = usePalette();
  const { ready } = useStore();
  const [fontsLoaded] = useFonts({
    ArefRuqaa_700Bold: require('../../assets/fonts/ArefRuqaa_700Bold.ttf'),
    Amiri_400Regular: require('../../assets/fonts/Amiri_400Regular.ttf'),
    Amiri_700Bold: require('../../assets/fonts/Amiri_700Bold.ttf'),
    IBMPlexSansArabic_400Regular: require('../../assets/fonts/IBMPlexSansArabic_400Regular.ttf'),
    IBMPlexSansArabic_500Medium: require('../../assets/fonts/IBMPlexSansArabic_500Medium.ttf'),
    IBMPlexSansArabic_600SemiBold: require('../../assets/fonts/IBMPlexSansArabic_600SemiBold.ttf'),
  });

  useEffect(() => { if (fontsLoaded && ready) SplashScreen.hideAsync().catch(() => {}); }, [fontsLoaded, ready]);

  useEffect(() => {
    BackgroundTask.registerTaskAsync(REFRESH_TASK, { minimumInterval: 15 }).catch(() => {});
    const sub = Notifications.addNotificationResponseReceivedListener(() => { router.navigate('/'); });
    return () => sub.remove();
  }, []);

  if (!fontsLoaded || !ready) return <View style={{ flex: 1, backgroundColor: p.sky[0] }} />;

  const base = p.dark ? DarkTheme : DefaultTheme;
  const navTheme = { ...base, colors: { ...base.colors, background: 'transparent', card: 'transparent', primary: p.gold, text: p.ink, border: 'transparent' } };
  return (
    <ThemeProvider value={navTheme}>
      <View style={{ flex: 1, backgroundColor: p.sky[0] }}>
        <Sky />
        <StatusBar style={p.statusBar} />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' }, animation: 'fade' }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="reader" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom', contentStyle: { backgroundColor: p.dark ? '#0D1A17' : '#F5EFE2' } }} />
          <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
          <Stack.Screen name="city" options={{ presentation: 'modal', contentStyle: { backgroundColor: p.dark ? '#0C1820' : '#F5F1E6' } }} />
        </Stack>
      </View>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StoreProvider>
          <Shell />
        </StoreProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
