"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MotionValue } from "motion/react";

export const INHALE_MS = 4000;
export const EXHALE_MS = 4000;
export const SESSION_MS = 60_000;
const CYCLE = INHALE_MS + EXHALE_MS;

const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

export type BreathPhase = "inhale" | "exhale";

/**
 * 4s in / 4s out breathing timer for a 1 minute session.
 * Writes a 0..1 breath value to `breath` every frame (drives Selly) and only
 * re-renders React when the visible second / phase changes.
 */
export function useBreathingSession(breath: MotionValue<number>, onComplete: () => void) {
  const [running, setRunning] = useState(true);
  const [tick, setTick] = useState({ elapsed: 0 });
  const elapsedRef = useRef(0);
  const lastSecond = useRef(-1);
  const completeRef = useRef(onComplete);
  useEffect(() => {
    completeRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      elapsedRef.current = Math.min(SESSION_MS, elapsedRef.current + (now - last));
      last = now;
      const e = elapsedRef.current;
      const inCycle = e % CYCLE;
      const value = inCycle < INHALE_MS ? easeInOutSine(inCycle / INHALE_MS) : 1 - easeInOutSine((inCycle - INHALE_MS) / EXHALE_MS);
      breath.set(value);

      const sec = Math.floor(e / 250);
      if (sec !== lastSecond.current) {
        lastSecond.current = sec;
        setTick({ elapsed: e });
      }
      if (e >= SESSION_MS) {
        breath.set(0);
        completeRef.current();
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [running, breath]);

  const toggle = useCallback(() => setRunning((r) => !r), []);

  const e = tick.elapsed;
  const inCycle = e % CYCLE;
  const phase: BreathPhase = inCycle < INHALE_MS ? "inhale" : "exhale";
  const phaseElapsed = phase === "inhale" ? inCycle : inCycle - INHALE_MS;
  const phaseDuration = phase === "inhale" ? INHALE_MS : EXHALE_MS;

  return {
    running,
    toggle,
    phase,
    /** seconds left in the current phase, 4 → 1 */
    phaseSecondsLeft: Math.max(1, Math.ceil((phaseDuration - phaseElapsed) / 1000)),
    phaseProgress: phaseElapsed / phaseDuration,
    remainingMs: SESSION_MS - e,
    sessionProgress: e / SESSION_MS,
  };
}
