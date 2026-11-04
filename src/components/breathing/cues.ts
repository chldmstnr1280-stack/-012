"use client";

import type { PhaseKind } from "@/lib/breathing";

/**
 * Gentle phase cues: a soft synthesized chime (no audio files) and a short vibration
 * where supported (Android). The AudioContext must be created from a user tap.
 */
let ctx: AudioContext | null = null;

export function unlockAudio() {
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx ??= new AC();
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
  } catch {
    ctx = null;
  }
}

const TONE: Record<PhaseKind, number> = { inhale: 523.25, hold: 659.25, exhale: 392, rest: 329.63 };

export function chime(kind: PhaseKind) {
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = TONE[kind];
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.07, now + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 1.7);
}

export const canVibrate = () => typeof navigator !== "undefined" && "vibrate" in navigator;

export function buzz(kind: PhaseKind) {
  if (!canVibrate()) return;
  navigator.vibrate(kind === "inhale" ? 40 : kind === "exhale" ? [20, 60, 20] : 15);
}
