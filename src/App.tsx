import { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { HUDOverlay } from './components/HUDOverlay';
import { PermissionsBanner } from './components/PermissionsBanner';
import { HomeScreen } from './screens/HomeScreen';
import { RecordingScreen } from './screens/RecordingScreen';
import { AlertScreen } from './screens/AlertScreen';
import { SafeRouteScreen } from './screens/SafeRouteScreen';
import { AIRiskScreen } from './screens/AIRiskScreen';
import { EvidenceScreen } from './screens/EvidenceScreen';
import { SOSActiveBar } from './components/SOSActiveBar';
import { CancelSOSModal } from './components/CancelSOSModal';
import { AnimatePresence, motion } from 'framer-motion';

function ScreenRouter() {
  const { currentScreen } = useApp();

  const screens = {
    home: HomeScreen,
    recording: RecordingScreen,
    alert: AlertScreen,
    route: SafeRouteScreen,
    ai: AIRiskScreen,
    evidence: EvidenceScreen,
  };

  const Screen = screens[currentScreen];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentScreen}
        className="page-view"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25 }}
      >
        <Screen />
      </motion.div>
    </AnimatePresence>
  );
}

function AppContent() {
  const { alertSent } = useApp();
  const [showCancelModal, setShowCancelModal] = useState(false);

  return (
    <div className="web-app">
      <Sidebar />
      <div className="web-main">
        <HUDOverlay />
        <TopHeader />
        <PermissionsBanner />
        {alertSent && <SOSActiveBar onCancelClick={() => setShowCancelModal(true)} />}
        <main className="web-content">
          <ScreenRouter />
        </main>
      </div>
      <AnimatePresence>
        {showCancelModal && (
          <CancelSOSModal onClose={() => setShowCancelModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
