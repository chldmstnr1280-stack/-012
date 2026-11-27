"use client";

import { motion, useReducedMotion } from "motion/react";
import { toScreen, type WorldLayout } from "@/lib/game/world";

/** where the tree stands (world px, bottom-centre) and how big it is */
export const TREE_AT = { x: 802, y: 996 };
const TREE_W = 150;
const TREE_H = 214;

const LIGHTS = [
  [52, 70], [70, 74], [44, 104], [64, 110], [86, 106], [36, 140], [58, 146], [80, 144], [100, 138],
  [30, 176], [52, 182], [74, 184], [96, 180], [116, 172], [26, 210], [48, 216], [72, 220], [96, 216], [120, 208],
] as const;
const BALLS: { x: number; y: number; c: string }[] = [
  { x: 60, y: 92, c: "#f2a7b6" },
  { x: 76, y: 126, c: "#f4d27a" },
  { x: 46, y: 128, c: "#a9c8ec" },
  { x: 90, y: 164, c: "#f2a7b6" },
  { x: 40, y: 166, c: "#f4d27a" },
  { x: 64, y: 198, c: "#a9c8ec" },
  { x: 108, y: 196, c: "#f4d27a" },
  { x: 34, y: 200, c: "#f2a7b6" },
];

/**
 * 크리스마스 트리 — a soft, hand-drawn tree with twinkling lights, a glowing star
 * and two little gifts. Tap it: Selly says something and the lights sparkle.
 */
export function ChristmasTree({ layout, onTap, disabled }: { layout: WorldLayout; onTap: () => void; disabled?: boolean }) {
  const reduce = useReducedMotion();
  const p = toScreen(layout, TREE_AT);
  const w = TREE_W * layout.s;
  const h = TREE_H * layout.s;
  return (
    <motion.button
      type="button"
      aria-label="크리스마스 트리"
      disabled={disabled}
      onClick={onTap}
      className="pointer-events-auto absolute disabled:pointer-events-none"
      style={{ left: p.x - w / 2, top: p.y - h, width: w, height: h, zIndex: TREE_AT.y }}
      initial={{ opacity: 0, scale: 0.8, originY: 1 }}
      animate={{ opacity: 1, scale: 1 }}
      whileTap={reduce ? undefined : { scale: 0.96, rotate: [-1, 1, 0] }}
      transition={{ type: "spring", stiffness: 160, damping: 14 }}
    >
      <svg viewBox="0 0 150 250" className="h-full w-full overflow-visible" aria-hidden>
        <defs>
          <linearGradient id="xt-leaf" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#8fbf86" />
            <stop offset="1" stopColor="#5f9a63" />
          </linearGradient>
          <linearGradient id="xt-leaf-dark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#77ad72" />
            <stop offset="1" stopColor="#4f8655" />
          </linearGradient>
          <radialGradient id="xt-glow">
            <stop offset="0" stopColor="#fff3c4" stopOpacity="0.95" />
            <stop offset="1" stopColor="#fff3c4" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="xt-ball" cx="0.35" cy="0.3">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="0.35" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* shadow */}
        <ellipse cx="75" cy="244" rx="62" ry="7" fill="#6b5240" opacity="0.18" />
        {/* trunk + pot */}
        <rect x="66" y="214" width="18" height="16" rx="3" fill="#9a6b4b" />
        <path d="M50 226 H100 L95 246 H55 Z" fill="#e7b9a7" />
        <path d="M48 222 H102 V230 H48 Z" rx="3" fill="#f1cbbb" />

        {/* three soft tiers */}
        <path d="M75 30 C 92 52, 104 70, 112 86 C 98 90, 52 90, 38 86 C 46 70, 58 52, 75 30 Z" fill="url(#xt-leaf)" />
        <path d="M75 62 C 96 92, 116 116, 126 136 C 104 142, 46 142, 24 136 C 34 116, 54 92, 75 62 Z" fill="url(#xt-leaf-dark)" />
        <path d="M75 100 C 100 138, 128 168, 140 192 C 112 202, 38 202, 10 192 C 22 168, 50 138, 75 100 Z" fill="url(#xt-leaf)" />
        <path d="M75 140 C 104 176, 136 200, 146 220 C 112 230, 38 230, 4 220 C 14 200, 46 176, 75 140 Z" fill="url(#xt-leaf-dark)" />

        {/* garland */}
        {[
          "M42 84 Q 75 98 110 82",
          "M28 134 Q 75 152 124 132",
          "M16 190 Q 75 210 136 188",
          "M10 218 Q 75 236 142 216",
        ].map((d) => (
          <path key={d} d={d} stroke="#fbe7a6" strokeWidth="2.4" fill="none" strokeLinecap="round" opacity="0.9" />
        ))}

        {/* ornaments */}
        {BALLS.map((b, i) => (
          <g key={i}>
            <circle cx={b.x} cy={b.y} r="6.2" fill={b.c} />
            <circle cx={b.x} cy={b.y} r="6.2" fill="url(#xt-ball)" />
          </g>
        ))}

        {/* twinkling lights */}
        {LIGHTS.map(([x, y], i) => (
          <motion.circle
            key={i}
            cx={x + 2}
            cy={y}
            r="2.6"
            fill={["#fff6c8", "#ffd6de", "#d8ecff"][i % 3]}
            animate={reduce ? undefined : { opacity: [0.35, 1, 0.35] }}
            transition={{ duration: 1.6 + (i % 4) * 0.35, delay: (i * 0.23) % 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}

        {/* star */}
        <motion.circle cx="75" cy="24" r="20" fill="url(#xt-glow)" animate={reduce ? undefined : { opacity: [0.6, 1, 0.6], scale: [0.95, 1.08, 0.95] }} transition={{ duration: 2.4, repeat: Infinity }} style={{ originX: "75px", originY: "24px" }} />
        <path d="M75 10 L79.5 20 L90 21 L82 28 L84.5 38.5 L75 33 L65.5 38.5 L68 28 L60 21 L70.5 20 Z" fill="#f6cf5e" stroke="#e8b23f" strokeWidth="1" strokeLinejoin="round" />

        {/* gifts */}
        <g transform="translate(2 214)">
          <rect x="0" y="10" width="30" height="24" rx="3" fill="#f3b3c0" />
          <rect x="12" y="10" width="6" height="24" fill="#fff4f6" />
          <rect x="-2" y="6" width="34" height="7" rx="2" fill="#f7c7d1" />
          <path d="M15 6 C 8 -2, 2 2, 9 6 M15 6 C 22 -2, 28 2, 21 6" stroke="#fff4f6" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        </g>
        <g transform="translate(118 222)">
          <rect x="0" y="6" width="26" height="20" rx="3" fill="#b8d4ef" />
          <rect x="10" y="6" width="6" height="20" fill="#f4f9ff" />
          <rect x="-2" y="3" width="30" height="6" rx="2" fill="#cfe2f5" />
        </g>
      </svg>
    </motion.button>
  );
}
