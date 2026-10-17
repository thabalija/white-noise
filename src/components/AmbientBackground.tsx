import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { DURATION, EASE } from "../motion/tokens";
import type { SoundId } from "../sounds";

type AmbientBackgroundProps = {
  soundId: SoundId;
};

AmbientBackground.displayName = "AmbientBackground";

function AmbientBackground({ soundId }: AmbientBackgroundProps) {
  const reducedMotion = useReducedMotion();

  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden
    >
      <AnimatePresence mode="sync" initial={false}>
        <motion.div
          key={soundId}
          className="absolute inset-0 bg-(--color-bg-active)"
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reducedMotion ? undefined : { opacity: 0 }}
          transition={{
            duration: reducedMotion ? 0 : DURATION.backgroundCrossfade,
            ease: EASE.power3Out,
          }}
        />
      </AnimatePresence>
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 20%, var(--color-accent-active), transparent 70%)",
        }}
      />
    </div>
  );
}

export { AmbientBackground };
