"use client";

import { AnimatePresence, motion } from "motion/react";

export type SellyExpression = "idle" | "happy" | "relaxed" | "love";

const INK = "#4b3a32";

/**
 * Live vector face. Kept separate from the body so the body can be swapped for
 * bitmap/3D art while blinking & expressions keep working.
 * Coordinates are in Selly's 240×240 art space.
 */
export function SellyFace({ expression, blink }: { expression: SellyExpression; blink: boolean }) {
  const happy = expression === "happy" || expression === "love";
  return (
    <g>
      {/* cheeks */}
      <motion.g animate={{ opacity: happy ? 0.85 : 0.55 }} transition={{ duration: 0.4 }} filter="url(#sellyCheekBlur)">
        <ellipse cx={89} cy={164} rx={12} ry={7} fill="#f4a9ad" />
        <ellipse cx={151} cy={164} rx={12} ry={7} fill="#f4a9ad" />
      </motion.g>

      <AnimatePresence mode="wait" initial={false}>
        <motion.g
          key={expression}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {expression === "idle" && (
            <>
              <motion.g
                animate={{ scaleY: blink ? 0.12 : 1 }}
                transition={{ duration: 0.09 }}
                style={{ originX: 0.5, originY: 0.5 }}
              >
                <ellipse cx={101} cy={150} rx={4.6} ry={5.6} fill={INK} />
                <ellipse cx={139} cy={150} rx={4.6} ry={5.6} fill={INK} />
                <circle cx={102.6} cy={147.8} r={1.6} fill="#fff" />
                <circle cx={140.6} cy={147.8} r={1.6} fill="#fff" />
              </motion.g>
              <path d="M113.5 160.5 Q116.8 165 120 161 Q123.2 165 126.5 160.5" stroke={INK} strokeWidth={2.1} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </>
          )}

          {happy && (
            <>
              <path d="M93.5 152 Q101 142.5 108.5 152" stroke={INK} strokeWidth={3} fill="none" strokeLinecap="round" />
              <path d="M131.5 152 Q139 142.5 146.5 152" stroke={INK} strokeWidth={3} fill="none" strokeLinecap="round" />
              <path d="M112 159.5 Q120 172 128 159.5 Z" fill="#b8625f" stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />
              <ellipse cx={120} cy={166} rx={4} ry={2.4} fill="#f39ea3" />
            </>
          )}

          {expression === "relaxed" && (
            <>
              <path d="M93.5 149 Q101 156 108.5 149" stroke={INK} strokeWidth={2.6} fill="none" strokeLinecap="round" />
              <path d="M131.5 149 Q139 156 146.5 149" stroke={INK} strokeWidth={2.6} fill="none" strokeLinecap="round" />
              <path d="M115.5 161 Q120 164.5 124.5 161" stroke={INK} strokeWidth={2} fill="none" strokeLinecap="round" />
            </>
          )}
        </motion.g>
      </AnimatePresence>
    </g>
  );
}
