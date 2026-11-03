// The reading plan, computed from saved state at any moment. Mirrors app/src/app.js plan()
// so the web screen, notifications and widgets always agree.
import { DAYS, HALF, MIN_PER_PAGE } from './data';
import PT from './prayer';
import { phraseAt, SHORT_MAX } from './phrases';

export const WIN_NAMES = ['الفجر', 'الظهر', 'العصر', 'المغرب', 'العشاء'];
export const WIN_KEYS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
export const SCHED: Record<number, number[]> = { 5: [0, 1, 2, 3, 4], 4: [0, 1, 3, 4], 3: [0, 1, 4] };

export type Settings = {
  lat: number | null; lng: number | null; method: string; asr: number;
  sittings: number; fajrHeavy: boolean; parts: Record<string, boolean>;
  offset: number; remType: string; fixed: string[]; notif?: boolean; onboarded?: boolean;
  city?: number | 'geo'; cityName?: string; theme?: 'auto' | 'light' | 'dark'; wake?: boolean; haptics?: boolean;
};
export type DayState = { read: Record<string, number>; done: Record<string, number> };
export type State = { settings: Settings; days: Record<string, DayState> };

export const DEFAULTS: Settings = {
  lat: null, lng: null, method: 'egypt', asr: 1, sittings: 5, fajrHeavy: false,
  parts: { dalail: true, mughnam: true, kunuz: true, salawat: true, ahzab: false },
  offset: 20, remType: 'prayer', fixed: ['05:30', '13:00', '16:00', '18:30', '21:00'], notif: true,
  onboarded: false, city: 0, cityName: 'القاهرة', theme: 'auto', wake: true, haptics: true,
};
export function normalize(raw: any): State {
  const s = raw && raw.settings ? raw.settings : {};
  return {
    settings: { ...DEFAULTS, ...s, parts: { ...DEFAULTS.parts, ...(s.parts || {}) } },
    days: (raw && raw.days) || {},
  };
}

// ---- numbers and time in Arabic, without relying on Intl (Hermes) ----
const AD = '٠١٢٣٤٥٦٧٨٩';
export const ar = (n: number | string) => String(n).replace(/[0-9]/g, (d) => AD[+d]);
export function cnt(n: number, one: string, two: string, few: string) {
  n = Math.round(n);
  if (n === 1) return one; if (n === 2) return two;
  if (n >= 3 && n <= 10) return `${ar(n)} ${few}`;
  return `${ar(n)} ${one}`;
}
export const PG = (n: number) => cnt(n, 'صفحة', 'صفحتان', 'صفحات');
export const MN = (n: number) => cnt(n, 'دقيقة', 'دقيقتان', 'دقائق');
export function fmtTime(d: Date | null) {
  if (!d) return '—';
  let h = d.getHours(); const m = d.getMinutes(); const pm = h >= 12;
  h = h % 12; if (h === 0) h = 12;
  return `${ar(h)}:${ar(String(m).padStart(2, '0'))} ${pm ? 'م' : 'ص'}`;
}

// ---- dates ----
export const dkey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const atMidnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const addDays = (d: Date, n: number) => { const x = atMidnight(d); x.setDate(x.getDate() + n); return x; };
const hasLoc = (s: Settings) => typeof s.lat === 'number' && typeof s.lng === 'number';
const fixedDate = (date: Date, hhmm: string) => { const [h, m] = hhmm.split(':').map(Number); return new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, m, 0); };

export type Times = Record<'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha', Date | null>;
export function times(s: Settings, date: Date): Times {
  if (hasLoc(s)) return PT.compute(date, s.lat, s.lng, { method: s.method, asr: s.asr }) as Times;
  const f = s.fixed;
  return { fajr: fixedDate(date, f[0]), dhuhr: fixedDate(date, f[1]), asr: fixedDate(date, f[2]), maghrib: fixedDate(date, f[3]), isha: fixedDate(date, f[4]) };
}
export function wirdDate(s: Settings, now: Date) { const t = times(s, now); return (t.fajr && now < t.fajr) ? addDays(now, -1) : atMidnight(now); }
export function windowsFor(s: Settings, date: Date) {
  const t = times(s, date);
  return SCHED[s.sittings].map((i) => ({ i, name: WIN_NAMES[i], time: t[WIN_KEYS[i]] }));
}

// ---- content ----
export type Page = { id: string; part: string; title: string; item: number; w: number };
export function dayPages(s: Settings, weekday: number): Page[] {
  const out: Page[] = [];
  DAYS[weekday].items.forEach((it, idx) => {
    const [part, title, a, b] = it;
    if (!s.parts[part]) return;
    if (typeof a === 'string') { out.push({ id: a, part, title, item: idx, w: HALF[a] ? 0.5 : 1 }); return; }
    for (let p = a; p <= (b as number); p++) out.push({ id: String(p), part, title, item: idx, w: HALF[String(p)] ? 0.5 : 1 });
  });
  return out;
}
export const sum = (a: Page[]) => a.reduce((x, p) => x + p.w, 0);
export const mins = (w: number) => Math.max(1, Math.round(w * MIN_PER_PAGE));
const pnum = (id: string) => id.replace(/[ab]$/, '');

export type Plan = {
  date: Date; key: string; wd: number; dayName: string; pages: Page[]; remaining: Page[];
  wins: { i: number; name: string; time: Date | null }[]; cur: number; curDone: boolean; nextIdx: number;
  total: number; left: number; readW: number; portion: Page[]; complete: boolean;
};

export function plan(st: State, now: Date = new Date()): Plan {
  const s = st.settings;
  const date = wirdDate(s, now); const key = dkey(date); const wd = date.getDay();
  const pages = dayPages(s, wd); const ds = st.days[key] || { read: {}, done: {} };
  const read = ds.read || {}; const done = ds.done || {};
  const remaining = pages.filter((p) => !read[p.id]);
  const wins = windowsFor(s, date);
  let cur = 0; wins.forEach((w, i) => { if (w.time && w.time <= now) cur = i; });
  const curDone = !!done[wins[cur].i];
  const nextIdx = curDone ? Math.min(cur + 1, wins.length - 1) : cur;
  const remWin = Math.max(1, wins.length - nextIdx);
  const total = sum(pages), left = sum(remaining), readW = total - left;
  const share = (s.fajrHeavy && nextIdx === 0 && readW === 0 && wins.length >= 4) ? total * 0.4 : left / remWin;
  const portion: Page[] = []; let acc = 0;
  for (const p of remaining) { if (acc >= share - 1e-9 && portion.length) break; portion.push(p); acc += p.w; }
  if (nextIdx === wins.length - 1 || remWin === 1) { portion.length = 0; portion.push(...remaining); }
  return { date, key, wd, dayName: DAYS[wd].name, pages, remaining, wins, cur, curDone, nextIdx, total, left, readW, portion, complete: remaining.length === 0 && pages.length > 0 };
}

export function rangeText(portion: Page[]) {
  if (!portion.length) return '';
  const a = pnum(portion[0].id), b = pnum(portion[portion.length - 1].id);
  return a === b ? `ص ${ar(a)}` : `ص ${ar(a)}–${ar(b)}`;
}

// What a widget shows at a given moment.
export type Snapshot = {
  day: string; title: string; shortTitle: string; detail: string; range: string; progressText: string;
  progress: number; nowFrac: number; next: string; complete: boolean;
  phrase: string; phraseShort: string; phraseSrc: string; phraseShortSrc: string;
};
export function snapshot(st: State, at: Date = new Date()): Snapshot {
  const P = plan(st, at);
  const w = P.wins[P.nextIdx];
  const nextWin = P.wins.find((x) => x.time && x.time > at);
  const tomorrowFajr = times(st.settings, addDays(P.date, 1)).fajr;
  const next = nextWin ? `${nextWin.name} ${fmtTime(nextWin.time)}` : `الفجر ${fmtTime(tomorrowFajr)}`;
  const pw = sum(P.portion);
  const progress = P.total ? P.readW / P.total : 0;
  const progressText = `${ar(Math.round(P.readW))} من ${ar(Math.round(P.total))} صفحة`;
  const nowFrac = P.total ? pw / P.total : 0;
  const ph = phraseAt(P.wd, at), phS = phraseAt(P.wd, at, SHORT_MAX);
  const words = { phrase: ph.t, phraseSrc: `${ph.src}، ص ${ar(ph.p)}`, phraseShort: phS.t, phraseShortSrc: `${phS.src}، ص ${ar(phS.p)}` };
  if (P.pages.length === 0) return { day: `ورد ${P.dayName}`, title: 'اختر أجزاء الورد', shortTitle: 'اختر الأجزاء', detail: 'من الإعدادات', range: '', progressText, progress, nowFrac: 0, next, complete: false, ...words };
  if (P.complete) return { day: `ورد ${P.dayName}`, title: 'تمّ ورد اليوم', shortTitle: 'تمّ ورد اليوم', detail: 'تقبّل الله', range: '', progressText, progress: 1, nowFrac: 0, next: `الفجر ${fmtTime(tomorrowFajr)}`, complete: true, ...words };
  const title = (P.curDone && P.nextIdx > P.cur) ? `القادمة: جلسة ${w.name}` : `جلسة ${w.name}`;
  return { day: `ورد ${P.dayName}`, title, shortTitle: `جلسة ${w.name}`, detail: `${PG(pw)}، نحو ${MN(mins(pw))}`, range: rangeText(P.portion), progressText, progress, nowFrac, next, complete: false, ...words };
}

// Notifications for the coming days, assuming the person follows the plan from now on.
export type Planned = { at: Date; title: string; body: string; id: string };
export function upcomingNotifications(st: State, now: Date, maxCount = 60): Planned[] {
  const s = st.settings; const out: Planned[] = [];
  const offset = (s.offset || 0) * 60000;
  for (let d = -1; d < 15 && out.length < maxCount; d++) {
    const date = addDays(now, d);
    const wd = date.getDay(); const key = dkey(date);
    const pages = dayPages(s, wd); if (!pages.length) continue;
    const ds = st.days[key] || { read: {}, done: {} };
    const wins = windowsFor(s, date);
    const left = sum(pages.filter((p) => !(ds.read || {})[p.id]));
    if (left <= 0) continue; // day already finished
    wins.forEach((w, idx) => {
      if (!w.time) return;
      const at = new Date(w.time.getTime() + offset);
      if (at <= now) return;
      if ((ds.done || {})[w.i]) return;
      // remaining windows from this one on share what is left (as of now)
      const futureWins = wins.filter((x, j) => j >= idx).length;
      const isLast = idx === wins.length - 1;
      let share = isLast ? left : left / futureWins;
      if (s.fajrHeavy && idx === 0 && left === sum(pages) && wins.length >= 4) share = sum(pages) * 0.4;
      const body = isLast ? `آخر جلسة اليوم · ${PG(Math.round(share))} · نحو ${MN(mins(share))}` : `${PG(Math.round(share))} · نحو ${MN(mins(share))}`;
      out.push({ at, id: `${key}-${w.i}`, title: `ورد ${DAYS[wd].name} · جلسة ${w.name}`, body });
    });
  }
  return out.sort((a, b) => +a.at - +b.at).slice(0, maxCount);
}

// Moments at which the widget content changes (prayer times, Fajr switch), for iOS timelines.
export function changePoints(st: State, now: Date, hours = 36): Date[] {
  const pts: Date[] = [];
  for (let d = -1; d <= 2; d++) {
    const t = times(st.settings, addDays(now, d));
    (['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const).forEach((k) => { const x = t[k]; if (x && x > now && +x - +now < hours * 3600000) pts.push(x); });
  }
  // and every quarter hour (the phrase changes every 15 minutes)
  const q = new Date(now); q.setSeconds(0, 0); q.setMinutes(Math.floor(q.getMinutes() / 15) * 15 + 15);
  for (let x = +q; x - +now < hours * 3600000; x += 15 * 60000) pts.push(new Date(x));
  return pts.sort((a, b) => +a - +b).filter((d, i, arr) => i === 0 || +d - +arr[i - 1] > 30000);
}
