"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

/**
 * The end of a whine: each thing the user said floats up in a soap bubble,
 * and tapping it pops it ("펑!"). Purely playful — nothing is stored.
 * Positions are fixed per index (no randomness in render).
 */
const SPOTS = [
  [12, 58],
  [56, 50],
  [30, 30],
  [64, 18],
  [8, 14],
  [42, 66],
  [70, 70],
  [22, 78],
];

export function PopBubbles({ words, calm, onPop, onDone }: { words: string[]; calm: boolean; onPop: () => void; onDone: (popped: number) => void }) {
  const reduce = useReducedMotion();
  const [popped, setPopped] = useState<number[]>([]);
  // a popping bubble keeps its old click handler while it fades out, so track pops
  // in a ref: a second tap on the same bubble is ignored and onDone runs once
  const poppedRef = useRef<Set<number>>(new Set());
  const done = useRef(false);
  const [bursts, setBursts] = useState<{ id: number; x: number; y: number }[]>([]);
  const left = words.length - popped.length;

  const finish = (n: number) => {
    if (done.current) return;
    done.current = true;
    onDone(n);
  };

  const pop = (i: number) => {
    if (poppedRef.current.has(i) || done.current) return;
    poppedRef.current.add(i);
    const next = [...poppedRef.current];
    setPopped(next);
    const [x, y] = SPOTS[i % SPOTS.length];
    setBursts((b) => [...b, { id: i, x, y }]);
    setTimeout(() => setBursts((b) => b.filter((p) => p.id !== i)), 700);
    onPop();
    if (next.length === words.length) setTimeout(() => finish(next.length), 650);
  };

  return (
    <motion.div className="absolute inset-0 z-40 flex flex-col bg-[rgba(244,239,252,0.86)] backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="px-5 pt-[calc(env(safe-area-inset-top)+22px)] text-center">
        <p className="text-[17px] font-bold text-ink-700">{calm ? "오늘 마음, 풍선에 담았어" : "오늘의 징징, 풍선에 다 담았다!!"}</p>
        <p className="mt-1 text-[13px] text-ink-500">{calm ? "하나씩 톡 눌러서 날려 보내 줘." : "톡톡 눌러서 다 터뜨려 버려!"}</p>
        <p className="mt-1 text-[12px] font-bold text-[#c06a80]" aria-live="polite">
          {left > 0 ? `남은 풍선 ${left}개` : "다 터뜨렸다!"}
        </p>
      </div>
      <div className="relative min-h-0 flex-1">
        <AnimatePresence>
          {words.map((w, i) =>
            popped.includes(i) ? null : (
              <motion.button
                key={i}
                type="button"
                onClick={() => pop(i)}
                aria-label={`풍선 터뜨리기: ${w}`}
                className="absolute grid h-[104px] w-[104px] place-items-center rounded-full border border-white/90 bg-[radial-gradient(circle_at_30%_28%,rgba(255,255,255,0.95)_0%,rgba(255,255,255,0.35)_22%,rgba(214,226,255,0.45)_55%,rgba(247,198,214,0.55)_100%)] p-3 text-center shadow-[0_10px_26px_-14px_rgba(120,90,150,0.6)] active:scale-90"
                style={{ left: `${SPOTS[i % SPOTS.length][0]}%`, top: `${SPOTS[i % SPOTS.length][1]}%` }}
                initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.3, y: 40 }}
                animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: [0, -10, 0], x: [0, i % 2 ? 6 : -6, 0] }}
                exit={reduce ? { opacity: 0, pointerEvents: "none" } : { opacity: 0, scale: 1.5, pointerEvents: "none" }}
                transition={reduce ? { duration: 0.2 } : { opacity: { duration: 0.3 }, scale: { type: "spring", stiffness: 200, damping: 14, delay: i * 0.08 }, y: { duration: 3 + (i % 3) * 0.6, repeat: Infinity, ease: "easeInOut" }, x: { duration: 4 + (i % 2), repeat: Infinity, ease: "easeInOut" } }}
              >
                <span className="line-clamp-3 break-keep text-[12px] leading-tight text-ink-700">{w.length > 22 ? `${w.slice(0, 21)}…` : w}</span>
              </motion.button>
            ),
          )}
        </AnimatePresence>
        <AnimatePresence>
          {bursts.map((b) => (
            <motion.span
              key={`b${b.id}`}
              aria-hidden
              className="pointer-events-none absolute grid h-[104px] w-[104px] place-items-center text-[22px] font-bold text-[#c06a80]"
              style={{ left: `${b.x}%`, top: `${b.y}%` }}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1.2 }}
              exit={{ opacity: 0, y: -16 }}
            >
              {calm ? "🕊️" : "펑!"}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
      <button type="button" onClick={() => finish(poppedRef.current.size)} className="mx-auto mb-[calc(env(safe-area-inset-bottom)+18px)] rounded-full px-4 py-2 text-[12.5px] text-ink-500 underline-offset-2 active:underline">
        그냥 마칠래
      </button>
    </motion.div>
  );
}
