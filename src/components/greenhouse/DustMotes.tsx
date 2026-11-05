"use client";

import { motion } from "motion/react";
import { mulberry32 } from "./svg-kit";

const rnd = mulberry32(2024);
const MOTES = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  left: 8 + rnd() * 84,
  top: 18 + rnd() * 70,
  size: 2 + rnd() * 3.5,
  drift: 18 + rnd() * 30,
  duration: 7 + rnd() * 7,
  delay: -rnd() * 10,
}));

/** Slow floating light particles drifting through the sun beams. */
export function DustMotes() {
  // hidden by CSS for reduced motion, so server and client markup always match
  return (
    <div className="absolute inset-0 motion-reduce:hidden">
      {MOTES.map((m) => (
        <motion.span
          key={m.id}
          className="absolute rounded-full bg-[#fff6d6]"
          style={{
            left: `${m.left}%`,
            top: `${m.top}%`,
            width: m.size,
            height: m.size,
            boxShadow: `0 0 ${m.size * 3}px ${m.size}px rgba(255,236,180,0.55)`,
          }}
          animate={{ y: [0, -m.drift, 0], x: [0, m.drift / 3, 0], opacity: [0, 0.9, 0] }}
          transition={{ duration: m.duration, delay: m.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}
