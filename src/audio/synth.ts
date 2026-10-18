import type { SoundId } from "../sounds";

const LOOP_SECONDS = 180;
const CROSSFADE_SECONDS = 0.08;
const SAMPLE_RATE = 44100;

class NoiseSynth {
  private readonly sampleRate: number;
  private pinkB0 = 0;
  private pinkB1 = 0;
  private pinkB2 = 0;
  private pinkB3 = 0;
  private pinkB4 = 0;
  private pinkB5 = 0;
  private pinkB6 = 0;
  private brownLast = 0;
  private fanLp = 0;
  private fanPhase = 0;
  private greyLpLow = 0;
  private greyLpHigh = 0;
  private greenLp = 0;
  private greenHp = 0;

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

  private pink(): number {
    const white = this.white();
    this.pinkB0 = 0.99886 * this.pinkB0 + white * 0.0555179;
    this.pinkB1 = 0.99332 * this.pinkB1 + white * 0.0750759;
    this.pinkB2 = 0.969 * this.pinkB2 + white * 0.153852;
    this.pinkB3 = 0.8665 * this.pinkB3 + white * 0.3104856;
    this.pinkB4 = 0.55 * this.pinkB4 + white * 0.5329522;
    this.pinkB5 = -0.7616 * this.pinkB5 - white * 0.016898;
    const pink =
      this.pinkB0 +
      this.pinkB1 +
      this.pinkB2 +
      this.pinkB3 +
      this.pinkB4 +
      this.pinkB5 +
      this.pinkB6 +
      white * 0.5362;
    this.pinkB6 = white * 0.115926;
    return pink * 0.11;
  }

  private brown(): number {
    const white = this.white();
    this.brownLast = (this.brownLast + white * 0.02) * 0.998;
    return this.brownLast * 3.5;
  }

  private fan(): number {
    const brown = this.brown();
    this.fanPhase += (0.2 * 2 * Math.PI) / this.sampleRate;
    if (this.fanPhase > Math.PI * 2) {
      this.fanPhase -= Math.PI * 2;
    }
    const cutoff = 400 + Math.sin(this.fanPhase) * 120;
    const coeff = Math.exp((-2 * Math.PI * cutoff) / this.sampleRate);
    this.fanLp = this.fanLp * coeff + brown * (1 - coeff);
    const tremolo = 0.85 + Math.sin(this.fanPhase * 2.3) * 0.15;
    return this.fanLp * tremolo * 1.2;
  }

  private grey(): number {
    const white = this.white() * 0.35;
    this.greyLpLow = this.lowpass(this.greyLpLow, white, 400);
    this.greyLpHigh = this.lowpass(this.greyLpHigh, white, 4500);
    return (this.greyLpHigh - this.greyLpLow) * 0.55;
  }

  private green(): number {
    const white = this.white() * 0.35;
    this.greenHp = this.lowpass(this.greenHp, white, 280);
    this.greenLp = this.lowpass(this.greenLp, white, 650);
    return (this.greenLp - this.greenHp) * 0.75;
  }

  sample(id: SoundId): number {
    switch (id) {
      case "white":
        return this.white() * 0.35;
      case "pink":
        return this.pink();
      case "brown":
        return this.brown();
      case "grey":
        return this.grey();
      case "green":
        return this.green();
      case "fan":
        return this.fan();
      default:
        return this.white() * 0.35;
    }
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

export function renderSoundLoop(soundId: SoundId): Float32Array {
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
