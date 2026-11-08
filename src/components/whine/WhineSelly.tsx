"use client";

import { AnimatePresence, motion, useReducedMotion, type TargetAndTransition } from "motion/react";
import { Selly } from "@/components/selly/Selly";
import type { SellyExpression } from "@/components/selly/SellyFace";
import type { WhineAnimation } from "@/lib/whine/types";

/**
 * Selly while she's being whined to. Each of the 8 states is a small motion
 * on top of the usual Selly (no new art), plus a tiny mark (💢, 💦, 💤 …).
 * Reduced motion → she just changes expression and keeps still.
 */
const LOOK: Record<WhineAnimation, { pose?: SellyExpression; mark?: string; motion: TargetAndTransition }> = {
  IDLE: { motion: { rotate: 0, y: 0, scale: 1 } },
  LISTENING: { pose: "relaxed", motion: { rotate: [0, -6, -6, 0], y: 0, scale: 1, transition: { duration: 1.6 } } },
  WHINING: {
    pose: "relaxed",
    mark: "💦",
    motion: { rotate: [0, -8, 8, -8, 8, 0], y: [0, -4, 0, -4, 0], scale: 1, transition: { duration: 0.9, repeat: 1 } },
  },
  ANGRY_CUTE: {
    pose: "idle",
    mark: "💢",
    motion: { y: [0, -14, 0, -10, 0], scaleX: [1, 1.1, 1, 1.08, 1], scaleY: [1, 0.92, 1, 0.94, 1], rotate: 0, transition: { duration: 0.7, repeat: 1 } },
  },
  LYING_DOWN: { pose: "relaxed", mark: "〰️", motion: { rotate: -78, y: 38, scale: 0.94, transition: { type: "spring", stiffness: 120, damping: 14 } } },
  COMFORTING: { pose: "love", mark: "🤍", motion: { rotate: 0, y: 0, scale: [1, 1.06, 1, 1.06, 1], transition: { duration: 2.4 } } },
  HAPPY: { pose: "happy", mark: "✨", motion: { rotate: 0, scale: 1, y: [0, -18, 0], transition: { duration: 0.6, repeat: 1 } } },
  SLEEPY: { pose: "relaxed", mark: "💤", motion: { rotate: [0, 10, 10], y: 6, scale: 1, transition: { duration: 1.4 } } },
};

export function WhineSelly({ animation, beat }: { animation: WhineAnimation; /** changes on every reply so the motion replays */ beat: number }) {
  const reduce = useReducedMotion();
  const look = LOOK[animation];
  return (
    <div className="relative mx-auto aspect-square w-[min(46vw,25dvh,190px)]" role="img" aria-label={`셀리 (${LABEL[animation]})`}>
      <motion.div
        key={reduce ? animation : `${animation}-${beat}`}
        className="h-full w-full origin-bottom"
        initial={false}
        animate={reduce ? { rotate: animation === "LYING_DOWN" ? -78 : 0, y: animation === "LYING_DOWN" ? 38 : 0, scale: 1 } : look.motion}
        transition={reduce ? { duration: 0 } : undefined}
      >
        <Selly className="h-full w-full" pose={look.pose} still={animation === "LYING_DOWN" || animation === "SLEEPY"} />
      </motion.div>
      <AnimatePresence>
        {look.mark && (
          <motion.span
            key={`${animation}-${beat}`}
            aria-hidden
            className="pointer-events-none absolute right-[4%] top-[4%] text-[26px]"
            initial={reduce ? false : { opacity: 0, scale: 0.4, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {look.mark}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

const LABEL: Record<WhineAnimation, string> = {
  IDLE: "기다리는 중",
  LISTENING: "듣는 중",
  WHINING: "같이 징징대는 중",
  ANGRY_CUTE: "귀엽게 화내는 중",
  LYING_DOWN: "드러누운 중",
  COMFORTING: "토닥이는 중",
  HAPPY: "기쁜 중",
  SLEEPY: "졸린 중",
};
