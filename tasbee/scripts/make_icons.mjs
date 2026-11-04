// App icon set: an open mushaf inside the eight-pointed star (۞) of the quarter-hizb, in lamp gold
// on the lapis night sky shared with أورادنا.
//   node scripts/make_icons.mjs <assets dir> <public/icons dir>
import { createRequire } from 'module'; const require = createRequire(import.meta.url); const { chromium } = require('playwright');
const [out, web] = process.argv.slice(2);
const defs = `<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#22408C"/><stop offset=".55" stop-color="#132656"/><stop offset="1" stop-color="#0A1330"/></linearGradient>
<radialGradient id="ll" cx="50%" cy="30%" r="70%"><stop offset="0" stop-color="#F7C566" stop-opacity=".38"/><stop offset="1" stop-color="#F7C566" stop-opacity="0"/></radialGradient>
<linearGradient id="gd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FBE9B4"/><stop offset=".5" stop-color="#E2BC6A"/><stop offset="1" stop-color="#A8802F"/></linearGradient>
<linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF8E6"/><stop offset="1" stop-color="#EAD9B0"/></linearGradient>
<radialGradient id="tq" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#E4FFFA"/><stop offset=".5" stop-color="#53CDBF"/><stop offset="1" stop-color="#0D4A44"/></radialGradient>
</defs>`;
// the eight-pointed star: two squares, one turned 45°
const sq = (r, rot, attrs) => { const pts = [0, 1, 2, 3].map((k) => { const a = (Math.PI / 2) * k + rot; return `${(90 + r * Math.cos(a)).toFixed(2)},${(90 + r * Math.sin(a)).toFixed(2)}`; }).join(' '); return `<polygon points="${pts}" ${attrs}/>`; };
const star = (mono) => {
  const st = mono ? 'fill="none" stroke="#fff" stroke-width="5"' : 'fill="rgba(226,188,106,0.10)" stroke="url(#gd)" stroke-width="4" stroke-linejoin="round"';
  return sq(64, Math.PI / 4, st) + sq(64, 0, st) + (mono ? '' : `<circle cx="90" cy="90" r="44" fill="#0E1C44" stroke="url(#gd)" stroke-width="2"/>`);
};
// an open mushaf on its stand
const book = (mono) => {
  const page = mono ? 'fill="#fff"' : 'fill="url(#pg)" stroke="url(#gd)" stroke-width="2.2" stroke-linejoin="round"';
  const lines = mono ? '' : [0, 1, 2, 3].map((i) => `<path d="M${66 + i * 0.6} ${80 + i * 7} q11 -3 20 0" stroke="#B48A36" stroke-width="1.6" fill="none" opacity=".75"/><path d="M${94} ${80 + i * 7} q9 -3 ${20 - i * 0.6} 0" stroke="#B48A36" stroke-width="1.6" fill="none" opacity=".75"/>`).join('');
  return `<path d="M90 76 C80 68 68 67 58 70 L58 108 C68 105 80 106 90 114 Z" ${page}/>
<path d="M90 76 C100 68 112 67 122 70 L122 108 C112 105 100 106 90 114 Z" ${page}/>${lines}
<path d="M64 118 L116 118 M70 112 L90 124 L110 112" stroke="${mono ? '#fff' : 'url(#gd)'}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
${mono ? '' : '<circle cx="90" cy="60" r="4.2" fill="url(#tq)"/>'}`;
};
const svg = (w, inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${w}" viewBox="0 0 180 180">${defs}${inner}</svg>`;
const mark = (mono, scale = 1) => `<g transform="translate(90 90) scale(${scale}) translate(-90 -90)">${star(mono)}${book(mono)}</g>`;
const full = (scale = 1) => `<rect width="180" height="180" fill="url(#bg)"/><rect width="180" height="180" fill="url(#ll)"/>${mark(false, scale)}`;
const files = {
  [`${out}/icon.png`]: [1024, svg(1024, full()), false],
  [`${out}/adaptive-foreground.png`]: [1024, svg(1024, mark(false, 0.6)), true],
  [`${out}/adaptive-monochrome.png`]: [1024, svg(1024, mark(true, 0.6)), true],
  [`${out}/splash-mark.png`]: [600, svg(600, mark(false, 0.95)), true],
  [`${out}/notification-icon.png`]: [96, svg(96, mark(true, 1.15)), true],
  [`${web}/icon-180.png`]: [180, svg(180, full()), false],
  [`${web}/icon-192.png`]: [192, svg(192, full()), false],
  [`${web}/icon-512.png`]: [512, svg(512, full()), false],
  [`${web}/icon-512-maskable.png`]: [512, svg(512, full(0.78)), false],
  [`${web}/badge-96.png`]: [96, svg(96, mark(true, 1.15)), true],
};
const b = await chromium.launch(); const p = await b.newPage({ deviceScaleFactor: 1 });
for (const [f, [w, s, tr]] of Object.entries(files)) {
  await p.setViewportSize({ width: w, height: w });
  await p.setContent(`<html><body style="margin:0;background:transparent">${s}</body></html>`);
  await p.screenshot({ path: f, omitBackground: tr, clip: { x: 0, y: 0, width: w, height: w } });
}
await b.close(); console.log('ok');
