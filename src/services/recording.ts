import { notify } from './notifications';

type RecordingCallback = (blob: Blob, duration: number, type: 'video' | 'audio') => void;

class RecordingService {
  private stream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private startTime = 0;
  private onSaved: RecordingCallback | null = null;
  private audioOnly = false;

  getStream(): MediaStream | null {
    return this.stream;
  }

  isActive(): boolean {
    return this.recorder?.state === 'recording';
  }

  async start(
    withVideo: boolean,
    withAudio: boolean,
    onSaved: RecordingCallback
  ): Promise<MediaStream> {
    if (this.isActive()) await this.stop();

    this.onSaved = onSaved;
    this.audioOnly = !withVideo && withAudio;
    this.chunks = [];

    const constraints: MediaStreamConstraints = {
      audio: withAudio,
      video: withVideo ? { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } : false,
    };

    this.stream = await navigator.mediaDevices.getUserMedia(constraints);

    const mimeType = withVideo
      ? MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm'
      : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';

    this.recorder = new MediaRecorder(this.stream, { mimeType });
    this.startTime = Date.now();

    this.recorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };

    this.recorder.onstop = () => {
      const duration = Math.round((Date.now() - this.startTime) / 1000);
      const type = this.audioOnly ? 'audio' : 'video';
      const blob = new Blob(this.chunks, { type: this.recorder?.mimeType ?? (type === 'audio' ? 'audio/webm' : 'video/webm') });
      if (blob.size > 0 && this.onSaved) {
        this.onSaved(blob, duration, type);
      }
      this.chunks = [];
    };

    this.recorder.start(1000);
    return this.stream;
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.recorder || this.recorder.state === 'inactive') {
        this.cleanup();
        resolve();
        return;
      }
      this.recorder.onstop = () => {
        const duration = Math.round((Date.now() - this.startTime) / 1000);
        const type = this.audioOnly ? 'audio' : 'video';
        const blob = new Blob(this.chunks, {
          type: this.recorder?.mimeType ?? (type === 'audio' ? 'audio/webm' : 'video/webm'),
        });
        if (blob.size > 0 && this.onSaved) {
          this.onSaved(blob, duration, type);
        }
        this.chunks = [];
        this.cleanup();
        resolve();
      };
      this.recorder.stop();
    });
  }

  private cleanup(): void {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.recorder = null;
  }
}

export const recordingService = new RecordingService();

export function captureClip(
  durationMs: number,
  withVideo: boolean,
  withAudio: boolean
): Promise<{ blob: Blob; type: 'video' | 'audio' }> {
  return new Promise(async (resolve, reject) => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: withAudio,
        video: withVideo
          ? { facingMode: 'environment', width: { ideal: 720 }, height: { ideal: 480 } }
          : false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const isAudioOnly = !withVideo && withAudio;
      const mimeType = withVideo
        ? MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : 'video/webm'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4';

      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const type = isAudioOnly ? 'audio' : 'video';
        const blob = new Blob(chunks, { type: mimeType });
        resolve({ blob, type });
      };

      recorder.start(500);
      setTimeout(() => {
        if (recorder.state === 'recording') recorder.stop();
      }, durationMs);
    } catch (err) {
      reject(err);
    }
  });
}

export async function requestMediaPermissions(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    stream.getTracks().forEach((t) => t.stop());
    return true;
  } catch {
    notify('Permisos requeridos', 'Activa cámara y micrófono para grabar evidencia.');
    return false;
  }
}
