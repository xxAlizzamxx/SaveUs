import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import {
  activarEmergenciaAgentKit,
  actualizarUbicacionAgentKit,
  cancelarEmergenciaAgentKit,
} from '../services/agentkit';
import type { AiLogEntry, EmergencyContact, EvidenceRecord, GeoLocation, RoutePoint, SOSOrigin } from '../types';
import {
  getContacts,
  saveContact,
  deleteContact,
  saveEvidence,
  getEvidenceList,
  deleteEvidence,
  addRoutePoint,
  getRoutePoints,
  clearRoute,
} from '../services/storage';
import {
  getCurrentPosition,
  watchPosition,
  stopWatching,
  reverseGeocode,
  googleMapsUrl,
} from '../services/geolocation';
import { recordingService, requestMediaPermissions, captureClip } from '../services/recording';
import { audioMonitor } from '../services/audioMonitor';
import {
  notify,
  requestNotificationPermission,
  shareLocation,
  openSms,
} from '../services/notifications';
import { alarmService } from '../services/alarm';

export type AppStatus = 'safe' | 'risk';
export type Screen = 'home' | 'recording' | 'alert' | 'route' | 'ai' | 'evidence';

interface AppState {
  status: AppStatus;
  isRecording: boolean;
  alertSent: boolean;
  safeMode: boolean;
  aiAlertActive: boolean;
  aiMonitoring: boolean;
  riskLevel: number;
  audioLevel: number;
  recordingAudio: boolean;
  recordingVideo: boolean;
  currentScreen: Screen;
  location: GeoLocation | null;
  locationError: string | null;
  contacts: EmergencyContact[];
  notifiedContactIds: string[];
  evidence: EvidenceRecord[];
  routePath: RoutePoint[];
  mediaStream: MediaStream | null;
  aiLogs: AiLogEntry[];
  permissionsReady: boolean;
  alarmActive: boolean;
  sosOrigin: SOSOrigin | null;
  sosClipUrl: string | null;
  sosClipType: 'video' | 'audio' | null;
  setScreen: (screen: Screen) => void;
  toggleRecording: () => Promise<void>;
  sendAlert: () => Promise<void>;
  activateSOS: () => Promise<void>;
  toggleSafeMode: () => Promise<void>;
  toggleAiMonitoring: () => Promise<void>;
  triggerAIAlert: (reason?: string) => void;
  setRecordingAudio: (v: boolean) => void;
  setRecordingVideo: (v: boolean) => void;
  addContact: (contact: Omit<EmergencyContact, 'id' | 'initials'>) => Promise<void>;
  removeContact: (id: string) => Promise<void>;
  notifyContact: (id: string, locOverride?: GeoLocation) => Promise<void>;
  cancelSOS: () => Promise<void>;
  shareCurrentLocation: () => Promise<void>;
  refreshEvidence: () => Promise<void>;
  removeEvidence: (id: string) => Promise<void>;
  startRouteTracking: () => Promise<void>;
  stopRouteTracking: () => void;
  vibrate: (pattern?: number | number[]) => void;
  agentkitEmergenciaId: string | null;
}

const AppContext = createContext<AppState | null>(null);

function nowTime(): string {
  return new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AppStatus>('safe');
  const [isRecording, setIsRecording] = useState(false);
  const [alertSent, setAlertSent] = useState(false);
  const [safeMode, setSafeMode] = useState(false);
  const [aiAlertActive, setAiAlertActive] = useState(false);
  const [aiMonitoring, setAiMonitoring] = useState(false);
  const [riskLevel, setRiskLevel] = useState(8);
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordingAudio, setRecordingAudio] = useState(true);
  const [recordingVideo, setRecordingVideo] = useState(true);
  const [currentScreen, setScreen] = useState<Screen>('home');
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [notifiedContactIds, setNotifiedContactIds] = useState<string[]>([]);
  const [evidence, setEvidence] = useState<EvidenceRecord[]>([]);
  const [routePath, setRoutePath] = useState<RoutePoint[]>([]);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [aiLogs, setAiLogs] = useState<AiLogEntry[]>([
    { time: nowTime(), message: 'Sistema IA iniciado — monitoreo listo', danger: false },
  ]);
  const [permissionsReady, setPermissionsReady] = useState(false);
  const [alarmActive, setAlarmActive] = useState(false);
  const [sosOrigin, setSosOrigin] = useState<SOSOrigin | null>(null);
  const [sosClipUrl, setSosClipUrl] = useState<string | null>(null);
  const [sosClipType, setSosClipType] = useState<'video' | 'audio' | null>(null);
  const [agentkitEmergenciaId, setAgentkitEmergenciaId] = useState<string | null>(null);

  const recordingRef = useRef(false);
  const aiTriggeredRef = useRef(false);
  const agentkitIdRef = useRef<string | null>(null);
  const locationRef = useRef<GeoLocation | null>(null);
  const locationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const vibrate = useCallback((pattern: number | number[] = 100) => {
    if ('vibrate' in navigator) navigator.vibrate(pattern);
  }, []);

  const addLog = useCallback((message: string, danger = false) => {
    setAiLogs((prev) => [...prev.slice(-19), { time: nowTime(), message, danger }]);
  }, []);

  const refreshEvidence = useCallback(async () => {
    const list = await getEvidenceList();
    setEvidence(list);
  }, []);

  const saveRecording = useCallback(
    async (blob: Blob, duration: number, type: 'video' | 'audio') => {
      const title =
        type === 'video'
          ? alertSent
            ? 'Grabación de alerta SOS'
            : safeMode
              ? 'Grabación modo seguro'
              : 'Grabación de video'
          : 'Grabación de audio';
      await saveEvidence(blob, type, title, duration);
      await refreshEvidence();
      addLog(`Evidencia guardada: ${title} (${duration}s)`, alertSent);
      notify('Evidencia guardada', `${title} — ${duration}s almacenados localmente.`);
    },
    [alertSent, safeMode, refreshEvidence, addLog]
  );

  const startRecordingInternal = useCallback(async () => {
    if (recordingRef.current) return;
    if (!recordingVideo && !recordingAudio) {
      notify('Grabación', 'Activa al menos audio o video.');
      return;
    }
    try {
      const stream = await recordingService.start(recordingVideo, recordingAudio, saveRecording);
      recordingRef.current = true;
      setIsRecording(true);
      setMediaStream(stream);
      addLog('Grabación iniciada en segundo plano', false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al acceder a cámara/micrófono';
      setLocationError(msg);
      notify('Error de grabación', msg);
    }
  }, [recordingVideo, recordingAudio, saveRecording, addLog]);

  const stopRecordingInternal = useCallback(async () => {
    if (!recordingRef.current) return;
    await recordingService.stop();
    recordingRef.current = false;
    setIsRecording(false);
    setMediaStream(null);
    addLog('Grabación detenida y guardada', false);
  }, [addLog]);

  const toggleRecording = useCallback(async () => {
    vibrate(50);
    if (recordingRef.current) {
      await stopRecordingInternal();
    } else {
      await startRecordingInternal();
    }
  }, [vibrate, stopRecordingInternal, startRecordingInternal]);

  const updateLocation = useCallback(async (loc: GeoLocation) => {
    locationRef.current = loc;
    setLocation(loc);
    setLocationError(null);
    const address = await reverseGeocode(loc.lat, loc.lng);
    if (address) setLocation((prev) => (prev ? { ...prev, address } : prev));
  }, []);

  const notifyContact = useCallback(
    async (id: string, locOverride?: GeoLocation) => {
      const contact = contacts.find((c) => c.id === id);
      const loc = locOverride ?? location;
      if (!contact || !loc) return;
      const url = googleMapsUrl(loc.lat, loc.lng);
      const msg = `¡EMERGENCIA! Necesito ayuda urgente.\n📍 ${loc.address ?? `${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}`}\n🗺️ ${url}`;
      setNotifiedContactIds((prev) => (prev.includes(id) ? prev : [...prev, id]));

      // Los contactos con WhatsApp se notifican automáticamente vía AgentKit.
      // Solo abrimos SMS para números cortos / servicios de emergencia (ej. 123).
      if (contact.phone.replace(/\D/g, '').length <= 8) {
        openSms(contact.phone, msg);
      }
      notify(`Alerta enviada a ${contact.name}`, 'Se notificó al contacto con tu ubicación.');
    },
    [contacts, location]
  );

  const sendAlert = useCallback(async () => {
    if (alertSent) return;

    const loc = location;

    // Siempre mandar alerta — con o sin ubicación (ANTES de cualquier await para mantener user gesture)
    if (contacts.length > 0) {
      const time = new Date().toLocaleTimeString('es-CO');
      const locationLine = loc
        ? `\n\n📍 ${loc.address ?? `${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}`}\n🗺️ ${googleMapsUrl(loc.lat, loc.lng)}`
        : `\n\n📍 Obteniendo ubicación GPS...`;
      const msg = `🚨 ¡EMERGENCIA SOS — SaveUs!\n\nNecesito ayuda urgente.${locationLine}\n⏰ ${time}`;

      // Los contactos con WhatsApp se notifican automáticamente vía AgentKit.
      // Solo abrimos SMS para números cortos / servicios de emergencia (ej. 123).
      const primary = contacts[0];
      if (primary.phone.replace(/\D/g, '').length <= 8) {
        openSms(primary.phone, msg);
      }

      for (let i = 1; i < contacts.length; i++) {
        const c = contacts[i];
        if (c.phone.replace(/\D/g, '').length <= 8) {
          setTimeout(() => openSms(c.phone, msg), i * 600);
        }
      }
    }

    setAlertSent(true);
    setStatus('risk');
    vibrate([100, 50, 100, 50, 200]);

    let resolvedLoc = loc;
    if (!resolvedLoc) {
      try {
        resolvedLoc = await getCurrentPosition();
        setLocation(resolvedLoc);
      } catch {
        setLocationError('No se pudo obtener ubicación. Activa el GPS.');
      }
    }

    if (resolvedLoc) {
      setSosOrigin({
        lat: resolvedLoc.lat,
        lng: resolvedLoc.lng,
        accuracy: resolvedLoc.accuracy,
        timestamp: Date.now(),
        address: resolvedLoc.address,
      });
    }

    if (!recordingRef.current) await startRecordingInternal();

    alarmService.start(1);
    setAlarmActive(true);

    notify('🚨 Alerta SOS activada', 'Compartiendo ubicación y grabando evidencia.');
    addLog('Alerta SOS activada — alarma sonando — compartiendo ubicación', true);

    for (const c of contacts) {
      setNotifiedContactIds((prev) => prev.includes(c.id) ? prev : [...prev, c.id]);
    }

    // ── Integración AgentKit: envío automático por WhatsApp + link de tracking único ──
    const eid = crypto.randomUUID();
    agentkitIdRef.current = eid;
    setAgentkitEmergenciaId(eid);

    activarEmergenciaAgentKit({
      id: eid,
      nombre_usuario: 'Usuario SaveUs',
      contacts: contacts.map((c) => ({ name: c.name, phone: c.phone, relation: c.relation })),
      location: resolvedLoc
        ? { lat: resolvedLoc.lat, lng: resolvedLoc.lng, accuracy: resolvedLoc.accuracy, timestamp: Date.now(), address: resolvedLoc.address }
        : null,
    }).then((res) => {
      if (res?.tracking_url) addLog(`AgentKit: link de seguimiento generado`, false);
    }).catch(() => {});

    // Enviar actualizaciones de GPS cada 15 segundos mientras la emergencia está activa
    if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
    locationIntervalRef.current = setInterval(() => {
      const loc = locationRef.current;
      const id = agentkitIdRef.current;
      if (id && loc) actualizarUbicacionAgentKit(id, loc.lat, loc.lng, loc.accuracy);
    }, 15000);
    // ── fin AgentKit ──────────────────────────────────────────────────────────

    addLog('Capturando clip de evidencia (15s)...', false);
    captureClip(15000, recordingVideo, recordingAudio)
      .then(async ({ blob, type }) => {
        const clipUrl = URL.createObjectURL(blob);
        setSosClipUrl(clipUrl);
        setSosClipType(type);
        await saveEvidence(blob, type, 'Clip SOS — evidencia automática', 15);
        await refreshEvidence();
        addLog(`Clip de ${type} capturado y guardado (15s)`, false);
        notify('Evidencia lista', 'Clip de 15 segundos guardado. Puedes compartirlo.');

        if (navigator.share && navigator.canShare?.({ files: [new File([blob], `sos-evidencia.webm`, { type: blob.type })] })) {
          const file = new File([blob], `sos-evidencia.webm`, { type: blob.type });
          const evidenceLoc = resolvedLoc;
          const locText = evidenceLoc ? `\n📍 ${evidenceLoc.address ?? `${evidenceLoc.lat.toFixed(5)}, ${evidenceLoc.lng.toFixed(5)}`}` : '';
          navigator.share({
            files: [file],
            title: 'Evidencia SOS — SaveUs',
            text: `🚨 Evidencia de emergencia SOS${locText}`,
          }).catch(() => {});
        }
      })
      .catch(() => {
        addLog('No se pudo capturar clip de evidencia', true);
      });
  }, [vibrate, location, startRecordingInternal, addLog, contacts, alertSent, recordingVideo, recordingAudio, refreshEvidence]);

  const avPrefsRef = useRef({ audio: recordingAudio, video: recordingVideo });

  // Restart recording when AV toggles change while active
  useEffect(() => {
    if (!recordingRef.current) {
      avPrefsRef.current = { audio: recordingAudio, video: recordingVideo };
      return;
    }
    if (
      avPrefsRef.current.audio !== recordingAudio ||
      avPrefsRef.current.video !== recordingVideo
    ) {
      avPrefsRef.current = { audio: recordingAudio, video: recordingVideo };
      stopRecordingInternal().then(() => startRecordingInternal());
    }
  }, [recordingAudio, recordingVideo, stopRecordingInternal, startRecordingInternal]);

  const activateSOS = useCallback(async () => {
    await sendAlert();
    setScreen('alert');
  }, [sendAlert]);

  const cancelSOS = useCallback(async () => {
    // La cancelación se notifica automáticamente a los contactos vía AgentKit
    // (cancelarEmergenciaAgentKit más abajo).
    alarmService.stop();
    setAlarmActive(false);
    setAlertSent(false);
    setStatus('safe');
    setAiAlertActive(false);
    setNotifiedContactIds([]);
    if (sosClipUrl) URL.revokeObjectURL(sosClipUrl);
    setSosClipUrl(null);
    setSosClipType(null);
    setSosOrigin(null);

    if (recordingRef.current) await stopRecordingInternal();
    if (!safeMode) stopWatching();

    // Notificar cancelación a AgentKit (detiene interval y avisa contactos)
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }
    const eid = agentkitIdRef.current;
    if (eid) {
      cancelarEmergenciaAgentKit(eid).catch(() => {});
      agentkitIdRef.current = null;
      setAgentkitEmergenciaId(null);
    }

    addLog('Emergencia cancelada — sistema en modo seguro', false);
    notify('Emergencia cancelada', 'Se ha desactivado la alerta. Estás a salvo.');

    setScreen('home');
  }, [safeMode, stopRecordingInternal, addLog]);

  const toggleSafeMode = useCallback(async () => {
    const next = !safeMode;
    setSafeMode(next);
    vibrate(80);

    if (next) {
      setStatus('safe');
      addLog('Modo seguro activado', false);
      notify('Modo seguro', 'Ubicación y grabación activadas.');
      if (!recordingRef.current) await startRecordingInternal();
      watchPosition(
        (loc) => updateLocation(loc),
        (err) => setLocationError(err)
      );
    } else {
      addLog('Modo seguro desactivado', false);
      if (!alertSent) stopWatching();
      if (!alertSent && !aiAlertActive) await stopRecordingInternal();
    }
  }, [
    safeMode,
    vibrate,
    addLog,
    startRecordingInternal,
    updateLocation,
    alertSent,
    aiAlertActive,
    stopRecordingInternal,
  ]);

  const triggerAIAlert = useCallback(
    (reason = 'Sonido sospechoso detectado') => {
      if (aiTriggeredRef.current) return;
      aiTriggeredRef.current = true;
      setTimeout(() => {
        aiTriggeredRef.current = false;
      }, 10000);

      setAiAlertActive(true);
      setRiskLevel(Math.min(100, Math.max(70, audioLevel + 25)));
      setStatus('risk');
      vibrate([200, 100, 200, 100, 200]);
      addLog(`${reason} — activando protocolo`, true);
      notify('⚠️ Alerta IA', reason);
      if (!alertSent) {
        sendAlert();
      } else if (!recordingRef.current) {
        startRecordingInternal();
      }
    },
    [audioLevel, vibrate, addLog, alertSent, sendAlert, startRecordingInternal]
  );

  const toggleAiMonitoring = useCallback(async () => {
    if (aiMonitoring) {
      audioMonitor.stop();
      setAiMonitoring(false);
      setAudioLevel(0);
      addLog('Monitoreo de audio detenido', false);
      return;
    }

    try {
      await audioMonitor.start(
        (level) => {
          setAudioLevel(level);
          setRiskLevel((prev) => (aiAlertActive ? prev : Math.max(8, Math.min(60, Math.round(level * 0.7)))));
        },
        () => triggerAIAlert('Nivel de audio anómalo detectado'),
        62,
        (word, transcript) => {
          addLog(`🎙️ Palabra detectada: "${word}" en: "${transcript}"`, true);
          triggerAIAlert(`Palabra de auxilio detectada: "${word.toUpperCase()}"`);
        }
      );
      setAiMonitoring(true);
      addLog('Monitoreo de audio + reconocimiento de voz activo', false);
      addLog('Escuchando palabras clave: ayuda, socorro, auxilio, policía...', false);
      notify('IA activa', 'Analizando audio y reconocimiento de voz en tiempo real.');
    } catch {
      notify('Micrófono requerido', 'Permite acceso al micrófono para la detección IA.');
    }
  }, [aiMonitoring, addLog, aiAlertActive, triggerAIAlert]);

  const addContact = useCallback(async (data: Omit<EmergencyContact, 'id' | 'initials'>) => {
    const initials = data.name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 3)
      .toUpperCase();
    const contact: EmergencyContact = { ...data, id: crypto.randomUUID(), initials };
    await saveContact(contact);
    setContacts((prev) => [...prev, contact]);
  }, []);

  const removeContact = useCallback(async (id: string) => {
    await deleteContact(id);
    setContacts((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const shareCurrentLocation = useCallback(async () => {
    if (!location) {
      try {
        const loc = await getCurrentPosition();
        setLocation(loc);
        const url = googleMapsUrl(loc.lat, loc.lng);
        await shareLocation(`Mi ubicación actual: ${loc.address ?? url}`, url);
      } catch {
        notify('Sin ubicación', 'Activa el GPS para compartir tu ubicación.');
      }
      return;
    }
    const url = googleMapsUrl(location.lat, location.lng);
    await shareLocation(`Mi ubicación: ${location.address ?? url}`, url);
  }, [location]);

  const removeEvidence = useCallback(
    async (id: string) => {
      await deleteEvidence(id);
      await refreshEvidence();
    },
    [refreshEvidence]
  );

  const startRouteTracking = useCallback(async () => {
    await clearRoute();
    setRoutePath([]);
    stopWatching();
    watchPosition(
      async (loc) => {
        await updateLocation(loc);
        const point: RoutePoint = { lat: loc.lat, lng: loc.lng, timestamp: loc.timestamp };
        await addRoutePoint(point);
        setRoutePath((prev) => [...prev, point]);
      },
      (err) => setLocationError(err)
    );
  }, [updateLocation]);

  const stopRouteTracking = useCallback(() => {
    stopWatching();
  }, []);

  // Init
  useEffect(() => {
    (async () => {
      await requestNotificationPermission();
      await requestMediaPermissions();
      const [loadedContacts, loadedEvidence, loadedRoute] = await Promise.all([
        getContacts(),
        getEvidenceList(),
        getRoutePoints(),
      ]);
      setContacts(loadedContacts);
      setEvidence(loadedEvidence);
      setRoutePath(loadedRoute);
      setPermissionsReady(true);

      try {
        const loc = await getCurrentPosition();
        await updateLocation(loc);
      } catch {
        setLocationError('Permite acceso a ubicación para funciones de seguridad.');
      }
    })();
  }, [updateLocation]);

  // Set sosOrigin as soon as location becomes available after SOS
  useEffect(() => {
    if (alertSent && location && !sosOrigin) {
      setSosOrigin({
        lat: location.lat,
        lng: location.lng,
        accuracy: location.accuracy,
        timestamp: Date.now(),
        address: location.address,
      });
    }
  }, [alertSent, location, sosOrigin]);

  // Location watch when alert or route screen
  useEffect(() => {
    if (alertSent || currentScreen === 'route') {
      watchPosition(
        (loc) => updateLocation(loc),
        (err) => setLocationError(err)
      );
      return () => {
        if (!safeMode) stopWatching();
      };
    }
  }, [alertSent, currentScreen, safeMode, updateLocation]);

  return (
    <AppContext.Provider
      value={{
        status,
        isRecording,
        alertSent,
        safeMode,
        aiAlertActive,
        aiMonitoring,
        riskLevel,
        audioLevel,
        recordingAudio,
        recordingVideo,
        currentScreen,
        location,
        locationError,
        contacts,
        notifiedContactIds,
        evidence,
        routePath,
        mediaStream,
        aiLogs,
        permissionsReady,
        alarmActive,
        sosOrigin,
        sosClipUrl,
        sosClipType,
        setScreen,
        toggleRecording,
        sendAlert,
        activateSOS,
        toggleSafeMode,
        toggleAiMonitoring,
        triggerAIAlert,
        setRecordingAudio,
        setRecordingVideo,
        addContact,
        removeContact,
        notifyContact,
        cancelSOS,
        shareCurrentLocation,
        refreshEvidence,
        removeEvidence,
        startRouteTracking,
        stopRouteTracking,
        vibrate,
        agentkitEmergenciaId,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
