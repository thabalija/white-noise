import { COPY, TIMER_MINUTES_OPTIONS, type TimerMinutes } from "../copy";

type SleepTimerProps = {
  timerMinutes: TimerMinutes;
  remainingMs: number | null;
  onSelect: (minutes: TimerMinutes) => void;
};

SleepTimer.displayName = "SleepTimer";

function formatRemaining(ms: number | null): string | null {
  if (ms === null) {
    return null;
  }
  const totalSec = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return COPY.timerRemaining(minutes, seconds);
}

function SleepTimer({ timerMinutes, remainingMs, onSelect }: SleepTimerProps) {
  const remainingLabel = formatRemaining(remainingMs);

  return (
    <div className="flex flex-col gap-3">
      <span className="text-[0.65rem] tracking-[0.18em] text-(--color-text-muted) uppercase">
        {COPY.timerLabel}
      </span>
      <fieldset className="m-0 flex flex-wrap gap-2 border-0 p-0">
        <legend className="sr-only">{COPY.timerLabel}</legend>
        {TIMER_MINUTES_OPTIONS.map((minutes) => {
          const selected = timerMinutes === minutes;
          const label =
            minutes === 0 ? COPY.timerOff : COPY.timerMinutes(minutes);
          return (
            <label
              key={minutes}
              className={`cursor-pointer rounded-full border px-3 py-1.5 text-[0.65rem] tracking-wide ${
                selected
                  ? "border-(--color-line) bg-(--color-glass-strong) text-(--color-text)"
                  : "border-transparent bg-(--color-glass) text-(--color-text-muted)"
              }`}
            >
              <input
                type="radio"
                name="sleep-timer"
                value={minutes}
                checked={selected}
                onChange={() => onSelect(minutes)}
                className="sr-only"
              />
              {label}
            </label>
          );
        })}
      </fieldset>
      <p
        className="min-h-[1.2em] text-[0.65rem] tracking-wide text-(--color-text)"
        aria-live="polite"
      >
        {remainingLabel ?? "\u00a0"}
      </p>
    </div>
  );
}

export { SleepTimer };
