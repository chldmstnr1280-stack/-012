"use client";

import { AnimatePresence, motion } from "motion/react";

/** Selly's speech bubble. The tail points down-left toward Selly's head. */
export function SpeechBubble({ text, className }: { text: string; className?: string }) {
  return (
    <div className={`pointer-events-none ${className ?? ""}`} aria-live="polite">
      <AnimatePresence mode="wait">
        <motion.div
          key={text}
          initial={{ opacity: 0, y: 8, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          style={{ originX: 0.15, originY: 1 }}
          className="relative"
        >
          <div className="rounded-[28px] border border-white/90 bg-[rgba(255,253,249,0.9)] px-5 py-3.5 text-center text-[15px] leading-[1.55] text-ink-700 shadow-[0_10px_30px_-10px_rgba(110,88,60,0.35)] backdrop-blur-md">
            {text.split("\n").map((line, i) => (
              <span key={i} className="block whitespace-nowrap">
                {line}
              </span>
            ))}
          </div>
          <svg className="absolute -bottom-[13px] left-[44px]" width="26" height="16" viewBox="0 0 26 16" aria-hidden>
            <path d="M2 0 C 6 6 4 12 0 16 C 10 14 18 8 24 0 Z" fill="rgba(255,253,249,0.92)" />
          </svg>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
