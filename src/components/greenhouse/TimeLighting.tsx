"use client";

import { AnimatePresence, motion, useTransform, type MotionValue } from "motion/react";
import type { TimeOfDay } from "@/lib/game/behaviorEngine";
import { toScreen, type WorldLayout } from "@/lib/game/world";
import { mulberry32 } from "./svg-kit";

/**
 * Time-of-day light over the painted greenhouse — no new artwork, just light:
 *  morning  soft rosy light and slanted sunbeams
 *  day      the painting as it is
 *  evening  sunset glow through the window, lanterns come alive
 *  night    dusk-blue dark with the lanterns cutting warm pools of light, moonlight, fireflies
 * Drawn above Selly and the objects (so they share the light) and below her speech bubble.
 */

/** Lantern flames in the painting (world px) and how far their light reaches. */
const LANTERNS = [
  { x: 790, y: 455, r: 150 }, // hanging lantern, right
  { x: 900, y: 335, r: 150 }, // upper hanging lantern, right
  { x: 245, y: 700, r: 160 }, // lantern on the left shelf
  { x: 662, y: 868, r: 90 }, // small floor lantern under the window
];
const WINDOW = { x: 575, y: 430 };

export function TimeLighting({ tod, layout, selly }: { tod: TimeOfDay; layout: WorldLayout; selly?: MotionValue<number>[] }) {
  return (
    <div className="pointer-events-none absolute inset-0" style={{ zIndex: 4500 }} aria-hidden>
      <AnimatePresence>
        {tod !== "day" && (
          <motion.div
            key={tod}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          >
            {tod === "morning" && <Morning />}
            {tod === "evening" && <Evening layout={layout} />}
            {tod === "night" && <Night layout={layout} selly={selly} />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Morning() {
  return (
    <>
      <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(255,214,200,0.32),rgba(255,244,228,0.1)_55%,rgba(196,218,244,0.2))]" />
      {[
        { left: "38%", w: 70, delay: 0 },
        { left: "58%", w: 110, delay: -3 },
        { left: "78%", w: 60, delay: -6 },
      ].map((b, i) => (
        <motion.div
          key={i}
          className="absolute -top-[10%] h-[95%] origin-top rotate-[24deg] bg-gradient-to-b from-[rgba(255,250,232,0.42)] to-transparent blur-md motion-reduce:hidden"
          style={{ left: b.left, width: b.w }}
          animate={{ opacity: [0.35, 0.75, 0.35] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: b.delay }}
        />
      ))}
    </>
  );
}

function LanternGlows({ layout, strength }: { layout: WorldLayout; strength: number }) {
  return (
    <>
      {LANTERNS.map((l, i) => {
        const p = toScreen(layout, l);
        const r = l.r * layout.s;
        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              left: p.x - r,
              top: p.y - r,
              width: r * 2,
              height: r * 2,
              background: `radial-gradient(closest-side, rgba(255,214,140,${0.55 * strength}), rgba(255,190,110,${0.22 * strength}) 45%, rgba(255,180,100,0))`,
            }}
            animate={{ opacity: [0.85, 1, 0.9, 1, 0.85] }}
            transition={{ duration: 4 + i * 0.7, repeat: Infinity, ease: "easeInOut" }}
          />
        );
      })}
    </>
  );
}

function Evening({ layout }: { layout: WorldLayout }) {
  const w = toScreen(layout, WINDOW);
  const wr = 480 * layout.s;
  const holes = [
    ...LANTERNS.map((l) => {
      const p = toScreen(layout, l);
      const r = l.r * layout.s * 1.1;
      return { x: p.x, y: p.y, rx: r, ry: r, keep: 0 };
    }),
    { x: w.x, y: w.y, rx: wr, ry: wr * 1.1, keep: 0.3 },
  ];
  return (
    <>
      <Shade layout={layout} color="rgba(70,40,72,0.32)" holes={holes} />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(150,96,170,0.18),rgba(255,140,90,0.2)_50%,rgba(150,70,50,0.18))]" />
      {/* the sunset pouring through the window */}
      <div
        className="absolute rounded-full"
        style={{
          left: w.x - wr,
          top: w.y - wr,
          width: wr * 2,
          height: wr * 2.2,
          background: "radial-gradient(closest-side, rgba(255,170,110,0.5), rgba(255,140,110,0.18) 55%, rgba(255,140,110,0))",
        }}
      />
      <LanternGlows layout={layout} strength={1} />
    </>
  );
}

const frand = mulberry32(5150);
const FIREFLIES = Array.from({ length: 11 }, () => ({ x: 270 + frand() * 560, y: 640 + frand() * 330, d: 6 + frand() * 6, dx: 12 + frand() * 26 }));

/** Darkness with soft holes of light, drawn as one SVG (radial-gradient mask) — works in every browser. */
function Shade({ layout, color, holes }: { layout: WorldLayout; color: string; holes: { x: number; y: number; rx: number; ry: number; keep: number }[] }) {
  const id = `shade-${color.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <svg className="absolute inset-0 h-full w-full" width={layout.w} height={layout.h} aria-hidden>
      <defs>
        <radialGradient id={`${id}-g`}>
          <stop offset="0" stopColor="black" />
          <stop offset="0.45" stopColor="black" stopOpacity="0.75" />
          <stop offset="1" stopColor="black" stopOpacity="0" />
        </radialGradient>
        <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x="0" y="0" width={layout.w} height={layout.h}>
          <rect width={layout.w} height={layout.h} fill="white" />
          {holes.map((h, i) => (
            <ellipse key={i} cx={h.x} cy={h.y} rx={h.rx} ry={h.ry} fill={`url(#${id}-g)`} opacity={1 - h.keep} />
          ))}
        </mask>
      </defs>
      <rect width={layout.w} height={layout.h} fill={color} mask={`url(#${id}-m)`} />
    </svg>
  );
}

function Night({ layout, selly }: { layout: WorldLayout; selly?: MotionValue<number>[] }) {
  const win = toScreen(layout, WINDOW);
  const holes = [
    ...LANTERNS.map((l) => {
      const p = toScreen(layout, l);
      const r = l.r * layout.s * 1.25;
      return { x: p.x, y: p.y, rx: r, ry: r, keep: 0 };
    }),
    // the window lets some moonlight in
    { x: win.x, y: win.y, rx: 300 * layout.s, ry: 420 * layout.s, keep: 0.55 },
  ];
  return (
    <>
      <Shade layout={layout} color="rgba(10,14,48,0.8)" holes={holes} />
      {selly && <SellyLight layout={layout} selly={selly} />}
      {/* a cool blue cast over everything */}
      <div className="absolute inset-0 bg-[rgba(40,60,140,0.16)]" style={{ mixBlendMode: "multiply" }} />
      {/* cool moonlight on the glass */}
      <div
        className="absolute rounded-full"
        style={{
          left: win.x - 300 * layout.s,
          top: win.y - 420 * layout.s,
          width: 600 * layout.s,
          height: 840 * layout.s,
          background: "radial-gradient(closest-side, rgba(170,192,255,0.26), rgba(170,192,255,0))",
        }}
      />
      <div className="absolute inset-0" style={{ mixBlendMode: "screen" }}>
        <LanternGlows layout={layout} strength={1.3} />
      </div>
      {FIREFLIES.map((f, i) => {
        const p = toScreen(layout, f);
        return (
          <motion.span
            key={i}
            className="absolute h-1.5 w-1.5 rounded-full bg-[#fff6c0] shadow-[0_0_10px_4px_rgba(255,236,150,0.75)] motion-reduce:hidden"
            style={{ left: p.x, top: p.y }}
            animate={{ x: [0, f.dx, -f.dx * 0.6, 0], y: [0, -18, -6, 0], opacity: [0.2, 1, 0.5, 0.2] }}
            transition={{ duration: f.d, repeat: Infinity, ease: "easeInOut", delay: -i }}
          />
        );
      })}
    </>
  );
}

/** Selly's own soft glow at night (her heart lights the dark a little), following her. */
function SellyLight({ layout, selly }: { layout: WorldLayout; selly: MotionValue<number>[] }) {
  const [x, y] = selly;
  const r = 150 * layout.s;
  const left = useTransform(() => toScreen(layout, { x: x.get(), y: y.get() }).x - r);
  const top = useTransform(() => toScreen(layout, { x: x.get(), y: y.get() }).y - r * 1.25);
  return (
    <motion.div
      className="absolute left-0 top-0 rounded-full"
      style={{ x: left, y: top, width: r * 2, height: r * 2, background: "radial-gradient(closest-side, rgba(255,240,205,0.3), rgba(255,226,170,0.12) 55%, rgba(255,226,170,0))", mixBlendMode: "screen" }}
    />
  );
}
