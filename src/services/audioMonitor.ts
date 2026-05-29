type LevelCallback = (level: number) => void;
type AlertCallback = () => void;
type KeywordCallback = (word: string, transcript: string) => void;

const DISTRESS_KEYWORDS = [
  'ayuda', 'ayúdame', 'ayudenme', 'ayúdenme',
  'socorro', 'auxilio',
  'help', 'helpme',
  'no me toques', 'no me toque',
  'déjame', 'dejame', 'déjenme', 'dejenme',
  'suéltame', 'sueltame', 'suéltenme', 'sueltenme',
  'policía', 'policia',
  'emergencia',
];

function matchesKeyword(transcript: string): string | null {
  const lower = transcript.toLowerCase().trim();
  for (const kw of DISTRESS_KEYWORDS) {
    if (lower.includes(kw)) return kw;
  }
  return null;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

class AudioMonitorService {
  private context: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private stream: MediaStream | null = null;
  private rafId: number | null = null;
  private onLevel: LevelCallback | null = null;
  private onAlert: AlertCallback | null = null;
  private onKeyword: KeywordCallback | null = null;
  private loudSince = 0;
  private threshold = 65;
  private active = false;

  // Speech recognition
  private recognition: any = null;
  private speechActive = false;
  private lastKeywordTime = 0;

  async start(
    onLevel: LevelCallback,
    onAlert: AlertCallback,
    threshold = 65,
    onKeyword?: KeywordCallback
  ): Promise<void> {
    if (this.active) return;
    this.threshold = threshold;
    this.onLevel = onLevel;
    this.onAlert = onAlert;
    this.onKeyword = onKeyword ?? null;
    this.loudSince = 0;

    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    this.context = new AudioContext();
    const source = this.context.createMediaStreamSource(this.stream);
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 256;
    source.connect(this.analyser);
    this.active = true;
    this.tick();

    // Start speech recognition for keyword detection
    this.startSpeechRecognition();
  }

  private startSpeechRecognition(): void {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('SpeechRecognition no disponible en este navegador');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'es-CO';
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 3;

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        for (let j = 0; j < result.length; j++) {
          const transcript = result[j].transcript;
          const keyword = matchesKeyword(transcript);

          if (keyword) {
            const now = Date.now();
            // Cooldown: don't trigger twice within 10 seconds
            if (now - this.lastKeywordTime > 10000) {
              this.lastKeywordTime = now;
              this.onKeyword?.(keyword, transcript);
            }
          }
        }
      }
    };

    this.recognition.onerror = (event: any) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      console.warn('SpeechRecognition error:', event.error);
    };

    this.recognition.onend = () => {
      // Auto-restart if still active
      if (this.active && this.recognition) {
        try {
          this.recognition.start();
        } catch {
          // Already running or other error, ignore
        }
      }
    };

    try {
      this.recognition.start();
      this.speechActive = true;
    } catch {
      this.speechActive = false;
    }
  }

  private tick = (): void => {
    if (!this.analyser || !this.active) return;
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    const avg = data.reduce((a, b) => a + b, 0) / data.length;
    const level = Math.min(100, Math.round((avg / 128) * 100));
    this.onLevel?.(level);

    if (level >= this.threshold) {
      if (this.loudSince === 0) this.loudSince = Date.now();
      if (Date.now() - this.loudSince > 800) {
        this.onAlert?.();
        this.loudSince = 0;
      }
    } else {
      this.loudSince = 0;
    }

    this.rafId = requestAnimationFrame(this.tick);
  };

  stop(): void {
    this.active = false;
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.stream?.getTracks().forEach((t) => t.stop());
    this.context?.close();
    this.stream = null;
    this.context = null;
    this.analyser = null;
    this.onLevel = null;
    this.onAlert = null;
    this.onKeyword = null;

    // Stop speech recognition
    if (this.recognition) {
      try { this.recognition.stop(); } catch { /* ignore */ }
      this.recognition = null;
    }
    this.speechActive = false;
  }

  isActive(): boolean {
    return this.active;
  }

  isSpeechActive(): boolean {
    return this.speechActive;
  }
}

export const audioMonitor = new AudioMonitorService();
