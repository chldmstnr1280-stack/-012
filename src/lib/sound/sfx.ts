"use client";

import { midi, noise, tone } from "./engine";

/**
 * Selly's cute sound effects. Pitches wobble a little each time so repeated
 * taps never sound mechanical. Timings follow the matching animations.
 */
export type SfxName = "touch" | "greet" | "water" | "sun" | "pat" | "cheer" | "levelup" | "tap";

const jitter = (amount = 0.06) => 1 + (Math.random() * 2 - 1) * amount;

const SFX: Record<SfxName, () => void> = {
  /** "뿅뿅" — two springy rising blips */
  touch() {
    const r = jitter();
    tone({ freq: 560 * r, to: 1150 * r, glide: 0.09, dur: 0.16, gain: 0.22, partial: { ratio: 2, level: 0.12 } });
    tone({ freq: 820 * r, to: 1480 * r, glide: 0.07, dur: 0.13, gain: 0.16, delay: 0.12, partial: { ratio: 2, level: 0.1 } });
  },
  /** little "안녕!" chirp */
  greet() {
    const r = jitter(0.03);
    tone({ freq: midi(84) * r, to: midi(88) * r, glide: 0.08, dur: 0.14, gain: 0.14, reverb: 0.2 });
    tone({ freq: midi(88) * r, to: midi(91) * r, glide: 0.06, dur: 0.2, gain: 0.13, delay: 0.16, reverb: 0.25 });
  },
  /** droplets landing on the leaves, then a happy "히히" */
  water() {
    [0.78, 0.92, 1.06, 1.2].forEach((d, i) => {
      const r = jitter(0.08);
      tone({ freq: 1700 * r, to: 620 * r, glide: 0.05, dur: 0.09, gain: 0.16 - i * 0.02, delay: d, reverb: 0.25 });
    });
    noise({ delay: 0.8, dur: 0.35, gain: 0.02, freq: 4200, q: 0.8, reverb: 0.2 });
    tone({ freq: midi(84), to: midi(91), glide: 0.1, dur: 0.16, gain: 0.13, delay: 1.45 });
    tone({ freq: midi(86), to: midi(93), glide: 0.1, dur: 0.18, gain: 0.12, delay: 1.62 });
  },
  /** warm, sparkling rise */
  sun() {
    [72, 74, 76, 79, 81, 84, 88].forEach((n, i) =>
      tone({ freq: midi(n), dur: 0.9, gain: 0.07, delay: i * 0.075, type: "triangle", reverb: 0.55, partial: { ratio: 3, level: 0.08 } }),
    );
    tone({ freq: midi(60), dur: 1.4, gain: 0.05, attack: 0.25, type: "triangle", lowpass: 900, reverb: 0.4 });
    noise({ delay: 0.3, dur: 0.6, gain: 0.012, freq: 8000, q: 0.6, reverb: 0.5 });
  },
  /** "뀨~" — a wobbly squeak, then a soft heart pop */
  pat() {
    const r = jitter(0.04);
    tone({ freq: 640 * r, to: 980 * r, glide: 0.12, to2: 780 * r, glide2: 0.22, dur: 0.42, gain: 0.17, vibrato: { rate: 11, depth: 22 }, partial: { ratio: 2, level: 0.1 } });
    tone({ freq: midi(91), dur: 0.35, gain: 0.08, delay: 0.42, partial: { ratio: 3, level: 0.15 }, reverb: 0.35 });
  },
  /** music-box "잘했어!" */
  cheer() {
    [84, 88, 91, 96].forEach((n, i) => tone({ freq: midi(n), dur: 0.7, gain: 0.1, delay: i * 0.09, partial: { ratio: 3, level: 0.12 }, reverb: 0.4 }));
  },
  /** small fanfare + held shimmer */
  levelup() {
    [72, 76, 79, 84, 88, 91, 96].forEach((n, i) =>
      tone({ freq: midi(n), dur: 0.6, gain: 0.09, delay: i * 0.075, partial: { ratio: 3, level: 0.12 }, reverb: 0.45 }),
    );
    [84, 88, 91].forEach((n) => tone({ freq: midi(n), dur: 1.6, gain: 0.06, delay: 0.6, attack: 0.05, type: "triangle", reverb: 0.6 }));
    noise({ delay: 0.55, dur: 1.2, gain: 0.015, freq: 9000, q: 0.5, reverb: 0.6 });
  },
  /** very soft UI tap */
  tap() {
    tone({ freq: midi(86) * jitter(0.02), dur: 0.06, gain: 0.05 });
  },
};

let enabled = true;
export function setSfxEnabled(v: boolean) {
  enabled = v;
}

export function playSfx(name: SfxName) {
  if (!enabled) return;
  try {
    SFX[name]();
  } catch {
    // audio is a nice-to-have; never let it break an interaction
  }
}
