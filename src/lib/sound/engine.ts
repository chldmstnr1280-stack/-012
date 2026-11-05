"use client";

/**
 * Tiny Web Audio engine. Every sound in Dear Selly is synthesized here —
 * there are no audio files, so nothing to license and nothing to download.
 *
 *   voices → [music bus | sfx bus | cue bus] → master → compressor → speakers
 *                     ↘ reverb send ↗
 *
 * Browsers only allow audio after a user gesture, so `unlock()` is called from
 * the first tap anywhere in the app.
 */

type Bus = "music" | "sfx" | "cue";

interface Engine {
  ctx: AudioContext;
  master: GainNode;
  buses: Record<Bus, GainNode>;
  reverb: ConvolverNode;
  reverbIn: GainNode;
}

let engine: Engine | null = null;

function makeImpulse(ctx: AudioContext, seconds = 2.8, decay = 3) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return buf;
}

function create(): Engine | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  // iOS: follow the ringer switch and mix politely with other audio
  const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
  if (session) session.type = "ambient";

  const ctx = new AC();
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14;
  comp.ratio.value = 3;
  comp.connect(ctx.destination);
  const master = ctx.createGain();
  master.gain.value = 0.9;
  master.connect(comp);

  const reverb = ctx.createConvolver();
  reverb.buffer = makeImpulse(ctx);
  const reverbIn = ctx.createGain();
  const reverbOut = ctx.createGain();
  reverbOut.gain.value = 0.55;
  reverbIn.connect(reverb).connect(reverbOut).connect(master);

  const bus = (v: number) => {
    const g = ctx.createGain();
    g.gain.value = v;
    g.connect(master);
    return g;
  };
  return { ctx, master, buses: { music: bus(0), sfx: bus(0.7), cue: bus(0.8) }, reverb, reverbIn };
}

export function getEngine(): Engine | null {
  engine ??= create();
  return engine;
}

/** Call from a user gesture. Resumes the context and plays a silent blip (iOS unlock). */
export function unlock() {
  const e = getEngine();
  if (!e) return;
  if (e.ctx.state !== "running") e.ctx.resume().catch(() => {});
  const b = e.ctx.createBuffer(1, 1, e.ctx.sampleRate);
  const s = e.ctx.createBufferSource();
  s.buffer = b;
  s.connect(e.ctx.destination);
  s.start();
}

export const isRunning = () => engine?.ctx.state === "running";

export function setBusVolume(bus: Bus, v: number, fade = 0.4) {
  const e = engine;
  if (!e) return;
  const g = e.buses[bus].gain;
  const now = e.ctx.currentTime;
  g.cancelScheduledValues(now);
  g.setValueAtTime(g.value, now);
  g.linearRampToValueAtTime(Math.max(0, Math.min(3, v)), now + fade);
}

export function suspend() {
  engine?.ctx.suspend().catch(() => {});
}
export function resume() {
  if (engine && engine.ctx.state === "suspended") engine.ctx.resume().catch(() => {});
}

export const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

export interface ToneOpts {
  freq: number;
  /** seconds from now (or absolute time when `at` is given) */
  delay?: number;
  at?: number;
  dur: number;
  type?: OscillatorType;
  gain?: number;
  attack?: number;
  /** glide the pitch to this frequency over `glide` seconds */
  to?: number;
  glide?: number;
  /** then glide again (for "kyu~" style squeaks) */
  to2?: number;
  glide2?: number;
  vibrato?: { rate: number; depth: number };
  reverb?: number;
  bus?: Bus;
  /** extra partial for a music-box / bell colour, as ratio + level */
  partial?: { ratio: number; level: number };
  lowpass?: number;
}

/** One enveloped voice. Returns nothing; nodes clean themselves up after stopping. */
export function tone(o: ToneOpts) {
  const e = engine;
  // a context that is still resuming queues the sound and plays it a moment later
  if (!e || e.ctx.state === "closed") return;
  const { ctx } = e;
  const t = o.at ?? ctx.currentTime + (o.delay ?? 0);
  const attack = o.attack ?? 0.008;
  const peak = o.gain ?? 0.2;

  const env = ctx.createGain();
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(peak, t + attack);
  env.gain.exponentialRampToValueAtTime(0.0001, t + attack + o.dur);

  let out: AudioNode = env;
  if (o.lowpass) {
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = o.lowpass;
    env.connect(f);
    out = f;
  }
  out.connect(e.buses[o.bus ?? "sfx"]);
  if (o.reverb) {
    const send = ctx.createGain();
    send.gain.value = o.reverb;
    out.connect(send).connect(e.reverbIn);
  }

  const voices: { ratio: number; level: number }[] = [{ ratio: 1, level: 1 }];
  if (o.partial) voices.push(o.partial);
  const end = t + attack + o.dur + 0.05;
  for (const v of voices) {
    const osc = ctx.createOscillator();
    osc.type = o.type ?? "sine";
    osc.frequency.setValueAtTime(o.freq * v.ratio, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to * v.ratio, t + (o.glide ?? 0.1));
    if (o.to && o.to2) osc.frequency.exponentialRampToValueAtTime(o.to2 * v.ratio, t + (o.glide ?? 0.1) + (o.glide2 ?? 0.1));
    if (o.vibrato) {
      const lfo = ctx.createOscillator();
      const depth = ctx.createGain();
      lfo.frequency.value = o.vibrato.rate;
      depth.gain.value = o.vibrato.depth * v.ratio;
      lfo.connect(depth).connect(osc.frequency);
      lfo.start(t);
      lfo.stop(end);
    }
    let src: AudioNode = osc;
    if (v.level !== 1) {
      const lv = ctx.createGain();
      lv.gain.value = v.level;
      osc.connect(lv);
      src = lv;
    }
    src.connect(env);
    osc.start(t);
    osc.stop(end);
  }
}

/** Short filtered noise burst (sparkle / water texture). */
export function noise({ delay = 0, dur = 0.15, gain = 0.05, freq = 6000, q = 1, bus = "sfx" as Bus, reverb = 0 }) {
  const e = engine;
  if (!e || e.ctx.state === "closed") return;
  const { ctx } = e;
  const t = ctx.currentTime + delay;
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = freq;
  f.Q.value = q;
  const env = ctx.createGain();
  env.gain.setValueAtTime(gain, t);
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(env).connect(e.buses[bus]);
  if (reverb) {
    const s = ctx.createGain();
    s.gain.value = reverb;
    env.connect(s).connect(e.reverbIn);
  }
  src.start(t);
  src.stop(t + dur + 0.02);
}
