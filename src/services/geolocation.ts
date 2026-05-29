import type { GeoLocation } from '../types';

let watchId: number | null = null;

export function isGeolocationSupported(): boolean {
  return 'geolocation' in navigator;
}

export function getCurrentPosition(): Promise<GeoLocation> {
  return new Promise((resolve, reject) => {
    if (!isGeolocationSupported()) {
      reject(new Error('Geolocalización no disponible'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        });
      },
      (err) => reject(new Error(err.message)),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );
  });
}

export function watchPosition(
  onUpdate: (loc: GeoLocation) => void,
  onError?: (msg: string) => void
): void {
  if (!isGeolocationSupported()) {
    onError?.('Geolocalización no disponible');
    return;
  }
  if (watchId !== null) return;

  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      onUpdate({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        timestamp: pos.timestamp,
      });
    },
    (err) => onError?.(err.message),
    { enableHighAccuracy: true, maximumAge: 3000, timeout: 20000 }
  );
}

export function stopWatching(): void {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
}

let lastGeocode = 0;
let lastGeocodeKey = '';

export async function reverseGeocode(lat: number, lng: number): Promise<string | undefined> {
  const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  const now = Date.now();
  if (key === lastGeocodeKey && now - lastGeocode < 30000) return undefined;

  try {
    lastGeocode = now;
    lastGeocodeKey = key;
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=es`,
      { headers: { 'Accept-Language': 'es' } }
    );
    if (!res.ok) return undefined;
    const data = await res.json();
    return data.display_name as string;
  } catch {
    return undefined;
  }
}

export function formatCoords(lat: number, lng: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lng).toFixed(4)}° ${lngDir}`;
}

export function googleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}
