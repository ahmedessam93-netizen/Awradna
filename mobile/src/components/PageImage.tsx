// A book page: ink-only image tinted for day or night.
import { Image } from 'expo-image';
import React from 'react';

export function PageImage({ source, tint, width, height }: { source: number; tint: string; width: number; height: number }) {
  return <Image source={source} style={{ width, height }} contentFit="contain" tintColor={tint} transition={120} cachePolicy="memory-disk" />;
}
