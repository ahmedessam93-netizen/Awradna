// The Android download link. Counts the download (a number only), then hands over the file.
import { bump } from '../shared/count.mjs';

export default async () => {
  let err = '';
  try { await bump({ dl: 1 }); } catch (e) { err = String(e && e.message || e).slice(0, 200); console.log('count failed', err); }
  return new Response(null, { status: 302, headers: { Location: '/android/files/awradna.apk', 'Cache-Control': 'no-store' } });
};
export const config = { path: '/android/awradna.apk', preferStatic: false };
