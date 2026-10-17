export const COPY = {
  appTitle: "Suuush",
  artistName: "Suuush",
  nowPlaying: "Now Playing",
  volumeLabel: "Volume",
  timerLabel: "Sleep timer",
  timerOff: "Off",
  timerMinutes: (minutes: number) => `${minutes} min`,
  timerRemaining: (minutes: number, seconds: number) =>
    `${minutes}:${seconds.toString().padStart(2, "0")} remaining`,
  play: "Play",
  pause: "Pause",
  soundPickerLabel: "Sound",
} as const;

export const TIMER_MINUTES_OPTIONS = [0, 15, 30, 60, 90] as const;

export type TimerMinutes = (typeof TIMER_MINUTES_OPTIONS)[number];
