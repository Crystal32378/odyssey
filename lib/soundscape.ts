export const SOUNDSCAPE_PREFERENCE_KEY = "odyssey.soundscape.muted.v1";
export const SEA_AMBIENCE_SOURCE = "/audio/aegean-sea-ambience.mp3";
export const SAILING_SOURCE = "/audio/wooden-ship-sailing.wav";
export const SAILING_DURATION_MS = 4_000;

const AMBIENCE_VOLUME = 0.13;
const DUCKED_VOLUME = 0.035;
const SHIP_VOLUME = 0.11;
const FADE_STEPS = 8;
const FADE_STEP_MS = 35;

export interface SoundscapeSnapshot {
  muted: boolean;
  active: boolean;
  voiceActive: boolean;
  sailing: boolean;
}

interface AudioLayer {
  currentTime: number;
  loop: boolean;
  muted: boolean;
  preload: string;
  volume: number;
  onended: (() => void) | null;
  onerror: (() => void) | null;
  pause(): void;
  play(): Promise<void>;
}

type AudioFactory = (source: string) => AudioLayer;
type PreferenceStore = Pick<Storage, "getItem" | "setItem">;

export class SoundscapeController {
  private readonly createAudio: AudioFactory;
  private readonly preferences?: PreferenceStore;
  private ambience: AudioLayer | null = null;
  private ship: AudioLayer | null = null;
  private active = false;
  private muted = false;
  private voiceActive = false;
  private sailing = false;
  private fadeTimer: ReturnType<typeof setInterval> | null = null;
  private sailingTimer: ReturnType<typeof setTimeout> | null = null;
  private listeners = new Set<() => void>();

  constructor(createAudio: AudioFactory, preferences?: PreferenceStore) {
    this.createAudio = createAudio;
    this.preferences = preferences;
    try { this.muted = preferences?.getItem(SOUNDSCAPE_PREFERENCE_KEY) === "true"; } catch { /* Silence is the safe preference fallback. */ }
  }

  snapshot = (): SoundscapeSnapshot => ({ muted: this.muted, active: this.active, voiceActive: this.voiceActive, sailing: this.sailing });

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  enterJourney() {
    if (this.active) return;
    this.active = true;
    if (!this.muted) this.startAmbience();
    this.notify();
  }

  leaveJourney() {
    this.active = false;
    this.voiceActive = false;
    this.stopSailing();
    this.stopFade();
    this.ambience?.pause();
    if (this.ambience) this.ambience.currentTime = 0;
    this.notify();
  }

  toggleMute() {
    this.muted = !this.muted;
    try { this.preferences?.setItem(SOUNDSCAPE_PREFERENCE_KEY, String(this.muted)); } catch { /* Preference persistence must never affect the Journey. */ }
    if (this.muted) {
      this.stopFade();
      if (this.ambience) { this.ambience.muted = true; this.ambience.pause(); }
      this.stopSailing();
    } else if (this.active) {
      if (this.ambience) this.ambience.muted = false;
      this.startAmbience(true);
    }
    this.notify();
  }

  setVoiceActive(active: boolean) {
    if (this.voiceActive === active) return;
    this.voiceActive = active;
    if (this.active && !this.muted) this.fadeAmbience(active ? DUCKED_VOLUME : AMBIENCE_VOLUME);
    this.notify();
  }

  startSailing() {
    this.stopSailing();
    if (!this.active || this.muted) return;
    const ship = this.ship || this.makeLayer(SAILING_SOURCE, false, SHIP_VOLUME);
    this.ship = ship;
    ship.currentTime = 0;
    ship.muted = false;
    this.sailing = true;
    this.notify();
    void ship.play().catch(() => this.stopSailing());
    this.sailingTimer = setTimeout(() => this.stopSailing(), SAILING_DURATION_MS);
  }

  stopSailing() {
    if (this.sailingTimer) clearTimeout(this.sailingTimer);
    this.sailingTimer = null;
    this.ship?.pause();
    if (this.ship) this.ship.currentTime = 0;
    const changed = this.sailing;
    this.sailing = false;
    if (changed) this.notify();
  }

  private startAmbience(fadeIn = true) {
    const ambience = this.ambience || this.makeLayer(SEA_AMBIENCE_SOURCE, true, fadeIn ? 0 : AMBIENCE_VOLUME);
    this.ambience = ambience;
    ambience.muted = false;
    if (fadeIn) ambience.volume = 0;
    void ambience.play().then(() => {
      this.fadeAmbience(this.voiceActive ? DUCKED_VOLUME : AMBIENCE_VOLUME);
    }).catch(() => {
      ambience.pause();
    });
  }

  private makeLayer(source: string, loop: boolean, volume: number) {
    const layer = this.createAudio(source);
    layer.loop = loop;
    layer.preload = "none";
    layer.volume = volume;
    layer.muted = this.muted;
    layer.onerror = () => {
      layer.pause();
      if (layer === this.ship) this.stopSailing();
    };
    if (!loop) layer.onended = () => this.stopSailing();
    return layer;
  }

  private fadeAmbience(target: number) {
    const ambience = this.ambience;
    if (!ambience || this.muted) return;
    this.stopFade();
    const start = ambience.volume;
    let step = 0;
    this.fadeTimer = setInterval(() => {
      step += 1;
      ambience.volume = Math.max(0, Math.min(1, start + (target - start) * (step / FADE_STEPS)));
      if (step >= FADE_STEPS) this.stopFade();
    }, FADE_STEP_MS);
  }

  private stopFade() {
    if (this.fadeTimer) clearInterval(this.fadeTimer);
    this.fadeTimer = null;
  }

  private notify() {
    for (const listener of this.listeners) listener();
  }
}

function browserAudio(source: string): AudioLayer {
  return new Audio(source);
}

export const soundscape = typeof window === "undefined"
  ? null
  : new SoundscapeController(browserAudio, window.localStorage);
