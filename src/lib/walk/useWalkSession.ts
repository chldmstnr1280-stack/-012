"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motionValue } from "motion/react";
import { pickPrompt, type WalkPrompt, type WalkTime } from "@/data/walkingPrompts";
import { requestMotionAccess, startStepDetector, type StepDetector } from "./stepDetector";
import { goalMinutes } from "./sunlight";

export type WalkPhase = "intro" | "walking" | "ending" | "summary";
/** motion = steps from the motion sensor; mind = "마음 산책" (time only) */
export type WalkMode = "motion" | "mind";

const GROUND_SPEED = 58; // px/s at an easy pace
const FIRST_PROMPT_MS = 75_000; // not at the same moment as the first sunlight piece

export function useWalkSession(time: WalkTime, onCue: () => void) {
  const [phase, setPhase] = useState<WalkPhase>("intro");
  const [mode, setMode] = useState<WalkMode>("mind");
  /** goal in steps (null = 자유 산책); a 마음 산책 turns it into minutes */
  const [goalSteps, setGoalSteps] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [moving, setMoving] = useState(false);
  const [cadence, setCadence] = useState(1.8);
  const [steps, setSteps] = useState(0);
  const [prompt, setPrompt] = useState<{ id: number; p: WalkPrompt } | null>(null);
  const [distance] = useState(() => motionValue(0));

  const startedAt = useRef(0);
  const stepsRef = useRef(0);
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
  const start = useCallback(async (goal: number | null) => {
    setGoalSteps(goal);
    stepsRef.current = 0;
    const access = await requestMotionAccess();
    startedAt.current = Date.now();
    nextPrompt.current = FIRST_PROMPT_MS;
    mindPlan.current = { walking: true, until: Date.now() + 30_000 };
    if (access === "granted") {
      setMode("motion");
      detector.current = startStepDetector(
        (cad) => {
          lastStep.current = Date.now();
          stepsRef.current += 1;
          setSteps(stepsRef.current);
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
      if (goalSteps && (mode === "motion" ? stepsRef.current >= goalSteps : e >= goalMinutes(goalSteps) * 60_000)) end();
    }, 400);
    return () => clearInterval(id);
  }, [phase, mode, goalSteps, time, end]);

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

  // a 마음 산책 with a step goal runs for the matching time
  const targetMs = goalSteps && mode === "mind" ? goalMinutes(goalSteps) * 60_000 : null;

  return { phase, mode, goalSteps, targetMs, elapsed, moving, cadence, steps, prompt, distance, start, end, dismissPrompt };
}
