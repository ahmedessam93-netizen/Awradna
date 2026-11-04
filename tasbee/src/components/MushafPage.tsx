// One page of the Madinah mushaf, drawn line by line with the King Fahd Complex's page font, so
// it matches the printed page. Words outside the current sitting can be shown faint.
import React, { memo, useEffect, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { isBasmala, isTitle, PAGES, pos, Q } from '../quran';
import { family, loadPage, usePageFonts } from '../quran/fonts';
import { F } from '../theme';

export const BSML = 'QCF_BSML';
const UPM = 2500;
const ROW = 1.72;          // line spacing of the printed page, in font sizes
const FILL = 0.965;        // the words fill the line; the rest is spread between them

// the surah names in the title font (QCF_BSML): 1–35 from U+5D, 36–47 from U+A1, 48–56 from U+AE, 57–114 from U+B8
const surahGlyph = (s: number) => String.fromCharCode(s <= 35 ? 0x5d + s - 1 : s <= 47 ? 0xa1 + s - 36 : s <= 56 ? 0xae + s - 48 : 0xb8 + s - 57);
const FRAME = String.fromCharCode(0xf2);
const BASMALA = String.fromCharCode(0xf3);
const SURAH_WORD = String.fromCharCode(0x5c);

export type PageLayout = { fs: number; row: number; textW: number; padTop: number };
/** Font size and line spacing that fit a page in the given box (all pages share one size). */
export function layoutFor(width: number, height: number, zoom = 1): PageLayout {
  const lineW = 38914; // the usual full line, in font units (every page is within 1%)
  const fsW = (width * FILL * UPM) / lineW;
  const fsH = height / 15 / ROW;
  const fs = Math.max(10, Math.min(fsW, fsH) * zoom);
  const row = fs * ROW;
  const textW = (fs * lineW) / UPM / FILL;
  return { fs, row, textW, padTop: Math.max(0, (height - row * 15) / 2) };
}

type Props = {
  page: number; width: number; height: number; zoom?: number;
  ink: string; faint: string; frame: string;
  /** words before `from` or after `to` (positions, see quran/pos) are shown faint */
  from?: number; to?: number;
  onRetry?: () => void;
};

function MushafPageImpl({ page, width, height, zoom = 1, ink, faint, frame, from, to }: Props) {
  const [ready] = usePageFonts([page]);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true; setFailed(false);
    const t = setTimeout(() => { loadPage(page).then((ok) => { if (alive && !ok) setFailed(true); }); }, 0);
    return () => { alive = false; clearTimeout(t); };
  }, [page]);
  const L = layoutFor(width, height, zoom);
  const lines = PAGES[page - 1];
  const special = page <= 2;
  const fam = family(page);
  const inRange = (x: number) => (from == null || x >= from) && (to == null || x <= to);

  if (!ready) {
    return (
      <View style={{ width, height, alignItems: 'center', justifyContent: 'center', gap: 14 }}>
        {Array.from({ length: 15 }).map((_, i) => (
          <View key={i} style={{ width: L.textW * (i % 5 === 4 ? 0.7 : 1), height: Math.max(3, L.fs * 0.16), borderRadius: 3, backgroundColor: faint, opacity: failed ? 0.12 : 0.22 }} />
        ))}
        <View style={{ position: 'absolute', alignItems: 'center', paddingHorizontal: 30 }}>
          <Text style={{ fontFamily: F.uiMed, fontSize: 15, color: ink, textAlign: 'center' }}>
            {failed ? 'تحتاج هذه الصفحة إلى الإنترنت مرة واحدة' : 'جارٍ تجهيز الصفحة…'}
          </Text>
          {failed ? (
            <Pressable accessibilityRole="button" onPress={() => { setFailed(false); loadPage(page).then((ok) => setFailed(!ok)); }} style={{ marginTop: 10, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 14, borderWidth: 1, borderColor: frame }}>
              <Text style={{ fontFamily: F.uiBold, fontSize: 14, color: frame }}>إعادة المحاولة</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View style={{ width, height, alignItems: 'center', justifyContent: special ? 'center' : 'flex-start', paddingTop: special ? 0 : L.padTop }}
      accessible accessibilityLabel={`صفحة ${page}`}>
      {lines.map((line, li) => {
        if (isTitle(line)) {
          const s = line[1];
          // the frame is about 8 em wide and 1 em tall: as wide as the line, but never taller than it
          const fsF = Math.min(L.textW / 8, L.row * 0.96);
          const lit = inRange(pos(page, li, 0)) ? 1 : 0.28;
          return (
            <View key={li} style={{ width: L.textW, height: L.row, alignItems: 'center', justifyContent: 'center', opacity: lit }}>
              <Text allowFontScaling={false} style={{ fontFamily: BSML, fontSize: fsF, color: frame, includeFontPadding: false, position: 'absolute' }}>{FRAME}</Text>
              <Text allowFontScaling={false} style={{ fontFamily: BSML, fontSize: fsF * 0.62, color: ink, includeFontPadding: false, writingDirection: 'ltr' }}>{`\u2066${surahGlyph(s)} ${SURAH_WORD}\u2069`}</Text>
            </View>
          );
        }
        if (isBasmala(line)) {
          const lit = inRange(pos(page, li, 0)) ? 1 : 0.28;
          return (
            <View key={li} style={{ width: L.textW, height: L.row, alignItems: 'center', justifyContent: 'center', opacity: lit }}>
              <Text allowFontScaling={false} style={{ fontFamily: BSML, fontSize: (L.textW * 0.52) / 5.07, color: ink, includeFontPadding: false }}>{BASMALA}</Text>
            </View>
          );
        }
        const words = line as string[];
        // a few lines are wider than the usual line: draw them a little smaller so they fit
        const wide = Q.wide[`${page}:${li}`];
        const fsl = wide && wide * FILL > 0.985 ? (L.fs * 0.985) / (wide * FILL) : L.fs;
        return (
          <View key={li} style={{ width: L.textW, height: L.row, flexDirection: 'row', direction: 'rtl', alignItems: 'center', justifyContent: special ? 'center' : 'space-between', gap: special ? L.fs * 0.18 : 0 }}>
            {words.map((w, wi) => (
              <Text key={wi} allowFontScaling={false}
                style={{ fontFamily: fam, fontSize: fsl, color: inRange(pos(page, li, wi)) ? ink : faint, includeFontPadding: false, ...(Platform.OS === 'web' ? { whiteSpace: 'pre' as any } : null) }}>{w}</Text>
            ))}
          </View>
        );
      })}
    </View>
  );
}

export const MushafPage = memo(MushafPageImpl);
export const pageHeightFor = (L: PageLayout) => L.row * 15;
export const unitsPerEm = UPM;
export const meta = Q;
