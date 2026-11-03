// The misbaha: 33 beads on a circle, with the head bead (imam) and tassel at the bottom.
// Each bead stands for 1/33 of today's wird. Read beads are gold, the current sitting's
// beads glow emerald, the rest are clear glass. Used by the app (react-native-svg)
// and by the Android widget (as an SVG string), so both always look the same.
export const BEAD_COUNT = 33;

export type BeadState = 'read' | 'now' | 'rest';
export type Bead = { x: number; y: number; r: number; state: BeadState };

export function beadLayout(size: number, readFrac: number, nowFrac: number): { beads: Bead[]; head: { x: number; y: number }; R: number; cx: number; cy: number } {
  const cx = size / 2, cy = size * 0.47;
  const R = size * 0.38;
  const r = size * 0.032;
  const beads: Bead[] = [];
  // gap at the bottom for the head bead: spread 33 beads over the remaining arc
  const gap = 0.28; // radians each side of the bottom
  const start = Math.PI / 2 - gap; // just right of the bottom (screen coords, y down); then up the right side
  const span = Math.PI * 2 - gap * 2;
  for (let k = 0; k < BEAD_COUNT; k++) {
    // RTL: start at bottom-right and climb up the right side, like reading right to left
    const t = start - (span * k) / (BEAD_COUNT - 1);
    const frac = (k + 0.5) / BEAD_COUNT;
    const state: BeadState = frac <= readFrac + 1e-9 ? 'read' : frac <= readFrac + nowFrac + 1e-9 ? 'now' : 'rest';
    beads.push({ x: cx + R * Math.cos(t), y: cy + R * Math.sin(t), r, state });
  }
  return { beads, head: { x: cx, y: cy + R }, R, cx, cy };
}

const GOLD = ['#FFF4CF', '#E8C77C', '#A9792A'];
const EMERALD = ['#E6FFF2', '#5FD39A', '#1D7A52'];

export function beadsSvg(size: number, readFrac: number, nowFrac: number, opts: { complete?: boolean } = {}): string {
  const { beads, head, R, cx, cy } = beadLayout(size, opts.complete ? 1 : readFrac, opts.complete ? 0 : nowFrac);
  const r0 = beads[0].r;
  const defs = `<defs>
<radialGradient id="g" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="${GOLD[0]}"/><stop offset=".45" stop-color="${GOLD[1]}"/><stop offset="1" stop-color="${GOLD[2]}"/></radialGradient>
<radialGradient id="e" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="${EMERALD[0]}"/><stop offset=".45" stop-color="${EMERALD[1]}"/><stop offset="1" stop-color="${EMERALD[2]}"/></radialGradient>
<radialGradient id="q" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".55"/><stop offset="1" stop-color="#FFFFFF" stop-opacity=".08"/></radialGradient>
</defs>`;
  const cord = `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#E3C47A" stroke-opacity=".22" stroke-width="${size * 0.006}"/>`;
  const b = beads.map((p) => {
    const fill = p.state === 'read' ? 'url(#g)' : p.state === 'now' ? 'url(#e)' : 'url(#q)';
    const stroke = p.state === 'rest' ? `stroke="#E3C47A" stroke-opacity=".35" stroke-width="${size * 0.004}"` : '';
    return `<circle cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="${p.r.toFixed(2)}" fill="${fill}" ${stroke}/>`;
  }).join('');
  const hx = head.x, hy = head.y;
  const headBead = `<ellipse cx="${hx}" cy="${hy}" rx="${(r0 * 1.15).toFixed(2)}" ry="${(r0 * 1.9).toFixed(2)}" fill="url(#g)"/>`
    + `<path d="M${hx} ${hy + r0 * 1.9} L${hx} ${hy + r0 * 3.4}" stroke="#E3C47A" stroke-width="${size * 0.008}" stroke-linecap="round"/>`
    + `<path d="M${hx - r0 * 0.9} ${hy + r0 * 4.6} L${hx} ${hy + r0 * 3.2} L${hx + r0 * 0.9} ${hy + r0 * 4.6} Z" fill="#E3C47A" fill-opacity=".85"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${defs}${cord}${b}${headBead}</svg>`;
}
