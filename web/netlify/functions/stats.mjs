// Private statistics, for the owner only: opened with the secret key in STATS_KEY.
import { read, today } from '../shared/count.mjs';

const AD = '٠١٢٣٤٥٦٧٨٩'; const ar = (n) => String(n).replace(/[0-9]/g, (d) => AD[+d]);
const num = (n) => ar((n || 0).toLocaleString('en-US'));
export default async (req) => {
  const url = new URL(req.url);
  const key = url.searchParams.get('k') || '';
  const want = process.env.STATS_KEY || '';
  if (!want || key !== want) return new Response('Not found', { status: 404 });
  // the page is sent at once (dark, with a short «loading»), then asks for its numbers
  if (url.searchParams.get('part') !== 'body') return new Response(shell(key), { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
  const days = Array.from({ length: 14 }, (_, i) => new Date(Date.now() - i * 864e5).toISOString().slice(0, 10));
  const [all, ...per] = await Promise.all([read('total'), ...days.map((d) => read(`d/${d}`))]);
  const opens = (x) => (x.open_android || 0) + (x.open_iphone || 0) + (x.open_ios || 0) + (x.open_web || 0);
  const news = (x) => (x.new_android || 0) + (x.new_iphone || 0) + (x.new_ios || 0) + (x.new_web || 0);
  const t = per[0] || {};
  const rows = days.map((d, i) => { const x = per[i] || {}; if (!opens(x) && !x.dl) return ''; return `<div class="row"><div class="d">${ar(d.slice(8))}/${ar(d.slice(5, 7))}</div><div>${num(x.dl)} تحميل</div><div>${num(opens(x))} نشط</div><div>${num(news(x))} جديد</div></div>`; }).join('');
  const html = `<h1>إحصاءات أورادنا</h1><p class="sub">خاصة بك. أعداد فقط، دون أي بيانات عن الأشخاص.</p>
<div class="cards"><div class="c"><div class="n">${num(all.dl)}</div><div class="l">تحميل تطبيق أندرويد (الكل)</div></div>
<div class="c"><div class="n">${num(news(all))}</div><div class="l">أجهزة فتحت التطبيق أول مرة (الكل)</div></div>
<div class="c"><div class="n">${num(opens(t))}</div><div class="l">أجهزة فتحت التطبيق اليوم</div></div>
<div class="c"><div class="n">${num(t.dl)}</div><div class="l">تحميل اليوم</div></div></div>
<h2>من أي جهاز (الكل)</h2>
<div class="cards"><div class="c"><div class="n">${num(all.new_android)}</div><div class="l">تطبيق أندرويد</div></div>
<div class="c"><div class="n">${num(all.new_iphone)}</div><div class="l">آيفون (من الشاشة الرئيسية)</div></div>
<div class="c"><div class="n">${num(all.new_web)}</div><div class="l">المتصفح</div></div>
<div class="c"><div class="n">${num(all.new_ios)}</div><div class="l">تطبيق iOS (لاحقًا)</div></div></div>
<h2>آخر ١٤ يومًا</h2>${rows || '<p class="sub">لا شيء بعد.</p>'}
<p class="note">«نشط»: عدد الأجهزة التي فتحت التطبيق ذلك اليوم (يُحسب الجهاز مرة واحدة في اليوم). «جديد»: أول فتح على جهاز. التحميلات تشمل التحديثات. الأيام بتوقيت غرينتش، واليوم هو ${ar(today())}.</p>
`;
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
};

const CSS = `body{margin:0;background:#0C1733;color:#F3EAD7;font:16px/1.7 -apple-system,"Segoe UI",Tahoma,sans-serif}main{max-width:560px;margin:0 auto;padding:28px 18px 48px}h1{color:#E9C677;font-size:26px;margin:0 0 4px}.sub{color:rgba(243,234,215,.6);font-size:14px;margin:0 0 20px}
.cards{display:grid;grid-template-columns:1fr 1fr;gap:10px}.c{background:rgba(255,255,255,.05);border:1px solid rgba(226,188,106,.25);border-radius:16px;padding:14px}.n{font-size:28px;color:#E9C677;font-weight:700}.l{font-size:13px;color:rgba(243,234,215,.7)}
h2{font-size:17px;color:#E9C677;margin:26px 0 8px}.row{display:grid;grid-template-columns:60px 1fr 1fr 1fr;gap:6px;padding:9px 0;border-top:1px solid rgba(243,234,215,.1);font-size:14px}.d{color:rgba(243,234,215,.6)}.note{font-size:13px;color:rgba(243,234,215,.55);margin-top:22px}`;
function shell(key) {
  return `<!doctype html><html lang="ar" dir="rtl" style="background:#0C1733"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><meta name="theme-color" content="#0C1733"><title>إحصاءات أورادنا</title><style>${CSS}</style></head>
<body><main id="m"><h1>إحصاءات أورادنا</h1><p class="sub">جارٍ التحميل…</p></main>
<script>fetch(location.pathname + '?k=' + encodeURIComponent(${JSON.stringify(key)}) + '&part=body', { cache: 'no-store' }).then(function (r) { if (!r.ok) throw 0; return r.text(); })
.then(function (h) { document.getElementById('m').innerHTML = h; }).catch(function () { document.getElementById('m').innerHTML = '<h1>إحصاءات أورادنا</h1><p class="sub">تعذّر التحميل. أعد فتح الصفحة.</p>'; });</script></body></html>`;
}
export const config = { path: '/stats' };
