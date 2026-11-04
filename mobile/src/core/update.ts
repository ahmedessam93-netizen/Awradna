// For the Android version shared by download link (not the store): checks the Awradna site
// for a newer version and offers it. Store installs update through the store instead.
import * as Application from 'expo-application';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

export const SITE = 'https://awradna.netlify.app';
// netlify.app does not open in Egypt, so the download page and the version file also live on
// GitHub Pages, which does. Both are asked; whichever answers with the newer version wins.
export const ANDROID_PAGE = 'https://ahmedessam93-netizen.github.io/Awradna/';
const VERSION_FILES = [`${ANDROID_PAGE}version.json`, `${SITE}/android/version.json`];
export const DIRECT = process.env.EXPO_PUBLIC_CHANNEL === 'direct';

export type Release = { versionCode: number; version: string; url: string; notes?: string };

const getRelease = (url: string) =>
  fetch(url, { cache: 'no-store' }).then((r) => (r.ok ? (r.json() as Promise<Release>) : null)).catch(() => null);

export function useUpdate(): Release | null {
  const [rel, setRel] = useState<Release | null>(null);
  useEffect(() => {
    if (Platform.OS !== 'android' || !DIRECT) return;
    const mine = Number(Application.nativeBuildVersion || 0);
    Promise.all(VERSION_FILES.map(getRelease)).then((all) => {
      const best = all.reduce<Release | null>((a, j) => (j && Number(j.versionCode) > Number(a?.versionCode ?? 0) ? j : a), null);
      if (best && Number(best.versionCode) > mine) setRel(best);
    });
  }, []);
  return rel;
}
