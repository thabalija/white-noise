import { motion } from "motion/react";

import { COPY } from "../copy";
import { SOUNDS, type SoundId } from "../sounds";

type SoundPickerProps = {
  soundId: SoundId;
  onSelect: (id: SoundId) => void;
};

SoundPicker.displayName = "SoundPicker";

function SoundPicker({ soundId, onSelect }: SoundPickerProps) {
  return (
    <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
      <legend className="sr-only">{COPY.soundPickerLabel}</legend>
      {SOUNDS.map((sound) => {
        const selected = sound.id === soundId;
        return (
          <label
            key={sound.id}
            className="relative block cursor-pointer rounded-xl px-4 py-3 text-left text-base transition-colors"
          >
            <input
              type="radio"
              name="sound"
              value={sound.id}
              checked={selected}
              onChange={() => onSelect(sound.id)}
              className="sr-only"
            />
            {selected ? (
              <motion.span
                layoutId="sound-highlight"
                className="pointer-events-none absolute inset-0 rounded-xl bg-(--color-surface-active) ring-1 ring-(--color-accent-active)/40"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            ) : null}
            <span
              className={`relative z-10 ${selected ? "text-(--color-text)" : "text-(--color-text-muted)"}`}
            >
              {sound.label}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}

export { SoundPicker };
