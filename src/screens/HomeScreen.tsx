import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Video, MapPin, Brain, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SOSShield } from '../components/SOSShield';

export function HomeScreen() {
  const {
    toggleSafeMode,
    safeMode,
    setScreen,
    vibrate,
    status,
    isRecording,
    activateSOS,
    location,
    contacts,
  } = useApp();
  const [showSOSModal, setShowSOSModal] = useState(false);

  const handleSOSPress = () => {
    vibrate([100, 50, 100]);
    setShowSOSModal(true);
  };

  const handleConfirmSOS = () => {
    setShowSOSModal(false);
    activateSOS();
  };

  const quickActions = [
    { icon: Shield, label: 'Modo seguro', desc: 'GPS + grabación automática', action: toggleSafeMode, active: safeMode },
    { icon: Video, label: 'Grabación discreta', desc: 'Cámara real en segundo plano', action: () => setScreen('recording') },
    { icon: MapPin, label: 'Camino seguro', desc: 'Mapa con tu ubicación real', action: () => setScreen('route') },
    { icon: Brain, label: 'Detección IA', desc: 'Análisis de audio en vivo', action: () => setScreen('ai') },
  ];

  return (
    <>
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-card-value" style={{ color: status === 'safe' ? 'var(--safe)' : 'var(--danger)', fontSize: 22 }}>
            {status === 'safe' ? 'Segura' : 'En riesgo'}
          </div>
          <div className="stat-card-label">Estado del sistema</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{contacts.length}</div>
          <div className="stat-card-label">Contactos de emergencia</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value" style={{ color: isRecording ? 'var(--danger)' : 'var(--text-muted)' }}>
            {isRecording ? 'REC' : 'OFF'}
          </div>
          <div className="stat-card-label">Grabación activa</div>
        </div>
      </div>

      {location && (
        <div className="location-card" style={{ marginBottom: 24 }}>
          <div className="location-pulse" />
          <div style={{ flex: 1, fontSize: 13 }}>
            <strong>Ubicación actual detectada</strong>
            <div style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
              {location.address ?? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`}
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-grid">
        <div className="panel-card panel-card--highlight">
          <p className="section-label">Emergencia</p>
          <div className="sos-container">
            <SOSShield onClick={handleSOSPress} isActive={status === 'risk'} />
            <p style={{ marginTop: 16, fontSize: 14, color: 'var(--text-muted)' }}>
              Toca el escudo para activar protección de emergencia
            </p>
          </div>
        </div>

        <div>
          <p className="section-label">Acceso rápido</p>
          <div className="quick-actions">
            {quickActions.map(({ icon: Icon, label, desc, action, active }) => (
              <motion.button
                key={label}
                className="quick-action"
                onClick={() => { action(); vibrate(40); }}
                whileTap={{ scale: 0.98 }}
                style={active ? { borderColor: 'rgba(16, 185, 129, 0.4)', background: 'rgba(16, 185, 129, 0.06)' } : undefined}
              >
                <div className="quick-action-icon" style={active ? { background: 'rgba(16, 185, 129, 0.15)', color: 'var(--safe)' } : undefined}>
                  <Icon size={22} />
                </div>
                <div>
                  <div className="quick-action-label">{label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{desc}</div>
                </div>
              </motion.button>
            ))}
          </div>

          {safeMode && (
            <motion.div className="alert-banner" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: 16 }}>
              <div className="alert-banner-icon"><Shield size={18} /></div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Modo seguro activo</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  GPS en vivo y grabación guardándose como evidencia
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showSOSModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="modal-content" initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}>
              <button style={{ position: 'absolute', top: 16, right: 16, color: 'var(--text-muted)' }} onClick={() => setShowSOSModal(false)}>
                <X size={20} />
              </button>
              <div className="modal-icon modal-icon--danger"><Shield size={28} /></div>
              <h2 className="modal-title">¿Activar SOS?</h2>
              <p className="modal-text">
                Se compartirá tu ubicación GPS, se grabará evidencia de video/audio, se activará la alarma y se enviará alerta a tus contactos de emergencia.
              </p>
              <div className="modal-actions">
                <button className="btn-primary btn-danger" onClick={handleConfirmSOS}>Confirmar SOS</button>
                <button className="btn-secondary" onClick={() => setShowSOSModal(false)}>Cancelar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
