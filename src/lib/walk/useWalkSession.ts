"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motionValue } from "motion/react";
import { pickPrompt, type WalkPrompt, type WalkTime } from "@/data/walkingPrompts";
import { requestMotionAccess, startStepDetector, type StepDetector } from "./stepDetector";

export type WalkPhase = "intro" | "walking" | "ending" | "summary";
/** motion = steps from the motion sensor; mind = "마음 산책" (time only) */
export type WalkMode = "motion" | "mind";

const GROUND_SPEED = 58; // px/s at an easy pace
const FIRST_PROMPT_MS = 60_000;

export function useWalkSession(time: WalkTime, onCue: () => void) {
  const [phase, setPhase] = useState<WalkPhase>("intro");
  const [mode, setMode] = useState<WalkMode>("mind");
  const [targetMs, setTargetMs] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [moving, setMoving] = useState(false);
  const [cadence, setCadence] = useState(1.8);
  const [steps, setSteps] = useState(0);
  const [prompt, setPrompt] = useState<{ id: number; p: WalkPrompt } | null>(null);
  const [distance] = useState(() => motionValue(0));

  const startedAt = useRef(0);
  const lastStep = useRef(0);
  const sampled = useRef(false);
  const detector = useRef<StepDetector | null>(null);
  const nextPrompt = useRef(FIRST_PROMPT_MS);
  const recent = useRef<string[]>([]);
  const counter = useRef(0);
  const mindPlan = useRef({ walking: true, until: 0 });
  const phaseRef = useRef<WalkPhase>("intro");
  const cueRef = useRef(onCue);
  useEffect(() => {
    cueRef.current = onCue;
  }, [onCue]);

  const setP = (p: WalkPhase) => {
    phaseRef.current = p;
    setPhase(p);
  };

  /** Must run from the user's tap (motion permission on iOS). */
  const start = useCallback(async (minutes: number | null) => {
    setTargetMs(minutes ? minutes * 60_000 : null);
    const access = await requestMotionAccess();
    startedAt.current = Date.now();
    nextPrompt.current = FIRST_PROMPT_MS;
    mindPlan.current = { walking: true, until: Date.now() + 30_000 };
    if (access === "granted") {
      setMode("motion");
      detector.current = startStepDetector(
        (cad) => {
          lastStep.current = Date.now();
          setSteps((s) => s + 1);
          setCadence((c) => c * 0.7 + Math.max(1.2, Math.min(2.6, cad)) * 0.3);
        },
        () => {
          sampled.current = true;
        },
      );
      // no sensor data at all (e.g. a desktop browser) → mind walk
      setTimeout(() => {
        if (!sampled.current && phaseRef.current === "walking") {
          detector.current?.stop();
          setMode("mind");
        }
      }, 3500);
    } else setMode("mind");
    setP("walking");
    return access;
  }, []);

  const end = useCallback(() => {
    if (phaseRef.current !== "walking") return;
    detector.current?.stop();
    setPrompt(null);
    setMoving(false);
    setP("ending");
    setTimeout(() => setP("summary"), 2600);
  }, []);

  // clock, movement state, prompts — wall-clock based so a dimmed screen loses nothing
  useEffect(() => {
    if (phase !== "walking") return;
    const id = setInterval(() => {
      const now = Date.now();
      const e = now - startedAt.current;
      setElapsed(e);
      if (mode === "motion") setMoving(now - lastStep.current < 1800);
      else {
        const plan = mindPlan.current;
        if (now > plan.until) {
          mindPlan.current = plan.walking
            ? { walking: false, until: now + 5000 + Math.random() * 4000 }
            : { walking: true, until: now + 25_000 + Math.random() * 25_000 };
        }
        setMoving(mindPlan.current.walking);
      }
      if (e >= nextPrompt.current) {
        nextPrompt.current = e + 180_000 + Math.random() * 60_000;
        const p = pickPrompt(time, recent.current);
        recent.current = [...recent.current.slice(-4), p.id];
        counter.current += 1;
        setPrompt({ id: counter.current, p });
        cueRef.current();
      }
      if (targetMs && e >= targetMs) end();
    }, 400);
    return () => clearInterval(id);
  }, [phase, mode, targetMs, time, end]);

  // scenery scroll
  useEffect(() => {
    if (phase !== "walking") return;
    let raf = 0;
    let last = performance.now();
    let v = 0;
    const frame = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const target = moving ? GROUND_SPEED * (cadence / 1.8) : 0;
      v += (target - v) * Math.min(1, dt * 2.5);
      distance.set(distance.get() + v * dt);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [phase, moving, cadence, distance]);

  useEffect(() => () => detector.current?.stop(), []);

  const dismissPrompt = useCallback(() => setPrompt(null), []);

  return { phase, mode, targetMs, elapsed, moving, cadence, steps, prompt, distance, start, end, dismissPrompt };
}
