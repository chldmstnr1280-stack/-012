"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useSelly } from "@/lib/selly-store";
import { AnimatePresence, motion } from "motion/react";
import { GreenhouseBackground } from "@/components/greenhouse/GreenhouseBackground";
import { Decorations, MoodGarden } from "@/components/greenhouse/GreenhouseWorld";
import { TimeLighting } from "@/components/greenhouse/TimeLighting";
import { CUSHION_BACK_Z, CUSHION_FRONT_Z, CUSHION_SEAT } from "@/data/greenhouseObjects";
import { SHARE_MESSAGES } from "@/data/shareMessages";
import { STAGE_SIZE, stageFor } from "@/lib/growth";
import { computeLayout, toScreen, type WorldLayout } from "@/lib/game/world";
import { decodeSnapshot, type GreenhouseSnapshot } from "@/lib/share/snapshot";
import { playSfx } from "@/lib/sound/sfx";

const CUSHION = { x: 585, y: 1006, w: 290, aspect: 392 / 560 };

/**
 * A friend's greenhouse, opened from a shared link (read-only). Everything shown
 * comes from the link itself (after validation) — nothing is fetched or stored.
 */
export function VisitScreen() {
  const ref = useRef<HTMLElement>(null);
  const [layout, setLayout] = useState<WorldLayout | null>(null);
  const [snap, setSnap] = useState<GreenhouseSnapshot | null | "invalid">(null);
  const { setImmersive } = useSelly();
  // a visit is its own little page: no app navigation bar
  useEffect(() => {
    setImmersive(true);
    return () => setImmersive(false);
  }, [setImmersive]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => setSnap(decodeSnapshot(window.location.hash.slice(1)) ?? "invalid");
    read();
    window.addEventListener("hashchange", read);
    const m = () => setLayout(computeLayout(el.clientWidth, el.clientHeight, el.clientHeight * 0.74));
    m();
    const ro = new ResizeObserver(m);
    ro.observe(el);
    return () => {
      ro.disconnect();
      window.removeEventListener("hashchange", read);
    };
  }, []);

  const ok = snap && snap !== "invalid" ? snap : null;
  const stage = ok ? stageFor(ok.level) : null;

  return (
    <main ref={ref} className="relative h-full w-full overflow-clip bg-cream-50">
      <GreenhouseBackground placement={layout ?? undefined} />
      {layout && ok && stage && (
        <div className="absolute inset-0 isolate">
          <Scene layout={layout} snap={ok} />
          <TimeLighting tod={ok.tod} layout={layout} />
        </div>
      )}

      <div className="absolute inset-x-0 top-0 z-[5000] flex justify-center pt-[calc(env(safe-area-inset-top)+18px)]">
        <span className="glass rounded-full px-4 py-1.5 text-[13px] font-bold text-ink-700">🌿 친구의 온실에 놀러 왔어요</span>
      </div>

      <AnimatePresence>
        {snap && (
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="absolute inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+20px)] z-[5000] rounded-[26px] border border-white/80 bg-[rgba(253,250,243,0.95)] p-5 text-center shadow-[0_20px_50px_-20px_rgba(60,40,20,0.5)]"
          >
            {ok && stage ? (
              <>
                <p className="text-[17px] font-bold text-ink-700">{SHARE_MESSAGES[ok.msg]}</p>
                <p className="mt-1 text-[12.5px] text-ink-500">
                  Lv. {ok.level} {stage.name} 셀리가 사는 온실이에요
                  {ok.flowers.length ? ` · 기분 꽃 ${ok.flowers.length}송이` : ""}
                </p>
              </>
            ) : (
              <>
                <p className="text-[16px] font-bold text-ink-700">온실 링크를 열지 못했어요</p>
                <p className="mt-1 text-[12.5px] text-ink-500">링크가 잘렸을 수 있어요. 친구에게 다시 받아 주세요.</p>
              </>
            )}
            <Link
              href="/"
              className="mt-4 block h-12 rounded-full bg-gradient-to-b from-[#9cc095] to-[#7ea47a] text-[15px] font-bold leading-[48px] text-white shadow-[0_10px_24px_-10px_rgba(90,130,85,0.8)]"
            >
              나도 셀리 만나러 가기
            </Link>
            <p className="mt-2 text-[11px] text-ink-300">구경만 할 수 있어요. 친구의 기록은 링크에 담겨 있지 않아요.</p>
          </motion.section>
        )}
      </AnimatePresence>
    </main>
  );
}

function Scene({ layout, snap }: { layout: WorldLayout; snap: GreenhouseSnapshot }) {
  const stage = stageFor(snap.level);
  const [hop, setHop] = useState(0);
  const c = toScreen(layout, CUSHION);
  const cw = CUSHION.w * layout.s;
  const ch = cw * CUSHION.aspect;
  const seat = toScreen(layout, CUSHION_SEAT);
  const sw = 262 * STAGE_SIZE[stage.id] * layout.s;
  const pose = stage.id === "seed" ? "/assets/selly/pose-sit-bare.png" : "/assets/selly/pose-sit.png";
  const flowers = snap.flowers.map((f, i) => ({ date: String(i).padStart(2, "0"), emotion: f.e, stage: f.s }));

  return (
    <>
      <Decorations layout={layout} deco={snap.deco} decorating={false} activeSlot={null} onSlot={() => {}} />
      <MoodGarden layout={layout} flowers={flowers} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assets/objects/cushion.png" alt="" className="pointer-events-none absolute max-w-none" style={{ left: c.x - cw / 2, top: c.y - ch, width: cw, zIndex: CUSHION_BACK_Z }} />
      <motion.button
        type="button"
        aria-label="셀리 쓰다듬기"
        className="absolute"
        style={{ left: seat.x - sw / 2, top: seat.y - sw * 1.2, width: sw, height: sw * 1.2, zIndex: CUSHION_SEAT.y, originY: 1 }}
        onClick={() => {
          setHop((h) => h + 1);
          playSfx("touch");
        }}
      >
        <motion.img
          key={hop}
          src={pose}
          alt=""
          draggable={false}
          className="absolute bottom-0 left-0 w-full select-none"
          style={{ originY: 1 }}
          animate={hop ? { y: [0, -18, 0], scaleY: [1, 1.06, 0.96, 1] } : { scaleY: [1, 1.02, 1] }}
          transition={hop ? { duration: 0.55 } : { duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
        />
        <AnimatePresence>
          {hop > 0 && (
            <motion.span key={hop} className="pointer-events-none absolute left-1/2 top-0 text-[22px]" initial={{ opacity: 0, y: 0 }} animate={{ opacity: [0, 1, 0], y: -40 }} transition={{ duration: 1.2 }}>
              ♡
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assets/objects/cushion-front.png" alt="" className="pointer-events-none absolute max-w-none" style={{ left: c.x - cw / 2, top: c.y - ch, width: cw, zIndex: CUSHION_FRONT_Z }} />
    </>
  );
}
