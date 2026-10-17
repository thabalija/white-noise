import { motion, useReducedMotion } from "motion/react";
import type { Ref } from "react";

import { COPY } from "../copy";
import { DURATION, EASE } from "../motion/tokens";

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
    <motion.button
      ref={ref}
      type="button"
      className="flex size-20 items-center justify-center rounded-full bg-(--color-accent-active) text-(--color-bg-active) shadow-lg shadow-black/30"
      aria-label={label}
      onClick={onToggle}
      whileTap={{ scale: 0.96 }}
      animate={
        playing && !reducedMotion ? { scale: [1, 1.04, 1] } : { scale: 1 }
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
          <span className="block h-8 w-2 rounded-sm bg-current" />
          <span className="block h-8 w-2 rounded-sm bg-current" />
        </span>
      ) : (
        <span
          className="ml-1 block size-0 border-y-[14px] border-y-transparent border-l-[22px] border-l-current"
          aria-hidden
        />
      )}
    </motion.button>
  );
}

export { PlayButton };
