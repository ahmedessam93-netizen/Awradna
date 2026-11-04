// Web version: real push notifications (Web Push). The phone computes when each sitting
// is due, exactly as the native app does, and hands that schedule to the Awradna server,
// which sends each notification on time even when the app is closed.
// iPhone: works from iOS 16.4 once Awradna is added to the Home Screen.
import { State, upcomingNotifications } from './plan';

export const CHANNEL_ID = 'wird';
const VAPID_PUBLIC = 'BA5YHXq-RWnQAqlMQMDxniMEtkox2FPuayvBu6YqwmTXY2SzOJKh9YNBfZNX_qHLhdn3b44cXkOjPPXHlG8w_Oo';
const SYNC_URL = '/.netlify/functions/push-sync';

export const pushSupported = () => typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
export const isIOS = () => typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent);
export const isStandalone = () => typeof window !== 'undefined' && (window.matchMedia?.('(display-mode: standalone)').matches || (navigator as any).standalone === true);
// On iPhone, notifications need the app on the Home Screen first.
export const needsHomeScreen = () => isIOS() && !isStandalone();

export function configureNotifications() {
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
}

function keyBytes(b64: string) {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

async function subscription(create: boolean): Promise<PushSubscription | null> {
  if (!pushSupported()) return null;
  const reg = await navigator.serviceWorker.ready;
  const cur = await reg.pushManager.getSubscription();
  if (cur || !create) return cur;
  return reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(VAPID_PUBLIC) });
}

export async function notificationPermission(ask: boolean): Promise<boolean> {
  try {
    if (!pushSupported() || needsHomeScreen()) return false;
    let perm = Notification.permission;
    if (perm === 'default' && ask) perm = await Notification.requestPermission();
    if (perm !== 'granted') return false;
    return !!(await subscription(true));
  } catch { return false; }
}

let timer: ReturnType<typeof setTimeout> | null = null;
export async function refreshReminders(s: State) {
  try {
    if (!pushSupported() || Notification.permission !== 'granted') return;
    const sub = await subscription(s.settings.notif !== false && !!s.settings.onboarded);
    if (!sub) return;
    const off = s.settings.notif === false || !s.settings.onboarded;
    const items = off ? [] : upcomingNotifications(s, new Date(), 120).map((n) => ({ at: n.at.getTime(), id: n.id, title: n.title, body: n.body }));
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fetch(SYNC_URL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sub: sub.toJSON(), items }) }).catch(() => {});
    }, 300);
  } catch {}
}

// One notification right now, to confirm everything works.
export async function sendTest(): Promise<boolean> {
  try {
    const sub = await subscription(false);
    if (!sub) return false;
    const r = await fetch('/.netlify/functions/push-test', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sub: sub.toJSON() }) });
    return r.ok;
  } catch { return false; }
}
