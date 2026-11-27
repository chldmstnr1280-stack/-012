"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { PHASE_COPY, type BodyPhase } from "@/lib/body/phase";

/**
 * The phase picture with a little motion on top (CSS): drops falling in the
 * period phase, a glowing follicle, the egg moving toward the tube, a warm
 * corpus luteum, and the PMS scene dimming and brightening very slowly.
 * Changing phase cross-fades. With "reduce motion" on: the still picture only.
 */
export function BodyScene({ phase, className = "" }: { phase: BodyPhase; className?: string }) {
  const reduce = useReducedMotion();
  const c = PHASE_COPY[phase];
  return (
    <div className={`relative aspect-square overflow-hidden ${className}`} role="img" aria-label={`${c.name} 그림: ${c.headline}`}>
      <AnimatePresence initial={false}>
        <motion.div key={phase} className={`absolute inset-0 ${!reduce && phase === "pms" ? "body-dim" : ""}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : 0.9, ease: "easeInOut" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={c.img} alt="" className="h-full w-full object-contain" draggable={false} />
          {!reduce && phase === "period" && [0, 1.6, 3.2].map((d) => <span key={d} className="body-drop" style={{ animationDelay: `${d}s` }} aria-hidden />)}
          {!reduce && phase === "follicular" && <span className="body-glow body-glow--follicle" aria-hidden />}
          {!reduce && phase === "ovulation" && <span className="body-glow body-glow--egg" aria-hidden />}
          {!reduce && phase === "luteal" && <span className="body-glow body-glow--luteum" aria-hidden />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
