import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { GeoLocation, SOSOrigin } from '../types';

interface SOSTrackingMapProps {
  origin: SOSOrigin;
  currentLocation: GeoLocation | null;
  height?: number;
}

const ORIGIN_ICON = L.divIcon({
  className: '',
  html: `<div style="
    width:32px;height:32px;border-radius:50%;
    background:radial-gradient(circle,#ef4444 40%,rgba(239,68,68,0.3));
    border:3px solid #fff;box-shadow:0 0 12px rgba(239,68,68,0.6);
    display:flex;align-items:center;justify-content:center;
  "><div style="width:8px;height:8px;border-radius:50%;background:#fff"></div></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const CURRENT_ICON = L.divIcon({
  className: '',
  html: `<div style="
    width:22px;height:22px;border-radius:50%;
    background:#22d3ee;border:3px solid #fff;
    box-shadow:0 0 16px rgba(34,211,238,0.7),0 0 40px rgba(34,211,238,0.3);
    animation:livePulse 2s ease-in-out infinite;
  "></div>
  <style>
    @keyframes livePulse {
      0%,100%{box-shadow:0 0 16px rgba(34,211,238,0.7),0 0 40px rgba(34,211,238,0.3)}
      50%{box-shadow:0 0 24px rgba(34,211,238,0.9),0 0 60px rgba(34,211,238,0.5)}
    }
  </style>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

export function SOSTrackingMap({ origin, currentLocation, height = 380 }: SOSTrackingMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const originMarkerRef = useRef<L.Marker | null>(null);
  const currentMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const trailRef = useRef<L.Polyline | null>(null);
  const positionsRef = useRef<[number, number][]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: false,
    }).setView([origin.lat, origin.lng], 16);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    originMarkerRef.current = L.marker([origin.lat, origin.lng], { icon: ORIGIN_ICON })
      .bindPopup(`<b style="color:#ef4444">📍 Punto SOS</b><br/><span style="font-size:11px">${origin.address ?? `${origin.lat.toFixed(5)}, ${origin.lng.toFixed(5)}`}</span>`)
      .addTo(map);

    L.circle([origin.lat, origin.lng], {
      radius: 50,
      color: 'rgba(239,68,68,0.3)',
      fillColor: 'rgba(239,68,68,0.08)',
      weight: 1,
    }).addTo(map);

    trailRef.current = L.polyline([], {
      color: '#a855f7',
      weight: 3,
      opacity: 0.5,
      dashArray: '8 6',
    }).addTo(map);

    routeLineRef.current = L.polyline([], {
      color: '#22d3ee',
      weight: 4,
      opacity: 0.9,
    }).addTo(map);

    currentMarkerRef.current = L.marker([origin.lat, origin.lng], { icon: CURRENT_ICON })
      .bindPopup('<b style="color:#22d3ee">📍 Ubicación actual</b>')
      .addTo(map);

    positionsRef.current = [[origin.lat, origin.lng]];

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!mapRef.current || !currentLocation) return;
    const pos: [number, number] = [currentLocation.lat, currentLocation.lng];

    currentMarkerRef.current?.setLatLng(pos);

    routeLineRef.current?.setLatLngs([
      [origin.lat, origin.lng],
      pos,
    ]);

    positionsRef.current.push(pos);
    trailRef.current?.setLatLngs(positionsRef.current);

    const bounds = L.latLngBounds([
      [origin.lat, origin.lng],
      pos,
    ]);
    mapRef.current.fitBounds(bounds.pad(0.3), { animate: true, maxZoom: 17 });
  }, [currentLocation, origin]);

  return (
    <div
      ref={containerRef}
      style={{
        height,
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid var(--border)',
      }}
    />
  );
}
