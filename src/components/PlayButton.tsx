import { motion, useReducedMotion } from "motion/react";
import type { Ref } from "react";

import { COPY } from "../copy";
import { DURATION, EASE } from "../motion/tokens";

const WAVE =
  "M0 32 C10 32 14 20 24 20 C34 20 38 44 48 44 C58 44 62 24 74 24 C86 24 90 42 102 42 C114 42 118 16 132 16 C146 16 150 48 164 48 C178 48 182 18 196 18 C210 18 214 44 228 44 C242 44 246 22 260 22 C274 22 278 40 292 40 C306 40 310 32 320 32";

type PlayButtonProps = {
  playing: boolean;
  onToggle: () => void;
  ref?: Ref<HTMLButtonElement>;
};

PlayButton.displayName = "PlayButton";

function PlayButton({ playing, onToggle, ref }: PlayButtonProps) {
  const reducedMotion = useReducedMotion();
  const label = playing ? COPY.pause : COPY.play;

  return (
    <div className="relative flex h-28 items-center justify-center">
      <motion.svg
        viewBox="0 0 320 64"
        aria-hidden
        className="pointer-events-none absolute inset-x-0 h-16 w-full text-(--color-text-muted)"
        animate={
          playing && !reducedMotion
            ? { opacity: [0.45, 0.9, 0.45] }
            : { opacity: 0.55 }
        }
        transition={
          playing && !reducedMotion
            ? {
                duration: DURATION.playPulse,
                repeat: Number.POSITIVE_INFINITY,
                ease: EASE.easeInOut,
              }
            : { duration: 0.2 }
        }
      >
        <path
          d={WAVE}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
          vectorEffect="non-scaling-stroke"
        />
      </motion.svg>
      <motion.button
        ref={ref}
        type="button"
        className="relative z-10 flex size-[4.5rem] items-center justify-center rounded-full border border-(--color-line) bg-(--color-glass) text-(--color-text) backdrop-blur-md"
        aria-label={label}
        onClick={onToggle}
        whileTap={{ scale: 0.96 }}
        animate={
          playing && !reducedMotion ? { scale: [1, 1.03, 1] } : { scale: 1 }
        }
        transition={
          playing && !reducedMotion
            ? {
                duration: DURATION.playPulse,
                repeat: Number.POSITIVE_INFINITY,
                ease: EASE.easeInOut,
              }
            : { duration: 0.2 }
        }
      >
        {playing ? (
          <span className="flex gap-1.5" aria-hidden>
            <span className="block h-5 w-[3px] rounded-full bg-current" />
            <span className="block h-5 w-[3px] rounded-full bg-current" />
          </span>
        ) : (
          <svg viewBox="0 0 24 24" className="ml-0.5 size-6" aria-hidden>
            <path d="M8 5.5v13l11-6.5-11-6.5z" fill="currentColor" />
          </svg>
        )}
      </motion.button>
    </div>
  );
}

export { PlayButton };
