"use client";

import { motion, useReducedMotion } from "motion/react";
import { toScreen, type WorldLayout } from "@/lib/game/world";

/** where the polaroid hangs (world px, top-centre of the string) */
export const FRAME_AT = { x: 352, y: 735 };
const FRAME_W = 86;

/**
 * 셀리가 걸어 둔 사진 — the latest sky photo (or any walk photo) hung in the
 * greenhouse like a polaroid on a string, as Selly promised ("온실에 걸어 둘게").
 * Tap → 산책 기록실.
 */
export function PhotoFrame({ layout, src, count, onTap, disabled }: { layout: WorldLayout; src: string; count: number; onTap: () => void; disabled?: boolean }) {
  const reduce = useReducedMotion();
  const p = toScreen(layout, FRAME_AT);
  const w = FRAME_W * layout.s;
  return (
    <motion.button
      type="button"
      aria-label={`셀리가 걸어 둔 산책 사진 · 기록실 ${count}장`}
      disabled={disabled}
      onClick={onTap}
      className="pointer-events-auto absolute disabled:pointer-events-none"
      style={{ left: p.x - w / 2, top: p.y, width: w, zIndex: 600, originX: 0.5, originY: 0 }}
      initial={{ opacity: 0, y: -10 }}
      animate={reduce ? { opacity: 1, y: 0 } : { opacity: 1, y: 0, rotate: [-3, 2, -3] }}
      transition={{ opacity: { duration: 0.5 }, y: { duration: 0.5 }, rotate: { duration: 6, repeat: Infinity, ease: "easeInOut" } }}
      whileTap={reduce ? undefined : { scale: 1.06 }}
    >
      {/* string and a little wooden peg */}
      <span className="absolute left-1/2 top-[-34%] h-[38%] w-px -translate-x-1/2 bg-[#b89a7a]" aria-hidden />
      <span className="absolute left-1/2 top-[-6%] z-10 h-[14%] w-[16%] -translate-x-1/2 rounded-[3px] bg-[#c9a27a] shadow-[0_1px_2px_rgba(0,0,0,0.25)]" aria-hidden />
      <span className="block rounded-[3px] bg-[#fffdf8] p-[7%] pb-[22%] shadow-[0_6px_14px_-6px_rgba(60,40,20,0.55)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="aspect-square w-full rounded-[2px] object-cover" draggable={false} />
      </span>
    </motion.button>
  );
}
