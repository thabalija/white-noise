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
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-(--color-text-muted)">
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
              className={`cursor-pointer rounded-full px-3 py-1.5 text-sm transition-colors ${
                selected
                  ? "bg-(--color-accent-active) text-(--color-bg-active)"
                  : "bg-(--color-surface) text-(--color-text-muted)"
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
      {remainingLabel ? (
        <p className="text-sm tabular-nums text-(--color-accent-active)">
          {remainingLabel}
        </p>
      ) : null}
    </div>
  );
}

export { SleepTimer };
