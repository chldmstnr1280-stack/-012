"use client";

import { motion, useReducedMotion } from "motion/react";
import { LIGHTS_PER_LEVEL } from "@/data/wishes";
import { levelOf, type Wish } from "@/lib/wish/wishes";

/**
 * A wish hanging in the sky. Grows a little with each level (every 7 lights)
 * and never dims; a resting wish sleeps (💤). `pulse` changes → a glow burst.
 */
export function WishStar({ wish, pulse, asked, onTap }: { wish: Wish; pulse: number; asked: boolean; onTap: () => void }) {
  const reduce = useReducedMotion();
  const level = levelOf(wish);
  const size = 46 + Math.min(level, 6) * 7;
  const sleeping = wish.status === "resting";
  const lights = wish.light % LIGHTS_PER_LEVEL;
  return (
    <button type="button" onClick={onTap} aria-label={`${wish.text}, 빛 ${wish.light}개, 별 ${level + 1}단계${sleeping ? ", 쉬는 중" : ""}${asked ? ", 오늘 안부 나눔" : ""}. 자세히 보기`} className="flex w-[120px] flex-col items-center active:scale-95">
      <div className="relative grid place-items-center" style={{ width: size + 24, height: size + 24 }}>
        {!sleeping && (
          <motion.span
            key={pulse}
            aria-hidden
            className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(255,236,170,0.75)_0%,rgba(255,236,170,0)_68%)]"
            initial={pulse && !reduce ? { scale: 0.6, opacity: 1 } : false}
            animate={reduce ? { opacity: 0.7 } : { scale: [1, 1.12, 1], opacity: [0.55, 0.85, 0.55] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        )}
        <motion.span
          aria-hidden
          style={{ fontSize: size, lineHeight: 1, filter: sleeping ? "grayscale(0.5) brightness(0.8)" : "drop-shadow(0 0 10px rgba(255,230,150,0.8))" }}
          animate={reduce || sleeping ? undefined : { rotate: [-4, 4, -4] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          {wish.kind === "dream" ? "🌟" : "⭐"}
        </motion.span>
        {sleeping && (
          <span aria-hidden className="absolute -right-1 top-0 text-[18px]">
            💤
          </span>
        )}
      </div>
      <span className="mt-0.5 line-clamp-2 max-w-full break-keep text-center text-[12px] font-bold leading-tight text-white drop-shadow">{wish.text}</span>
      <span aria-hidden className="mt-1 flex gap-[3px]">
        {Array.from({ length: LIGHTS_PER_LEVEL }, (_, i) => (
          <span key={i} className={`h-1.5 w-1.5 rounded-full ${i < lights ? "bg-[#ffe7a0]" : "bg-white/25"}`} />
        ))}
      </span>
    </button>
  );
}
