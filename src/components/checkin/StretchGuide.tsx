"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { X } from "lucide-react";
import { Selly } from "@/components/selly/Selly";
import { playSfx } from "@/lib/sound/sfx";

/**
 * 2분 몸 풀기 — four gentle 30-second moves with Selly. Not exercise advice and not
 * a treatment: just a short pause for the body. "아프면 바로 멈춰" is always shown.
 */
const MOVES = [
  { text: "어깨를 천천히 귀 쪽으로 올렸다가,\n툭 내려놓기", emoji: "🙆" },
  { text: "고개를 오른쪽으로 천천히 기울였다가,\n왼쪽으로", emoji: "🌿" },
  { text: "깍지 끼고 팔을 위로\n쭉— 뻗기", emoji: "🌱" },
  { text: "어깨를 뒤로 크게\n세 번 돌리기", emoji: "🌀" },
];
const SECS = 30;

export function StretchGuide({ onClose }: { onClose: (done: boolean) => void }) {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const [left, setLeft] = useState(SECS);
  const finished = i >= MOVES.length;

  useEffect(() => {
    if (finished) return;
    const t = setInterval(() => setLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [finished, i]);

  useEffect(() => {
    if (left > 0 || finished) return;
    const t = setTimeout(() => {
      playSfx("tap");
      setI((x) => x + 1);
      setLeft(SECS);
    }, 0);
    return () => clearTimeout(t);
  }, [left, finished]);

  const move = MOVES[Math.min(i, MOVES.length - 1)];
  return (
    <motion.div className="absolute inset-0 z-50 flex flex-col items-center bg-[linear-gradient(180deg,#f4f7ee,#fbf6ec)] px-6 pt-[calc(env(safe-area-inset-top)+16px)]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-label="2분 몸 풀기">
      <button type="button" aria-label="그만하기" onClick={() => onClose(false)} className="glass absolute right-3 top-[calc(env(safe-area-inset-top)+10px)] grid h-11 w-11 place-items-center rounded-full text-ink-500">
        <X size={20} />
      </button>
      <p className="mt-2 text-[15px] font-bold text-ink-700">2분 몸 풀기</p>
      <p className="text-[11.5px] text-ink-500">아프거나 불편하면 바로 멈춰도 돼</p>
      <motion.div
        className="mt-6 w-[min(46vw,170px)]"
        animate={reduce || finished ? undefined : { y: [0, -10, 0], scaleY: [1, 1.04, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <Selly pose={finished ? "happy" : "relaxed"} className="w-full" />
      </motion.div>
      {finished ? (
        <>
          <p className="mt-6 text-center text-[17px] font-bold text-ink-700">다 했다! 몸이 조금 말랑해졌어?</p>
          <button type="button" onClick={() => onClose(true)} className="mt-6 h-12 w-full max-w-xs rounded-2xl bg-sage-500 text-[15px] font-bold text-white">
            좋아
          </button>
        </>
      ) : (
        <>
          <p className="mt-6 text-[30px]" aria-hidden>
            {move.emoji}
          </p>
          <p className="mt-2 whitespace-pre-line text-center text-[17px] font-bold leading-relaxed text-ink-700" aria-live="polite">
            {move.text}
          </p>
          <div className="mt-5 flex items-center gap-2" aria-label={`${i + 1}/${MOVES.length}, ${left}초 남음`}>
            {MOVES.map((_, k) => (
              <span key={k} className={`h-2 rounded-full ${k === i ? "w-6 bg-sage-500" : k < i ? "w-2 bg-sage-300" : "w-2 bg-[#e3dacd]"}`} />
            ))}
            <span className="ml-2 text-[13px] tabular-nums text-ink-500">{left}초</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setI((x) => x + 1);
              setLeft(SECS);
            }}
            className="mt-6 h-11 rounded-full px-5 text-[13px] text-ink-500 active:bg-white/70"
          >
            다음 동작
          </button>
        </>
      )}
    </motion.div>
  );
}
