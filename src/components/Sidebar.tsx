import { motion } from 'framer-motion';
import {
  Home,
  Video,
  Bell,
  MapPin,
  Brain,
  FolderLock,
  Shield,
} from 'lucide-react';
import { useApp, type Screen } from '../context/AppContext';

const navItems: { id: Screen; label: string; desc: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Inicio', desc: 'Panel principal', icon: Home },
  { id: 'recording', label: 'Grabación', desc: 'Modo discreto', icon: Video },
  { id: 'alert', label: 'Alertas', desc: 'Emergencias', icon: Bell },
  { id: 'route', label: 'Camino seguro', desc: 'Ruta en vivo', icon: MapPin },
  { id: 'ai', label: 'Detección IA', desc: 'Análisis de riesgo', icon: Brain },
  { id: 'evidence', label: 'Evidencia', desc: 'Archivos seguros', icon: FolderLock },
];

export function Sidebar() {
  const { currentScreen, setScreen, vibrate, status } = useApp();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="app-logo-icon">
          <Shield size={20} color="white" />
        </div>
        <div>
          <div className="sidebar-brand-name">SaveUs</div>
          <div className="sidebar-brand-tag">Protección inteligente</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(({ id, label, desc, icon: Icon }) => (
          <motion.button
            key={id}
            className={`sidebar-link ${currentScreen === id ? 'sidebar-link--active' : ''}`}
            onClick={() => {
              setScreen(id);
              vibrate(30);
            }}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="sidebar-link-icon">
              <Icon size={20} strokeWidth={currentScreen === id ? 2.5 : 1.8} />
            </span>
            <span className="sidebar-link-text">
              <span className="sidebar-link-label">{label}</span>
              <span className="sidebar-link-desc">{desc}</span>
            </span>
          </motion.button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className={`sidebar-status sidebar-status--${status}`}>
          <span className="status-dot" />
          {status === 'safe' ? 'Estado: Segura' : 'Estado: En riesgo'}
        </div>
      </div>
    </aside>
  );
}
