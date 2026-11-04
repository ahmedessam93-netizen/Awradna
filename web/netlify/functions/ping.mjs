// Once a day, each phone says "opened today" (and "first time" once). Only these counts are kept:
// no identifier, no address, no location, nothing about the person.
import { bump } from '../shared/count.mjs';

const KINDS = new Set(['android', 'iphone', 'ios', 'web']);
export default async (req) => {
  if (req.method !== 'POST') return new Response('POST only', { status: 405 });
  let b = {};
  try { b = await req.json(); } catch {}
  const k = KINDS.has(b && b.k) ? b.k : 'web';
  const f = { [`open_${k}`]: 1 };
  if (b && b.first === true) f[`new_${k}`] = 1;
  try { await bump(f); } catch {}
  return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*' } });
};
