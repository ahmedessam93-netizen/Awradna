// A run of book pages for the daily wird (الوظيفة الزرّوقية، حزب البحر).
// Reaching the last page marks the section read for this morning or evening.
import { useKeepAwake } from 'expo-keep-awake';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { Pager, PagerHandle } from '../components/Pager';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronIcon, CloseIcon } from '../components/icons';
import { Bar, IconButton, useTap } from '../components/ui';
import { ZoomPage } from '../components/ZoomPage';
import { Session } from '../core/daily';
import { PAGE_IMAGES, PAGE_SIZE } from '../core/pages';
import { ar } from '../core/plan';
import { usePlan, useStore } from '../core/store';
import { F, usePalette } from '../theme';

function KeepAwake() { useKeepAwake(); return null; }

export default function Book() {
  const p = usePalette(); const tap = useTap(); const insets = useSafeAreaInsets(); const { width, height } = useWindowDimensions();
  const q = useLocalSearchParams<{ from?: string; to?: string; title?: string; section?: string; session?: string }>();
  const from = Number(q.from || 11), to = Number(q.to || from);
  const ids = Array.from({ length: to - from + 1 }, (_, k) => String(from + k)).filter((id) => PAGE_IMAGES[id]);
  const { state, updateDaily } = useStore(); const P = usePlan();
  const session = (q.session === 'pm' ? 'pm' : 'am') as Session;
  const pager = useRef<PagerHandle>(null);
  const [idx, setIdx] = useState(0); const idxRef = useRef(0);
  const zoom = state.settings.pageZoom || 1;
  const [zoomed, setZoomed] = useState(zoom > 1);
  const last = idx === ids.length - 1;

  const finish = () => {
    tap('success');
    const sec = q.section || '';
    updateDaily(P.key, (d) => (sec === 'bahr' ? { ...d, bahr: 1 } : { ...d, [session]: { ...(d[session] || {}), [sec]: 1 } }));
    router.back();
  };
  const areaH = height - insets.top - insets.bottom;

  return (
    <View style={{ flex: 1, backgroundColor: p.pageBg }}>
      {state.settings.wake !== false && <KeepAwake />}
      <Pager ref={pager} style={{ flex: 1 }} scrollEnabled={!zoomed}
        onPageSelected={(i) => { setIdx(i); idxRef.current = i; setZoomed(zoom > 1); tap(); }}>
        {ids.map((id, i) => {
          const [pw, ph] = PAGE_SIZE[id] || [1110, 1768];
          return (
            <View key={id} style={{ flex: 1, paddingTop: insets.top + 74, paddingBottom: insets.bottom + 88 }}>
              {Math.abs(i - idx) <= 2 ? <ZoomPage source={PAGE_IMAGES[id]} tint={p.pageInk} aspect={pw / ph} width={width} height={areaH - 162} initialScale={zoom}
                onZoomChange={(z) => { if (i === idxRef.current) setZoomed(z); }} onTap={() => {}} label={`${q.title}، صفحة ${ar(id)}`} /> : null}
            </View>
          );
        })}
      </Pager>
      <View style={{ position: 'absolute', top: insets.top + 8, left: 16, right: 16 }}>
        <Bar radius={22}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8 }}>
            <IconButton label="إغلاق" onPress={() => router.back()}><CloseIcon size={20} color={p.ink} /></IconButton>
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} maxFontSizeMultiplier={1.2} style={{ fontFamily: F.display, fontSize: 17, lineHeight: 24, color: p.ink, textAlign: 'right' }}>{q.title}</Text>
              <Text numberOfLines={1} maxFontSizeMultiplier={1.2} style={{ fontFamily: F.ui, fontSize: 12.5, lineHeight: 18, color: p.muted, textAlign: 'right' }}>{`الورد اليومي، ص ${ar(ids[idx] || '')}`}</Text>
            </View>
          </View>
        </Bar>
      </View>
      <View style={{ position: 'absolute', bottom: insets.bottom + 14, left: 16, right: 16 }}>
        <Bar radius={24}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 }}>
            <View style={{ flex: 1, paddingStart: 6, gap: 4 }}>
              <View style={{ flexDirection: 'row', gap: 4 }}>
                {ids.map((id, k) => <Text key={id} allowFontScaling={false} style={{ fontFamily: F.serif, fontSize: k === idx ? 22 : 17, lineHeight: 24, color: k < idx ? p.gold : k === idx ? p.turq : p.faint }}>۞</Text>)}
              </View>
              <Text maxFontSizeMultiplier={1.2} style={{ fontFamily: F.ui, fontSize: 12.5, color: p.muted, textAlign: 'right' }}>{`صفحة ${ar(idx + 1)} من ${ar(ids.length)}`}</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel={last ? 'تمّ' : 'التالية'} onPress={() => { if (last) finish(); else { tap('medium'); pager.current?.setPage(idx + 1); } }}>
              <LinearGradient colors={p.primary} locations={[0, 0.48, 1]} style={{ height: 52, paddingHorizontal: 20, borderRadius: 17, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text maxFontSizeMultiplier={1.2} style={{ fontFamily: F.uiBold, fontSize: 16, color: p.onPrimary }}>{last ? 'تمّ' : 'التالية'}</Text>
                {!last ? <ChevronIcon size={18} color={p.onPrimary} strokeWidth={2.2} /> : null}
              </LinearGradient>
            </Pressable>
          </View>
        </Bar>
      </View>
    </View>
  );
}
