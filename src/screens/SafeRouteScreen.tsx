import { useEffect, useState } from 'react';
import { Users, Clock, Route, Play, Square } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MapView } from '../components/MapView';

export function SafeRouteScreen() {
  const { location, routePath, startRouteTracking, stopRouteTracking, locationError } = useApp();
  const [tracking, setTracking] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {
    if (!tracking) return;
    const interval = setInterval(() => {
      if (startTime) setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [tracking, startTime]);

  const handleStart = async () => {
    setTracking(true);
    setStartTime(Date.now());
    setElapsed(0);
    await startRouteTracking();
  };

  const handleStop = () => {
    setTracking(false);
    stopRouteTracking();
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const distance = routePath.length > 1
    ? routePath.slice(1).reduce((acc, p, i) => {
        const prev = routePath[i];
        const R = 6371e3;
        const φ1 = (prev.lat * Math.PI) / 180;
        const φ2 = (p.lat * Math.PI) / 180;
        const Δφ = ((p.lat - prev.lat) * Math.PI) / 180;
        const Δλ = ((p.lng - prev.lng) * Math.PI) / 180;
        const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
        return acc + R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      }, 0)
    : 0;

  return (
    <div className="web-grid-2 web-grid-2--wide-left">
      <div>
        <MapView location={location} routePath={routePath} height={460} />
        {locationError && (
          <p style={{ fontSize: 12, color: 'var(--warning)', marginTop: 8 }}>{locationError}</p>
        )}
        <div className="live-tracker" style={{ position: 'relative', marginTop: 12, display: 'inline-flex' }}>
          <Users size={12} />
          {tracking ? 'Rastreo GPS activo' : 'Rastreo detenido'} · {routePath.length} puntos registrados
        </div>
      </div>

      <div>
        <div className="stat-row" style={{ flexDirection: 'column' }}>
          <div className="stat-chip">
            <div className="stat-value">{routePath.length}</div>
            <div className="stat-label">Puntos GPS</div>
          </div>
          <div className="stat-chip">
            <div className="stat-value">{formatTime(elapsed)}</div>
            <div className="stat-label">Tiempo en camino</div>
          </div>
          <div className="stat-chip">
            <div className="stat-value">{(distance / 1000).toFixed(2)} km</div>
            <div className="stat-label">Distancia recorrida</div>
          </div>
        </div>

        {!tracking ? (
          <button className="btn-primary" onClick={handleStart} style={{ marginTop: 16 }}>
            <Play size={16} style={{ marginRight: 8 }} />
            Iniciar camino seguro
          </button>
        ) : (
          <button className="btn-primary btn-danger" onClick={handleStop} style={{ marginTop: 16 }}>
            <Square size={16} style={{ marginRight: 8 }} />
            Detener rastreo
          </button>
        )}

        <div className="card" style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Route size={16} color="var(--accent-purple)" />
            <span style={{ fontWeight: 600, fontSize: 14 }}>Mapa OpenStreetMap en vivo</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Tu ruta se traza con coordenadas GPS reales y se guarda localmente. Comparte tu pantalla de alertas para que contactos vean tu ubicación.
          </p>
          {location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
              <Clock size={12} />
              Última actualización: {new Date(location.timestamp).toLocaleTimeString('es-CO')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
