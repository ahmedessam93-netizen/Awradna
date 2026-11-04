// Anonymous daily count: once a day the app says "opened today" (and "first time" once), with the
// kind of device (Android app, iPhone home-screen app, browser). Nothing else is sent: no
// identifier, no city, no reading progress. Counts are visible only to the app's owner.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { isIOS, isStandalone } from './notify';

const KEY = 'awradna.ping';
const URL = Platform.OS === 'web' ? '/.netlify/functions/ping' : 'https://awradna.netlify.app/.netlify/functions/ping';
let busy = false;

export async function pingDaily() {
  if (busy) return; busy = true;
  try {
    const day = new Date().toISOString().slice(0, 10);
    const last = await AsyncStorage.getItem(KEY);
    if (last === day) return;
    const k = Platform.OS === 'android' ? 'android' : Platform.OS === 'ios' ? 'ios' : isIOS() && isStandalone() ? 'iphone' : 'web';
    // text/plain keeps it a simple request (no extra round trip in browsers)
    const r = await fetch(URL, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ k, first: !last }) });
    if (r.ok) await AsyncStorage.setItem(KEY, day);
  } catch {} finally { busy = false; }
}
