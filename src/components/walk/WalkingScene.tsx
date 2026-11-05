"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { motion, useTime, useTransform, type MotionValue } from "motion/react";
import { walkArt } from "@/lib/assets";
import type { WalkTime } from "@/data/walkingPrompts";
import { farTile, foreTile, midTile } from "./placeholderArt";
import { mulberry32 } from "@/components/greenhouse/svg-kit";

const prand = mulberry32(99);
const PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  leaf: i % 3 === 0,
  x0: prand(),
  y0: 0.18 + prand() * 0.55,
  speed: 0.6 + prand() * 0.9,
  drift: 6 + prand() * 10,
  phase: prand() * Math.PI * 2,
}));

/**
 * WalkingScene = farBackground · midBackground · foreground · (Selly + UI via children) · ambientParticles.
 * `distance` (px walked) drives every layer at its own parallax speed.
 */
const SKY: Record<WalkTime, [string, string, string]> = {
  morning: ["#cfe3f3", "#f7ecdf", "#fbf4e6"],
  day: ["#b9d8ef", "#e9f1f4", "#f7f3e6"],
  evening: ["#a9a6d6", "#f2c3b8", "#fbe0c4"],
  night: ["#3b4470", "#6b6e9c", "#a8a0c4"],
};

export function WalkingScene({
  distance,
  time,
  moving,
  children,
}: {
  distance: MotionValue<number>;
  time: WalkTime;
  moving: boolean;
  children?: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const m = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    m();
    const ro = new ResizeObserver(m);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const [a, b, c] = SKY[time];

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden" style={{ background: `linear-gradient(${a}, ${b} 45%, ${c})` }}>
      {size && (
        <>
          <ParallaxLayer name="farBackground" src={walkArt.far} factor={0.12} distance={distance} size={size} tile={farTile} />
          <ParallaxLayer name="midBackground" src={walkArt.mid} factor={0.4} distance={distance} size={size} tile={midTile} />
          {children}
          <ParallaxLayer name="foreground" src={walkArt.fore} factor={1} distance={distance} size={size} tile={foreTile} front />
          <AmbientParticles distance={distance} size={size} moving={moving} night={time === "night"} />
        </>
      )}
      {time === "night" && <div className="pointer-events-none absolute inset-0 bg-[#1c2140]/25" />}
    </div>
  );
}

/** One parallax layer: a seamless image strip, or two placeholder tiles side by side. */
function ParallaxLayer({
  name,
  src,
  factor,
  distance,
  size,
  tile,
  front = false,
}: {
  name: string;
  src: string | null;
  factor: number;
  distance: MotionValue<number>;
  size: { w: number; h: number };
  tile: (w: number, h: number) => React.ReactNode;
  front?: boolean;
}) {
  const { w, h } = size;
  const bgPos = useTransform(distance, (d) => `${-d * factor}px 100%`);
  const x = useTransform(distance, (d) => -((d * factor) % w));
  return (
    <div data-layer={name} className={`pointer-events-none absolute inset-0 ${front ? "z-20" : ""}`}>
      {src ? (
        <motion.div className="absolute inset-0" style={{ backgroundImage: `url(${src})`, backgroundRepeat: "repeat-x", backgroundSize: "auto 100%", backgroundPosition: bgPos }} />
      ) : (
        <motion.div className="absolute left-0 top-0 flex" style={{ x, width: w * 2, height: h }}>
          {[0, 1].map((i) => (
            <svg key={i} width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden>
              {tile(w, h)}
            </svg>
          ))}
        </motion.div>
      )}
    </div>
  );
}

/** Drifting light motes and little leaves; they stream past while walking. */
function AmbientParticles({ distance, size, moving, night }: { distance: MotionValue<number>; size: { w: number; h: number }; moving: boolean; night: boolean }) {
  const t = useTime();

  return (
    <div className="pointer-events-none absolute inset-0 z-30 motion-reduce:hidden" aria-hidden>
      {PARTICLES.map((p, i) => (
        <Particle key={i} p={p} t={t} distance={distance} size={size} moving={moving} night={night} />
      ))}
    </div>
  );
}

function Particle({
  p,
  t,
  distance,
  size,
  night,
}: {
  p: { leaf: boolean; x0: number; y0: number; speed: number; drift: number; phase: number };
  t: MotionValue<number>;
  distance: MotionValue<number>;
  size: { w: number; h: number };
  moving: boolean;
  night: boolean;
}) {
  const W = size.w + 40;
  const x = useTransform(() => {
    const raw = p.x0 * W - distance.get() * 0.7 * p.speed - (t.get() / 1000) * p.drift;
    return (((raw % W) + W) % W) - 20;
  });
  const y = useTransform(() => p.y0 * size.h + Math.sin(t.get() / 1400 + p.phase) * 14);
  const rotate = useTransform(() => (p.leaf ? (t.get() / 20 + p.phase * 60) % 360 : 0));
  return p.leaf ? (
    <motion.svg viewBox="-6 -12 12 14" width={12} height={14} className="absolute left-0 top-0" style={{ x, y, rotate }}>
      <path d="M0 0 C -5 -3 -5 -9 0 -12 C 5 -9 5 -3 0 0Z" fill="#a8cb8a" />
    </motion.svg>
  ) : (
    <motion.span
      className="absolute left-0 top-0 h-1.5 w-1.5 rounded-full"
      style={{ x, y, background: night ? "#fff3b0" : "#fffbe6", boxShadow: night ? "0 0 10px 3px rgba(255,236,150,0.7)" : "0 0 8px 2px rgba(255,248,220,0.7)" }}
    />
  );
}
