// Every minute: sends each phone the notifications that are now due.
import { getStore } from '@netlify/blobs';
import webpush from 'web-push';

export default async () => {
  webpush.setVapidDetails('https://awradna.netlify.app', process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
  const store = getStore('push');
  const now = Date.now();
  let sent = 0, dropped = 0;
  const { blobs } = await store.list();
  await Promise.all(blobs.map(async ({ key }) => {
    const rec = await store.get(key, { type: 'json' });
    if (!rec || !Array.isArray(rec.items)) return;
    const due = rec.items.filter((i) => i.at <= now);
    if (!due.length) return;
    const rest = rec.items.filter((i) => i.at > now);
    // only the latest due one, and only if it is fresh (a phone that was offline gets no backlog)
    const n = due[due.length - 1];
    if (now - n.at < 15 * 60000) {
      try {
        await webpush.sendNotification(rec.sub, JSON.stringify({ title: n.title, body: n.body, id: n.id, url: '/' }), { TTL: 3600, urgency: 'high' });
        sent++;
      } catch (e) {
        if (e && (e.statusCode === 404 || e.statusCode === 410)) { await store.delete(key); dropped++; return; }
      }
    }
    if (rest.length) await store.setJSON(key, { ...rec, items: rest });
    else await store.delete(key);
  }));
  console.log(`push-send: ${blobs.length} phones, ${sent} sent, ${dropped} gone`);
};

export const config = { schedule: '* * * * *' };
