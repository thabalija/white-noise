import { useCallback, useEffect, useRef, useState } from "react";

import { getNoiseEngine } from "../audio/engine";
import type { TimerMinutes } from "../copy";
import { nextSoundId, previousSoundId, type SoundId } from "../sounds";
import {
  bindMediaSessionActions,
  setupMediaSessionHandlers,
  updateMediaSession,
} from "./mediaSession";
import { loadPersistedState, savePersistedState } from "./storage";

const FADE_BEFORE_END_MS = 12_000;

export type PlayerState = {
  soundId: SoundId;
  playing: boolean;
  volume: number;
  timerMinutes: TimerMinutes;
  remainingMs: number | null;
  toggle: () => Promise<void>;
  setSound: (id: SoundId) => Promise<void>;
  setVolume: (volume: number) => void;
  setTimer: (minutes: TimerMinutes) => void;
};

function computeRemainingMs(timerEndsAt: number | null): number | null {
  if (timerEndsAt === null) {
    return null;
  }
  return Math.max(0, timerEndsAt - Date.now());
}

export function usePlayer(): PlayerState {
  const engine = getNoiseEngine();
  const persisted = loadPersistedState();

  const [soundId, setSoundIdState] = useState<SoundId>(persisted.soundId);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolumeState] = useState(persisted.volume);
  const [timerMinutes, setTimerMinutesState] = useState<TimerMinutes>(
    persisted.timerMinutes,
  );
  const [remainingMs, setRemainingMs] = useState<number | null>(() =>
    computeRemainingMs(persisted.timerEndsAt),
  );

  const timerEndsAtRef = useRef<number | null>(persisted.timerEndsAt);
  const fadeStartedRef = useRef(false);
  const playingRef = useRef(false);
  const soundIdRef = useRef(soundId);
  soundIdRef.current = soundId;

  const actionsRef = useRef<{
    startPlayback: () => Promise<void>;
    pausePlayback: () => Promise<void>;
    setSound: (id: SoundId) => Promise<void>;
  }>({
    startPlayback: async () => {},
    pausePlayback: async () => {},
    setSound: async () => {},
  });

  const persist = useCallback(() => {
    savePersistedState({
      soundId,
      volume,
      timerMinutes,
      timerEndsAt: timerEndsAtRef.current,
    });
  }, [soundId, volume, timerMinutes]);

  const syncMediaSession = useCallback(() => {
    updateMediaSession(soundId, playingRef.current);
  }, [soundId]);

  const clearTimerEnd = useCallback(() => {
    timerEndsAtRef.current = null;
    fadeStartedRef.current = false;
    setRemainingMs(null);
  }, []);

  const armTimerFromMinutes = useCallback(
    (minutes: TimerMinutes) => {
      if (minutes === 0) {
        clearTimerEnd();
        return;
      }
      timerEndsAtRef.current = Date.now() + minutes * 60_000;
      fadeStartedRef.current = false;
      setRemainingMs(computeRemainingMs(timerEndsAtRef.current));
    },
    [clearTimerEnd],
  );

  const pausePlayback = useCallback(async () => {
    engine.pause();
    playingRef.current = false;
    setPlaying(false);
    syncMediaSession();
    persist();
  }, [engine, persist, syncMediaSession]);

  const startPlayback = useCallback(async () => {
    await engine.setSound(soundId);
    await engine.play();
    playingRef.current = true;
    setPlaying(true);

    if (timerMinutes > 0 && timerEndsAtRef.current === null) {
      armTimerFromMinutes(timerMinutes);
    }

    syncMediaSession();
    persist();
  }, [
    armTimerFromMinutes,
    engine,
    persist,
    soundId,
    syncMediaSession,
    timerMinutes,
  ]);

  const toggle = useCallback(async () => {
    if (playingRef.current) {
      await pausePlayback();
    } else {
      await startPlayback();
    }
  }, [pausePlayback, startPlayback]);

  const setSound = useCallback(
    async (id: SoundId) => {
      setSoundIdState(id);
      document.documentElement.dataset.sound = id;
      await engine.setSound(id);
      syncMediaSession();
      persist();
    },
    [engine, persist, syncMediaSession],
  );

  const setVolume = useCallback(
    (next: number) => {
      const clamped = Math.min(1, Math.max(0, next));
      setVolumeState(clamped);
      engine.setVolume(clamped);
      persist();
    },
    [engine, persist],
  );

  const setTimer = useCallback(
    (minutes: TimerMinutes) => {
      setTimerMinutesState(minutes);
      if (minutes === 0) {
        clearTimerEnd();
      } else if (playingRef.current) {
        armTimerFromMinutes(minutes);
      } else {
        timerEndsAtRef.current = Date.now() + minutes * 60_000;
        fadeStartedRef.current = false;
        setRemainingMs(computeRemainingMs(timerEndsAtRef.current));
      }
      persist();
    },
    [armTimerFromMinutes, clearTimerEnd, persist],
  );

  actionsRef.current = { startPlayback, pausePlayback, setSound };

  useEffect(() => {
    setupMediaSessionHandlers();
    bindMediaSessionActions({
      onPlay: () => {
        void actionsRef.current.startPlayback();
      },
      onPause: () => {
        void actionsRef.current.pausePlayback();
      },
      onNext: () => {
        void actionsRef.current.setSound(nextSoundId(soundIdRef.current));
      },
      onPrevious: () => {
        void actionsRef.current.setSound(previousSoundId(soundIdRef.current));
      },
    });
  }, []);

  useEffect(() => {
    document.documentElement.dataset.sound = soundId;
    void engine.setSound(soundId);
    engine.setVolume(volume);
    syncMediaSession();
  }, [engine, soundId, syncMediaSession, volume]);

  useEffect(() => {
    persist();
  }, [persist]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void engine.resumeIfNeeded(playingRef.current);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [engine]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const endsAt = timerEndsAtRef.current;
      if (endsAt === null) {
        setRemainingMs(null);
        return;
      }

      const remaining = computeRemainingMs(endsAt);
      setRemainingMs(remaining);

      if (remaining === 0) {
        if (playingRef.current) {
          void pausePlayback();
        }
        clearTimerEnd();
        setTimerMinutesState(0);
        persist();
        return;
      }

      if (
        playingRef.current &&
        remaining !== null &&
        remaining <= FADE_BEFORE_END_MS &&
        !fadeStartedRef.current
      ) {
        fadeStartedRef.current = true;
        void engine.fadeOutAndPause(() => {
          playingRef.current = false;
          setPlaying(false);
          clearTimerEnd();
          setTimerMinutesState(0);
          syncMediaSession();
          persist();
        });
      }
    }, 250);

    return () => {
      window.clearInterval(interval);
    };
  }, [clearTimerEnd, engine, pausePlayback, persist, syncMediaSession]);

  return {
    soundId,
    playing,
    volume,
    timerMinutes,
    remainingMs,
    toggle,
    setSound,
    setVolume,
    setTimer,
  };
}
