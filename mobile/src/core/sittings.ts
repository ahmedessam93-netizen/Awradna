// Each day's wird is divided once into fixed sittings (one per prayer). The division never moves:
// tapping الظهر always opens the same pages. A sitting may only end where a salawat or prayer ends
// (a ۞ rosette inside a Dalail hizb, see cuts.ts), so a page can be split between two sittings:
// it then appears twice, first shown up to the cut ('until'), then from the cut on ('from').
// Where a prayer may end was checked against the book page by page.
import { CUTS } from './cuts';
import type { Page } from './plan';

export type RItem = { key: string; page: Page; half?: 'until' | 'from'; cut?: { top: number; bottom: number; x: number }; w: number; k: number };
export type Segments = RItem[][];

// Where on a page a cut falls, as a share of the page's text (the text spans ~6%–88% of the image).
const frac = (bottom: number) => Math.max(0.05, Math.min(0.95, (bottom - 0.06) / 0.82));

type Cand = { i: number; mode: 'end' | 'cut'; pos: number };

// Only the hizbs of دلائل الخيرات may be divided: there ۞ ends each salat. Every other prayer
// (a hizb, a dua, كنوز الأسرار, a chosen salat, a surah) is read whole within one sitting.
const divisible = (pg: Page) => pg.part === 'dalail' && pg.title.startsWith('ورد دلائل');
// Pages whose last ۞ does NOT end a prayer, found by reading every candidate page in the book:
// 114 (the same salat continues: «…وأعظم صلوات الله ۞ على أفضل خلق الله»), 177 («اللهم آمين»
// seals the dua before it), 209 (one dua written three times), 210–216 (the closing dua of the
// sixth hizb continues: «فأسألك…»، «وأسألك…»، «وأن تصلي…»), 247 («وصلى الله على سيدنا محمد…» seals the dua).
// All other candidate pages (40–45, 70–76, 108–112, 136–143, 173–181, 205–208, 239–246) were checked:
// the text after the ۞ starts a new salat or dua.
const NOT_AN_END = new Set(['114', '177', '209', '210', '211', '212', '213', '214', '215', '216', '247']);
// Page 46 opens with the end of the first hizb's last salat («كفضلك على جميع خلقك») and only then
// does «دعاء مرجو الإجابة» begin, under its heading. So the end of page 45 is not an end, and page 46
// may be divided just before that heading (its cut, checked in the book).
const NO_END_AFTER = new Set(['45']);
const CUT_ALLOWED = new Set(['46']);

function candidates(pages: Page[]): Cand[] {
  const out: Cand[] = []; let acc = 0;
  pages.forEach((pg, i) => {
    const c = (divisible(pg) || CUT_ALLOWED.has(pg.id)) && !NOT_AN_END.has(pg.id) ? CUTS[pg.id] : null; const next = pages[i + 1];
    if (c && c.top != null && !c.clean && !c.none) out.push({ i, mode: 'cut', pos: acc + pg.w * frac(c.bottom as number) });
    acc += pg.w;
    if (!next || NO_END_AFTER.has(pg.id)) return;
    const itemEnd = next.item !== pg.item;
    const nc = next.item === pg.item && divisible(next) ? CUTS[next.id] : null;
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
