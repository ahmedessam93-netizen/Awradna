// Small facts about the reader's days: was a day's wird finished, and how many days in a row.
import { addDays, atMidnight, dayPages, dkey, State, sum } from './plan';
import { readFrac } from './sittings';

export function dayStat(st: State, d: Date) {
  const pages = dayPages(st.settings, d.getDay());
  const ds = st.days[dkey(d)];
  const read = ds ? pages.reduce((a, x) => a + x.w * readFrac(ds.read, x.id), 0) : 0;
  return { total: sum(pages), read, full: pages.length > 0 && read >= sum(pages) - 1e-9 };
}

/** Days in a row with a finished wird, ending today (or yesterday while today is still open). */
export function streak(st: State, today: Date): number {
  let n = 0; let d = dayStat(st, today).full ? atMidnight(today) : addDays(today, -1);
  while (n < 400 && dayStat(st, d).full) { n++; d = addDays(d, -1); }
  return n;
}

/** Finished days in the week of `today`, Monday to Sunday as in the book. */
export function weekFull(st: State, today: Date): number {
  const mon = addDays(today, -((today.getDay() + 6) % 7));
  let n = 0; for (let i = 0; i < 7; i++) if (dayStat(st, addDays(mon, i)).full) n++;
  return n;
}
