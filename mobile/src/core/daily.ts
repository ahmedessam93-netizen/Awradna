// الورد اليومي (pages 9–24 of «أورادنا»): read morning and evening, apart from the weekly wird.
// Dhikr text transcribed from printed pages 9–10 and checked word by word against them (Nov 2026).
// The book's honorific is «صلى الله عليه وآله وسلم» (with وآله), so it is written out in full, never as ﷺ.
// Quran is never typed here: surahs are named, with their count.
export type Dhikr = { id: string; text: string; count: number; last?: string; surah?: boolean };
export type DailySection =
  | { id: string; title: string; sub: string; kind: 'count'; page: number; items: Dhikr[]; note?: string }
  | { id: string; title: string; sub: string; kind: 'pages'; from: number; to: number; note?: string };

const SAW = 'صَلَّى اللهُ عَلَيْهِ وَآلِهِ وَسَلَّمَ';

export const FAWATIH = [
  'لسيدنا رسول الله صلى الله عليه وآله وسلم',
  'لسيدي الإمام أبي الحسن الشاذلي، شيخ الطريقة الشاذلية',
  'لسيدي الإمام العلامة العارف بالله نور الدين علي جمعة، شيخ الطريقة الصديقية الشاذلية',
];

const SALAH_ASAS = `اللَّهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ ${SAW} عَبْدِكَ وَنَبِيِّكَ وَرَسُولِكَ النَّبِيِّ الْأُمِّيِّ، وَعَلَى آلِهِ وَصَحْبِهِ وَسَلِّمْ تَسْلِيمًا، بِقَدْرِ عَظَمَةِ ذَاتِكَ فِي كُلِّ وَقْتٍ وَحِينٍ`;
const IBRAHIMIYYA = `اللَّهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ وَعَلَى آلِ سَيِّدِنَا مُحَمَّدٍ ${SAW}، كَمَا صَلَّيْتَ عَلَى سَيِّدِنَا إِبْرَاهِيمَ، وَعَلَى آلِ سَيِّدِنَا إِبْرَاهِيمَ، وَبَارِكْ عَلَى سَيِّدِنَا مُحَمَّدٍ ${SAW}، وَعَلَى آلِ سَيِّدِنَا مُحَمَّدٍ ${SAW}، كَمَا بَارَكْتَ عَلَى سَيِّدِنَا إِبْرَاهِيمَ، وَعَلَى آلِ سَيِّدِنَا إِبْرَاهِيمَ، فِي الْعَالَمِينَ، إِنَّكَ حَمِيدٌ مَجِيدٌ`;

export const DAILY: DailySection[] = [
  { id: 'asas', title: 'ورد الأساس', sub: 'ثلاثة أذكار، كلٌّ منها مئة مرة', kind: 'count', page: 9, items: [
    { id: 'istighfar', text: 'أَسْتَغْفِرُ اللهَ', count: 100 },
    { id: 'salah', text: SALAH_ASAS, count: 100 },
    { id: 'tahlil', text: 'لَا إِلَهَ إِلَّا اللهُ', count: 100, last: `لَا إِلَهَ إِلَّا اللهُ، سَيِّدُنَا مُحَمَّدٌ ${SAW} رَسُولُ اللهِ ${SAW}` },
  ]},
  { id: 'musabbaat', title: 'المسبّعات', sub: 'خمس سور وآية الكرسي وأربعة أذكار، سبعًا سبعًا', kind: 'count', page: 10, note: 'تُقرأ قبل الشروق وقبل الغروب', items: [
    { id: 'fatiha', text: 'سورة الفاتحة', count: 7, surah: true },
    { id: 'nas', text: 'سورة الناس', count: 7, surah: true },
    { id: 'falaq', text: 'سورة الفلق', count: 7, surah: true },
    { id: 'ikhlas', text: 'سورة الإخلاص', count: 7, surah: true },
    { id: 'kafirun', text: 'سورة الكافرون', count: 7, surah: true },
    { id: 'kursi', text: 'آية الكرسي', count: 7, surah: true },
    { id: 'baqiyat', text: 'سُبْحَانَ اللهِ وَالْحَمْدُ لِلَّهِ وَلَا إِلَهَ إِلَّا اللهُ وَاللهُ أَكْبَرُ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللهِ الْعَلِيِّ الْعَظِيمِ', count: 7 },
    { id: 'ibrahimiyya', text: IBRAHIMIYYA, count: 7 },
    { id: 'maghfira', text: 'اللَّهُمَّ اغْفِرْ لِي وَلِوَالِدَيَّ، وَلِلْمُؤْمِنِينَ وَالْمُؤْمِنَاتِ وَالْمُسْلِمِينَ وَالْمُسْلِمَاتِ، الْأَحْيَاءِ مِنْهُمْ وَالْأَمْوَاتِ', count: 7 },
    { id: 'ifal', text: 'اللَّهُمَّ افْعَلْ بِي وَبِهِمْ عَاجِلًا وَآجِلًا فِي الدِّينِ وَالدُّنْيَا وَالْآخِرَةِ مَا أَنْتَ لَهُ أَهْلٌ، وَلَا تَفْعَلْ بِنَا يَا مَوْلَانَا مَا نَحْنُ لَهُ أَهْلٌ، إِنَّكَ غَفُورٌ حَلِيمٌ، جَوَادٌ كَرِيمٌ، رَءُوفٌ رَحِيمٌ', count: 7 },
  ]},
  { id: 'wazifa', title: 'الوظيفة الزرّوقية', sub: 'ص ١١–١٧', kind: 'pages', from: 11, to: 17 },
  { id: 'bahr', title: 'حزب البحر', sub: 'مرة في اليوم، ص ١٨–٢٤', kind: 'pages', from: 18, to: 24, note: 'مرة واحدة في اليوم' },
];

export type Session = 'am' | 'pm';
// progress key per day and session: { [sectionId]: number of items (or pages) done; fawatih: 0|1 }
export type DailyProgress = Record<string, number>;

export function sectionSize(s: DailySection) { return s.kind === 'count' ? s.items.length : s.to - s.from + 1; }

export function sectionDone(d: Record<string, number> | undefined, bahr: number | undefined, s: DailySection) {
  if (s.id === 'bahr') return bahr ? sectionSize(s) : 0;
  return Math.min(sectionSize(s), (d || {})[s.id] || 0);
}
