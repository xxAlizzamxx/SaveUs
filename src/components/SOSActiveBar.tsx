import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, XCircle, MapPin } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface SOSActiveBarProps {
  onCancelClick: () => void;
}

export function SOSActiveBar({ onCancelClick }: SOSActiveBarProps) {
  const { setScreen, location, alarmActive } = useApp();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');

  return (
    <motion.div
      className="sos-active-bar"
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -60, opacity: 0 }}
    >
      <div className="sos-active-bar-left">
        <AlertTriangle size={16} className="sos-bar-icon-blink" />
        <span className="sos-bar-label">EMERGENCIA ACTIVA</span>
        <span className="sos-bar-timer">{mm}:{ss}</span>
        {alarmActive && <span className="sos-bar-alarm-badge">ALARMA</span>}
      </div>

      <div className="sos-active-bar-right">
        {location && (
          <button className="sos-bar-btn sos-bar-btn--map" onClick={() => setScreen('alert')}>
            <MapPin size={14} />
            Ver mapa
          </button>
        )}
        <button className="sos-bar-btn sos-bar-btn--cancel" onClick={onCancelClick}>
          <XCircle size={14} />
          Cancelar SOS
        </button>
      </div>
    </motion.div>
  );
}
