// Sends one test notification to the phone that asks for it (from Settings), to confirm it works.
import webpush from 'web-push';

const PUSH_HOSTS = [/\.googleapis\.com$/, /(^|\.)push\.apple\.com$/, /\.mozilla\.com$/, /\.notify\.windows\.com$/];

export default async (req) => {
  if (req.method !== 'POST') return new Response('POST only', { status: 405 });
  let b; try { b = await req.json(); } catch { return new Response('bad request', { status: 400 }); }
  const sub = b && b.sub; let host = '';
  try { host = new URL(sub.endpoint).hostname; } catch {}
  if (!sub || !sub.keys || !PUSH_HOSTS.some((r) => r.test(host))) return new Response('bad subscription', { status: 400 });
  webpush.setVapidDetails('https://awradna.netlify.app', process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
  try {
    await webpush.sendNotification(sub, JSON.stringify({ title: 'أورادنا', body: 'الإشعارات تعمل. ستصلك بعد كل صلاة إن شاء الله.', id: 'test' }), { TTL: 600 });
    return Response.json({ ok: true });
  } catch (e) { return Response.json({ ok: false, status: e && e.statusCode }, { status: 502 }); }
};
