// Saves a phone's notification schedule. The phone computes when each sitting is due
// (prayer times + offset, for its own city) and sends only that list and its push address.
import { getStore } from '@netlify/blobs';
import crypto from 'node:crypto';

const PUSH_HOSTS = [/\.googleapis\.com$/, /(^|\.)push\.apple\.com$/, /\.mozilla\.com$/, /\.notify\.windows\.com$/];
const clip = (s, n) => String(s || '').slice(0, n);

export default async (req) => {
  if (req.method !== 'POST') return new Response('POST only', { status: 405 });
  let b;
  try { b = await req.json(); } catch { return new Response('bad request', { status: 400 }); }
  const sub = b && b.sub;
  let host = '';
  try { host = new URL(sub.endpoint).hostname; } catch {}
  if (!sub || !sub.keys || !sub.keys.p256dh || !sub.keys.auth || !String(sub.endpoint).startsWith('https://') || !PUSH_HOSTS.some((r) => r.test(host))) {
    return new Response('bad subscription', { status: 400 });
  }
  const now = Date.now();
  const items = (Array.isArray(b.items) ? b.items : [])
    .filter((i) => i && Number.isFinite(i.at) && i.at > now - 10 * 60000 && i.at < now + 21 * 864e5)
    .slice(0, 150)
    .map((i) => ({ at: Math.round(i.at), id: clip(i.id, 64), title: clip(i.title, 120), body: clip(i.body, 240) }))
    .sort((a, c) => a.at - c.at);
  const key = crypto.createHash('sha256').update(sub.endpoint).digest('hex');
  const store = getStore('push');
  if (!items.length) { await store.delete(key); return Response.json({ ok: true, count: 0 }); }
  await store.setJSON(key, { sub: { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } }, items, updated: now });
  return Response.json({ ok: true, count: items.length });
};
