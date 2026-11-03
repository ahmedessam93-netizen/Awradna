// Keeps the home-screen widgets in step with the app.
// Android: re-render the widgets now (they also refresh themselves every 30 minutes).
// iOS: write a timeline of snapshots (now + every prayer time in the next 36 h) into the
// shared App Group; the SwiftUI widget shows each entry at its time, even with the app closed.
import React from 'react';
import { Platform } from 'react-native';
import { changePoints, snapshot, State } from './plan';

export const APP_GROUP = 'group.com.awradna.app';
export const ANDROID_WIDGETS = ['Wird', 'WirdSmall', 'WirdLarge'] as const;

export async function refreshWidgets(s: State) {
  if (!s.settings.onboarded) return;
  if (Platform.OS === 'android') {
    const { requestWidgetUpdate } = await import('react-native-android-widget');
    const { WirdWidget } = await import('../widget/WirdWidget');
    for (const name of ANDROID_WIDGETS) {
      await requestWidgetUpdate({
        widgetName: name,
        renderWidget: () => <WirdWidget s={snapshot(s, new Date())} size={name === 'WirdSmall' ? 'small' : name === 'WirdLarge' ? 'large' : 'medium'} />,
      }).catch(() => {});
    }
  } else if (Platform.OS === 'ios') {
    try {
      const { ExtensionStorage } = await import('@bacons/apple-targets');
      const storage = new ExtensionStorage(APP_GROUP);
      const now = new Date();
      const points = [now, ...changePoints(s, now, 26).map((d) => new Date(d.getTime() + 1000))];
      const entries = points.map((at) => {
        const x = snapshot(s, at);
        return {
          t: String(at.getTime()), day: x.day, title: x.title, shortTitle: x.shortTitle, detail: x.detail,
          range: x.range, progressText: x.progressText, progress: String(x.progress), nowFrac: String(x.nowFrac),
          next: x.next, complete: x.complete ? '1' : '0',
          phrase: x.phrase, phraseSrc: x.phraseSrc, phraseShort: x.phraseShort, phraseShortSrc: x.phraseShortSrc,
        };
      });
      storage.set('timeline', entries);
      ExtensionStorage.reloadWidget();
    } catch {}
  }
}
