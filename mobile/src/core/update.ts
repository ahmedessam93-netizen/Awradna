// For the Android version shared by download link (not the store): checks the Awradna site
// for a newer version and offers it. Store installs update through the store instead.
import * as Application from 'expo-application';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

export const SITE = 'https://awradna.netlify.app';
export const DIRECT = process.env.EXPO_PUBLIC_CHANNEL === 'direct';

export type Release = { versionCode: number; version: string; url: string; notes?: string };

export function useUpdate(): Release | null {
  const [rel, setRel] = useState<Release | null>(null);
  useEffect(() => {
    if (Platform.OS !== 'android' || !DIRECT) return;
    const mine = Number(Application.nativeBuildVersion || 0);
    fetch(`${SITE}/android/version.json`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: Release | null) => { if (j && Number(j.versionCode) > mine) setRel(j); })
      .catch(() => {});
  }, []);
  return rel;
}
