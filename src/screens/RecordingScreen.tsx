import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Mic, Image, Circle, RotateCcw, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Toggle } from '../components/Toggle';
import { saveEvidence } from '../services/storage';
import { notify } from '../services/notifications';

export function RecordingScreen() {
  const {
    isRecording,
    toggleRecording,
    recordingAudio,
    recordingVideo,
    setRecordingAudio,
    setRecordingVideo,
    safeMode,
    mediaStream,
    setScreen,
    refreshEvidence,
  } = useApp();

  const videoRef = useRef<HTMLVideoElement>(null);
  const [flash, setFlash] = useState(false);
  const [photoTaken, setPhotoTaken] = useState(false);
  const [photoCount, setPhotoCount] = useState(0);
  const [facingUser, setFacingUser] = useState(false);

  useEffect(() => {
    if (safeMode && !isRecording) {
      toggleRecording();
    }
  }, [safeMode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (mediaStream) {
      video.srcObject = mediaStream;
      video.play().catch(() => {});
    } else {
      video.srcObject = null;
    }
  }, [mediaStream]);

  // Capture photo from video feed
  const capturePhoto = async () => {
    const video = videoRef.current;
    if (!video || !mediaStream) {
      notify('Cámara inactiva', 'Activa la grabación primero para capturar fotos.');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Flash effect
    setFlash(true);
    setTimeout(() => setFlash(false), 250);

    // Show checkmark briefly
    setPhotoTaken(true);
    setTimeout(() => setPhotoTaken(false), 1500);

    // Convert canvas to blob and save as evidence
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      await saveEvidence(blob, 'photo', `Foto capturada #${photoCount + 1}`, 0);
      await refreshEvidence();
      setPhotoCount((c) => c + 1);
      notify('Foto guardada', 'Captura guardada en evidencia local.');
    }, 'image/png');
  };

  // Navigate to evidence gallery
  const openGallery = () => {
    setScreen('evidence');
  };

  // Toggle recording (main record button)
  const handleRecord = () => {
    toggleRecording();
  };

  // Flip camera (front ↔ back)
  const flipCamera = async () => {
    if (!isRecording) {
      notify('Cámara inactiva', 'Activa la grabación para cambiar la cámara.');
      return;
    }

    const wasRecording = isRecording;
    if (wasRecording) {
      await toggleRecording(); // stop
    }

    setFacingUser((prev) => !prev);

    // Small delay then restart with new facing mode
    setTimeout(async () => {
      // Override the video constraints temporarily
      try {
        const constraints: MediaStreamConstraints = {
          audio: recordingAudio,
          video: recordingVideo
            ? { facingMode: facingUser ? 'environment' : 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
            : false,
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          video.play().catch(() => {});
        }
        notify('Cámara', facingUser ? 'Cámara trasera activa' : 'Cámara frontal activa');
      } catch {
        notify('Error', 'No se pudo cambiar la cámara.');
      }

      if (wasRecording) {
        await toggleRecording(); // restart recording
      }
    }, 300);
  };

  return (
    <div className="web-grid-2 web-grid-2--wide-left">
      <div className="panel-card" style={{ padding: 16 }}>
        <div className="recording-view" style={{ position: 'relative' }}>
          {mediaStream ? (
            <video
              ref={videoRef}
              className="recording-feed"
              autoPlay
              muted
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: facingUser ? 'scaleX(-1)' : 'none',
              }}
            />
          ) : (
            <div
              className="recording-feed"
              style={{
                background: 'linear-gradient(160deg, #1a1a2e 0%, #0f172a 40%, #1e1b4b 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
              }}
            >
              <div style={{ textAlign: 'center', opacity: 0.5 }}>
                <Camera size={56} />
                <p style={{ fontSize: 14, marginTop: 12 }}>Activa la grabación para ver la cámara</p>
              </div>
            </div>
          )}
          <div className="recording-overlay" />

          {/* Flash effect on photo capture */}
          <AnimatePresence>
            {flash && (
              <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'white',
                  zIndex: 20,
                  borderRadius: 16,
                }}
              />
            )}
          </AnimatePresence>

          {/* Photo taken checkmark */}
          <AnimatePresence>
            {photoTaken && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.9)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 21,
                }}
              >
                <Check size={32} color="white" />
              </motion.div>
            )}
          </AnimatePresence>

          {isRecording && (
            <motion.div className="recording-badge" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <span className="rec-dot" /> REC
            </motion.div>
          )}

          {/* Photo counter */}
          {photoCount > 0 && (
            <div style={{
              position: 'absolute',
              top: 12,
              right: 12,
              background: 'rgba(168, 85, 247, 0.9)',
              borderRadius: 12,
              padding: '4px 10px',
              fontSize: 11,
              fontWeight: 700,
              color: 'white',
              zIndex: 10,
            }}>
              {photoCount} foto{photoCount > 1 ? 's' : ''}
            </div>
          )}

          {/* Functional disguise UI buttons */}
          <div className="disguise-ui">
            <button
              className="disguise-btn"
              onClick={capturePhoto}
              title="Capturar foto"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}
            >
              <Camera className="disguise-icon" style={{ color: mediaStream ? 'white' : 'rgba(255,255,255,0.3)' }} />
            </button>
            <button
              className="disguise-btn"
              onClick={openGallery}
              title="Ver galería de evidencia"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}
            >
              <Image className="disguise-icon" style={{ color: 'rgba(255,255,255,0.7)' }} />
            </button>
            <button
              className="disguise-btn"
              onClick={handleRecord}
              title={isRecording ? 'Detener grabación' : 'Iniciar grabación'}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}
            >
              <Circle
                className="disguise-icon"
                fill={isRecording ? '#ef4444' : 'none'}
                style={{ color: isRecording ? '#ef4444' : 'white', opacity: 1 }}
              />
            </button>
            <button
              className="disguise-btn"
              onClick={flipCamera}
              title="Cambiar cámara"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}
            >
              <RotateCcw className="disguise-icon" style={{ color: mediaStream ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)' }} />
            </button>
          </div>
        </div>
      </div>

      <div>
        <div className="card card--glow">
          <p className="section-label">Controles reales</p>
          <div className="toggle-row">
            <div>
              <div className="toggle-label">Grabación activa</div>
              <div className="toggle-sublabel">MediaRecorder + getUserMedia</div>
            </div>
            <Toggle on={isRecording} onChange={() => toggleRecording()} />
          </div>
          <div className="toggle-row">
            <div>
              <div className="toggle-label">Audio</div>
              <div className="toggle-sublabel">Micrófono del dispositivo</div>
            </div>
            <Toggle on={recordingAudio} onChange={setRecordingAudio} />
          </div>
          <div className="toggle-row">
            <div>
              <div className="toggle-label">Video</div>
              <div className="toggle-sublabel">Cámara web / móvil</div>
            </div>
            <Toggle on={recordingVideo} onChange={setRecordingVideo} />
          </div>
        </div>

        {isRecording && (
          <motion.div className="secure-lock" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: 16 }}>
            <Mic size={14} />
            Grabando — al detener se guarda automáticamente en evidencia local
          </motion.div>
        )}

        <div className="card" style={{ marginTop: 16 }}>
          <p className="section-label">Almacenamiento</p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Los archivos se guardan en IndexedDB del navegador. Puedes verlos y descargarlos en la sección Evidencia.
          </p>
        </div>

        {/* Button legend */}
        <div className="card" style={{ marginTop: 16 }}>
          <p className="section-label">Botones de cámara</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)' }}>
              <Camera size={16} color="var(--accent-cyan)" /> Capturar foto (se guarda como evidencia)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)' }}>
              <Image size={16} color="var(--accent-purple)" /> Abrir galería de evidencia
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)' }}>
              <Circle size={16} color="var(--danger)" /> Iniciar / detener grabación
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)' }}>
              <RotateCcw size={16} color="var(--safe)" /> Cambiar cámara (frontal / trasera)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
