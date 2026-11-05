"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useAnimate, useReducedMotion, useTransform } from "motion/react";
import { useSelly, type SellyReaction } from "@/lib/selly-store";
import { SellyBody, SellyDefs } from "./SellyBody";
import { SellyFace, type SellyExpression } from "./SellyFace";
import { VECTOR_FACE, sellyArt } from "@/lib/assets";
import type { StageId } from "@/lib/growth";

/** Younger stages are a little smaller. */
const STAGE_SIZE: Record<StageId, number> = { seed: 0.78, sprout: 0.88, leaf: 1, bloom: 1 };
import { SellyBurst, type BurstKind } from "./SellyEffects";

export type SellyMode = "idle" | "breathing";

interface SellyProps {
  mode?: SellyMode;
  /** fixed expression (e.g. a sleepy Selly on the report) */
  pose?: SellyExpression;
  /** growth stage to draw; defaults to the user's current stage */
  stage?: StageId;
  /** Called when the user taps Selly (only in idle mode). */
  onTouch?: () => void;
  className?: string;
  /** stop the idle float (while walking, sitting or sleeping) */
  still?: boolean;
  /** where the eyes look: -1 left … 1 right */
  look?: number;
}

const BURST_FOR: Record<SellyReaction, BurstKind> = {
  touch: "sparkle",
  greet: "sparkle",
  water: "water",
  sun: "sun",
  pat: "heart",
  cheer: "heart",
};

/**
 * Selly — the interactive character.
 *
 * Layering (outer → inner), each with a single motion responsibility:
 *   floater  : slow idle bob (declarative loop)
 *   jumper   : one-shot reactions — hop, squash, wiggle (imperative)
 *   breather : idle breathing, or scale driven by the breathing session
 *   svg      : body / leaves / live face
 */
export function Selly({ mode = "idle", pose, stage, onTouch, className, still = false, look = 0 }: SellyProps) {
  const { reaction, breath, stage: myStage } = useSelly();
  const shownStage = stage ?? myStage.id;
  const reduce = useReducedMotion();
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const [expression, setExpression] = useState<SellyExpression>("idle");
  const [blink, setBlink] = useState(false);
  const [burst, setBurst] = useState<{ id: number; kind: BurstKind } | null>(null);
  const [perk, setPerk] = useState(0);
  const [glow, setGlow] = useState(0);
  const exprTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Ignore whatever reaction was already in the store when this Selly mounted.
  const [mountedReactionId] = useState(() => reaction?.id ?? 0);
  const breathing = mode === "breathing";

  // Breathing session drives scale & leaf spread
  const breathScale = useTransform(breath, [0, 1], [0.965, 1.075]);
  const leftSpread = useTransform(breath, [0, 1], [0, -9]);
  const rightSpread = useTransform(breath, [0, 1], [0, 9]);

  const shownExpression: SellyExpression = breathing ? "relaxed" : expression === "idle" && pose ? pose : expression;

  // Natural blinking with random intervals
  useEffect(() => {
    if (shownExpression !== "idle") return;
    let t: ReturnType<typeof setTimeout>;
    const loop = () => {
      t = setTimeout(() => {
        setBlink(true);
        t = setTimeout(() => {
          setBlink(false);
          // occasional double-blink
          if (Math.random() < 0.2) {
            t = setTimeout(() => {
              setBlink(true);
              t = setTimeout(() => {
                setBlink(false);
                loop();
              }, 120);
            }, 140);
          } else loop();
        }, 130);
      }, 2400 + Math.random() * 3600);
    };
    loop();
    return () => clearTimeout(t);
  }, [shownExpression]);

  // React to events coming from the store (touch, care, greeting...)
  useEffect(() => {
    if (!reaction || breathing || reaction.id <= mountedReactionId) return;
    const { type, id } = reaction;
    const hold = (e: SellyExpression, ms: number) => {
      if (exprTimer.current) clearTimeout(exprTimer.current);
      setExpression(e);
      exprTimer.current = setTimeout(() => setExpression("idle"), ms);
    };

    const run = async () => {
      setBurst({ id, kind: BURST_FOR[type] });
      const j = ".selly-jumper";
      const s = ".selly-shadow";
      if (type === "touch" || type === "cheer") {
        hold("happy", 1900);
        if (reduce) return;
        await animate(j, { scaleX: 1.08, scaleY: 0.88, y: 0 }, { duration: 0.12, ease: "easeOut" });
        animate(s, { scale: 0.7, opacity: 0.35 }, { duration: 0.26, ease: "easeOut" });
        await animate(j, { scaleX: 0.95, scaleY: 1.07, y: -34 }, { duration: 0.26, ease: [0.2, 0.7, 0.3, 1] });
        animate(s, { scale: 1, opacity: 0.6 }, { duration: 0.26, ease: "easeIn" });
        await animate(j, { scaleX: 1, scaleY: 1, y: 0 }, { duration: 0.26, ease: [0.6, 0, 0.9, 0.5] });
        await animate(j, { scaleX: 1.06, scaleY: 0.93 }, { duration: 0.1 });
        await animate(j, { scaleX: 1, scaleY: 1 }, { type: "spring", stiffness: 320, damping: 11 });
      } else if (type === "greet") {
        hold("happy", 2200);
        if (reduce) return;
        await animate(j, { rotate: [0, -5, 5, -3, 0], y: [0, -8, 0, -4, 0] }, { duration: 1.4, ease: "easeInOut" });
      } else if (type === "pat") {
        hold("love", 2200);
        if (reduce) return;
        await animate(j, { scaleX: [1, 1.07, 0.98, 1.04, 1], scaleY: [1, 0.92, 1.02, 0.96, 1], rotate: [0, -3, 3, -1.5, 0] }, { duration: 1, ease: "easeInOut" });
      } else if (type === "water") {
        hold("happy", 2400);
        setTimeout(() => setPerk((p) => p + 1), 650);
        if (reduce) return;
        await animate(j, { scaleY: [1, 1, 0.94, 1.04, 1], y: [0, 0, 2, -6, 0] }, { duration: 1.5, times: [0, 0.45, 0.6, 0.8, 1] });
      } else if (type === "sun") {
        hold("relaxed", 1200);
        setGlow(1);
        setTimeout(() => {
          setGlow(0);
          hold("happy", 1400);
        }, 1400);
        if (reduce) return;
        await animate(j, { scale: [1, 1.04, 1] }, { duration: 1.6, ease: "easeInOut" });
      }
    };
    run();
  }, [reaction, breathing, animate, reduce, mountedReactionId]);

  useEffect(() => {
    if (!breathing) return;
    breath.set(0);
  }, [breathing, breath]);

  return (
    <div ref={scope} className={`relative aspect-square ${className ?? ""}`}>
      {/* contact shadow */}
      <motion.div
        className="absolute left-1/2 top-[85%] h-[9%] w-[58%] -translate-x-1/2"
        animate={reduce || breathing ? { scaleX: 1 } : { scaleX: [1, 0.93, 1] }}
        transition={reduce || breathing ? { duration: 0.6, ease: "easeOut" } : { duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="selly-shadow h-full w-full rounded-[50%] bg-[radial-gradient(closest-side,rgba(84,92,48,0.5),rgba(84,92,48,0))] opacity-60" />
      </motion.div>

      <motion.div
        className="absolute inset-0"
        animate={reduce || breathing || still ? { y: 0 } : { y: [0, -7, 0] }}
        transition={reduce || breathing || still ? { duration: 0.6, ease: "easeOut" } : { duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="selly-jumper absolute inset-0" style={{ transformOrigin: "50% 88%" }}>
          <motion.div
            className="absolute inset-0"
            style={breathing ? { scale: breathScale, originX: 0.5, originY: 0.88 } : { originX: 0.5, originY: 0.88 }}
            animate={breathing || reduce ? { scaleX: 1, scaleY: 1 } : { scaleY: [1, 1.022, 1], scaleX: [1, 0.992, 1] }}
            // settle once when breathing takes over (a repeating settle would keep wobbling)
            transition={breathing || reduce ? { duration: 0.6, ease: "easeOut" } : { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
          >
            <svg
              viewBox="0 0 240 240"
              className="h-full w-full overflow-visible transition-transform duration-700"
              style={{ transform: `scale(${STAGE_SIZE[shownStage]})`, transformOrigin: "50% 90%" }}
              aria-hidden
            >
              <SellyDefs />
              <SellyBody leftSpread={leftSpread} rightSpread={rightSpread} perk={perk} glow={glow} stage={shownStage} />
              <SellyFace expression={shownExpression} blink={blink} layout={sellyArt?.face ?? VECTOR_FACE} look={look} />
            </svg>
          </motion.div>
        </div>
      </motion.div>

      {burst && <SellyBurst key={burst.id} kind={burst.kind} />}

      {onTouch && !breathing && (
        <button
          type="button"
          aria-label="셀리 쓰다듬기"
          onClick={onTouch}
          className="absolute left-[15%] top-[10%] h-[80%] w-[70%] rounded-[45%] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/80"
        />
      )}
    </div>
  );
}
