// App state: settings + reading progress, saved on the device.
// Every change is persisted, and notifications/widgets are refreshed from the same state.
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { DayState, normalize, plan, State } from './plan';
import { refreshReminders } from './notify';
import { refreshWidgets } from './widgets';

export const STORAGE_KEY = 'awradna.v1';
const KEEP_DAYS = 70;

export async function loadState(): Promise<State> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return normalize(raw ? JSON.parse(raw) : null);
  } catch {
    return normalize(null);
  }
}

async function persist(s: State) {
  try {
    const keys = Object.keys(s.days).sort();
    while (keys.length > KEEP_DAYS) delete s.days[keys.shift() as string];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {}
}

type Ctx = {
  state: State;
  ready: boolean;
  now: Date;
  setSettings: (patch: Partial<State['settings']>) => void;
  markRead: (dayKey: string, ids: string[]) => void;
  markSitting: (dayKey: string, windowIndex: number) => void;
  completeDay: (dayKey: string, windowIndexes: number[]) => void;
  resetDay: (dayKey: string) => void;
  replaceAll: (s: State) => void;
};

const StoreContext = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(normalize(null));
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState(new Date());
  const latest = useRef(state);
  const sideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Notifications and widgets follow the state, debounced so a fast page swipe costs nothing.
  const scheduleSideEffects = useCallback((s: State, delay = 1500) => {
    if (sideTimer.current) clearTimeout(sideTimer.current);
    sideTimer.current = setTimeout(() => {
      refreshReminders(s).catch(() => {});
      refreshWidgets(s).catch(() => {});
    }, delay);
  }, []);

  const commit = useCallback((next: State, effectsDelay?: number) => {
    latest.current = next;
    setState(next);
    persist(next);
    scheduleSideEffects(next, effectsDelay);
  }, [scheduleSideEffects]);

  useEffect(() => {
    loadState().then((s) => { latest.current = s; setState(s); setReady(true); scheduleSideEffects(s, 300); });
  }, [scheduleSideEffects]);

  // Keep "now" fresh: every minute, and whenever the app comes back to the foreground.
  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 30000);
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') { setNow(new Date()); scheduleSideEffects(latest.current, 500); }
    });
    return () => { clearInterval(tick); sub.remove(); };
  }, [scheduleSideEffects]);

  const dayOf = (s: State, key: string): DayState => s.days[key] ? { read: { ...s.days[key].read }, done: { ...(s.days[key].done || {}) } } : { read: {}, done: {} };

  const api = useMemo<Ctx>(() => ({
    state, ready, now,
    setSettings: (patch) => {
      const s = latest.current;
      commit({ ...s, settings: { ...s.settings, ...patch, parts: { ...s.settings.parts, ...(patch.parts || {}) } } }, 400);
    },
    markRead: (key, ids) => {
      const s = latest.current; const d = dayOf(s, key); let changed = false;
      ids.forEach((id) => { if (!d.read[id]) { d.read[id] = 1; changed = true; } });
      if (changed) commit({ ...s, days: { ...s.days, [key]: d } }, 4000);
    },
    markSitting: (key, w) => {
      const s = latest.current; const d = dayOf(s, key);
      if (d.done[w]) return; d.done[w] = 1;
      commit({ ...s, days: { ...s.days, [key]: d } }, 800);
    },
    completeDay: (key, ws) => {
      const s = latest.current; const d = dayOf(s, key);
      ws.forEach((w) => { d.done[w] = 1; });
      commit({ ...s, days: { ...s.days, [key]: d } }, 800);
    },
    resetDay: (key) => {
      const s = latest.current; const days = { ...s.days }; delete days[key];
      commit({ ...s, days }, 400);
    },
    replaceAll: (s) => commit(normalize(s), 400),
  }), [state, ready, now, commit]);

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const c = useContext(StoreContext);
  if (!c) throw new Error('StoreProvider missing');
  return c;
}

export function usePlan() {
  const { state, now } = useStore();
  return useMemo(() => plan(state, now), [state, now]);
}
