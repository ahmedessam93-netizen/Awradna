// Web: the page image is used as a mask over the ink colour, so it tints like the native app.
import React from 'react';

function uriOf(source: any): string {
  if (!source) return '';
  if (typeof source === 'string') return source;
  if (source.uri) return source.uri;
  if (source.default) return uriOf(source.default);
  return String(source);
}

export function PageImage({ source, tint, width, height }: { source: number; tint: string; width: number; height: number }) {
  const url = `url("${uriOf(source)}")`;
  return (
    <div role="img" style={{
      width, height, backgroundColor: tint,
      WebkitMaskImage: url, maskImage: url,
      WebkitMaskSize: 'contain', maskSize: 'contain',
      WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
      WebkitMaskPosition: 'center', maskPosition: 'center',
    } as React.CSSProperties} />
  );
}
