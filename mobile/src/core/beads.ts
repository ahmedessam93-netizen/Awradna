// The misbaha: 33 beads on a cord, the head bead (imam) and tassel at the bottom.
// Same geometry as the approved canvas (342 box: cx 171, cy 160, R 130, r 10.6, gap 0.27).
// Read beads are amber, the current sitting's beads turquoise, the rest clear glass.
// Used by the app (react-native-svg) and the Android widget (as an SVG string).
export const BEAD_COUNT = 33;

export type BeadState = 'read' | 'now' | 'rest';
export type Bead = { x: number; y: number; r: number; state: BeadState };

export function beadGeometry(size: number) {
  return { cx: size / 2, cy: size * (160 / 342), R: size * (130 / 342), r: size * (10.6 / 342), gap: 0.27 };
}

export function beadLayout(size: number, readFrac: number, nowFrac: number, states?: BeadState[]) {
  const { cx, cy, R, r, gap } = beadGeometry(size);
  const start = Math.PI / 2 - gap; // just right of the bottom; then up the right side (reading right to left)
  const span = Math.PI * 2 - gap * 2;
  const beads: Bead[] = [];
  for (let k = 0; k < BEAD_COUNT; k++) {
    const t = start - (span * k) / (BEAD_COUNT - 1);
    const frac = (k + 0.5) / BEAD_COUNT;
    const state: BeadState = states ? states[k] : frac <= readFrac + 1e-9 ? 'read' : frac <= readFrac + nowFrac + 1e-9 ? 'now' : 'rest';
    beads.push({ x: cx + R * Math.cos(t), y: cy + R * Math.sin(t), r, state });
  }
  return { beads, head: { x: cx, y: cy + R }, R, cx, cy, r };
}

export const AMBER = ['#FFF1C4', '#F0B451', '#B8661C', '#7A3F0E'];
export const TURQ = ['#E4FFFA', '#53CDBF', '#16736A', '#0D4A44'];

export function beadsSvg(size: number, readFrac: number, nowFrac: number, opts: { complete?: boolean } = {}): string {
  const { beads, head, R, cx, cy, r } = beadLayout(size, opts.complete ? 1 : readFrac, opts.complete ? 0 : nowFrac);
  const k = size / 342;
  const defs = `<defs>
<radialGradient id="a" cx="34%" cy="28%" r="78%"><stop offset="0" stop-color="${AMBER[0]}"/><stop offset=".38" stop-color="${AMBER[1]}"/><stop offset=".8" stop-color="${AMBER[2]}"/><stop offset="1" stop-color="${AMBER[3]}"/></radialGradient>
<radialGradient id="t" cx="34%" cy="28%" r="78%"><stop offset="0" stop-color="${TURQ[0]}"/><stop offset=".42" stop-color="${TURQ[1]}"/><stop offset=".85" stop-color="${TURQ[2]}"/><stop offset="1" stop-color="${TURQ[3]}"/></radialGradient>
<radialGradient id="c" cx="34%" cy="28%" r="80%"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".42"/><stop offset=".6" stop-color="#9FB3E0" stop-opacity=".1"/><stop offset="1" stop-color="#FFFFFF" stop-opacity=".05"/></radialGradient>
<radialGradient id="ga"><stop offset="0" stop-color="#F2B24E" stop-opacity=".5"/><stop offset="1" stop-color="#F2B24E" stop-opacity="0"/></radialGradient>
<radialGradient id="gt"><stop offset="0" stop-color="#53CDBF" stop-opacity=".6"/><stop offset="1" stop-color="#53CDBF" stop-opacity="0"/></radialGradient>
<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F7E2A6"/><stop offset=".5" stop-color="#E2BC6A"/><stop offset="1" stop-color="#9C7428"/></linearGradient>
</defs>`;
  const cord = `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#E2BC6A" stroke-opacity=".32" stroke-width="${1.2 * k}"/>`;
  const b = beads.map((p) => {
    const fill = p.state === 'read' ? 'url(#a)' : p.state === 'now' ? 'url(#t)' : 'url(#c)';
    const glow = p.state === 'rest' ? '' : `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${(r * 2.1).toFixed(1)}" fill="url(#${p.state === 'read' ? 'ga' : 'gt'})"/>`;
    const stroke = p.state === 'rest' ? `stroke="#E2BC6A" stroke-opacity=".35" stroke-width="${0.8 * k}"` : '';
    const hl = `<ellipse cx="${(p.x - r * 0.32).toFixed(1)}" cy="${(p.y - r * 0.42).toFixed(1)}" rx="${(r * 0.36).toFixed(1)}" ry="${(r * 0.22).toFixed(1)}" fill="#fff" fill-opacity="${p.state === 'rest' ? 0.35 : 0.75}"/>`;
    return `${glow}<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${r.toFixed(1)}" fill="${fill}" ${stroke}/>${hl}`;
  }).join('');
  const hx = head.x, hy = head.y;
  let tassel = `<ellipse cx="${hx}" cy="${hy}" rx="${12 * k}" ry="${19 * k}" fill="url(#a)"/><rect x="${hx - 6 * k}" y="${hy + 19 * k}" width="${12 * k}" height="${7 * k}" rx="${2 * k}" fill="url(#g)"/>`;
  for (let i = 0; i < 11; i++) { const d = (i - 5) / 5; tassel += `<line x1="${hx + d * 5 * k}" y1="${hy + 26 * k}" x2="${hx + d * 11 * k}" y2="${hy + (48 - Math.abs(d) * 4) * k}" stroke="url(#g)" stroke-width="${1.3 * k}" stroke-linecap="round"/>`; }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${defs}${cord}${b}${tassel}</svg>`;
}
