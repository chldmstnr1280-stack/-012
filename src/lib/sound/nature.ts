"use client";

import type { TimeOfDay } from "@/lib/game/behaviorEngine";
import type { Weather } from "@/lib/garden/weather";
import { getEngine, noiseBuffer, setBusVolume, tone } from "./engine";

/**
 * 자연의 소리 — synthesized, like every sound in Dear Selly (no audio files).
 *   맑음  birds        흐림  soft wind      비  rain + drops on the glass roof
 *   눈    winter wind  밤    crickets (when it isn't raining or snowing)
 * Each layer fades in and out over a few seconds, so changing the weather
 * crossfades. Nothing plays until the engine is unlocked by a tap, and
 * nothing is scheduled while the audio context is suspended (tab hidden).
 */
type LayerId = "rain" | "wind" | "winter" | "birds" | "crickets";

interface Layer {
  gain: GainNode;
  stop: () => void;
}

const FADE = 2.5;
const LEVEL: Record<LayerId, number> = { rain: 0.5, wind: 0.32, winter: 0.26, birds: 1, crickets: 1 };
const layers = new Map<LayerId, Layer>();
let volume = 0.5;
let duck = 1;

export function layersFor(weather: Weather, tod: TimeOfDay): LayerId[] {
  const night = tod === "night";
  const out: LayerId[] = [];
  if (weather === "rain") out.push("rain");
  if (weather === "cloudy") out.push("wind");
  if (weather === "snow") out.push("winter");
  if ((weather === "clear" || weather === "rainbow") && !night) out.push("birds");
  if (night && weather !== "rain" && weather !== "snow") out.push("crickets");
  return out;
}

function running() {
  const e = getEngine();
  return e && e.ctx.state === "running" ? e : null;
}

/** a looping noise bed through a filter chain */
function noiseLayer(id: LayerId, build: (ctx: AudioContext, src: AudioBufferSourceNode) => AudioNode, extra?: (ctx: AudioContext) => () => void): Layer | null {
  const e = getEngine();
  if (!e) return null;
  const { ctx } = e;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx);
  src.loop = true;
  // start somewhere random so layers never line up
  src.start(ctx.currentTime, Math.random() * 3.5);
  const gain = ctx.createGain();
  gain.gain.value = 0;
  build(ctx, src).connect(gain).connect(e.buses.nature);
  const stopExtra = extra?.(ctx);
  return {
    gain,
    stop: () => {
      try {
        src.stop();
      } catch {}
      stopExtra?.();
      gain.disconnect();
    },
  };
}

/** a layer of little scheduled sounds (birds, crickets, drops) */
function eventLayer(fire: (at: number) => number): Layer | null {
  const e = getEngine();
  if (!e) return null;
  const { ctx } = e;
  const gain = ctx.createGain();
  gain.gain.value = 0;
  gain.connect(e.buses.nature);
  let next = ctx.currentTime + 0.5;
  const t = setInterval(() => {
    if (!running()) return;
    const now = ctx.currentTime;
    if (next < now) next = now + 0.1;
    // schedule up to half a second ahead
    while (next < now + 0.5) next += fire(next);
  }, 200);
  return {
    gain,
    stop: () => {
      clearInterval(t);
      setTimeout(() => gain.disconnect(), 400);
    },
  };
}

function make(id: LayerId): Layer | null {
  switch (id) {
    case "rain": {
      const bed = noiseLayer("rain", (ctx, src) => {
        const hp = ctx.createBiquadFilter();
        hp.type = "highpass";
        hp.frequency.value = 350;
        const lp = ctx.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.value = 3200;
        src.connect(hp).connect(lp);
        return lp;
      });
      if (!bed) return null;
      // drops tapping on the glass roof
      const drops = eventLayer((at) => {
        tone({ at, freq: 2400 + Math.random() * 3200, dur: 0.025 + Math.random() * 0.03, gain: 0.012 + Math.random() * 0.02, bus: "nature", reverb: 0.25, lowpass: 6000 });
        return 0.05 + Math.random() * 0.22;
      });
      if (drops) {
        drops.gain.disconnect();
        drops.gain.gain.value = 1;
      }
      return { gain: bed.gain, stop: () => (bed.stop(), drops?.stop()) };
    }
    case "wind":
    case "winter": {
      const winter = id === "winter";
      return noiseLayer(
        id,
        (ctx, src) => {
          const bp = ctx.createBiquadFilter();
          bp.type = "bandpass";
          bp.frequency.value = winter ? 700 : 420;
          bp.Q.value = winter ? 2.2 : 0.7;
          const sway = ctx.createGain();
          sway.gain.value = 0.7;
          src.connect(bp).connect(sway);
          // slow gusts: an LFO on the level (and the pitch for the winter wind)
          const lfo = ctx.createOscillator();
          lfo.frequency.value = winter ? 0.05 : 0.08;
          const depth = ctx.createGain();
          depth.gain.value = 0.35;
          lfo.connect(depth).connect(sway.gain);
          if (winter) {
            const fd = ctx.createGain();
            fd.gain.value = 260;
            lfo.connect(fd).connect(bp.frequency);
          }
          lfo.start();
          return sway;
        },
      );
    }
    case "birds":
      return eventLayer((at) => {
        // a short phrase of 2–5 chirps, then a rest
        const notes = 2 + Math.floor(Math.random() * 4);
        const base = 2600 + Math.random() * 1600;
        for (let i = 0; i < notes; i++) {
          const f = base * (1 + (Math.random() - 0.3) * 0.25);
          tone({ at: at + i * (0.09 + Math.random() * 0.05), freq: f, to: f * (1.15 + Math.random() * 0.3), glide: 0.05, dur: 0.07, gain: 0.035, bus: "nature", reverb: 0.3, attack: 0.005 });
        }
        return notes * 0.13 + 2.5 + Math.random() * 6;
      });
    case "crickets":
      return eventLayer((at) => {
        const f = Math.random() < 0.5 ? 4400 : 4900;
        for (let i = 0; i < 3; i++) tone({ at: at + i * 0.045, freq: f, dur: 0.022, gain: 0.012, bus: "nature", attack: 0.004, reverb: 0.15 });
        // sometimes a pause
        return Math.random() < 0.15 ? 2 + Math.random() * 2 : 0.7 + Math.random() * 0.5;
      });
  }
}

function ramp(g: GainNode, to: number, secs = FADE) {
  const e = getEngine();
  if (!e) return;
  const now = e.ctx.currentTime;
  g.gain.cancelScheduledValues(now);
  g.gain.setValueAtTime(g.gain.value, now);
  g.gain.linearRampToValueAtTime(to, now + secs);
}

/** Crossfade to the sounds for this weather and time (null = silence). */
export function setNatureScene(scene: { weather: Weather; tod: TimeOfDay } | null) {
  if (!getEngine()) return;
  const want = new Set(scene ? layersFor(scene.weather, scene.tod) : []);
  for (const [id, l] of layers) {
    if (want.has(id)) continue;
    ramp(l.gain, 0);
    layers.delete(id);
    setTimeout(() => l.stop(), FADE * 1000 + 200);
  }
  for (const id of want) {
    if (layers.has(id)) continue;
    const l = make(id);
    if (!l) continue;
    layers.set(id, l);
    ramp(l.gain, LEVEL[id]);
  }
  applyVolume();
}

function applyVolume(fade = 0.8) {
  // nature sounds are soft by design; this brings them to a gentle level on phone speakers
  setBusVolume("nature", volume * duck * 1.5, fade);
}

export function setNatureVolume(v: number) {
  volume = Math.max(0, Math.min(1, v));
  applyVolume(0.3);
}

/** called by the story player (duckFor) — keeps nature quieter under a voice */
export function setNatureDuck(level: number) {
  duck = level;
  applyVolume(1.2);
}

export function stopNature() {
  setNatureScene(null);
}

/** for tests */
export const activeNatureLayers = () => [...layers.keys()];
