// Android home-screen widgets, in the app's lapis night style.
//  small  (2×2): the misbaha ring + current sitting
//  medium (4×2): a short line from today's wird (changes every 15 min) + ring + sitting
//  large  (4×4): «مشكاة اللحظة» — any line from today's wird, in large Amiri, + sitting and next prayer
import React from 'react';
import { FlexWidget, SvgWidget, TextWidget } from 'react-native-android-widget';
import { beadsSvg } from '../core/beads';
import { Snapshot } from '../core/plan';

const F = { title: 'Amiri_700Bold', kufi: 'ReemKufi_600SemiBold', ui: 'IBMPlexSansArabic_500Medium', uiReg: 'IBMPlexSansArabic_400Regular' };
// lapis night, lamp gold, turquoise for "now" (same tokens as the app)
const C = {
  bgFrom: 'rgba(19, 35, 80, 0.97)' as const,
  bgTo: 'rgba(7, 12, 26, 0.97)' as const,
  rim: 'rgba(226, 188, 106, 0.32)' as const,
  line: 'rgba(226, 188, 106, 0.2)' as const,
  ivory: '#F3EAD7' as const,
  muted: 'rgba(243, 234, 215, 0.66)' as const,
  faint: 'rgba(243, 234, 215, 0.45)' as const,
  gold: '#E9C677' as const,
  turq: '#7FE3D7' as const,
};

const ring = (s: Snapshot, size: number) => beadsSvg(size, s.progress, s.complete ? 0 : s.nowFrac, { complete: s.complete });

export function WirdWidget({ s, size = 'medium' }: { s: Snapshot; size?: 'small' | 'medium' | 'large' }) {
  const shell = {
    height: 'match_parent' as const, width: 'match_parent' as const,
    backgroundGradient: { from: C.bgFrom, to: C.bgTo, orientation: 'TOP_BOTTOM' as const },
    borderRadius: 28, borderWidth: 1, borderColor: C.rim,
  };
  const sitting = s.complete ? 'تمّ ورد اليوم، تقبّل الله' : `${s.shortTitle}، ${s.detail}`;

  if (size === 'small') {
    return (
      <FlexWidget clickAction="OPEN_APP" style={{ ...shell, padding: 10, flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <SvgWidget svg={ring(s, 96)} style={{ width: 96, height: 96 }} />
        <TextWidget text={s.complete ? 'تمّ ورد اليوم' : s.shortTitle} style={{ fontFamily: F.kufi, fontSize: 15, color: s.complete ? C.gold : C.ivory, textAlign: 'center', marginTop: 4 }} />
        <TextWidget text={s.complete ? 'تقبّل الله' : s.detail} style={{ fontFamily: F.uiReg, fontSize: 11, color: C.muted, textAlign: 'center' }} />
      </FlexWidget>
    );
  }

  if (size === 'large') {
    return (
      <FlexWidget clickAction="OPEN_APP" style={{ ...shell, padding: 18, flexDirection: 'column' }}>
        <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', width: 'match_parent' }}>
          <FlexWidget style={{ flex: 1, flexDirection: 'column', alignItems: 'flex-end' }}>
            <TextWidget text={s.day} style={{ fontFamily: F.ui, fontSize: 12, color: C.gold, textAlign: 'right' }} />
            <TextWidget text="مشكاة اللحظة" style={{ fontFamily: F.kufi, fontSize: 18, color: C.ivory, textAlign: 'right' }} />
          </FlexWidget>
          <SvgWidget svg={ring(s, 58)} style={{ width: 58, height: 58 }} />
        </FlexWidget>
        <FlexWidget style={{ height: 1, width: 'match_parent', backgroundColor: C.line, marginTop: 10, marginBottom: 12 }} />
        <FlexWidget style={{ flex: 1, width: 'match_parent', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <TextWidget text={s.phrase} maxLines={10} style={{ fontFamily: F.title, fontSize: s.phrase.length > 220 ? 16 : s.phrase.length > 120 ? 18 : 22, color: C.ivory, textAlign: 'center', lineHeight: s.phrase.length > 220 ? 28 : 34 }} />
          <TextWidget text={s.phraseSrc} style={{ fontFamily: F.uiReg, fontSize: 11, color: C.gold, textAlign: 'center', marginTop: 8 }} />
        </FlexWidget>
        <FlexWidget style={{ height: 1, width: 'match_parent', backgroundColor: C.line, marginTop: 10, marginBottom: 10 }} />
        <FlexWidget style={{ flexDirection: 'row', width: 'match_parent', alignItems: 'center' }}>
          <TextWidget text={s.complete || !s.next ? '' : `التالية: ${s.next}`} style={{ fontFamily: F.uiReg, fontSize: 11, color: C.turq, textAlign: 'left' }} />
          <FlexWidget style={{ flex: 1 }} />
          <TextWidget text={sitting} style={{ fontFamily: F.ui, fontSize: 12, color: C.muted, textAlign: 'right' }} />
        </FlexWidget>
      </FlexWidget>
    );
  }

  // medium
  return (
    <FlexWidget clickAction="OPEN_APP" style={{ ...shell, paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' }}>
      <FlexWidget style={{ flex: 1, flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', paddingHorizontal: 6 }}>
        <TextWidget text={s.phraseShort} maxLines={3} truncate="END" style={{ fontFamily: F.title, fontSize: 15, color: C.ivory, textAlign: 'right', lineHeight: 25 }} />
        <TextWidget text={s.phraseShortSrc} style={{ fontFamily: F.uiReg, fontSize: 10, color: C.gold, textAlign: 'right', marginTop: 2 }} />
        <FlexWidget style={{ height: 1, width: 'match_parent', backgroundColor: C.line, marginTop: 8, marginBottom: 6 }} />
        <TextWidget text={sitting} style={{ fontFamily: F.ui, fontSize: 11.5, color: C.muted, textAlign: 'right' }} />
      </FlexWidget>
      <SvgWidget svg={ring(s, 96)} style={{ width: 96, height: 96 }} />
    </FlexWidget>
  );
}
