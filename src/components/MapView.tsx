import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { GeoLocation, RoutePoint } from '../types';

interface MapViewProps {
  location: GeoLocation | null;
  routePath: RoutePoint[];
  height?: number;
}

export function MapView({ location, routePath, height = 420 }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);
  const routeRef = useRef<L.Polyline | null>(null);
  const destRef = useRef<L.CircleMarker | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const defaultLat = location?.lat ?? 10.391;
    const defaultLng = location?.lng ?? -75.4794;

    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView([defaultLat, defaultLng], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    markerRef.current = L.circleMarker([defaultLat, defaultLng], {
      radius: 10,
      color: '#22d3ee',
      fillColor: '#22d3ee',
      fillOpacity: 0.9,
      weight: 2,
    }).addTo(map);

    routeRef.current = L.polyline([], { color: '#a855f7', weight: 4, opacity: 0.8 }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!mapRef.current || !location) return;
    const { lat, lng } = location;
    markerRef.current?.setLatLng([lat, lng]);
    mapRef.current.panTo([lat, lng], { animate: true });
  }, [location]);

  useEffect(() => {
    if (!mapRef.current || routePath.length === 0) return;
    const latlngs = routePath.map((p) => [p.lat, p.lng] as [number, number]);
    routeRef.current?.setLatLngs(latlngs);

    const last = routePath[routePath.length - 1];
    if (routePath.length > 3) {
      destRef.current?.remove();
      destRef.current = L.circleMarker([last.lat, last.lng], {
        radius: 8,
        color: '#10b981',
        fillColor: '#10b981',
        fillOpacity: 0.5,
        weight: 2,
      }).addTo(mapRef.current);
    }
  }, [routePath]);

  return (
    <div
      ref={containerRef}
      className="map-leaflet"
      style={{ height, width: '100%', borderRadius: 16, overflow: 'hidden' }}
    />
  );
}
