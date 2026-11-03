// App icon set from the approved canvas: an amber misbaha with a lit Mamluk lamp at its heart.
import { createRequire } from 'module'; const require = createRequire(import.meta.url); const { chromium } = require('playwright');
const out = process.argv[2];
const defs = `<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#22408C"/><stop offset=".55" stop-color="#132656"/><stop offset="1" stop-color="#0A1330"/></linearGradient>
<radialGradient id="ll" cx="50%" cy="20%" r="70%"><stop offset="0" stop-color="#F7C566" stop-opacity=".45"/><stop offset="1" stop-color="#F7C566" stop-opacity="0"/></radialGradient>
<radialGradient id="ll2" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#F7C566" stop-opacity=".45"/><stop offset="1" stop-color="#F7C566" stop-opacity="0"/></radialGradient>
<linearGradient id="gd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FBE9B4"/><stop offset=".5" stop-color="#E2BC6A"/><stop offset="1" stop-color="#A8802F"/></linearGradient>
<radialGradient id="am" cx="34%" cy="28%" r="78%"><stop offset="0" stop-color="#FFF1C4"/><stop offset=".4" stop-color="#F0B451"/><stop offset="1" stop-color="#8A4A12"/></radialGradient>
<radialGradient id="tq" cx="34%" cy="28%" r="78%"><stop offset="0" stop-color="#E4FFFA"/><stop offset=".45" stop-color="#53CDBF"/><stop offset="1" stop-color="#0D4A44"/></radialGradient>
<radialGradient id="fl" cx="50%" cy="60%" r="55%"><stop offset="0" stop-color="#FFF4CF"/><stop offset=".4" stop-color="#F7C566" stop-opacity=".9"/><stop offset="1" stop-color="#C47A22" stop-opacity=".2"/></radialGradient>
</defs>`;
const beads = (mono) => { let s = ''; const cx = 90, cy = 84, R = 62, gap = .3, st = Math.PI / 2 - gap, sp = Math.PI * 2 - gap * 2;
  for (let k = 0; k < 33; k++) { const t = st - sp * k / 32, f = (k + .5) / 33;
    const fill = mono ? '#fff' : f <= .62 ? 'url(#am)' : f <= .8 ? 'url(#tq)' : 'rgba(255,255,255,0.22)';
    s += `<circle cx="${(cx + R * Math.cos(t)).toFixed(2)}" cy="${(cy + R * Math.sin(t)).toFixed(2)}" r="6.4" fill="${fill}"/>`; }
  return s + `<ellipse cx="90" cy="150" rx="7" ry="11" fill="${mono ? '#fff' : 'url(#am)'}"/>`; };
const lamp = (mono) => mono
  ? `<path d="M90 44 V58" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/><path d="M73 60 L107 60 L100 76 L80 76 Z" fill="#fff"/><path d="M80 76 C63 79 62 104 76 110 L104 110 C118 104 117 79 100 76 Z" fill="#fff"/><path d="M84 110 L96 110 L94 117 L86 117 Z" fill="#fff"/>`
  : `<circle cx="90" cy="88" r="34" fill="url(#ll2)"/><path d="M90 44 V58" stroke="url(#gd)" stroke-width="2.4" stroke-linecap="round"/>
<path d="M73 60 L107 60 L100 76 L80 76 Z" fill="url(#fl)" stroke="url(#gd)" stroke-width="2.6" stroke-linejoin="round"/>
<path d="M80 76 C63 79 62 104 76 110 L104 110 C118 104 117 79 100 76 Z" fill="url(#fl)" stroke="url(#gd)" stroke-width="2.6" stroke-linejoin="round"/>
<path d="M68 91 C82 96 98 96 112 91" stroke="#2F6FD0" stroke-width="4.5" fill="none" stroke-opacity=".9"/>
<path d="M84 110 L96 110 L94 117 L86 117 Z" fill="url(#gd)"/>`;
const svg = (w, inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${w}" viewBox="0 0 180 180">${defs}${inner}</svg>`;
const mark = (mono, scale = 1) => `<g transform="translate(90 90) scale(${scale}) translate(-90 -92)">${beads(mono)}${lamp(mono)}</g>`;
const files = {
  'icon.png': [1024, svg(1024, `<rect width="180" height="180" fill="url(#bg)"/><rect width="180" height="180" fill="url(#ll)"/>${mark(false)}`), false],
  'adaptive-foreground.png': [1024, svg(1024, mark(false, 0.62)), true],
  'adaptive-monochrome.png': [1024, svg(1024, mark(true, 0.62)), true],
  'splash-mark.png': [600, svg(600, mark(false, 0.95)), true],
  'notification-icon.png': [96, svg(96, `<g transform="translate(90 92) scale(1.6) translate(-90 -82)">${lamp(true)}</g>`), true],
};
const b = await chromium.launch(); const p = await b.newPage({ deviceScaleFactor: 1 });
for (const [f, [w, s, tr]] of Object.entries(files)) {
  await p.setViewportSize({ width: w, height: w });
  await p.setContent(`<html><body style="margin:0;background:transparent">${s}</body></html>`);
  await p.screenshot({ path: `${out}/${f}`, omitBackground: tr, clip: { x: 0, y: 0, width: w, height: w } });
}
await b.close(); console.log('ok');
