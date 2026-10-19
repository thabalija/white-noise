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

export function usePlayer(): PlayerState {
  const engine = getNoiseEngine();
  const persisted = loadPersistedState();

  const [soundId, setSoundIdState] = useState<SoundId>(persisted.soundId);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolumeState] = useState(persisted.volume);
  const [timerMinutes, setTimerMinutesState] = useState<TimerMinutes>(
    persisted.timerMinutes,
  );
  const [remainingMs, setRemainingMs] = useState<number | null>(
    persisted.timerRemainingMs,
  );

  const timerEndsAtRef = useRef<number | null>(null);
  const timerRemainingMsRef = useRef<number | null>(persisted.timerRemainingMs);
  const timerMinutesRef = useRef(persisted.timerMinutes);
  timerMinutesRef.current = timerMinutes;
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
    const endsAt = timerEndsAtRef.current;
    if (endsAt !== null) {
      const remaining = Math.max(0, endsAt - Date.now());
      timerRemainingMsRef.current = remaining > 0 ? remaining : null;
    }
    savePersistedState({
      soundId: soundIdRef.current,
      volume,
      timerMinutes: timerMinutesRef.current,
      timerRemainingMs: timerRemainingMsRef.current,
    });
  }, [volume]);

  const syncMediaSession = useCallback(() => {
    updateMediaSession(soundId, playingRef.current);
  }, [soundId]);

  const clearTimerEnd = useCallback(() => {
    timerEndsAtRef.current = null;
    timerRemainingMsRef.current = null;
    fadeStartedRef.current = false;
    setRemainingMs(null);
  }, []);

  const freezeTimer = useCallback(() => {
    const endsAt = timerEndsAtRef.current;
    if (endsAt === null) {
      return;
    }
    const remaining = Math.max(0, endsAt - Date.now());
    timerEndsAtRef.current = null;
    fadeStartedRef.current = false;
    timerRemainingMsRef.current = remaining > 0 ? remaining : null;
    setRemainingMs(timerRemainingMsRef.current);
  }, []);

  const beginTimerClock = useCallback(() => {
    if (timerEndsAtRef.current !== null) {
      return;
    }
    const remaining = timerRemainingMsRef.current;
    if (remaining === null || remaining <= 0) {
      return;
    }
    timerEndsAtRef.current = Date.now() + remaining;
    fadeStartedRef.current = false;
    setRemainingMs(remaining);
  }, []);

  const pausePlayback = useCallback(async () => {
    engine.pause();
    playingRef.current = false;
    setPlaying(false);
    freezeTimer();
    syncMediaSession();
    persist();
  }, [engine, freezeTimer, persist, syncMediaSession]);

  const startPlayback = useCallback(async () => {
    await engine.setSound(soundId);
    playingRef.current = true;
    syncMediaSession();
    try {
      await engine.play();
    } catch {
      playingRef.current = false;
      setPlaying(false);
      syncMediaSession();
      return;
    }
    setPlaying(true);
    beginTimerClock();
    syncMediaSession();
    persist();
  }, [beginTimerClock, engine, persist, soundId, syncMediaSession]);

  const toggle = useCallback(async () => {
    if (playingRef.current) {
      await pausePlayback();
    } else {
      await startPlayback();
    }
  }, [pausePlayback, startPlayback]);

  const setSound = useCallback(
    async (id: SoundId) => {
      soundIdRef.current = id;
      setSoundIdState(id);
      document.documentElement.dataset.sound = id;
      await engine.setSound(id);
      if (engine.isPlaying()) {
        playingRef.current = true;
        setPlaying(true);
        beginTimerClock();
      }
      syncMediaSession();
      persist();
    },
    [beginTimerClock, engine, persist, syncMediaSession],
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
      timerMinutesRef.current = minutes;
      setTimerMinutesState(minutes);
      fadeStartedRef.current = false;
      if (minutes === 0) {
        clearTimerEnd();
      } else {
        const duration = minutes * 60_000;
        timerRemainingMsRef.current = duration;
        timerEndsAtRef.current = playingRef.current
          ? Date.now() + duration
          : null;
        setRemainingMs(duration);
      }
      persist();
    },
    [clearTimerEnd, persist],
  );

  actionsRef.current = { startPlayback, pausePlayback, setSound };
  const sessionSyncRef = useRef({ persist, syncMediaSession, freezeTimer });
  sessionSyncRef.current = { persist, syncMediaSession, freezeTimer };

  useEffect(() => {
    engine.setSystemPauseHandler(() => {
      if (!playingRef.current) {
        return;
      }
      playingRef.current = false;
      setPlaying(false);
      sessionSyncRef.current.freezeTimer();
      sessionSyncRef.current.syncMediaSession();
      sessionSyncRef.current.persist();
    });
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
  }, [engine.setSystemPauseHandler]);

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
    let lastSavedSecond: number | null = null;
    const interval = window.setInterval(() => {
      const endsAt = timerEndsAtRef.current;
      if (endsAt === null) {
        return;
      }

      const remaining = Math.max(0, endsAt - Date.now());
      timerRemainingMsRef.current = remaining > 0 ? remaining : null;
      setRemainingMs(remaining);

      if (remaining === 0) {
        if (playingRef.current) {
          void pausePlayback();
        }
        clearTimerEnd();
        timerMinutesRef.current = 0;
        setTimerMinutesState(0);
        persist();
        return;
      }

      const second = Math.ceil(remaining / 1000);
      if (second !== lastSavedSecond) {
        lastSavedSecond = second;
        persist();
      }

      if (
        playingRef.current &&
        remaining <= FADE_BEFORE_END_MS &&
        !fadeStartedRef.current
      ) {
        fadeStartedRef.current = true;
        engine.fadeOutAndPause(() => {
          playingRef.current = false;
          setPlaying(false);
          clearTimerEnd();
          timerMinutesRef.current = 0;
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
