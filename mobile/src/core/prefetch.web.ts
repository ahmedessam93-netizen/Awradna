// Web: warm the browser (and the offline cache) with the pages of the sitting, so each
// "next" is instant.
const seen = new Set<string>();
function uriOf(source: any): string {
  if (!source) return '';
  if (typeof source === 'string') return source;
  if (source.uri) return source.uri;
  if (source.default) return uriOf(source.default);
  return '';
}
export function prefetchPages(sources: number[]) {
  sources.forEach((s) => {
    const u = uriOf(s);
    if (!u || seen.has(u)) return;
    seen.add(u);
    const img = new Image(); img.decoding = 'async'; img.src = u;
  });
}
