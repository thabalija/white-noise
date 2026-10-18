export const SOUND_IDS = [
  "white",
  "pink",
  "brown",
  "grey",
  "jungle",
  "waves",
  "rain",
  "fan",
] as const;

export const GENERATED_SOUND_IDS = ["grey"] as const;

export type GeneratedSoundId = (typeof GENERATED_SOUND_IDS)[number];

export type SoundId = (typeof SOUND_IDS)[number];

export type SoundDefinition = {
  id: SoundId;
  label: string;
  image: string;
  audio?: string;
};

export const SOUNDS: readonly SoundDefinition[] = [
  {
    id: "white",
    label: "White noise",
    image: "/backgrounds/white.jpg",
    audio: "/audio/white.mp3",
  },
  {
    id: "pink",
    label: "Pink noise",
    image: "/backgrounds/pink.jpg",
    audio: "/audio/pink.mp3",
  },
  {
    id: "brown",
    label: "Brown noise",
    image: "/backgrounds/brown.jpg",
    audio: "/audio/brown.mp3",
  },
  { id: "grey", label: "Grey noise", image: "/backgrounds/grey.jpg" },
  {
    id: "jungle",
    label: "Jungle",
    image: "/backgrounds/jungle.jpg",
    audio: "/audio/jungle.mp3",
  },
  {
    id: "waves",
    label: "Sea waves",
    image: "/backgrounds/waves.jpg",
    audio: "/audio/waves.mp3",
  },
  {
    id: "rain",
    label: "Rain",
    image: "/backgrounds/rain.jpg",
    audio: "/audio/rain.mp3",
  },
  {
    id: "fan",
    label: "Fan",
    image: "/backgrounds/fan.jpg",
    audio: "/audio/fan.mp3",
  },
] as const;

export function getSoundById(id: SoundId): SoundDefinition {
  const sound = SOUNDS.find((s) => s.id === id);
  if (!sound) {
    return SOUNDS[0];
  }
  return sound;
}

export function nextSoundId(current: SoundId): SoundId {
  const index = SOUND_IDS.indexOf(current);
  const next = (index + 1) % SOUND_IDS.length;
  return SOUND_IDS[next];
}

export function previousSoundId(current: SoundId): SoundId {
  const index = SOUND_IDS.indexOf(current);
  const prev = (index - 1 + SOUND_IDS.length) % SOUND_IDS.length;
  return SOUND_IDS[prev];
}

export function isSoundId(value: string): value is SoundId {
  return (SOUND_IDS as readonly string[]).includes(value);
}

export function isGeneratedSound(id: SoundId): id is GeneratedSoundId {
  return (GENERATED_SOUND_IDS as readonly string[]).includes(id);
}
