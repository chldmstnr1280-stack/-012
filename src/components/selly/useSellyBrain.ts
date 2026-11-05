"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motionValue, useReducedMotion, type MotionValue } from "motion/react";
import { SPOTS, depthScale, type Spot, type WorldPoint } from "@/data/greenhouseWorld";
import { AMBIENT, CALLED_LINES, GREETINGS, WAKE_LINES, pick } from "@/data/sellyDialogues";
import { chooseActivity, type Activity, type ActivityKind, type SellyState } from "@/lib/game/behaviorEngine";
import { currentTimeOfDay } from "@/lib/game/ambience";
import { clampToFloor, randomFloorPoint, toWorld, type WorldLayout } from "@/lib/game/world";
import type { VisitKind } from "@/lib/game/gameStore";

const WALK_SPEED = 72; // world px per second — an unhurried stroll
const STEP_HZ = 2.1;

export interface SellyBody {
  /** world position of Selly's feet */
  x: MotionValue<number>;
  y: MotionValue<number>;
  /** on-screen size multiplier (depth, or the breathing float) */
  scale: MotionValue<number>;
  /** walking bounce (px) and lean (deg) */
  hop: MotionValue<number>;
  tilt: MotionValue<number>;
}

export interface Bubble {
  id: number;
  text: string;
}

/**
 * Selly's behaviour state machine.
 * Exactly one main state is active; autonomous activities run one after another
 * and any user interaction cancels the current one, then autonomy resumes.
 */
export function useSellyBrain(layoutRef: React.RefObject<WorldLayout | null>) {
  const reduce = useReducedMotion() ?? false;
  const body = useMemo<SellyBody>(
    () => ({
      x: motionValue(SPOTS.rug.at.x),
      y: motionValue(SPOTS.rug.at.y),
      scale: motionValue(depthScale(SPOTS.rug.at.y)),
      hop: motionValue(0),
      tilt: motionValue(0),
    }),
    [],
  );
  const [state, setState] = useState<SellyState>("idle");
  const [facing, setFacing] = useState<-1 | 0 | 1>(0);
  const [spot, setSpot] = useState<Spot | null>(SPOTS.rug);
  const [bubble, setBubble] = useState<Bubble | null>(null);

  const gen = useRef(0); // bumping it cancels whatever is running
  const raf = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const bubbleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const history = useRef<ActivityKind[]>([]);
  const paused = useRef(false);
  const stateRef = useRef<SellyState>("idle");
  const counter = useRef(0);

  const set = useCallback((s: SellyState) => {
    stateRef.current = s;
    setState(s);
  }, []);

  const say = useCallback((text: string | null, ms = 3800) => {
    if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
    if (!text) {
      setBubble(null);
      return;
    }
    counter.current += 1;
    setBubble({ id: counter.current, text });
    if (ms > 0) bubbleTimer.current = setTimeout(() => setBubble(null), ms);
  }, []);

  const stopMotion = useCallback(() => {
    cancelAnimationFrame(raf.current);
    timers.current.forEach(clearTimeout);
    timers.current = [];
    body.hop.set(0);
    body.tilt.set(0);
  }, [body]);

  const cancel = useCallback(() => {
    gen.current += 1;
    stopMotion();
    return gen.current;
  }, [stopMotion]);

  const wait = useCallback((ms: number, g: number) => {
    return new Promise<boolean>((resolve) => {
      const t = setTimeout(() => resolve(g === gen.current), ms);
      timers.current.push(t);
    });
  }, []);

  /** Walk (hopping, facing the way she goes) or float (smooth, for breathing). */
  const moveTo = useCallback(
    (target: WorldPoint, g: number, mode: "walk" | "float" = "walk", floatScale?: number) =>
      new Promise<boolean>((resolve) => {
        const sx = body.x.get();
        const sy = body.y.get();
        const dist = Math.hypot(target.x - sx, target.y - sy);
        if (dist < 4 && mode === "walk") return resolve(g === gen.current);
        if (reduce) {
          // no travelling animation for reduced motion — a quiet fade-like step
          body.x.set(target.x);
          body.y.set(target.y);
          body.scale.set(floatScale ?? depthScale(target.y));
          return resolve(g === gen.current);
        }
        const startScale = body.scale.get();
        const endScale = floatScale ?? depthScale(target.y);
        const duration = mode === "walk" ? (dist / WALK_SPEED) * 1000 : 1300;
        const t0 = performance.now();
        if (mode === "walk" && Math.abs(target.x - sx) > 6) setFacing(target.x > sx ? 1 : -1);
        const frame = (now: number) => {
          if (g !== gen.current) return resolve(false);
          const p = Math.min(1, (now - t0) / duration);
          const e = mode === "walk" ? p : p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
          body.x.set(sx + (target.x - sx) * e);
          body.y.set(sy + (target.y - sy) * e);
          body.scale.set(mode === "walk" ? depthScale(body.y.get()) : startScale + (endScale - startScale) * e);
          if (mode === "walk") {
            const ph = ((now - t0) / 1000) * STEP_HZ * Math.PI;
            const fade = Math.min(1, p * 8, (1 - p) * 8); // ease in/out of the gait
            body.hop.set(-Math.abs(Math.sin(ph)) * 6 * fade);
            body.tilt.set(Math.sin(ph) * 3.2 * fade);
          }
          if (p >= 1) {
            body.hop.set(0);
            body.tilt.set(0);
            return resolve(g === gen.current);
          }
          raf.current = requestAnimationFrame(frame);
        };
        raf.current = requestAnimationFrame(frame);
      }),
    [body, reduce],
  );

  const runRef = useRef<(a: Activity) => void>(() => {});
  const next = useCallback(() => {
    if (paused.current) return;
    const act = chooseActivity(history.current, currentTimeOfDay(), { canMove: !reduce });
    history.current = [...history.current.slice(-5), act.kind];
    runRef.current(act);
  }, [reduce]);

  const run = useCallback(
    async (act: Activity) => {
      const g = cancel();
      const L = layoutRef.current ?? undefined;
      const target = act.goTo === "random" ? randomFloorPoint(L) : act.goTo ? clampToFloor(SPOTS[act.goTo].at, L) : null;
      const s = act.goTo && act.goTo !== "random" ? SPOTS[act.goTo] : null;
      if (target && Math.hypot(target.x - body.x.get(), target.y - body.y.get()) > 6) {
        setSpot(null);
        set("walking");
        if (!(await moveTo(target, g))) return;
      }
      setSpot(s);
      setFacing(s ? s.facing : 0);
      set(act.state);
      if (act.lineKey && Math.random() < 0.4) {
        const lines = AMBIENT[act.lineKey];
        if (lines) say(pick(lines), 3600);
      }
      if (await wait(act.durationMs, g)) next();
    },
    [body, cancel, layoutRef, moveTo, next, say, set, wait],
  );
  useEffect(() => {
    runRef.current = run;
  }, [run]);

  /** First appearance: greet the user warmly (never a guilt trip). */
  const start = useCallback(
    async (visit: VisitKind) => {
      const g = cancel();
      setSpot(SPOTS.rug);
      setFacing(0);
      set("greeting");
      say(pick(GREETINGS[visit]), 4200);
      if (await wait(4200, g)) next();
    },
    [cancel, next, say, set, wait],
  );

  /** The user touched Selly or cared for her: stop, face them, then carry on. */
  const interact = useCallback(
    async (line?: string, holdMs = 3800) => {
      const wasAsleep = stateRef.current === "sleeping";
      const g = cancel();
      setFacing(0);
      set("interacting");
      if (wasAsleep) say(pick(WAKE_LINES));
      else if (line) say(line);
      if (!(await wait(holdMs, g))) return;
      set("idle");
      if (await wait(1200, g)) next();
    },
    [cancel, next, say, set, wait],
  );

  /** The user tapped the floor: Selly comes over. */
  const walkTo = useCallback(
    async (p: WorldPoint) => {
      if (paused.current) return;
      const g = cancel();
      const target = clampToFloor(p, layoutRef.current ?? undefined);
      say(pick(CALLED_LINES), 2200);
      setSpot(null);
      set("walking");
      if (!(await moveTo(target, g))) return;
      setFacing(0);
      set("idle");
      if (await wait(4500, g)) next();
    },
    [cancel, layoutRef, moveTo, next, say, set, wait],
  );

  /** "함께 쉬기": walk to the cushion, sit (or doze off) and stay a while. */
  const rest = useCallback(
    async (line = "같이 쉬자 ♡", stayMs = 16000) => {
      if (paused.current) return;
      const g = cancel();
      say(line, 3200);
      const seat = SPOTS.rug.at;
      if (Math.hypot(seat.x - body.x.get(), seat.y - body.y.get()) > 6) {
        setSpot(null);
        set("walking");
        if (!(await moveTo(seat, g))) return;
      }
      setSpot(SPOTS.rug);
      setFacing(0);
      set("sitting");
      if (!(await wait(stayMs, g))) return;
      next();
    },
    [body, cancel, moveTo, next, say, set, wait],
  );

  /** A conversation begins: stop, come to the talk spot and face the user. */
  const engage = useCallback(async () => {
    const g = cancel();
    paused.current = true;
    say(null);
    const target = clampToFloor(SPOTS.talk.at, layoutRef.current ?? undefined);
    if (Math.hypot(target.x - body.x.get(), target.y - body.y.get()) > 6) {
      setSpot(null);
      set("walking");
      if (!(await moveTo(target, g))) return;
    }
    setSpot(SPOTS.talk);
    setFacing(0);
    set("interacting");
  }, [body, cancel, layoutRef, moveTo, say, set]);

  /** During a conversation: sit or doze on the cushion, or come close — and stay there. */
  const settle = useCallback(
    async (where: "cushion" | "close" | "back", sleep = false) => {
      const g = cancel();
      paused.current = true;
      // "back": left of the cushion, higher on screen — clear of a bottom panel and not behind the cushion
      const spotTo = where === "cushion" ? SPOTS.rug : where === "back" ? SPOTS.kind : SPOTS.close;
      const target = clampToFloor(spotTo.at, layoutRef.current ?? undefined);
      if (Math.hypot(target.x - body.x.get(), target.y - body.y.get()) > 6) {
        setSpot(null);
        set("walking");
        if (!(await moveTo(target, g))) return;
      }
      setSpot(spotTo);
      setFacing(0);
      set(where === "cushion" ? (sleep ? "sleeping" : "sitting") : "interacting");
    },
    [body, cancel, layoutRef, moveTo, set],
  );

  /** The conversation ended: if resting, stay a little longer; then life goes on. */
  const release = useCallback(async () => {
    const resting = stateRef.current === "sitting" || stateRef.current === "sleeping";
    const g = cancel();
    paused.current = false;
    if (!resting) set("idle");
    if (await wait(resting ? 15000 : 1500, g)) next();
  }, [cancel, next, set, wait]);

  /** Head out for a walk: stop living in the greenhouse and walk to the door. */
  const leave = useCallback(async () => {
    const g = cancel();
    paused.current = true;
    say("가자! ♡", 2000);
    const door = SPOTS.door.at;
    setSpot(null);
    set("walking");
    await moveTo(door, g);
    setFacing(0);
    set("idle");
  }, [cancel, moveTo, say, set]);

  /** Back from a walk: appear at the door, say so, then rest on the cushion. */
  const returnFromWalk = useCallback(
    async (line: string) => {
      const g = cancel();
      paused.current = false;
      body.x.set(SPOTS.door.at.x);
      body.y.set(SPOTS.door.at.y);
      body.scale.set(depthScale(SPOTS.door.at.y));
      setSpot(SPOTS.door);
      setFacing(0);
      set("greeting");
      say(line, 4200);
      if (!(await wait(3000, g))) return;
      set("walking");
      if (!(await moveTo(SPOTS.rug.at, g))) return;
      setSpot(SPOTS.rug);
      set("sitting");
      if (await wait(12000, g)) next();
    },
    [body, cancel, moveTo, next, say, set, wait],
  );

  /** Breathing takes over: float Selly to a calm spot above the controls, and back after. */
  const setBreathing = useCallback(
    async (on: boolean, screen?: { x: number; y: number }) => {
      const g = cancel();
      say(null);
      if (on) {
        paused.current = true;
        setSpot(null);
        setFacing(0);
        set("breathing");
        const L = layoutRef.current;
        if (L && screen) await moveTo(toWorld(L, screen.x, screen.y), g, "float", 0.95);
        return;
      }
      paused.current = false;
      const home = clampToFloor(SPOTS.rug.at, layoutRef.current ?? undefined);
      set("idle");
      if (!(await moveTo(home, g, "float"))) return;
      setSpot(SPOTS.rug);
      set("sitting");
      if (await wait(3500, g)) next();
    },
    [cancel, layoutRef, moveTo, next, say, set, wait],
  );

  useEffect(
    () => () => {
      gen.current += 1;
      stopMotion();
      if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
    },
    [stopMotion],
  );

  return { body, state, facing, spot, bubble, say, start, interact, walkTo, rest, leave, returnFromWalk, engage, settle, release, setBreathing };
}

export type SellyBrain = ReturnType<typeof useSellyBrain>;
