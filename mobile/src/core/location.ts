import * as Location from 'expo-location';
import { CITIES } from './data';

// Current position, matched to the nearest known city for its calculation method.
export async function locateMe(): Promise<{ lat: number; lng: number; method: string; cityName: string } | null> {
  const perm = await Location.requestForegroundPermissionsAsync();
  if (!perm.granted) return null;
  const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  const { latitude: la, longitude: lo } = pos.coords;
  let best = 0, bd = 1e9;
  CITIES.forEach((c, i) => { const d = (c[1] - la) ** 2 + (c[2] - lo) ** 2; if (d < bd) { bd = d; best = i; } });
  return { lat: la, lng: lo, method: CITIES[best][3], cityName: bd < 0.6 ? CITIES[best][0] : 'موقعي الحالي' };
}
