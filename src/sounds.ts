export const SOUND_IDS = [
  "white",
  "pink",
  "brown",
  "grey",
  "green",
  "fan",
] as const;

export type SoundId = (typeof SOUND_IDS)[number];

export type SoundDefinition = {
  id: SoundId;
  label: string;
};

export const SOUNDS: readonly SoundDefinition[] = [
  { id: "white", label: "White noise" },
  { id: "pink", label: "Pink noise" },
  { id: "brown", label: "Brown noise" },
  { id: "grey", label: "Grey noise" },
  { id: "green", label: "Green noise" },
  { id: "fan", label: "Fan" },
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
