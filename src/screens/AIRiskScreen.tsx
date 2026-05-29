import { motion, AnimatePresence } from 'framer-motion';
import { Brain, AlertTriangle, Mic, Video, Zap, Volume2, MessageCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function AIRiskScreen() {
  const {
    aiAlertActive,
    aiMonitoring,
    toggleAiMonitoring,
    isRecording,
    riskLevel,
    audioLevel,
    aiLogs,
    triggerAIAlert,
  } = useApp();

  return (
    <div>
      <AnimatePresence>
        {aiAlertActive && (
          <motion.div
            className="alert-banner"
            style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)', marginBottom: 24 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <div className="alert-banner-icon" style={{ background: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger)' }}>
              <AlertTriangle size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--danger)' }}>Alerta automática activada</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Audio anómalo detectado — grabación y SOS iniciados
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="web-grid-2">
        <div>
          <div className="panel-card panel-card--highlight" style={{ textAlign: 'center', padding: 40 }}>
            <p className="section-label">Nivel de riesgo (audio en vivo)</p>
            <div className="risk-meter" style={{ margin: '24px 0' }}>
              <motion.div
                className={`risk-ring ${aiAlertActive ? 'risk-ring--alert' : ''}`}
                style={{ width: 140, height: 140 }}
                animate={aiAlertActive ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 1, repeat: aiAlertActive ? Infinity : 0 }}
              >
                <motion.span
                  className="risk-value"
                  style={{ fontSize: 36, color: aiAlertActive ? 'var(--danger)' : 'var(--accent-purple)' }}
                  key={riskLevel}
                >
                  {riskLevel}%
                </motion.span>
                <span className="risk-label">Riesgo estimado</span>
              </motion.div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
                <Volume2 size={16} color="var(--accent-cyan)" />
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Nivel de audio: {audioLevel}%</span>
              </div>
              <div className="audio-bar-track">
                <motion.div className="audio-bar-fill" animate={{ width: `${audioLevel}%` }} transition={{ duration: 0.1 }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 24 }}>
              <div className="stat-chip">
                <Mic size={18} color={aiMonitoring ? 'var(--accent-cyan)' : 'var(--text-muted)'} style={{ margin: '0 auto 6px' }} />
                <div className="stat-label">{aiMonitoring ? 'Escuchando' : 'Inactivo'}</div>
              </div>
              <div className="stat-chip">
                <MessageCircle size={18} color={aiMonitoring ? 'var(--safe)' : 'var(--text-muted)'} style={{ margin: '0 auto 6px' }} />
                <div className="stat-label">{aiMonitoring ? 'Voz activa' : 'Voz off'}</div>
              </div>
              <div className="stat-chip">
                <Video size={18} color={isRecording ? 'var(--danger)' : 'var(--text-muted)'} style={{ margin: '0 auto 6px' }} />
                <div className="stat-label">{isRecording ? 'Grabando' : 'Inactivo'}</div>
              </div>
              <div className="stat-chip">
                <Zap size={18} color="var(--accent-purple)" style={{ margin: '0 auto 6px' }} />
                <div className="stat-label">Auto-SOS</div>
              </div>
            </div>

            {aiMonitoring && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  marginTop: 16,
                  padding: '12px 16px',
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: 12,
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <motion.div
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--safe)' }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--safe)' }}>
                    Reconocimiento de voz activo
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Palabras que activan SOS: <strong style={{ color: 'var(--danger)' }}>ayuda</strong>,{' '}
                  <strong style={{ color: 'var(--danger)' }}>socorro</strong>,{' '}
                  <strong style={{ color: 'var(--danger)' }}>auxilio</strong>,{' '}
                  <strong style={{ color: 'var(--danger)' }}>policía</strong>,{' '}
                  <strong style={{ color: 'var(--danger)' }}>emergencia</strong>,{' '}
                  <strong style={{ color: 'var(--danger)' }}>no me toques</strong>,{' '}
                  <strong style={{ color: 'var(--danger)' }}>suéltame</strong>,{' '}
                  <strong style={{ color: 'var(--danger)' }}>déjame</strong>
                </div>
              </motion.div>
            )}

            <button
              className="btn-primary"
              onClick={toggleAiMonitoring}
              style={{ marginTop: 24 }}
            >
              <Brain size={16} style={{ marginRight: 8 }} />
              {aiMonitoring ? 'Detener monitoreo IA' : 'Iniciar monitoreo IA'}
            </button>

            {!aiAlertActive && (
              <button
                className="btn-secondary"
                onClick={() => triggerAIAlert('Prueba manual de alerta IA')}
                style={{ marginTop: 10 }}
              >
                Probar alerta manual
              </button>
            )}
          </div>
        </div>

        <div>
          <p className="section-label">Registro de análisis en tiempo real</p>
          <div className="ai-log">
            {[...aiLogs].reverse().map((entry, i) => (
              <motion.div
                key={`${entry.time}-${i}`}
                className={`ai-log-entry ${entry.danger ? 'ai-log-entry--danger' : ''}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <span className="ai-log-time">{entry.time}</span>
                <span>{entry.message}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
