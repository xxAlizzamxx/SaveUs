import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, CheckCircle, Send, Navigation, Share2, Phone, MessageCircle, Plus, Trash2, X, Volume2, XCircle, Video, Mic, Download, Clock } from 'lucide-react';
import { CancelSOSModal } from '../components/CancelSOSModal';
import { useApp } from '../context/AppContext';
import { formatCoords, googleMapsUrl } from '../services/geolocation';
import { openTel } from '../services/notifications';
import { SOSTrackingMap } from '../components/SOSTrackingMap';

function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function AlertScreen() {
  const {
    alertSent,
    sendAlert,
    location,
    locationError,
    contacts,
    notifiedContactIds,
    notifyContact,
    shareCurrentLocation,
    addContact,
    removeContact,
    alarmActive,
    sosOrigin,
    sosClipUrl,
    sosClipType,
  } = useApp();

  const distanceFromOrigin = useMemo(() => {
    if (!sosOrigin || !location) return null;
    return haversineDistance(sosOrigin.lat, sosOrigin.lng, location.lat, location.lng);
  }, [sosOrigin, location]);

  const [showAdd, setShowAdd] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relation, setRelation] = useState('');

  const handleAdd = async () => {
    if (!name.trim() || !phone.trim()) return;
    await addContact({ name: name.trim(), phone: phone.trim(), relation: relation.trim() || 'Contacto' });
    setName('');
    setPhone('');
    setRelation('');
    setShowAdd(false);
  };

  return (
    <div>
      {locationError && (
        <div className="alert-banner" style={{ background: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.3)', marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: 'var(--warning)' }}>{locationError}</div>
        </div>
      )}

      {alertSent && (
        <>
          <motion.div className="alert-banner" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: 12 }}>
            <div className="alert-banner-icon"><CheckCircle size={18} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Alerta SOS activa</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Grabando evidencia y compartiendo ubicación GPS en tiempo real
              </div>
            </div>
          </motion.div>

          {alarmActive && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="alarm-active-banner"
            >
              <Volume2 size={18} className="alarm-icon-pulse" />
              <span style={{ fontSize: 13, fontWeight: 600 }}>Alarma sonando</span>
            </motion.div>
          )}

          <motion.button
            className="cancel-sos-btn"
            onClick={() => setShowCancelModal(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <XCircle size={20} />
            Cancelar emergencia — Estoy a salvo
          </motion.button>
        </>
      )}

      {/* Punto de origen + distancia + clip */}
      {alertSent && sosOrigin && (
        <div className="sos-evidence-grid">
          <div className="evidence-panel">
            <div className="evidence-panel-header">
              <MapPin size={16} color="var(--danger)" />
              <span>Punto de activación SOS</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>
              {sosOrigin.address ?? `${sosOrigin.lat.toFixed(5)}, ${sosOrigin.lng.toFixed(5)}`}
            </div>
            <div style={{ fontSize: 12, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
              {formatCoords(sosOrigin.lat, sosOrigin.lng)} · ±{Math.round(sosOrigin.accuracy)}m
            </div>
            <a
              href={googleMapsUrl(sosOrigin.lat, sosOrigin.lng)}
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: 12, color: 'var(--accent-blue)', marginTop: 8, display: 'inline-block' }}
            >
              Ver origen en Maps →
            </a>
          </div>

          <div className="evidence-panel">
            <div className="evidence-panel-header">
              <Navigation size={16} color="var(--accent-cyan)" />
              <span>Distancia desde origen</span>
            </div>
            <div className="distance-value">
              {distanceFromOrigin !== null
                ? distanceFromOrigin < 1000
                  ? `${Math.round(distanceFromOrigin)} m`
                  : `${(distanceFromOrigin / 1000).toFixed(2)} km`
                : '—'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              Actualización en tiempo real
            </div>
          </div>

          <div className="evidence-panel">
            <div className="evidence-panel-header">
              {sosClipType === 'video' ? <Video size={16} color="var(--accent-purple)" /> : <Mic size={16} color="var(--accent-purple)" />}
              <span>Clip de evidencia</span>
            </div>
            {sosClipUrl ? (
              <>
                <div style={{ fontSize: 13, color: 'var(--safe)', marginTop: 8 }}>
                  Clip de 15s capturado
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <a
                    href={sosClipUrl}
                    download={`sos-clip-${Date.now()}.webm`}
                    className="clip-action-btn"
                  >
                    <Download size={14} /> Descargar
                  </a>
                  <button
                    className="clip-action-btn"
                    onClick={() => {
                      if (!navigator.share) return;
                      fetch(sosClipUrl).then(r => r.blob()).then(blob => {
                        const file = new File([blob], `sos-evidencia.webm`, { type: blob.type });
                        navigator.share({ files: [file], title: 'Evidencia SOS — SaveUs' }).catch(() => {});
                      });
                    }}
                  >
                    <Share2 size={14} /> Compartir
                  </button>
                </div>
              </>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--warning)', marginTop: 8 }}>
                Capturando clip (15s)...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mapa de tracking en tiempo real */}
      {alertSent && sosOrigin && (
        <div className="tracking-map-section">
          <div className="tracking-map-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="tracking-live-dot" />
              <span style={{ fontWeight: 700, fontSize: 16 }}>Rastreo en vivo</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', border: '2px solid #fff' }} />
                <span style={{ color: 'var(--text-secondary)' }}>Punto SOS</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22d3ee', border: '2px solid #fff' }} />
                <span style={{ color: 'var(--text-secondary)' }}>Posición actual</span>
              </div>
              {distanceFromOrigin !== null && (
                <div style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                  {distanceFromOrigin < 1000
                    ? `${Math.round(distanceFromOrigin)} m`
                    : `${(distanceFromOrigin / 1000).toFixed(2)} km`}
                </div>
              )}
            </div>
          </div>
          <SOSTrackingMap origin={sosOrigin} currentLocation={location} height={400} />
          {location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
              <Clock size={11} />
              Última actualización: {new Date(location.timestamp).toLocaleTimeString('es-CO')}
              <span style={{ marginLeft: 8 }}>· Precisión ±{Math.round(location.accuracy)}m</span>
            </div>
          )}
        </div>
      )}

      <div className="web-grid-2">
        <div>
          <div className="location-card" style={{ marginBottom: 16, minHeight: 180 }}>
            <div className="location-pulse" />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Navigation size={16} color="var(--accent-blue)" />
                Ubicación GPS en tiempo real
              </div>
              {location ? (
                <>
                  <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 8 }}>
                    {location.address ?? 'Obteniendo dirección...'}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--accent-cyan)', marginTop: 6, fontFamily: 'var(--font-mono)' }}>
                    {formatCoords(location.lat, location.lng)} · ±{Math.round(location.accuracy)}m
                  </div>
                  <a
                    href={googleMapsUrl(location.lat, location.lng)}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: 12, color: 'var(--accent-blue)', marginTop: 8, display: 'inline-block' }}
                  >
                    Abrir en Google Maps →
                  </a>
                </>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>Esperando señal GPS...</div>
              )}
            </div>
            <MapPin size={32} color="var(--accent-blue)" style={{ opacity: 0.5 }} />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-primary" onClick={shareCurrentLocation} style={{ flex: 1 }}>
              <Share2 size={16} style={{ marginRight: 8 }} />
              Compartir ubicación
            </button>
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <p className="section-label" style={{ marginBottom: 0 }}>Contactos de emergencia</p>
            <button className="header-icon-btn" onClick={() => setShowAdd(true)} title="Agregar contacto">
              <Plus size={16} />
            </button>
          </div>

          <div className="contact-list">
            {contacts.map((contact, i) => (
              <motion.div key={contact.id} className="contact-item" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <div className="contact-avatar">{contact.initials}</div>
                <div className="contact-info">
                  <div className="contact-name">{contact.name}</div>
                  <div className="contact-relation">{contact.relation} · {contact.phone}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                  {notifiedContactIds.includes(contact.id) ? (
                    <span className="contact-status contact-status--notified">Notificado</span>
                  ) : (
                    <span className="contact-status contact-status--pending">Pendiente</span>
                  )}
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="header-icon-btn" style={{ width: 32, height: 32 }} onClick={() => notifyContact(contact.id)} title="Enviar alerta">
                      <MessageCircle size={14} />
                    </button>
                    <button className="header-icon-btn" style={{ width: 32, height: 32 }} onClick={() => openTel(contact.phone)} title="Llamar">
                      <Phone size={14} />
                    </button>
                    <button className="header-icon-btn" style={{ width: 32, height: 32 }} onClick={() => removeContact(contact.id)} title="Eliminar">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {!alertSent && (
            <motion.button className="btn-primary btn-danger" onClick={sendAlert} style={{ marginTop: 20 }} whileTap={{ scale: 0.98 }}>
              <Send size={16} style={{ marginRight: 8 }} />
              Enviar alerta de emergencia
            </motion.button>
          )}
        </div>
      </div>

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'left' }}>
            <button style={{ position: 'absolute', top: 16, right: 16, color: 'var(--text-muted)' }} onClick={() => setShowAdd(false)}>
              <X size={20} />
            </button>
            <h2 className="modal-title">Nuevo contacto</h2>
            <input className="form-input" placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="form-input" placeholder="Teléfono (+57...)" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <input className="form-input" placeholder="Relación (ej. Madre)" value={relation} onChange={(e) => setRelation(e.target.value)} />
            <button className="btn-primary" onClick={handleAdd} style={{ marginTop: 12 }}>Guardar contacto</button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showCancelModal && (
          <CancelSOSModal onClose={() => setShowCancelModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
