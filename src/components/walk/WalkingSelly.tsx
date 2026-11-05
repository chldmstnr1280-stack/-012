"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useTime, useTransform } from "motion/react";
import { Selly } from "@/components/selly/Selly";
import { walkArt } from "@/lib/assets";
import { STAGE_SIZE } from "@/lib/growth";
import { useSelly } from "@/lib/selly-store";

/**
 * Selly on the walking path. Walking uses `walkArt.frames`: one frame → a gentle hop,
 * 2–4 frames → a sprite cycle at the walker's cadence. Standing still she is the
 * regular live Selly, looking around (and at the odd butterfly).
 */
export function WalkingSelly({ moving, cadence, ended }: { moving: boolean; cadence: number; ended: boolean }) {
  const { stage } = useSelly();
  const useSprite = stage.id !== "seed"; // seed Selly has no leaves; her walk is the base art hopping
  const showWalk = moving && !ended;
  const [look, setLook] = useState(0);
  const [butterfly, setButterfly] = useState(0);

  // idle: glance around now and then; sometimes a butterfly passes
  useEffect(() => {
    if (showWalk) return;
    const id = setInterval(() => {
      if (Math.random() < 0.3) setButterfly((b) => b + 1);
      else setLook([-0.9, 0, 0.9, 0][Math.floor(Math.random() * 4)]);
    }, 3200);
    return () => clearInterval(id);
  }, [showWalk]);
  const watching = butterfly > 0 && !showWalk;

  return (
    <div className="absolute left-[40%] z-[25] -translate-x-1/2" style={{ bottom: "13%", width: "min(48vw, 30dvh, 220px)", aspectRatio: "1" }}>
      <AnimatePresence initial={false}>
        {showWalk ? (
          <motion.div key="walk" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            {useSprite ? <WalkCycle cadence={cadence} scale={STAGE_SIZE[stage.id]} /> : <HopSelly cadence={cadence} />}
          </motion.div>
        ) : (
          <motion.div key="idle" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <Selly className="h-full w-full" look={watching ? 0.8 : look} pose={ended || watching ? "happy" : undefined} />
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>{watching && <Butterfly key={butterfly} onDone={() => setButterfly(0)} />}</AnimatePresence>
    </div>
  );
}

/** Sprite walk: cycles frames (or hops a single frame) in step with the walker. */
function WalkCycle({ cadence, scale }: { cadence: number; scale: number }) {
  const frames = walkArt.frames;
  const t = useTime();
  const period = 1000 / Math.max(1.2, Math.min(2.6, cadence)); // ms per step
  const frame = useTransform(t, (ms) => Math.floor(ms / (period / 2)) % frames.length);
  const y = useTransform(t, (ms) => -Math.abs(Math.sin((ms / period) * Math.PI)) * 8);
  const rotate = useTransform(t, (ms) => Math.sin((ms / period) * Math.PI) * 3);
  const [idx, setIdx] = useState(0);
  useEffect(() => frame.on("change", (v) => setIdx(v)), [frame]);
  return (
    <motion.div className="absolute bottom-[10%] left-1/2" style={{ width: `${66 * scale}%`, x: "-50%", y, rotate, originY: 1 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={frames[frames.length > 1 ? idx : 0]} alt="" draggable={false} className="block w-full select-none" />
      <div className="absolute -bottom-[4%] left-1/2 -z-10 h-[10%] w-[80%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgba(84,92,48,0.4),rgba(84,92,48,0))]" />
    </motion.div>
  );
}

function HopSelly({ cadence }: { cadence: number }) {
  const period = 1 / Math.max(1.2, Math.min(2.6, cadence));
  return (
    <motion.div className="absolute inset-0" animate={{ y: [0, -8, 0], rotate: [-2, 2, -2] }} transition={{ duration: period * 2, repeat: Infinity, ease: "easeInOut" }} style={{ originY: 0.9 }}>
      <Selly className="h-full w-full" still look={0.8} />
    </motion.div>
  );
}

function Butterfly({ onDone }: { onDone: () => void }) {
  return (
    <motion.svg
      viewBox="-12 -10 24 20"
      width={26}
      height={22}
      className="pointer-events-none absolute"
      style={{ left: "110%", top: "10%" }}
      initial={{ x: 60, y: -10, opacity: 0 }}
      animate={{ x: [60, 10, -30, 20], y: [-10, 20, -6, -40], opacity: [0, 1, 1, 0] }}
      transition={{ duration: 4.5, ease: "easeInOut" }}
      onAnimationComplete={onDone}
      aria-hidden
    >
      <motion.g animate={{ scaleX: [1, 0.3, 1] }} transition={{ duration: 0.25, repeat: Infinity }}>
        <ellipse cx={-5} cy={-3} rx={6} ry={5} fill="#f7c9d6" />
        <ellipse cx={5} cy={-3} rx={6} ry={5} fill="#f7c9d6" />
        <ellipse cx={-4} cy={4} rx={4} ry={3.4} fill="#e9d2f2" />
        <ellipse cx={4} cy={4} rx={4} ry={3.4} fill="#e9d2f2" />
      </motion.g>
      <rect x={-0.8} y={-6} width={1.6} height={12} rx={0.8} fill="#8a6f55" />
    </motion.svg>
  );
}
