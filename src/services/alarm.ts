let ctx: AudioContext | null = null;
let gainNode: GainNode | null = null;
let oscillators: OscillatorNode[] = [];
let intervalId: ReturnType<typeof setInterval> | null = null;
let running = false;

function getContext(): AudioContext {
  if (!ctx || ctx.state === 'closed') {
    ctx = new AudioContext();
  }
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  return ctx;
}

function createSiren(audioCtx: AudioContext, gain: GainNode): OscillatorNode[] {
  const now = audioCtx.currentTime;
  const nodes: OscillatorNode[] = [];

  // Primary siren — sweeps 600 Hz ↔ 1200 Hz
  const osc1 = audioCtx.createOscillator();
  osc1.type = 'sawtooth';
  osc1.frequency.setValueAtTime(600, now);
  for (let t = 0; t < 30; t++) {
    osc1.frequency.linearRampToValueAtTime(1200, now + t + 0.5);
    osc1.frequency.linearRampToValueAtTime(600, now + t + 1);
  }
  osc1.connect(gain);
  osc1.start(now);
  nodes.push(osc1);

  // Secondary tone — steady high-pitch pulse for urgency
  const osc2 = audioCtx.createOscillator();
  osc2.type = 'square';
  osc2.frequency.setValueAtTime(1800, now);

  const pulseGain = audioCtx.createGain();
  pulseGain.gain.setValueAtTime(0, now);
  for (let t = 0; t < 60; t++) {
    const base = now + t * 0.5;
    pulseGain.gain.setValueAtTime(0.3, base);
    pulseGain.gain.setValueAtTime(0, base + 0.15);
  }
  osc2.connect(pulseGain);
  pulseGain.connect(gain);
  osc2.start(now);
  nodes.push(osc2);

  return nodes;
}

export const alarmService = {
  start(volume = 1) {
    if (running) return;
    running = true;

    const audioCtx = getContext();
    gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(Math.min(1, Math.max(0, volume)), audioCtx.currentTime);
    gainNode.connect(audioCtx.destination);

    oscillators = createSiren(audioCtx, gainNode);

    // Restart siren every 30s so it never stops
    intervalId = setInterval(() => {
      if (!running) return;
      oscillators.forEach((o) => { try { o.stop(); } catch { /* already stopped */ } });
      oscillators = [];
      const freshCtx = getContext();
      if (gainNode) {
        oscillators = createSiren(freshCtx, gainNode);
      }
    }, 30_000);
  },

  stop() {
    running = false;
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
    oscillators.forEach((o) => { try { o.stop(); } catch { /* already stopped */ } });
    oscillators = [];
    if (gainNode) {
      gainNode.disconnect();
      gainNode = null;
    }
  },

  get isRunning() {
    return running;
  },
};
