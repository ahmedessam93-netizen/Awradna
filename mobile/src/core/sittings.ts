// Each day's wird is divided once into fixed sittings (one per prayer). The division never moves:
// tapping الظهر always opens the same pages. A sitting may only end where a salawat or prayer ends
// (a ۞ rosette or the end of a paragraph, see cuts.ts), so a page can be split between two sittings:
// it then appears twice, first shown up to the cut ('until'), then from the cut on ('from').
import { CUTS } from './cuts';
import type { Page } from './plan';

export type RItem = { key: string; page: Page; half?: 'until' | 'from'; cut?: { top: number; bottom: number; x: number }; w: number; k: number };
export type Segments = RItem[][];

// Where on a page a cut falls, as a share of the page's text (the text spans ~6%–88% of the image).
const frac = (bottom: number) => Math.max(0.05, Math.min(0.95, (bottom - 0.06) / 0.82));

type Cand = { i: number; mode: 'end' | 'cut'; pos: number };

function candidates(pages: Page[]): Cand[] {
  const out: Cand[] = []; let acc = 0;
  pages.forEach((pg, i) => {
    const c = CUTS[pg.id]; const next = pages[i + 1];
    if (c && c.top != null && !c.clean && !c.none) out.push({ i, mode: 'cut', pos: acc + pg.w * frac(c.bottom as number) });
    acc += pg.w;
    if (!next) return;
    const itemEnd = next.item !== pg.item;
    const nc = CUTS[next.id];
    if (itemEnd || (c && c.clean) || (nc && nc.startsSep)) out.push({ i, mode: 'end', pos: acc });
  });
  return out;
}

const cache = new Map<string, Segments>();

/** The day's pages split into `n` fixed sittings. */
export function segmentsFor(pages: Page[], n: number, fajrHeavy: boolean): Segments {
  const ck = `${n}|${fajrHeavy ? 1 : 0}|${pages.map((p) => p.id).join(',')}`;
  const hit = cache.get(ck); if (hit) return hit;
  const total = pages.reduce((a, p) => a + p.w, 0);
  const targets: number[] = [];
  for (let k = 1; k < n; k++) targets.push(fajrHeavy && n >= 4 ? total * (0.4 + (0.6 * (k - 1)) / (n - 1)) : (total * k) / n);
  const cands = candidates(pages);
  const chosen: Cand[] = []; let last = 0;
  targets.forEach((t, j) => {
    // keep at least a few candidates for the sittings still to place
    const left = targets.length - j - 1;
    const pool = cands.filter((c) => c.pos > last + 0.3);
    const usable = left > 0 ? pool.slice(0, Math.max(1, pool.length - left)) : pool;
    if (!usable.length) return;
    const best = usable.reduce((a, b) => (Math.abs(b.pos - t) < Math.abs(a.pos - t) ? b : a));
    chosen.push(best); last = best.pos;
  });
  const segs: Segments = Array.from({ length: n }, () => []);
  let k = 0;
  pages.forEach((pg, i) => {
    const b = chosen[k];
    if (b && b.i === i && b.mode === 'cut') {
      const c = CUTS[pg.id] as { top: number; bottom: number; x: number };
      const f = frac(c.bottom);
      segs[k].push({ key: `${pg.id}~u`, page: pg, half: 'until', cut: { top: c.top, bottom: c.bottom, x: c.x }, w: pg.w * f, k });
      k++;
      segs[k].push({ key: `${pg.id}~f`, page: pg, half: 'from', cut: { top: c.top, bottom: c.bottom, x: c.x }, w: pg.w * (1 - f), k });
      return;
    }
    segs[k].push({ key: pg.id, page: pg, w: pg.w, k });
    if (b && b.i === i && b.mode === 'end') k++;
  });
  if (cache.size > 40) cache.clear();
  cache.set(ck, segs);
  return segs;
}

/** How much of a page has been read: 1, or ½ for each half read on its own. */
export function readFrac(read: Record<string, number> | undefined, id: string) {
  if (!read) return 0;
  if (read[id]) return 1;
  return (read[`${id}~u`] ? 0.5 : 0) + (read[`${id}~f`] ? 0.5 : 0);
}
export const itemRead = (read: Record<string, number> | undefined, it: RItem) => !!read && (!!read[it.key] || !!read[it.page.id]);
