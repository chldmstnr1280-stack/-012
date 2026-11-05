"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useTransform, type MotionValue } from "motion/react";
import { Selly } from "@/components/selly/Selly";
import type { SellyBrain } from "@/components/selly/useSellyBrain";
import type { SellyExpression } from "@/components/selly/SellyFace";
import { SPOTS, depthScale } from "@/data/greenhouseWorld";
import { grassIslandArt } from "@/lib/assets";
import { toScreen, toWorld, type WorldLayout } from "@/lib/game/world";
import type { SellyState } from "@/lib/game/behaviorEngine";

/** Expression and posture for each behaviour state. */
const LOOK: Partial<Record<SellyState, { pose?: SellyExpression; still?: boolean; squash?: boolean; tilt?: number }>> = {
  walking: { still: true },
  sitting: { still: true, squash: true },
  sleeping: { pose: "relaxed", still: true, squash: true, tilt: 5 },
  sunbathing: { pose: "relaxed" },
  looking_at_flower: { pose: "happy" },
  watering: { pose: "happy" },
};

interface Props {
  layout: WorldLayout;
  brain: SellyBrain;
  /** Selly's box size before depth scaling (px) */
  size: number;
  breathing: boolean;
  haloScale: MotionValue<number>;
  haloOpacity: MotionValue<number>;
  onTouchSelly: () => void;
}

export function GreenhouseWorld({ layout, brain, size, breathing, haloScale, haloOpacity, onTouchSelly }: Props) {
  const { body, state, facing, spot } = brain;
  const L = layout;

  // world → screen for Selly's feet; her box is anchored at 50% / 90%
  const left = useTransform(() => toScreen(L, { x: body.x.get(), y: body.y.get() }).x - size / 2);
  const top = useTransform(() => toScreen(L, { x: body.x.get(), y: body.y.get() }).y - size * 0.9 + body.hop.get());
  const scale = body.scale;

  const look = LOOK[state] ?? {};
  const rug = toScreen(L, SPOTS.rug.at);
  const rugW = size * 1.6 * depthScale(SPOTS.rug.at.y);

  // floor band where a tap calls Selly over
  const floorTop = toScreen(L, { x: 0, y: 890 }).y;
  const floorBottom = toScreen(L, { x: 0, y: 1000 }).y;

  return (
    <div className="pointer-events-none absolute inset-0" aria-label="유리온실">
      {/* moss rug (cut from the painted floor) — Selly's resting place */}
      {grassIslandArt && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={grassIslandArt}
          alt=""
          aria-hidden
          className="absolute max-w-none -translate-x-1/2 -translate-y-1/2 opacity-95"
          style={{ left: rug.x, top: rug.y - size * 0.02, width: rugW }}
        />
      )}

      {/* tap the floor to call Selly */}
      {!breathing && (
        <button
          type="button"
          aria-label="셀리 부르기"
          tabIndex={-1}
          className="pointer-events-auto absolute inset-x-0 cursor-pointer"
          style={{ top: floorTop, height: Math.max(0, floorBottom - floorTop) }}
          onClick={(e) => {
            const r = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
            brain.walkTo(toWorld(L, e.clientX - r.left, e.clientY - r.top));
          }}
        />
      )}

      {state === "watering" && spot?.focus && <Droplets at={toScreen(L, spot.focus)} />}

      <motion.div className="absolute left-0 top-0" style={{ x: left, y: top, width: size, height: size, scale, originX: 0.5, originY: 0.9 }}>
        <motion.div
          className="h-full w-full"
          animate={{
            rotate: look.tilt ? look.tilt * (facing || 1) : 0,
            scaleY: look.squash ? 0.94 : 1,
            scaleX: look.squash ? 1.04 : 1,
          }}
          transition={{ type: "spring", stiffness: 90, damping: 16 }}
          style={{ originX: 0.5, originY: 0.9 }}
        >
          <motion.div className="h-full w-full" style={{ rotate: body.tilt, originX: 0.5, originY: 0.9 }}>
            <AnimatePresence>
              {breathing && (
                <motion.div
                  className="absolute left-1/2 top-[52%] aspect-square w-[150%] -translate-x-1/2 -translate-y-1/2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  <motion.div
                    className="h-full w-full rounded-full border border-white/60 bg-[radial-gradient(closest-side,rgba(255,250,232,0.55),rgba(255,244,214,0.18)_70%,rgba(255,255,255,0))] shadow-[0_0_60px_10px_rgba(255,244,210,0.35)]"
                    style={{ scale: haloScale, opacity: haloOpacity }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
            <div className="pointer-events-auto absolute inset-0">
              <Selly
                mode={breathing ? "breathing" : "idle"}
                pose={look.pose}
                still={look.still}
                look={state === "walking" ? facing : facing * 0.6}
                onTouch={onTouchSelly}
                className="h-full w-full"
              />
            </div>
            {state === "sleeping" && <Zzz />}
          </motion.div>
        </motion.div>
      </motion.div>

      {!breathing && <WorldBubble brain={brain} layout={L} size={size} />}
    </div>
  );
}

/** Speech bubble that follows Selly's head and stays on screen. */
function WorldBubble({ brain, layout, size }: { brain: SellyBrain; layout: WorldLayout; size: number }) {
  const { body, bubble } = brain;
  const ref = useRef<HTMLDivElement>(null);
  const tail = useRef<HTMLDivElement>(null);

  const place = () => {
    const el = ref.current;
    if (!el) return;
    const p = toScreen(layout, { x: body.x.get(), y: body.y.get() });
    const s = body.scale.get();
    const headTop = p.y - size * 0.9 * s + size * 0.12 * s + body.hop.get();
    const w = el.offsetWidth;
    const x = Math.max(12, Math.min(layout.w - 12 - w, p.x - w / 2 + size * 0.18 * s));
    el.style.transform = `translate(${x}px, ${headTop - el.offsetHeight - 10}px)`;
    if (tail.current) tail.current.style.left = `${Math.max(18, Math.min(w - 30, p.x - x - 8))}px`;
  };
  useMotionValueEvent(body.x, "change", place);
  useMotionValueEvent(body.y, "change", place);
  useMotionValueEvent(body.hop, "change", place);
  useEffect(place);

  return (
    <div ref={ref} className="pointer-events-none absolute left-0 top-0 z-10" aria-live="polite">
      <AnimatePresence mode="wait">
        {bubble && (
          <motion.div
            key={bubble.id}
            initial={{ opacity: 0, y: 6, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96, transition: { duration: 0.12 } }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="relative"
          >
            <div className="rounded-[24px] border border-white/90 bg-[rgba(255,253,249,0.92)] px-4 py-3 text-center text-[14.5px] leading-[1.5] text-ink-700 shadow-[0_10px_30px_-10px_rgba(110,88,60,0.35)] backdrop-blur-md">
              {bubble.text.split("\n").map((line, i) => (
                <span key={i} className="block whitespace-nowrap">
                  {line}
                </span>
              ))}
            </div>
            <div ref={tail} className="absolute -bottom-[11px]" style={{ left: 30 }}>
              <svg width="18" height="12" viewBox="0 0 18 12" aria-hidden>
                <path d="M0 0 C 5 4 7 8 9 12 C 11 8 13 4 18 0 Z" fill="rgba(255,253,249,0.92)" />
              </svg>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Zzz() {
  return (
    <div className="pointer-events-none absolute right-[14%] top-[18%]" aria-hidden>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="absolute font-bold text-[#8f7fd6]"
          style={{ fontSize: 13 + i * 4 }}
          initial={{ opacity: 0, x: 0, y: 0 }}
          animate={{ opacity: [0, 0.9, 0], x: [0, 10 + i * 6], y: [0, -26 - i * 8] }}
          transition={{ duration: 3, delay: i * 1, repeat: Infinity, ease: "easeOut" }}
        >
          z
        </motion.span>
      ))}
    </div>
  );
}

function Droplets({ at }: { at: { x: number; y: number } }) {
  return (
    <div className="pointer-events-none absolute" style={{ left: at.x, top: at.y }} aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <motion.span
          key={i}
          className="absolute h-[9px] w-[6px] rounded-full rounded-t-[50%] bg-[#cfe7f4] shadow-[inset_0_0_0_1px_#9cc8de]"
          style={{ left: -12 + i * 7 }}
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: [-30, 4], opacity: [0, 1, 0] }}
          transition={{ duration: 0.9, delay: i * 0.25, repeat: Infinity, repeatDelay: 0.6, ease: "easeIn" }}
        />
      ))}
    </div>
  );
}
