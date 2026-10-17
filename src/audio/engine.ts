import type { SoundId } from "../sounds";

const FADE_OUT_SECONDS = 12;
const SOUND_SWAP_DIP_SECONDS = 0.04;

export type NoiseEngineState = {
  playing: boolean;
  soundId: SoundId;
  volume: number;
};

export class NoiseEngine {
  private audioContext: AudioContext | null = null;
  private worklet: AudioWorkletNode | null = null;
  private gain: GainNode | null = null;
  private audioEl: HTMLAudioElement | null = null;
  private userVolume = 0.7;
  private soundId: SoundId = "white";
  private initialized = false;
  private fading = false;

  getAudioElement(): HTMLAudioElement | null {
    return this.audioEl;
  }

  getContext(): AudioContext | null {
    return this.audioContext;
  }

  isPlaying(): boolean {
    return Boolean(this.audioEl && !this.audioEl.paused);
  }

  getSoundId(): SoundId {
    return this.soundId;
  }

  getVolume(): number {
    return this.userVolume;
  }

  async ensureReady(): Promise<void> {
    if (this.initialized) {
      if (this.audioContext?.state === "suspended") {
        await this.audioContext.resume();
      }
      return;
    }

    const audioContext = new AudioContext();
    await audioContext.audioWorklet.addModule(
      new URL("./processor.js", import.meta.url),
    );

    const worklet = new AudioWorkletNode(audioContext, "noise-processor");
    const gain = audioContext.createGain();
    const destination = audioContext.createMediaStreamDestination();

    worklet.connect(gain);
    gain.connect(destination);

    const audioEl = new Audio();
    audioEl.srcObject = destination.stream;
    audioEl.loop = true;
    audioEl.setAttribute("playsinline", "true");

    gain.gain.value = this.userVolume;

    worklet.port.postMessage({ type: "set-sound", soundId: this.soundId });

    this.audioContext = audioContext;
    this.worklet = worklet;
    this.gain = gain;
    this.audioEl = audioEl;
    this.initialized = true;
  }

  async play(): Promise<void> {
    await this.ensureReady();
    if (!this.audioEl || !this.audioContext || !this.gain) {
      return;
    }
    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }
    this.fading = false;
    this.gain.gain.cancelScheduledValues(this.audioContext.currentTime);
    this.gain.gain.setTargetAtTime(
      this.userVolume,
      this.audioContext.currentTime,
      0.01,
    );
    await this.audioEl.play();
  }

  pause(): void {
    this.fading = false;
    this.audioEl?.pause();
    if (this.audioContext && this.gain) {
      this.gain.gain.cancelScheduledValues(this.audioContext.currentTime);
      this.gain.gain.setTargetAtTime(
        this.userVolume,
        this.audioContext.currentTime,
        0.01,
      );
    }
  }

  setVolume(volume: number): void {
    this.userVolume = Math.min(1, Math.max(0, volume));
    if (!this.audioContext || !this.gain || this.fading) {
      return;
    }
    this.gain.gain.cancelScheduledValues(this.audioContext.currentTime);
    this.gain.gain.setTargetAtTime(
      this.userVolume,
      this.audioContext.currentTime,
      0.02,
    );
  }

  async setSound(soundId: SoundId): Promise<void> {
    const wasPlaying = this.isPlaying();
    this.soundId = soundId;
    if (!this.worklet || !this.audioContext || !this.gain) {
      return;
    }

    if (wasPlaying) {
      const now = this.audioContext.currentTime;
      this.gain.gain.cancelScheduledValues(now);
      this.gain.gain.setValueAtTime(this.gain.gain.value, now);
      this.gain.gain.linearRampToValueAtTime(
        0.0001,
        now + SOUND_SWAP_DIP_SECONDS,
      );
      this.gain.gain.linearRampToValueAtTime(
        this.userVolume,
        now + SOUND_SWAP_DIP_SECONDS * 2,
      );
    }

    this.worklet.port.postMessage({ type: "set-sound", soundId });
  }

  async fadeOutAndPause(onComplete: () => void): Promise<void> {
    await this.ensureReady();
    if (!this.audioContext || !this.gain || !this.audioEl) {
      onComplete();
      return;
    }
    if (!this.isPlaying()) {
      onComplete();
      return;
    }

    this.fading = true;
    const now = this.audioContext.currentTime;
    this.gain.gain.cancelScheduledValues(now);
    this.gain.gain.setValueAtTime(this.gain.gain.value, now);
    this.gain.gain.linearRampToValueAtTime(0, now + FADE_OUT_SECONDS);

    window.setTimeout(() => {
      this.fading = false;
      this.audioEl?.pause();
      if (this.audioContext && this.gain) {
        this.gain.gain.cancelScheduledValues(this.audioContext.currentTime);
        this.gain.gain.setValueAtTime(
          this.userVolume,
          this.audioContext.currentTime,
        );
      }
      onComplete();
    }, FADE_OUT_SECONDS * 1000);
  }

  async resumeIfNeeded(shouldBePlaying: boolean): Promise<void> {
    if (!shouldBePlaying || !this.audioContext) {
      return;
    }
    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }
  }
}

let sharedEngine: NoiseEngine | null = null;

export function getNoiseEngine(): NoiseEngine {
  if (!sharedEngine) {
    sharedEngine = new NoiseEngine();
  }
  return sharedEngine;
}
