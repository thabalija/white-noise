import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

import { DURATION, EASE } from "../motion/tokens";
import { getSoundById, type SoundDefinition, type SoundId } from "../sounds";

type AmbientBackgroundProps = {
  soundId: SoundId;
};

type BackgroundPlateProps = {
  sound: SoundDefinition;
  reducedMotion: boolean;
};

AmbientBackground.displayName = "AmbientBackground";

function imageCached(src: string): boolean {
  const img = new Image();
  img.src = src;
  return img.complete && img.naturalWidth > 0;
}

function useImageReady(src: string | null): boolean {
  const [ready, setReady] = useState(() => (src ? imageCached(src) : false));

  useEffect(() => {
    if (!src) {
      setReady(false);
      return;
    }
    if (imageCached(src)) {
      setReady(true);
      return;
    }

    setReady(false);
    const img = new Image();
    let cancelled = false;
    const markReady = () => {
      if (!cancelled) {
        setReady(true);
      }
    };
    img.addEventListener("load", markReady);
    img.src = src;
    if (img.complete && img.naturalWidth > 0) {
      markReady();
    }

    return () => {
      cancelled = true;
      img.removeEventListener("load", markReady);
    };
  }, [src]);

  return ready;
}

function BackgroundPlate({ sound, reducedMotion }: BackgroundPlateProps) {
  const lowReady = useImageReady(sound.imageLow);
  const highReady = useImageReady(lowReady ? sound.imageHigh : null);
  const fade = {
    duration: reducedMotion ? 0 : DURATION.backgroundCrossfade,
    ease: EASE.power3Out,
  };

  return (
    <motion.div
      className="absolute inset-0"
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reducedMotion ? undefined : { opacity: 0 }}
      transition={fade}
    >
      <img
        src={sound.imageLow}
        alt=""
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 h-full w-full scale-105 object-cover blur-md"
      />
      {lowReady ? (
        <motion.img
          src={sound.imageHigh}
          alt=""
          fetchPriority="low"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
          initial={reducedMotion || highReady ? false : { opacity: 0 }}
          animate={{ opacity: highReady ? 1 : 0 }}
          transition={fade}
        />
      ) : null}
    </motion.div>
  );
}

function AmbientBackground({ soundId }: AmbientBackgroundProps) {
  const reducedMotion = useReducedMotion();
  const sound = getSoundById(soundId);

  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-(--color-bg)"
      aria-hidden
    >
      <AnimatePresence mode="sync" initial={false}>
        <BackgroundPlate
          key={sound.id}
          sound={sound}
          reducedMotion={Boolean(reducedMotion)}
        />
      </AnimatePresence>
      <div className="ambient-wash absolute inset-0" />
      <div className="ambient-overlay absolute inset-0" />
    </div>
  );
}

export { AmbientBackground };
