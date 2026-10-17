/** @typedef {'white' | 'pink' | 'brown' | 'grey' | 'green' | 'fan'} SoundId */

class NoiseProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    /** @type {SoundId} */
    this.soundId = "white";
    this.pendingSoundId = null;

    this.pinkB0 = 0;
    this.pinkB1 = 0;
    this.pinkB2 = 0;
    this.pinkB3 = 0;
    this.pinkB4 = 0;
    this.pinkB5 = 0;
    this.pinkB6 = 0;

    this.brownLast = 0;

    this.fanLp = 0;
    this.fanPhase = 0;

    this.greyLpLow = 0;
    this.greyLpHigh = 0;

    this.greenLp = 0;
    this.greenHp = 0;

    this.port.onmessage = (event) => {
      if (event.data?.type === "set-sound" && event.data.soundId) {
        this.pendingSoundId = event.data.soundId;
      }
    };
  }

  /** @param {number} prev @param {number} input @param {number} cutoff */
  onePoleLowpass(prev, input, cutoff) {
    const coeff = Math.exp((-2 * Math.PI * cutoff) / sampleRate);
    return prev * coeff + input * (1 - coeff);
  }

  whiteSample() {
    return Math.random() * 2 - 1;
  }

  pinkSample() {
    const white = this.whiteSample();
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

  brownSample() {
    const white = this.whiteSample();
    this.brownLast = (this.brownLast + white * 0.02) * 0.998;
    return this.brownLast * 3.5;
  }

  fanSample() {
    const brown = this.brownSample();
    this.fanPhase += (0.2 * 2 * Math.PI) / sampleRate;
    if (this.fanPhase > Math.PI * 2) {
      this.fanPhase -= Math.PI * 2;
    }
    const cutoff = 400 + Math.sin(this.fanPhase) * 120;
    const coeff = Math.exp((-2 * Math.PI * cutoff) / sampleRate);
    this.fanLp = this.fanLp * coeff + brown * (1 - coeff);
    const tremolo = 0.85 + Math.sin(this.fanPhase * 2.3) * 0.15;
    return this.fanLp * tremolo * 1.2;
  }

  /** Equal-loudness-ish: mid band emphasis (~400 Hz–4.5 kHz). */
  greySample() {
    const white = this.whiteSample() * 0.35;
    this.greyLpLow = this.onePoleLowpass(this.greyLpLow, white, 400);
    this.greyLpHigh = this.onePoleLowpass(this.greyLpHigh, white, 4500);
    return (this.greyLpHigh - this.greyLpLow) * 0.55;
  }

  /** Mid-focused band (~280 Hz–650 Hz), centered near 500 Hz. */
  greenSample() {
    const white = this.whiteSample() * 0.35;
    this.greenHp = this.onePoleLowpass(this.greenHp, white, 280);
    this.greenLp = this.onePoleLowpass(this.greenLp, white, 650);
    return (this.greenLp - this.greenHp) * 0.75;
  }

  /** @param {SoundId} id */
  sampleFor(id) {
    switch (id) {
      case "white":
        return this.whiteSample() * 0.35;
      case "pink":
        return this.pinkSample();
      case "brown":
        return this.brownSample();
      case "grey":
        return this.greySample();
      case "green":
        return this.greenSample();
      case "fan":
        return this.fanSample();
      default:
        return this.whiteSample() * 0.35;
    }
  }

  softLimit(x) {
    if (x > 1) return 1;
    if (x < -1) return -1;
    return x;
  }

  process(_inputs, outputs) {
    const output = outputs[0];
    if (!output?.length) {
      return true;
    }

    const channel0 = output[0];
    const channel1 = output[1] ?? channel0;

    for (let i = 0; i < channel0.length; i += 1) {
      if (this.pendingSoundId !== null && i === 0) {
        this.soundId = this.pendingSoundId;
        this.pendingSoundId = null;
      }

      const raw = this.sampleFor(this.soundId);
      const limited = this.softLimit(raw);
      channel0[i] = limited;
      channel1[i] = limited;
    }

    return true;
  }
}

registerProcessor("noise-processor", NoiseProcessor);
