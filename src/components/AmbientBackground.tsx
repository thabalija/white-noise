import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { DURATION, EASE } from "../motion/tokens";
import { getSoundById, type SoundId } from "../sounds";

type AmbientBackgroundProps = {
  soundId: SoundId;
};

AmbientBackground.displayName = "AmbientBackground";

function AmbientBackground({ soundId }: AmbientBackgroundProps) {
  const reducedMotion = useReducedMotion();
  const sound = getSoundById(soundId);

  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-(--color-bg)"
      aria-hidden
    >
      <AnimatePresence mode="sync" initial={false}>
        <motion.img
          key={soundId}
          src={sound.image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reducedMotion ? undefined : { opacity: 0 }}
          transition={{
            duration: reducedMotion ? 0 : DURATION.backgroundCrossfade,
            ease: EASE.power3Out,
          }}
        />
      </AnimatePresence>
      <div className="ambient-wash absolute inset-0" />
      <div className="ambient-overlay absolute inset-0" />
    </div>
  );
}

export { AmbientBackground };
