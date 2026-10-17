import type { SoundId } from "../sounds";
import { LOOP_SAMPLE_RATE, renderSoundLoop } from "./synth";
import { encodeStereoWav } from "./wav";

const FADE_OUT_SECONDS = 12;

type AudioSessionNavigator = Navigator & {
  audioSession?: { type: string };
};

export class NoiseEngine {
  private audioEl: HTMLAudioElement | null = null;
  private userVolume = 0.7;
  private soundId: SoundId = "white";
  private fading = false;
  private fadeTimer: number | null = null;
  private suppressPauseHandler = false;
  private systemPauseHandler: (() => void) | null = null;
  private readonly urls = new Map<SoundId, string>();
  private currentUrl = "";

  getAudioElement(): HTMLAudioElement | null {
    return this.audioEl;
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

  setSystemPauseHandler(handler: () => void): void {
    this.systemPauseHandler = handler;
  }

  private mount(): HTMLAudioElement {
    if (this.audioEl) {
      return this.audioEl;
    }

    const audioEl = document.createElement("audio");
    audioEl.loop = true;
    audioEl.preload = "auto";
    audioEl.setAttribute("playsinline", "true");
    audioEl.setAttribute("webkit-playsinline", "true");
    audioEl.style.position = "fixed";
    audioEl.style.bottom = "0";
    audioEl.style.left = "0";
    audioEl.style.width = "1px";
    audioEl.style.height = "1px";
    audioEl.style.opacity = "0.01";
    audioEl.style.pointerEvents = "none";
    document.body.appendChild(audioEl);

    audioEl.addEventListener("pause", () => {
      if (this.suppressPauseHandler) {
        return;
      }
      this.clearFade();
      this.systemPauseHandler?.();
    });
    audioEl.addEventListener("timeupdate", () => {
      if (
        !("mediaSession" in navigator) ||
        !Number.isFinite(audioEl.duration)
      ) {
        return;
      }
      const position = Math.min(audioEl.currentTime, audioEl.duration);
      try {
        navigator.mediaSession.setPositionState({
          duration: audioEl.duration,
          playbackRate: audioEl.playbackRate,
          position,
        });
      } catch {
        // Ignore a position that lands past the loop boundary.
      }
    });

    this.audioEl = audioEl;
    return audioEl;
  }

  private sourceFor(soundId: SoundId): string {
    const cached = this.urls.get(soundId);
    if (cached) {
      return cached;
    }
    const samples = renderSoundLoop(soundId);
    const blob = encodeStereoWav(samples, LOOP_SAMPLE_RATE);
    const url = URL.createObjectURL(blob);
    this.urls.set(soundId, url);
    return url;
  }

  private applySource(soundId: SoundId): void {
    const audioEl = this.mount();
    const url = this.sourceFor(soundId);
    if (this.currentUrl !== url) {
      this.currentUrl = url;
      audioEl.src = url;
      audioEl.loop = true;
    }
  }

  async play(): Promise<void> {
    const audioEl = this.mount();
    this.clearFade();
    this.applySource(this.soundId);
    audioEl.volume = this.userVolume;
    this.markPlaybackSession();
    await audioEl.play();
  }

  pause(): void {
    this.clearFade();
    if (!this.audioEl) {
      return;
    }
    this.suppressPauseHandler = true;
    this.audioEl.pause();
    this.suppressPauseHandler = false;
    this.audioEl.volume = this.userVolume;
  }

  setVolume(volume: number): void {
    this.userVolume = Math.min(1, Math.max(0, volume));
    if (!this.audioEl || this.fading) {
      return;
    }
    this.audioEl.volume = this.userVolume;
  }

  setSound(soundId: SoundId): void {
    const wasPlaying = this.isPlaying();
    this.soundId = soundId;
    if (!this.audioEl) {
      return;
    }
    this.applySource(soundId);
    if (wasPlaying) {
      this.markPlaybackSession();
      void this.audioEl.play();
    }
  }

  fadeOutAndPause(onComplete: () => void): void {
    const audioEl = this.audioEl;
    if (!audioEl || audioEl.paused) {
      onComplete();
      return;
    }

    this.clearFade();
    this.fading = true;
    const startedAt = Date.now();
    const from = audioEl.volume;

    this.fadeTimer = window.setInterval(() => {
      const t = Math.min(
        1,
        (Date.now() - startedAt) / (FADE_OUT_SECONDS * 1000),
      );
      audioEl.volume = from * (1 - t);
      if (t < 1) {
        return;
      }
      this.fading = false;
      this.clearFade();
      this.pause();
      audioEl.volume = this.userVolume;
      onComplete();
    }, 250);
  }

  async resumeIfNeeded(shouldBePlaying: boolean): Promise<void> {
    if (!shouldBePlaying || !this.audioEl?.paused) {
      return;
    }
    this.markPlaybackSession();
    await this.audioEl.play();
  }

  private clearFade(): void {
    if (this.fadeTimer !== null) {
      window.clearInterval(this.fadeTimer);
      this.fadeTimer = null;
    }
    this.fading = false;
  }

  private markPlaybackSession(): void {
    const session = (navigator as AudioSessionNavigator).audioSession;
    if (session) {
      session.type = "playback";
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
