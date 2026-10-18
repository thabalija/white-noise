import type { GeneratedSoundId } from "../sounds";

const LOOP_SECONDS = 180;
const CROSSFADE_SECONDS = 0.08;
const SAMPLE_RATE = 44100;

class NoiseSynth {
  private readonly sampleRate: number;
  private greyLpLow = 0;
  private greyLpHigh = 0;

  constructor(sampleRate: number) {
    this.sampleRate = sampleRate;
  }

  private white(): number {
    return Math.random() * 2 - 1;
  }

  private lowpass(prev: number, input: number, cutoff: number): number {
    const coeff = Math.exp((-2 * Math.PI * cutoff) / this.sampleRate);
    return prev * coeff + input * (1 - coeff);
  }

  private grey(): number {
    const white = this.white() * 0.35;
    this.greyLpLow = this.lowpass(this.greyLpLow, white, 400);
    this.greyLpHigh = this.lowpass(this.greyLpHigh, white, 4500);
    return (this.greyLpHigh - this.greyLpLow) * 0.666;
  }

  sample(_id: GeneratedSoundId): number {
    return this.grey();
  }
}

function crossfadeLoop(
  samples: Float32Array,
  fadeSamples: number,
): Float32Array {
  const length = samples.length;
  if (fadeSamples <= 0 || fadeSamples * 2 >= length) {
    return samples;
  }
  const looped = samples.subarray(0, length - fadeSamples);
  for (let i = 0; i < fadeSamples; i += 1) {
    const mix = i / fadeSamples;
    const head = samples[i] ?? 0;
    const tail = samples[length - fadeSamples + i] ?? 0;
    looped[i] = head * mix + tail * (1 - mix);
  }
  return looped;
}

export function renderSoundLoop(soundId: GeneratedSoundId): Float32Array {
  const synth = new NoiseSynth(SAMPLE_RATE);
  const total = Math.floor(LOOP_SECONDS * SAMPLE_RATE);
  const samples = new Float32Array(total);
  for (let i = 0; i < total; i += 1) {
    const raw = synth.sample(soundId);
    samples[i] = Math.max(-1, Math.min(1, raw));
  }
  return crossfadeLoop(samples, Math.floor(CROSSFADE_SECONDS * SAMPLE_RATE));
}

export const LOOP_SAMPLE_RATE = SAMPLE_RATE;
