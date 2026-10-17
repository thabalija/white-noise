import { COPY } from "../copy";
import { getSoundById, type SoundId } from "../sounds";

export type MediaSessionActions = {
  onPlay: () => void;
  onPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
};

let actionsRef: MediaSessionActions | null = null;

export function bindMediaSessionActions(actions: MediaSessionActions): void {
  actionsRef = actions;
}

export function setupMediaSessionHandlers(): void {
  if (!("mediaSession" in navigator)) {
    return;
  }

  navigator.mediaSession.setActionHandler("play", () => {
    actionsRef?.onPlay();
  });
  navigator.mediaSession.setActionHandler("pause", () => {
    actionsRef?.onPause();
  });
  navigator.mediaSession.setActionHandler("previoustrack", () => {
    actionsRef?.onPrevious();
  });
  navigator.mediaSession.setActionHandler("nexttrack", () => {
    actionsRef?.onNext();
  });
}

export function updateMediaSession(soundId: SoundId, playing: boolean): void {
  if (!("mediaSession" in navigator)) {
    return;
  }

  const sound = getSoundById(soundId);
  navigator.mediaSession.metadata = new MediaMetadata({
    title: sound.label,
    artist: COPY.artistName,
    album: COPY.appTitle,
  });
  navigator.mediaSession.playbackState = playing ? "playing" : "paused";
}
