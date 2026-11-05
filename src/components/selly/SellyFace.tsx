"use client";

import { AnimatePresence, motion } from "motion/react";
import type { FaceLayout } from "@/lib/assets";

export type SellyExpression = "idle" | "happy" | "relaxed" | "love";

const INK = "#5a3a2c";

/**
 * Live vector face, kept separate from the body art so blinking and
 * expressions work on top of any body (vector, bitmap or, later, 3D).
 * Features are drawn around (0,0) = midpoint between the eyes, then placed by `layout`.
 */
export function SellyFace({ expression, blink, layout, look = 0 }: { expression: SellyExpression; blink: boolean; layout: FaceLayout; look?: number }) {
  const happy = expression === "happy" || expression === "love";
  const { cx, eyeY, eyeDx: d, mouthY, scale: s, cheeks } = layout;
  const my = mouthY - eyeY;
  const sw = (w: number) => w * Math.min(s, 1.25);
  const eye = (x: number) => `translate(${x} 0) scale(${s})`;

  return (
    <motion.g initial={false} animate={{ x: cx + look * 4 * s, y: eyeY }} transition={{ type: "spring", stiffness: 120, damping: 18 }}>
      {/* cheeks: always for the vector body, only a happy flush on top of art that has its own blush */}
      <motion.g
        initial={false}
        animate={{ opacity: cheeks ? (happy ? 0.85 : 0.55) : happy ? 0.5 : 0 }}
        transition={{ duration: 0.4 }}
        filter="url(#sellyCheekBlur)"
      >
        <ellipse cx={-d * 1.6} cy={my + 3 * s} rx={11 * s} ry={6.5 * s} fill="#f4a0a6" />
        <ellipse cx={d * 1.6} cy={my + 3 * s} rx={11 * s} ry={6.5 * s} fill="#f4a0a6" />
      </motion.g>

      <AnimatePresence mode="wait" initial={false}>
        <motion.g key={expression} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }}>
          {expression === "idle" && (
            <>
              <motion.g animate={{ scaleY: blink ? 0.1 : 1 }} transition={{ duration: 0.08 }} style={{ originX: 0.5, originY: 0.5 }}>
                {[-d, d].map((x) => (
                  <g key={x} transform={eye(x)}>
                    <ellipse rx={4.2} ry={5.2} fill={INK} />
                    <circle cx={1.4} cy={-2} r={1.5} fill="#fff" />
                  </g>
                ))}
              </motion.g>
              <path
                transform={`translate(0 ${my}) scale(${s})`}
                d="M-6.5 -1 Q-3.2 3.6 0 -0.2 Q3.2 3.6 6.5 -1"
                stroke={INK}
                strokeWidth={sw(2.1) / s}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}

          {happy && (
            <>
              {[-d, d].map((x) => (
                <path key={x} transform={eye(x)} d="M-7.5 2.5 Q0 -6.5 7.5 2.5" stroke={INK} strokeWidth={sw(2.6) / s} fill="none" strokeLinecap="round" />
              ))}
              <g transform={`translate(0 ${my}) scale(${s})`}>
                <path d="M-7 -1.5 Q0 10 7 -1.5 Z" fill="#b65d58" stroke={INK} strokeWidth={1.3} strokeLinejoin="round" />
                <ellipse cx={0} cy={4.2} rx={3.6} ry={2} fill="#f39aa0" />
              </g>
            </>
          )}

          {expression === "relaxed" && (
            <>
              {[-d, d].map((x) => (
                <path key={x} transform={eye(x)} d="M-7.5 -1.5 Q0 5 7.5 -1.5" stroke={INK} strokeWidth={sw(2.3) / s} fill="none" strokeLinecap="round" />
              ))}
              <path
                transform={`translate(0 ${my}) scale(${s})`}
                d="M-6 -1 Q-3 3 0 0 Q3 3 6 -1"
                stroke={INK}
                strokeWidth={sw(1.9) / s}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}
        </motion.g>
      </AnimatePresence>
    </motion.g>
  );
}
