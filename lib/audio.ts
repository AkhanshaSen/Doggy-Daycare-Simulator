const MUTE_KEY = "doggy-daycare-mute";

type SoundName = "click" | "success" | "bark" | "slurp" | "ambient";

class AudioManager {
  private ctx: AudioContext | null = null;
  private muted = true;
  private unlocked = false;
  private ambientNodes: { osc: OscillatorNode; gain: GainNode }[] = [];
  private ambientPlaying = false;

  constructor() {
    if (typeof window !== "undefined") {
      try {
        const stored = window.localStorage.getItem(MUTE_KEY);
        // Default muted until first interaction; remember preference after unlock
        this.muted = stored === null ? true : stored === "1";
      } catch {
        this.muted = true;
      }
    }
  }

  isMuted(): boolean {
    return this.muted;
  }

  isUnlocked(): boolean {
    return this.unlocked;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
      } catch {
        // ignore
      }
    }
    if (muted) {
      this.stopAmbient();
    } else if (this.unlocked) {
      this.startAmbient();
    }
  }

  unlock(): void {
    if (this.unlocked) return;
    this.unlocked = true;
    this.ensureCtx();
    // After first interaction, unmute if user hasn't explicitly muted
    if (typeof window !== "undefined") {
      try {
        const stored = window.localStorage.getItem(MUTE_KEY);
        if (stored === null) {
          this.muted = false;
          window.localStorage.setItem(MUTE_KEY, "0");
        } else {
          this.muted = stored === "1";
        }
      } catch {
        this.muted = false;
      }
    }
    if (!this.muted) {
      this.startAmbient();
    }
  }

  private ensureCtx(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctx) return null;
      this.ctx = new Ctx();
    }
    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  play(name: SoundName): void {
    if (this.muted || !this.unlocked) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;

    try {
      if (name === "click") this.tone(ctx, 600, 0.05, "square", 0.04);
      else if (name === "success") this.jingle(ctx);
      else if (name === "bark") this.bark(ctx);
      else if (name === "slurp") this.tone(ctx, 180, 0.12, "sine", 0.05);
    } catch {
      // Audio failures should never break the UI
    }
  }

  private tone(
    ctx: AudioContext,
    freq: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    delay = 0,
  ): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = 0;
    osc.connect(gain);
    gain.connect(ctx.destination);
    const t = ctx.currentTime + delay;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(volume, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  }

  private jingle(ctx: AudioContext): void {
    this.tone(ctx, 523, 0.1, "triangle", 0.06, 0);
    this.tone(ctx, 659, 0.1, "triangle", 0.06, 0.1);
    this.tone(ctx, 784, 0.15, "triangle", 0.07, 0.2);
  }

  private bark(ctx: AudioContext): void {
    this.tone(ctx, 280, 0.08, "sawtooth", 0.05, 0);
    this.tone(ctx, 220, 0.1, "sawtooth", 0.04, 0.07);
  }

  startAmbient(): void {
    if (this.muted || !this.unlocked || this.ambientPlaying) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;

    try {
      // Soft two-tone drone + gentle noise-like pulse
      const configs = [
        { freq: 110, vol: 0.008 },
        { freq: 165, vol: 0.006 },
      ];
      this.ambientNodes = [];
      for (const c of configs) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = c.freq;
        gain.gain.value = c.vol;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        this.ambientNodes.push({ osc, gain });
      }
      this.ambientPlaying = true;
    } catch {
      this.ambientPlaying = false;
    }
  }

  stopAmbient(): void {
    for (const node of this.ambientNodes) {
      try {
        node.osc.stop();
        node.osc.disconnect();
        node.gain.disconnect();
      } catch {
        // ignore
      }
    }
    this.ambientNodes = [];
    this.ambientPlaying = false;
  }
}

let manager: AudioManager | null = null;

export function getAudio(): AudioManager {
  if (!manager) manager = new AudioManager();
  return manager;
}
