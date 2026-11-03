// Runs in the background when Android asks a widget to draw (added, resized, periodic update, tap).
import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { snapshot } from '../core/plan';
import { loadState } from '../core/store';
import { WirdWidget } from './WirdWidget';

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  if (props.widgetAction === 'WIDGET_DELETED') return;
  const s = await loadState();
  const snap = s.settings.onboarded
    ? snapshot(s, new Date())
    : { day: 'أورادنا', title: 'افتح التطبيق', shortTitle: 'افتح التطبيق', detail: 'لإعداد ورد اليوم', range: '', progressText: '', progress: 0, nowFrac: 0, next: '', complete: false, phrase: 'اللَّهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ', phraseShort: 'اللَّهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ', phraseSrc: '', phraseShortSrc: '' };
  const n = props.widgetInfo.widgetName;
  props.renderWidget(<WirdWidget s={snap} size={n === 'WirdSmall' ? 'small' : n === 'WirdLarge' ? 'large' : 'medium'} />);
}
