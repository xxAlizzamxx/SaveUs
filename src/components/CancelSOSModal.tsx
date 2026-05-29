import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, X, Loader } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface CancelSOSModalProps {
  onClose: () => void;
}

export function CancelSOSModal({ onClose }: CancelSOSModalProps) {
  const { cancelSOS } = useApp();
  const [cancelling, setCancelling] = useState(false);
  const [done, setDone] = useState(false);

  const handleConfirm = async () => {
    setCancelling(true);
    await cancelSOS();
    setDone(true);
    setTimeout(() => onClose(), 1500);
  };

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="modal-content"
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {!cancelling && !done && (
          <>
            <button
              style={{ position: 'absolute', top: 16, right: 16, color: 'var(--text-muted)' }}
              onClick={onClose}
            >
              <X size={20} />
            </button>
            <div className="modal-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)' }}>
              <ShieldCheck size={28} />
            </div>
            <h2 className="modal-title">¿Cancelar emergencia?</h2>
            <p className="modal-text">
              Se detendrá la alarma, la grabación y el rastreo GPS. Se notificará a tus contactos que estás a salvo.
            </p>
            <div className="modal-actions">
              <button className="btn-primary" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }} onClick={handleConfirm}>
                Sí, estoy a salvo
              </button>
              <button className="btn-secondary" onClick={onClose}>
                No, mantener alerta activa
              </button>
            </div>
          </>
        )}

        {cancelling && !done && (
          <div style={{ padding: '24px 0' }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{ display: 'inline-block', color: 'var(--safe)' }}
            >
              <Loader size={40} />
            </motion.div>
            <h2 className="modal-title" style={{ marginTop: 16 }}>Desactivando alerta...</h2>
            <p className="modal-text">Notificando a tus contactos</p>
          </div>
        )}

        {done && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{ padding: '24px 0' }}
          >
            <div className="modal-icon modal-icon--success">
              <ShieldCheck size={32} />
            </div>
            <h2 className="modal-title" style={{ color: 'var(--safe)' }}>Estás a salvo</h2>
            <p className="modal-text">La emergencia ha sido cancelada y tus contactos fueron notificados.</p>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
