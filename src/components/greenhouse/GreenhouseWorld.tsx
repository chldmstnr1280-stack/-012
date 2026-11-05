"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useTransform, type MotionValue } from "motion/react";
import { Selly } from "@/components/selly/Selly";
import type { SellyBrain } from "@/components/selly/useSellyBrain";
import type { SellyExpression } from "@/components/selly/SellyFace";
import { CUSHION_BACK_Z, CUSHION_FRONT_Z, OBJECTS, flowerStage, type GreenhouseObject, type ObjectId } from "@/data/greenhouseObjects";
import { sellyPoses } from "@/lib/assets";
import { STAGE_SIZE, type StageId } from "@/lib/growth";
import { useSelly } from "@/lib/selly-store";
import { toScreen, toWorld, type WorldLayout } from "@/lib/game/world";
import type { SellyState } from "@/lib/game/behaviorEngine";

/** Expression and posture for each behaviour state. */
const LOOK: Partial<Record<SellyState, { pose?: SellyExpression; still?: boolean }>> = {
  walking: { still: true },
  sitting: { still: true },
  sleeping: { pose: "relaxed", still: true },
  sunbathing: { pose: "relaxed" },
  looking_at_flower: { pose: "happy" },
  watering: { pose: "happy" },
};

/** States drawn with a painted pose sprite (box-relative width; feet at 90%). */
type PoseId = "walk" | "sit" | "sleep";
const POSE_FOR: Partial<Record<SellyState, PoseId>> = { walking: "walk", sitting: "sit", sleeping: "sleep" };
const POSE_WIDTH: Record<PoseId, number> = { walk: 0.66, sit: 0.68, sleep: 0.8 };

interface Props {
  layout: WorldLayout;
  brain: SellyBrain;
  /** Selly's box size before depth scaling (px) */
  size: number;
  breathing: boolean;
  haloScale: MotionValue<number>;
  haloOpacity: MotionValue<number>;
  onTouchSelly: () => void;
  onObject: (id: ObjectId) => void;
  /** days with a mood record — grows the mood flower */
  moodDays: number;
}

export function GreenhouseWorld({ layout, brain, size, breathing, haloScale, haloOpacity, onTouchSelly, onObject, moodDays }: Props) {
  const { body, state, facing, spot } = brain;
  const L = layout;

  // world → screen for Selly's feet; her box is anchored at 50% / 90%
  const left = useTransform(() => toScreen(L, { x: body.x.get(), y: body.y.get() }).x - size / 2);
  const top = useTransform(() => toScreen(L, { x: body.x.get(), y: body.y.get() }).y - size * 0.9 + body.hop.get());
  // depth sorting with the objects (floating while breathing puts her in front of everything)
  const zIndex = useTransform(() => (breathing ? 3000 : Math.round(body.y.get())));
  const scale = body.scale;

  const { stage } = useSelly();
  const look = LOOK[state] ?? {};
  // seed Selly has no leaves: her side-walk pose can't be shown leafless, so she hops in her base art
  const wanted = !breathing && sellyPoses ? POSE_FOR[state] : undefined;
  const pose = wanted === "walk" && stage.id === "seed" ? undefined : wanted;

  // floor band where a tap calls Selly over
  const floorTop = toScreen(L, { x: 0, y: 890 }).y;
  const floorBottom = toScreen(L, { x: 0, y: 1000 }).y;

  return (
    <div className="pointer-events-none absolute inset-0 isolate" aria-label="유리온실">
      {/* tap the floor to call Selly */}
      {!breathing && (
        <button
          type="button"
          aria-label="셀리 부르기"
          tabIndex={-1}
          className="pointer-events-auto absolute inset-x-0 z-0 cursor-pointer"
          style={{ top: floorTop, height: Math.max(0, floorBottom - floorTop) }}
          onClick={(e) => {
            const r = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
            brain.walkTo(toWorld(L, e.clientX - r.left, e.clientY - r.top));
          }}
        />
      )}

      {OBJECTS.map((o) => (
        <WorldObject key={o.id} obj={o} layout={L} moodDays={moodDays} disabled={breathing} onTap={() => onObject(o.id)} breathing={breathing} />
      ))}

      {state === "watering" && spot?.focus && <Droplets at={toScreen(L, spot.focus)} />}

      <motion.div className="absolute left-0 top-0" style={{ x: left, y: top, width: size, height: size, scale, zIndex, originX: 0.5, originY: 0.9 }}>
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

          {/* the live Selly (expressions, reactions) — stays mounted, hidden while a pose sprite shows */}
          <motion.div className="pointer-events-auto absolute inset-0" animate={{ opacity: pose ? 0 : 1 }} transition={{ duration: 0.22 }}>
            <Selly
              mode={breathing ? "breathing" : "idle"}
              pose={look.pose}
              still={look.still}
              look={state === "walking" ? facing : facing * 0.6}
              onTouch={onTouchSelly}
              className="h-full w-full"
            />
          </motion.div>

          <AnimatePresence>
            {pose && sellyPoses && (
              <motion.button
                key={pose}
                type="button"
                aria-label="셀리 쓰다듬기"
                onClick={onTouchSelly}
                className="pointer-events-auto absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
              >
                <PoseSprite pose={pose} stage={stage.id} facing={facing} />
              </motion.button>
            )}
          </AnimatePresence>
          {state === "sleeping" && <Zzz />}
        </motion.div>
      </motion.div>

      {!breathing && <WorldBubble brain={brain} layout={L} size={size} />}
    </div>
  );
}

/** A painted pose; walking flips with direction, sitting & sleeping breathe softly. */
function PoseSprite({ pose, stage, facing }: { pose: PoseId; stage: StageId; facing: -1 | 0 | 1 }) {
  if (!sellyPoses) return null;
  const w = POSE_WIDTH[pose] * STAGE_SIZE[stage];
  const bare = stage === "seed" && pose !== "walk";
  const src = bare ? sellyPoses.bare[pose as "sit" | "sleep"] : sellyPoses[pose];
  const head = bare ? sellyPoses.head[pose as "sit" | "sleep"] : null;
  return (
    <motion.div
      className="absolute bottom-[10%] left-1/2"
      style={{ width: `${w * 100}%`, x: "-50%", originY: 1 }}
      animate={pose === "walk" ? { scaleX: facing < 0 ? -1 : 1 } : { scaleY: [1, pose === "sleep" ? 1.035 : 1.02, 1] }}
      transition={pose === "walk" ? { duration: 0.2 } : { duration: pose === "sleep" ? 4.6 : 3.6, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" draggable={false} className="block w-full select-none" />
      {head && <Seedling x={head[0]} y={head[1]} tilt={pose === "sleep" ? 18 : 0} />}
      <div className="absolute -bottom-[4%] left-1/2 -z-10 h-[10%] w-[80%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgba(84,92,48,0.45),rgba(84,92,48,0))]" />
    </motion.div>
  );
}

/** Two tiny seed leaves on top of a leafless pose. */
function Seedling({ x, y, tilt }: { x: number; y: number; tilt: number }) {
  return (
    <svg
      viewBox="-20 -26 40 30"
      className="absolute w-[22%] -translate-x-1/2 -translate-y-[88%]"
      style={{ left: `${x * 100}%`, top: `${y * 100}%`, rotate: `${tilt}deg` }}
      aria-hidden
    >
      <defs>
        <linearGradient id="seedLeaf" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#8db86a" />
          <stop offset="1" stopColor="#c6e19a" />
        </linearGradient>
      </defs>
      <path d="M0 3 Q -1 -4 0.5 -9" stroke="#86b06a" strokeWidth={2.4} strokeLinecap="round" fill="none" />
      <path d="M0 -8 C -6 -9 -14 -14 -15 -22 C -7 -22 -1 -17 0 -8Z" fill="url(#seedLeaf)" />
      <path d="M1 -8 C 7 -10 14 -16 14 -23 C 6 -22 1 -17 1 -8Z" fill="url(#seedLeaf)" />
    </svg>
  );
}

/** A tappable object in the greenhouse, depth-sorted by its floor position. */
function WorldObject({
  obj,
  layout,
  moodDays,
  disabled,
  breathing,
  onTap,
}: {
  obj: GreenhouseObject;
  layout: WorldLayout;
  moodDays: number;
  disabled: boolean;
  breathing: boolean;
  onTap: () => void;
}) {
  const [bump, setBump] = useState(0);
  const stage = obj.id === "moodFlower" ? flowerStage(moodDays) : null;
  const src = stage?.src ?? obj.src;
  const width = stage?.width ?? obj.width;
  const aspect = stage?.aspect ?? obj.aspect;
  const p = toScreen(layout, obj.anchor);
  const w = width * layout.s;
  const h = w * aspect;
  const z = obj.id === "cushion" ? CUSHION_BACK_Z : Math.round(obj.anchor.y);
  const label = stage ? `${obj.label} (${stage.name}) — ${obj.hint}` : `${obj.label} — ${obj.hint}`;

  return (
    <>
      <motion.button
        type="button"
        aria-label={label}
        disabled={disabled}
        onClick={() => {
          setBump((b) => b + 1);
          onTap();
        }}
        className="pointer-events-auto absolute rounded-3xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:pointer-events-none"
        style={{ left: p.x - w / 2, top: p.y - h, width: w, height: h, zIndex: z, originY: 1 }}
        animate={bump ? { scale: [1, 1.08, 0.97, 1] } : undefined}
        transition={{ duration: 0.45 }}
        key={`${obj.id}-${bump}`}
      >
        {obj.glow && (
          <motion.span
            aria-hidden
            className="absolute inset-[-12%] rounded-full bg-[radial-gradient(closest-side,rgba(255,236,250,0.65),rgba(255,236,250,0))]"
            animate={{ opacity: breathing ? [0.7, 1, 0.7] : [0.35, 0.7, 0.35], scale: [0.95, 1.05, 0.95] }}
            transition={{ duration: breathing ? 4 : 5, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        <motion.img
          src={src}
          alt=""
          draggable={false}
          className="relative block h-full w-full select-none object-contain"
          animate={obj.glow ? { y: [0, -4, 0] } : undefined}
          transition={obj.glow ? { duration: 5, repeat: Infinity, ease: "easeInOut" } : undefined}
        />
      </motion.button>
      {obj.frontSrc && (
        // front rim drawn above Selly when she sits inside
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={obj.frontSrc}
          alt=""
          aria-hidden
          draggable={false}
          className="pointer-events-none absolute select-none"
          style={{ left: p.x - w / 2, top: p.y - h, width: w, height: h, zIndex: CUSHION_FRONT_Z }}
        />
      )}
    </>
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
    <div ref={ref} className="pointer-events-none absolute left-0 top-0 z-[5000]" aria-live="polite">
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
