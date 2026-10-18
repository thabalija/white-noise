import type { SoundId } from "../sounds";
import { LOOP_SAMPLE_RATE, renderSoundLoop } from "./synth";
import { encodeStereoWav } from "./wav";

const FADE_OUT_SECONDS = 12;
const HANDOFF_SECONDS = 8;

type AudioSessionNavigator = Navigator & {
  audioSession?: { type: string };
};

export class NoiseEngine {
  private players: HTMLAudioElement[] | null = null;
  private activeIndex = 0;
  private userVolume = 0.7;
  private outputVolume = 0.7;
  private soundId: SoundId = "white";
  private fading = false;
  private fadeTimer: number | null = null;
  private handoff = false;
  private expectEndPause = false;
  private intendedPlaying = false;
  private suppressPauseHandler = false;
  private systemPauseHandler: (() => void) | null = null;
  private readonly urls = new Map<SoundId, string>();
  private currentUrl = "";

  getAudioElement(): HTMLAudioElement | null {
    return this.players?.[this.activeIndex] ?? null;
  }

  isPlaying(): boolean {
    const active = this.players?.[this.activeIndex];
    return Boolean(active && !active.paused);
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

  private mount(): HTMLAudioElement[] {
    if (this.players) {
      return this.players;
    }

    this.players = [0, 1].map((index) => {
      const audioEl = document.createElement("audio");
      audioEl.preload = "auto";
      audioEl.loop = false;
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
        this.onPause(index);
      });
      audioEl.addEventListener("ended", () => {
        this.finishHandoff(index);
      });
      audioEl.addEventListener("timeupdate", () => {
        this.onTimeUpdate(index);
      });
      return audioEl;
    });

    return this.players;
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
    const players = this.mount();
    const url = this.sourceFor(soundId);
    if (this.currentUrl === url) {
      return;
    }
    this.currentUrl = url;
    this.handoff = false;
    this.expectEndPause = false;
    this.activeIndex = 0;
    this.suppressPauseHandler = true;
    for (const player of players) {
      player.src = url;
      player.loop = false;
    }
    this.suppressPauseHandler = false;
  }

  async play(): Promise<void> {
    const players = this.mount();
    this.clearFade();
    this.outputVolume = this.userVolume;
    this.intendedPlaying = true;
    this.applySource(this.soundId);
    this.applyVolumes();
    this.markPlaybackSession();
    const active = players[this.activeIndex];
    if (!active) {
      return;
    }
    await active.play();
  }

  pause(): void {
    this.clearFade();
    this.intendedPlaying = false;
    this.handoff = false;
    this.expectEndPause = false;
    this.outputVolume = this.userVolume;
    if (!this.players) {
      return;
    }
    this.suppressPauseHandler = true;
    for (const player of this.players) {
      player.pause();
    }
    this.suppressPauseHandler = false;
    this.applyVolumes();
  }

  setVolume(volume: number): void {
    this.userVolume = Math.min(1, Math.max(0, volume));
    if (this.fading) {
      return;
    }
    this.outputVolume = this.userVolume;
    this.applyVolumes();
  }

  setSound(soundId: SoundId): void {
    const wasPlaying = this.isPlaying();
    this.soundId = soundId;
    if (!this.players) {
      return;
    }
    const previousUrl = this.currentUrl;
    this.applySource(soundId);
    if (!wasPlaying) {
      return;
    }
    this.intendedPlaying = true;
    this.markPlaybackSession();
    if (previousUrl !== this.currentUrl) {
      this.handoff = false;
      this.expectEndPause = false;
      this.activeIndex = 0;
      this.suppressPauseHandler = true;
      this.players[1]?.pause();
      this.suppressPauseHandler = false;
      const next = this.players[0];
      if (next) {
        next.currentTime = 0;
        this.applyVolumes();
        void next.play();
      }
      return;
    }
    const active = this.players[this.activeIndex];
    if (active?.paused) {
      void active.play();
    }
  }

  fadeOutAndPause(onComplete: () => void): void {
    const active = this.players?.[this.activeIndex];
    if (!active || active.paused) {
      onComplete();
      return;
    }

    this.clearFade();
    this.fading = true;
    const startedAt = Date.now();
    const from = this.outputVolume;

    this.fadeTimer = window.setInterval(() => {
      const t = Math.min(
        1,
        (Date.now() - startedAt) / (FADE_OUT_SECONDS * 1000),
      );
      this.outputVolume = from * (1 - t);
      this.applyVolumes();
      if (t < 1) {
        return;
      }
      this.fading = false;
      this.clearFade();
      this.pause();
      onComplete();
    }, 250);
  }

  async resumeIfNeeded(shouldBePlaying: boolean): Promise<void> {
    const active = this.players?.[this.activeIndex];
    if (!shouldBePlaying || !active?.paused) {
      return;
    }
    this.intendedPlaying = true;
    this.markPlaybackSession();
    await active.play();
  }

  private onTimeUpdate(index: number): void {
    if (index !== this.activeIndex) {
      return;
    }
    const active = this.players?.[index];
    if (!active || !Number.isFinite(active.duration)) {
      return;
    }
    this.publishPosition(active);
    if (this.handoff || active.paused) {
      return;
    }
    const remaining = active.duration - active.currentTime;
    if (remaining < HANDOFF_SECONDS) {
      this.beginHandoff();
    }
  }

  private beginHandoff(): void {
    const players = this.players;
    if (!players || this.handoff) {
      return;
    }
    const incoming = players[1 - this.activeIndex];
    if (!incoming) {
      return;
    }
    this.handoff = true;
    this.expectEndPause = true;
    incoming.currentTime = 0;
    this.applyVolumes();
    void incoming.play().catch(() => {
      this.handoff = false;
      this.expectEndPause = false;
      this.applyVolumes();
    });
  }

  private finishHandoff(finishedIndex: number): void {
    const players = this.players;
    if (
      !this.intendedPlaying ||
      !players ||
      finishedIndex !== this.activeIndex
    ) {
      return;
    }
    if (!this.handoff) {
      this.beginHandoff();
    }
    const incomingIndex = 1 - finishedIndex;
    const incoming = players[incomingIndex];
    const outgoing = players[finishedIndex];
    if (!incoming || !outgoing) {
      return;
    }
    this.activeIndex = incomingIndex;
    this.handoff = false;
    this.expectEndPause = false;
    this.suppressPauseHandler = true;
    outgoing.pause();
    outgoing.currentTime = 0;
    this.suppressPauseHandler = false;
    if (incoming.paused) {
      void incoming.play();
    }
    this.applyVolumes();
  }

  private onPause(index: number): void {
    if (this.suppressPauseHandler || index !== this.activeIndex) {
      return;
    }
    const active = this.players?.[index];
    if (!active) {
      return;
    }
    const duration = active.duration;
    const reachedEnd =
      this.expectEndPause ||
      (Number.isFinite(duration) && active.currentTime >= duration - 0.05);
    if (this.intendedPlaying && reachedEnd) {
      return;
    }
    this.intendedPlaying = false;
    this.handoff = false;
    this.expectEndPause = false;
    this.clearFade();
    this.suppressPauseHandler = true;
    this.players?.[1 - index]?.pause();
    this.suppressPauseHandler = false;
    this.systemPauseHandler?.();
  }

  private applyVolumes(): void {
    const players = this.players;
    if (!players) {
      return;
    }
    const overlap = this.outputVolume * Math.SQRT1_2;
    players.forEach((player, index) => {
      if (this.handoff) {
        player.volume = overlap;
        return;
      }
      player.volume = index === this.activeIndex ? this.outputVolume : 0;
    });
  }

  private publishPosition(active: HTMLAudioElement): void {
    if (!("mediaSession" in navigator) || !Number.isFinite(active.duration)) {
      return;
    }
    const position = Math.min(active.currentTime, active.duration);
    try {
      navigator.mediaSession.setPositionState({
        duration: active.duration,
        playbackRate: active.playbackRate,
        position,
      });
    } catch {
      // Ignore a position that lands past the loop boundary.
    }
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
