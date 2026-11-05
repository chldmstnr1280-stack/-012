"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * "소리 내어 말하기" — listens for the user's voice and reports only how loud it
 * is. Nothing is recorded, transcribed, stored or sent; the microphone is
 * released as soon as `stop()` runs or the component unmounts.
 */
export function useVoiceLevel() {
  const [level, setLevel] = useState(0); // 0..1
  const [spoke, setSpoke] = useState(false);
  const [state, setState] = useState<"off" | "asking" | "on" | "denied">("off");
  const ref = useRef<{ stream: MediaStream; ctx: AudioContext; raf: number } | null>(null);
  const voiced = useRef(0);

  const stop = useCallback(() => {
    const r = ref.current;
    if (!r) return;
    cancelAnimationFrame(r.raf);
    r.stream.getTracks().forEach((t) => t.stop());
    void r.ctx.close().catch(() => {});
    ref.current = null;
    setLevel(0);
    setState((s) => (s === "on" ? "off" : s));
  }, []);

  /** Start listening for one utterance; `spoke` turns true after ~0.5 s of voice. */
  const start = useCallback(async () => {
    stop();
    setSpoke(false);
    voiced.current = 0;
    if (!navigator.mediaDevices?.getUserMedia) {
      setState("denied");
      return false;
    }
    setState("asking");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      const ctx = new AudioContext();
      const src = ctx.createMediaStreamSource(stream);
      const an = ctx.createAnalyser();
      an.fftSize = 1024;
      src.connect(an);
      const buf = new Float32Array(an.fftSize);
      let last = performance.now();
      const tick = () => {
        an.getFloatTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
        const rms = Math.sqrt(sum / buf.length);
        const v = Math.min(1, rms * 9);
        setLevel(v);
        const now = performance.now();
        if (v > 0.18) voiced.current += now - last;
        last = now;
        if (voiced.current > 500) setSpoke(true);
        if (ref.current) ref.current.raf = requestAnimationFrame(tick);
      };
      ref.current = { stream, ctx, raf: requestAnimationFrame(tick) };
      setState("on");
      return true;
    } catch {
      setState("denied");
      return false;
    }
  }, [stop]);

  useEffect(() => stop, [stop]);
  return { level, spoke, state, start, stop };
}
