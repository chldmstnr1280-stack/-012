"use client";

import { getEngine, midi, setBusVolume, tone } from "./engine";

/**
 * "온실 오르골" — gentle generative music.
 * A slow pad progression with a music-box melody that wanders over a pentatonic
 * scale, so it never loops exactly. `calm` mode (breathing) thins the melody.
 */

const BEAT = 0.75; // seconds (80 bpm)
const BEATS_PER_CHORD = 8;

const CHORDS = [
  { root: 41, notes: [53, 57, 60, 64] }, // Fmaj7
  { root: 43, notes: [55, 59, 62, 64] }, // G6
  { root: 40, notes: [52, 55, 59, 62] }, // Em7
  { root: 45, notes: [57, 60, 64, 67] }, // Am7
];
// C major pentatonic, two octaves for the music box
const SCALE = [72, 74, 76, 79, 81, 84, 86, 88, 91, 93];

let timer: ReturnType<typeof setInterval> | null = null;
let nextTime = 0;
let step = 0; // eighth notes since start
let melodyIdx = 4;
let calm = false;
let volume = 0.5;

function chordAt(s: number) {
  return CHORDS[Math.floor(s / (BEATS_PER_CHORD * 2)) % CHORDS.length];
}

function schedule(at: number) {
  const chord = chordAt(step);
  const eighth = step % (BEATS_PER_CHORD * 2);

  // pad + soft bass at the top of each chord
  if (eighth === 0) {
    const len = BEAT * BEATS_PER_CHORD + 1.2;
    tone({ freq: midi(chord.root), at, dur: len, attack: 1.2, gain: 0.07, type: "sine", bus: "music", lowpass: 400 });
    chord.notes.forEach((n, i) => {
      [-4, 4].forEach((cents) =>
        tone({
          freq: midi(n) * Math.pow(2, cents / 1200),
          at: at + i * 0.04,
          dur: len,
          attack: 1.6,
          gain: 0.018,
          type: "triangle",
          bus: "music",
          lowpass: 1100,
          reverb: 0.35,
        }),
      );
    });
  }

  // music box melody — rest for the last 2 beats of every 4 bars
  const bar = Math.floor(step / 8);
  const inRest = bar % 4 === 3 && step % 8 >= 4;
  const onBeat = step % 2 === 0;
  const p = calm ? (onBeat ? 0.16 : 0.03) : onBeat ? 0.62 : 0.28;
  if (!inRest && Math.random() < p) {
    // random walk, nudged toward chord tones on the beat
    melodyIdx = Math.max(0, Math.min(SCALE.length - 1, melodyIdx + [-2, -1, -1, 0, 1, 1, 2][Math.floor(Math.random() * 7)]));
    let note = SCALE[melodyIdx];
    if (onBeat) {
      const tones = chord.notes.map((n) => n + 24);
      const near = tones.reduce((a, b) => (Math.abs(b - note) < Math.abs(a - note) ? b : a));
      if (Math.abs(near - note) <= 2) note = near;
    }
    const vel = 0.6 + Math.random() * 0.4;
    tone({
      freq: midi(note),
      at: at + (Math.random() - 0.5) * 0.02, // tiny humanize
      dur: 1.6,
      gain: 0.07 * vel,
      bus: "music",
      partial: { ratio: 3, level: 0.12 },
      reverb: 0.5,
    });
    // occasional soft harmony a sixth below
    if (onBeat && !calm && Math.random() < 0.18) tone({ freq: midi(note - 9), at, dur: 1.4, gain: 0.03 * vel, bus: "music", reverb: 0.5 });
  }

  // rare wind-chime sparkle
  if (!calm && Math.random() < 0.012) {
    [96, 100, 103].forEach((n, i) => tone({ freq: midi(n), at: at + i * 0.11, dur: 1.2, gain: 0.018, bus: "music", reverb: 0.7 }));
  }
  step += 1;
}

function tick() {
  const e = getEngine();
  if (!e || e.ctx.state !== "running") return;
  const now = e.ctx.currentTime;
  if (nextTime < now) nextTime = now + 0.1;
  while (nextTime < now + 0.6) {
    schedule(nextTime);
    nextTime += BEAT / 2;
  }
}

export function startMusic() {
  if (timer) return;
  const e = getEngine();
  if (!e) return;
  nextTime = e.ctx.currentTime + 0.2;
  step = 0;
  setBusVolume("music", volume * 2.7, 3);
  timer = setInterval(tick, 150);
  tick();
}

export function stopMusic() {
  if (!timer) return;
  clearInterval(timer);
  timer = null;
  setBusVolume("music", 0, 0.8);
}

export const isMusicPlaying = () => timer !== null;

export function setMusicVolume(v: number) {
  volume = v;
  if (timer) setBusVolume("music", v * 2.7, 0.3);
}

export function setMusicCalm(v: boolean) {
  calm = v;
}
