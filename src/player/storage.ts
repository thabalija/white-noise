import type { TimerMinutes } from "../copy";
import { isSoundId, type SoundId } from "../sounds";

const STORAGE_KEY = "white-noise-player-v1";

export type PersistedPlayerState = {
  soundId: SoundId;
  volume: number;
  timerMinutes: TimerMinutes;
  /** Milliseconds left. The clock runs only while audio is playing. */
  timerRemainingMs: number | null;
};

type StoredPlayerState = Partial<PersistedPlayerState> & {
  timerEndsAt?: unknown;
};

const DEFAULT_STATE: PersistedPlayerState = {
  soundId: "white",
  volume: 0.7,
  timerMinutes: 0,
  timerRemainingMs: null,
};

function clampVolume(value: number): number {
  if (Number.isNaN(value)) return DEFAULT_STATE.volume;
  return Math.min(1, Math.max(0, value));
}

function parseTimerMinutes(value: unknown): TimerMinutes {
  const n = typeof value === "number" ? value : Number(value);
  if (n === 0 || n === 15 || n === 30 || n === 60 || n === 90) {
    return n;
  }
  return 0;
}

function parseRemainingMs(
  parsed: StoredPlayerState,
  timerMinutes: TimerMinutes,
): number | null {
  if (timerMinutes === 0) {
    return null;
  }
  if (
    typeof parsed.timerRemainingMs === "number" &&
    Number.isFinite(parsed.timerRemainingMs)
  ) {
    return parsed.timerRemainingMs > 0 ? parsed.timerRemainingMs : null;
  }
  if (
    typeof parsed.timerEndsAt === "number" &&
    Number.isFinite(parsed.timerEndsAt)
  ) {
    const left = parsed.timerEndsAt - Date.now();
    return left > 0 ? left : null;
  }
  return timerMinutes * 60_000;
}

export function loadPersistedState(): PersistedPlayerState {
  if (typeof localStorage === "undefined") {
    return DEFAULT_STATE;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_STATE;
    }
    const parsed = JSON.parse(raw) as StoredPlayerState;
    const soundId =
      typeof parsed.soundId === "string" && isSoundId(parsed.soundId)
        ? parsed.soundId
        : DEFAULT_STATE.soundId;
    let timerMinutes = parseTimerMinutes(parsed.timerMinutes);
    const timerRemainingMs = parseRemainingMs(parsed, timerMinutes);
    if (timerRemainingMs === null) {
      timerMinutes = 0;
    }
    return {
      soundId,
      volume: clampVolume(Number(parsed.volume)),
      timerMinutes,
      timerRemainingMs,
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export function savePersistedState(state: PersistedPlayerState): void {
  if (typeof localStorage === "undefined") {
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}
