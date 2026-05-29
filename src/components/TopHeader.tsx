import { Bell, Search, User } from 'lucide-react';
import { useApp, type Screen } from '../context/AppContext';

const pageTitles: Record<Screen, { title: string; subtitle: string }> = {
  home: { title: 'Panel de control', subtitle: 'Bienvenida, Gabriela — tu red de protección está activa' },
  recording: { title: 'Grabación discreta', subtitle: 'Simula una app normal mientras grabas en segundo plano' },
  alert: { title: 'Alertas de emergencia', subtitle: 'Comparte ubicación y notifica a tus contactos' },
  route: { title: 'Camino seguro', subtitle: 'Ruta trazada con seguimiento en vivo' },
  ai: { title: 'Detección IA', subtitle: 'Análisis inteligente de riesgo en tiempo real' },
  evidence: { title: 'Evidencia', subtitle: 'Historial cifrado y respaldo en la nube' },
};

export function TopHeader() {
  const { currentScreen, status } = useApp();
  const page = pageTitles[currentScreen];

  return (
    <header className="top-header">
      <div className="top-header-left">
        <h1 className="page-title">{page.title}</h1>
        <p className="page-subtitle">{page.subtitle}</p>
      </div>

      <div className="top-header-right">
        <button className="header-icon-btn" aria-label="Buscar">
          <Search size={18} />
        </button>
        <button className="header-icon-btn header-icon-btn--alert" aria-label="Notificaciones">
          <Bell size={18} />
          {status === 'risk' && <span className="notif-dot" />}
        </button>
        <div className="header-user">
          <div className="header-user-info">
            <span className="header-user-name">Gabriela M.</span>
            <span className="header-user-role">Usuario premium</span>
          </div>
          <div className="header-avatar">
            <User size={18} />
          </div>
        </div>
      </div>
    </header>
  );
}
