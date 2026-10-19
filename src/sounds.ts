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
  imageLow: string;
  imageHigh: string;
  audio?: string;
};

function images(id: SoundId): Pick<SoundDefinition, "imageLow" | "imageHigh"> {
  return {
    imageLow: `/backgrounds/low/${id}.jpg`,
    imageHigh: `/backgrounds/high/${id}.jpg`,
  };
}

export const SOUNDS: readonly SoundDefinition[] = [
  {
    id: "white",
    label: "White noise",
    ...images("white"),
    audio: "/audio/white.mp3",
  },
  {
    id: "pink",
    label: "Pink noise",
    ...images("pink"),
    audio: "/audio/pink.mp3",
  },
  {
    id: "brown",
    label: "Brown noise",
    ...images("brown"),
    audio: "/audio/brown.mp3",
  },
  { id: "grey", label: "Grey noise", ...images("grey") },
  {
    id: "jungle",
    label: "Jungle",
    ...images("jungle"),
    audio: "/audio/jungle.mp3",
  },
  {
    id: "waves",
    label: "Sea waves",
    ...images("waves"),
    audio: "/audio/waves.mp3",
  },
  {
    id: "rain",
    label: "Rain",
    ...images("rain"),
    audio: "/audio/rain.mp3",
  },
  {
    id: "fan",
    label: "Fan",
    ...images("fan"),
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
