import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cloud, Lock, Video, Mic, Download, Trash2, Play, X, Camera } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getEvidenceBlob, getPin, setPin, verifyPin } from '../services/storage';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function EvidenceScreen() {
  const { evidence, refreshEvidence, removeEvidence } = useApp();
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [needsSetup, setNeedsSetup] = useState(false);
  const [confirmPin, setConfirmPin] = useState('');
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'video' | 'audio' | 'photo'>('video');

  useEffect(() => {
    refreshEvidence();
    setNeedsSetup(!getPin());
  }, [refreshEvidence]);

  const handleUnlock = () => {
    if (needsSetup) {
      if (pin.length < 4) { setPinError('Mínimo 4 dígitos'); return; }
      if (pin !== confirmPin) { setPinError('Los PIN no coinciden'); return; }
      setPin(pin);
      setUnlocked(true);
      setPinError('');
      return;
    }
    if (verifyPin(pin)) {
      setUnlocked(true);
      setPinError('');
    } else {
      setPinError('PIN incorrecto');
    }
  };

  const handleDownload = async (id: string, title: string) => {
    const blob = await getEvidenceBlob(id);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s/g, '_')}.${blob.type.includes('video') ? 'webm' : 'webm'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePreview = async (id: string, type: 'video' | 'audio' | 'photo') => {
    const blob = await getEvidenceBlob(id);
    if (!blob) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
    setPreviewId(id);
    setPreviewType(type);
  };

  const handleDelete = async (id: string) => {
    await removeEvidence(id);
    if (previewId === id) {
      setPreviewId(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  return (
    <>
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-card-value">{evidence.length}</div>
          <div className="stat-card-label">Archivos guardados</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{evidence.filter((e) => e.type === 'video').length}</div>
          <div className="stat-card-label">Videos</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value" style={{ fontSize: 18, color: 'var(--accent-purple)' }}>Local</div>
          <div className="stat-card-label">IndexedDB del navegador</div>
        </div>
      </div>

      {!unlocked ? (
        <div className="panel-card panel-card--highlight" style={{ textAlign: 'center', padding: 48, maxWidth: 480, margin: '0 auto' }}>
          <Lock size={40} color="var(--accent-purple)" style={{ margin: '0 auto 16px' }} />
          <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
            {needsSetup ? 'Configura tu PIN de acceso' : 'Acceso protegido'}
          </p>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
            {needsSetup ? 'Crea un PIN de 4+ dígitos para proteger tus grabaciones' : 'Ingresa tu PIN para ver la evidencia'}
          </p>
          <input
            className="form-input"
            type="password"
            inputMode="numeric"
            placeholder="PIN"
            value={pin}
            onChange={(e) => setPinInput(e.target.value)}
            style={{ maxWidth: 240, margin: '0 auto 10px' }}
          />
          {needsSetup && (
            <input
              className="form-input"
              type="password"
              inputMode="numeric"
              placeholder="Confirmar PIN"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              style={{ maxWidth: 240, margin: '0 auto 10px' }}
            />
          )}
          {pinError && <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>{pinError}</p>}
          <button className="btn-primary" onClick={handleUnlock} style={{ maxWidth: 240, margin: '0 auto' }}>
            {needsSetup ? 'Guardar PIN y entrar' : 'Desbloquear'}
          </button>
        </div>
      ) : (
        <>
          <div className="secure-lock">
            <Lock size={14} />
            Evidencia almacenada localmente en tu navegador · {evidence.length} archivo(s)
          </div>

          {evidence.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 40 }}>
              <p style={{ color: 'var(--text-secondary)' }}>Aún no hay grabaciones. Activa la grabación o el modo seguro para crear evidencia.</p>
            </div>
          ) : (
            <div className="web-grid-2" style={{ gridTemplateColumns: previewUrl ? '1fr 1fr' : '1fr' }}>
              <div>
                <p className="section-label">Historial de grabaciones</p>
                {evidence.map((item, i) => (
                  <motion.div
                    key={item.id}
                    className="evidence-item"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    style={{ marginBottom: 10 }}
                  >
                    <div className="evidence-thumb">
                      {item.type === 'video' ? <Video size={24} color="var(--accent-purple)" /> : item.type === 'photo' ? <Camera size={24} color="var(--safe)" /> : <Mic size={24} color="var(--accent-cyan)" />}
                      <span className="evidence-duration">{item.type === 'photo' ? 'FOTO' : formatDuration(item.duration)}</span>
                    </div>
                    <div className="evidence-meta">
                      <div className="evidence-title">{item.title}</div>
                      <div className="evidence-details">
                        <span>{item.date}</span>
                        <span>{formatSize(item.size)}</span>
                      </div>
                      <span className="cloud-badge"><Cloud size={12} /> Almacenamiento local</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <button className="header-icon-btn" onClick={() => handlePreview(item.id, item.type)} title="Reproducir">
                        <Play size={14} />
                      </button>
                      <button className="header-icon-btn" onClick={() => handleDownload(item.id, item.title)} title="Descargar">
                        <Download size={14} />
                      </button>
                      <button className="header-icon-btn" onClick={() => handleDelete(item.id)} title="Eliminar">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {previewUrl && (
                <div className="panel-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <p className="section-label" style={{ marginBottom: 0 }}>Vista previa</p>
                    <button onClick={() => { setPreviewUrl(null); setPreviewId(null); }} style={{ color: 'var(--text-muted)' }}>
                      <X size={18} />
                    </button>
                  </div>
                  {previewType === 'video' ? (
                    <video src={previewUrl} controls style={{ width: '100%', borderRadius: 12, maxHeight: 360 }} />
                  ) : previewType === 'photo' ? (
                    <img src={previewUrl} alt="Evidencia" style={{ width: '100%', borderRadius: 12, maxHeight: 360, objectFit: 'contain' }} />
                  ) : (
                    <audio src={previewUrl} controls style={{ width: '100%' }} />
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
}
