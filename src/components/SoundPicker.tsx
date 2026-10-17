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
    <fieldset className="m-0 flex flex-wrap justify-center gap-2 border-0 p-0">
      <legend className="sr-only">{COPY.soundPickerLabel}</legend>
      {SOUNDS.map((sound) => {
        const selected = sound.id === soundId;
        return (
          <label
            key={sound.id}
            className="relative cursor-pointer rounded-full px-3 py-2 text-[0.65rem] tracking-wide"
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
                className="pointer-events-none absolute inset-0 rounded-full border border-(--color-line) bg-(--color-glass-strong)"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            ) : (
              <span className="pointer-events-none absolute inset-0 rounded-full bg-(--color-glass)" />
            )}
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
