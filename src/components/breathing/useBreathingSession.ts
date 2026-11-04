"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MotionValue } from "motion/react";
import { cycleMs, type BreathPattern, type PhaseKind } from "@/lib/breathing";

const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

export interface PhaseState {
  kind: PhaseKind;
  /** index of the phase inside the cycle — changes even when two "hold"s follow each other */
  index: number;
  secondsLeft: number;
}

function phaseAt(pattern: BreathPattern, elapsed: number) {
  let t = elapsed % cycleMs(pattern);
  for (let i = 0; i < pattern.phases.length; i++) {
    const len = pattern.phases[i].seconds * 1000;
    if (t < len) return { i, kind: pattern.phases[i].kind, t, len };
    t -= len;
  }
  const last = pattern.phases.length - 1;
  return { i: last, kind: pattern.phases[last].kind, t: 0, len: pattern.phases[last].seconds * 1000 };
}

/** 0 = empty lungs, 1 = full. Holds keep the value of the phase before them. */
function breathValue(kind: PhaseKind, p: number) {
  if (kind === "inhale") return easeInOutSine(p);
  if (kind === "exhale") return 1 - easeInOutSine(p);
  return kind === "hold" ? 1 : 0;
}

/**
 * Breathing timer for any pattern. Writes the 0..1 breath value every frame
 * (drives Selly) and re-renders only when the visible second or phase changes.
 */
export function useBreathingSession(
  breath: MotionValue<number>,
  pattern: BreathPattern,
  totalMs: number,
  onComplete: () => void,
  onCue: (kind: PhaseKind) => void,
) {
  const [running, setRunning] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const elapsedRef = useRef(0);
  const lastTick = useRef(-1);
  const lastPhase = useRef(-1);
  const cbs = useRef({ onComplete, onCue });
  useEffect(() => {
    cbs.current = { onComplete, onCue };
  }, [onComplete, onCue]);

  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      elapsedRef.current = Math.min(totalMs, elapsedRef.current + (now - last));
      last = now;
      const e = elapsedRef.current;
      const ph = phaseAt(pattern, e);
      breath.set(breathValue(ph.kind, ph.t / ph.len));

      const cycleIndex = Math.floor(e / cycleMs(pattern)) * pattern.phases.length + ph.i;
      if (cycleIndex !== lastPhase.current) {
        lastPhase.current = cycleIndex;
        if (e < totalMs) cbs.current.onCue(ph.kind);
      }
      const tick = Math.floor(e / 250);
      if (tick !== lastTick.current) {
        lastTick.current = tick;
        setElapsed(e);
      }
      if (e >= totalMs) {
        breath.set(0);
        cbs.current.onComplete();
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [running, breath, pattern, totalMs]);

  const toggle = useCallback(() => setRunning((r) => !r), []);

  const ph = phaseAt(pattern, elapsed);
  const phase: PhaseState = { kind: ph.kind, index: ph.i, secondsLeft: Math.max(1, Math.ceil((ph.len - ph.t) / 1000)) };

  return {
    running,
    toggle,
    phase,
    remainingMs: totalMs - elapsed,
    sessionProgress: elapsed / totalMs,
  };
}
