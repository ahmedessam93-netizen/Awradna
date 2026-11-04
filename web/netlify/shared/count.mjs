// Anonymous counters in Netlify Blobs. Each day has one record, split over 8 shards so that many
// phones counting at the same moment don't overwrite each other (each write is conditional).
import { getStore } from '@netlify/blobs';

const SHARDS = 8;
// strong: read the latest value at once (needed for safe increments and an up-to-date page)
export const store = () => getStore({ name: 'stats', consistency: 'strong' });
export const today = () => new Date().toISOString().slice(0, 10); // UTC day

async function bumpKey(st, key, fields) {
  const k = `${key}/s${Math.floor(Math.random() * SHARDS)}`; // («#» can't be used in a key)
  for (let i = 0; i < 6; i++) {
    const cur = await st.getWithMetadata(k, { type: 'json' });
    const data = { ...(cur ? cur.data : {}) };
    for (const [f, n] of Object.entries(fields)) data[f] = (data[f] || 0) + n;
    const res = cur ? await st.setJSON(k, data, { onlyIfMatch: cur.etag }) : await st.setJSON(k, data, { onlyIfNew: true });
    if (res && res.modified) return;
  }
  throw new Error(`could not save ${k}`);
}
export async function bump(fields) {
  const st = store();
  await Promise.all([bumpKey(st, `d/${today()}`, fields), bumpKey(st, 'total', fields)]);
}
export async function read(key) {
  const st = store(); const out = {};
  const parts = await Promise.all(Array.from({ length: SHARDS }, (_, s) => st.get(`${key}/s${s}`, { type: 'json' })));
  for (const p of parts) if (p) for (const [f, n] of Object.entries(p)) out[f] = (out[f] || 0) + n;
  return out;
}
