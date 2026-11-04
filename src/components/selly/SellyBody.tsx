"use client";

import { motion, type MotionValue } from "motion/react";
import { assets } from "@/lib/assets";
import { leafPath } from "@/components/greenhouse/svg-kit";

const BODY = "M120 89 C 162 89 194 119 198 158 C 202 194 178 212 120 212 C 62 212 38 194 42 158 C 46 119 78 89 120 89 Z";
const LEAF = leafPath(94, 40);

export function SellyDefs() {
  return (
    <defs>
      <radialGradient id="sellyBody" cx="0.42" cy="0.32" r="0.78">
        <stop offset="0" stopColor="#fffdf6" />
        <stop offset="0.42" stopColor="#fff3dc" />
        <stop offset="0.78" stopColor="#f6dfba" />
        <stop offset="1" stopColor="#e6c596" />
      </radialGradient>
      <radialGradient id="sellyCore" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#fff4c8" stopOpacity="1" />
        <stop offset="0.6" stopColor="#ffeab0" stopOpacity="0.45" />
        <stop offset="1" stopColor="#ffe6a6" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="sellyAura" cx="0.5" cy="0.55" r="0.5">
        <stop offset="0" stopColor="#ffeec4" stopOpacity="0.8" />
        <stop offset="0.6" stopColor="#ffe6b0" stopOpacity="0.32" />
        <stop offset="1" stopColor="#ffe2a8" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="sellyLeaf" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" stopColor="#6b9a51" />
        <stop offset="0.55" stopColor="#92bf6b" />
        <stop offset="1" stopColor="#c1e092" />
      </linearGradient>
      <linearGradient id="sellyLeafShade" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#5f8a4b" stopOpacity="0.35" />
        <stop offset="0.5" stopColor="#5f8a4b" stopOpacity="0" />
      </linearGradient>
      <clipPath id="sellyClip">
        <path d={BODY} />
      </clipPath>
      {/* fluffy, slightly irregular silhouette */}
      <filter id="sellyFuzz" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="2" seed="4" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="4.5" xChannelSelector="R" yChannelSelector="G" />
      </filter>
      <filter id="sellySoft" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="9" />
      </filter>
      <filter id="sellyBlur3" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" />
      </filter>
      <filter id="sellyCheekBlur" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2.4" />
      </filter>
    </defs>
  );
}

function Leaf({ side, spread, perk }: { side: -1 | 1; spread: MotionValue<number>; perk: number }) {
  const baseAngle = side * 34;
  return (
    <g transform={`translate(${120 + side * 11} 98) rotate(${baseAngle})`}>
      <motion.g style={{ rotate: spread, originX: 0.5, originY: 1 }}>
        <motion.g
          key={perk}
          style={{ originX: 0.5, originY: 1 }}
          animate={
            perk > 0
              ? { rotate: [0, side * -14, side * 6, 0], scale: [1, 1.08, 1] }
              : { rotate: [side * -2.5, side * 3, side * -2.5] }
          }
          transition={
            perk > 0
              ? { duration: 1.1, ease: "easeOut" }
              : { duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: side > 0 ? 0.4 : 0 }
          }
        >
          <path d={LEAF} fill="url(#sellyLeaf)" />
          <path d={LEAF} fill="url(#sellyLeafShade)" />
          <path d={LEAF} fill="none" stroke="#5d8a48" strokeOpacity={0.45} strokeWidth={1} />
          <path d="M0 -2 Q -1.5 -46 0 -86" stroke="#eef7dc" strokeOpacity={0.75} strokeWidth={1.6} fill="none" strokeLinecap="round" />
          {[-24, -44, -62].map((y) => (
            <g key={y} stroke="#eef7dc" strokeOpacity={0.45} strokeWidth={1} fill="none" strokeLinecap="round">
              <path d={`M0 ${y} Q -8 ${y - 6} -14 ${y - 14}`} />
              <path d={`M0 ${y} Q 8 ${y - 6} 14 ${y - 14}`} />
            </g>
          ))}
          <path d="M-4 -30 Q -14 -50 -6 -74" stroke="#fff" strokeOpacity={0.35} strokeWidth={3} fill="none" strokeLinecap="round" />
        </motion.g>
      </motion.g>
    </g>
  );
}

/**
 * Selly's body (vector stand-in). When `assets.sellyBody` is provided, the
 * bitmap is used for body + leaves and only the face stays vector.
 */
export function SellyBody({
  leftSpread,
  rightSpread,
  perk,
  glow,
}: {
  leftSpread: MotionValue<number>;
  rightSpread: MotionValue<number>;
  perk: number;
  glow: number;
}) {
  if (assets.sellyBody) {
    return <image href={assets.sellyBody} x={0} y={0} width={240} height={240} preserveAspectRatio="xMidYMid meet" />;
  }

  return (
    <g>
      {/* aura */}
      <motion.ellipse
        cx={120}
        cy={150}
        rx={100}
        ry={86}
        fill="url(#sellyAura)"
        animate={{ opacity: 0.7 + glow * 0.3, scale: 1 + glow * 0.06 }}
        transition={{ duration: 0.8 }}
      />

      {/* leaves sit behind the head */}
      <Leaf side={-1} spread={leftSpread} perk={perk} />
      <Leaf side={1} spread={rightSpread} perk={perk} />
      {/* short stem */}
      <path d="M120 94 Q 118 86 121 80" stroke="#86b36a" strokeWidth={4} strokeLinecap="round" fill="none" />

      <g filter="url(#sellyFuzz)">
        {/* arms */}
        <ellipse cx={47} cy={150} rx={11} ry={16} fill="#f8e7c9" transform="rotate(-48 47 150)" />
        <ellipse cx={193} cy={150} rx={11} ry={16} fill="#f8e7c9" transform="rotate(48 193 150)" />
        {/* body */}
        <path d={BODY} fill="url(#sellyBody)" />
        {/* feet */}
        <ellipse cx={99} cy={208} rx={15} ry={9} fill="#f3dcb6" />
        <ellipse cx={141} cy={208} rx={15} ry={9} fill="#f3dcb6" />
        <ellipse cx={98} cy={205} rx={10} ry={4.5} fill="#fff6e4" />
        <ellipse cx={140} cy={205} rx={10} ry={4.5} fill="#fff6e4" />
      </g>

      {/* soft shading, clipped to the body */}
      <g clipPath="url(#sellyClip)">
        <ellipse cx={120} cy={222} rx={92} ry={30} fill="#d9b483" opacity={0.45} filter="url(#sellySoft)" />
        <ellipse cx={100} cy={118} rx={36} ry={16} fill="#ffffff" opacity={0.8} filter="url(#sellyBlur3)" />
        <ellipse cx={120} cy={186} rx={44} ry={24} fill="url(#sellyCore)" opacity={0.95} />
        {/* tiny heart glow on the belly */}
        <path
          d="M120 196 C 112 190 108 185 112 181 C 115 178 119 180 120 183 C 121 180 125 178 128 181 C 132 185 128 190 120 196 Z"
          fill="#fff6dc"
          opacity={0.9}
          filter="url(#sellyBlur3)"
        />
      </g>
      {/* rim light */}
      <path d={BODY} fill="none" stroke="#fffaf0" strokeWidth={2.5} opacity={0.45} filter="url(#sellyBlur3)" />
    </g>
  );
}
