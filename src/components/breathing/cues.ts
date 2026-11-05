"use client";

import type { PhaseKind } from "@/lib/breathing";
import { midi, tone, unlock } from "@/lib/sound/engine";

/**
 * Breathing phase cues: a soft music-box chime on the shared sound engine,
 * and a short vibration where supported (Android).
 */
export const unlockAudio = unlock;

const NOTE: Record<PhaseKind, number[]> = {
  inhale: [72, 79], // rising fifth
  hold: [84],
  exhale: [79, 72], // falling fifth
  rest: [67],
};

export function chime(kind: PhaseKind) {
  NOTE[kind].forEach((n, i) =>
    tone({ freq: midi(n), delay: i * 0.18, dur: 1.8, gain: 0.08, bus: "cue", partial: { ratio: 3, level: 0.1 }, reverb: 0.5 }),
  );
}

export const canVibrate = () => typeof navigator !== "undefined" && "vibrate" in navigator;

export function buzz(kind: PhaseKind) {
  if (!canVibrate()) return;
  navigator.vibrate(kind === "inhale" ? 40 : kind === "exhale" ? [20, 60, 20] : 15);
}
