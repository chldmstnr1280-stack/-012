"use client";

import { motion } from "motion/react";

/**
 * "지금 마음은 몇 점이야?" — one tap on 0–10, or skip. Asked right before and
 * right after a breath; neither answer is required, and no score is good or bad.
 */
export function MoodCheck({ stage, onAnswer, onSkip }: { stage: "before" | "after"; onAnswer: (v: number) => void; onSkip: () => void }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      className="mx-3 rounded-[26px] border border-white/80 bg-[rgba(253,250,243,0.96)] px-4 py-4 shadow-[0_16px_40px_-20px_rgba(60,40,20,0.5)]"
      aria-label={stage === "before" ? "호흡 전 마음 점수" : "호흡 후 마음 점수"}
    >
      <p className="text-center text-[15px] font-bold text-ink-700">{stage === "before" ? "시작 전에, 지금 마음은 몇 점쯤이야?" : "지금 마음은 몇 점쯤이야?"}</p>
      <p className="mt-0.5 text-center text-[11.5px] text-ink-500">0은 아주 무거움, 10은 아주 가벼움 · 정답은 없어요</p>
      <div className="mt-3 grid grid-cols-11 gap-1" role="radiogroup" aria-label="마음 점수 0부터 10까지">
        {Array.from({ length: 11 }, (_, v) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={false}
            aria-label={`${v}점`}
            onClick={() => onAnswer(v)}
            className="grid h-11 place-items-center rounded-xl text-[14px] font-bold tabular-nums text-ink-700 active:scale-90"
            style={{ background: `color-mix(in srgb, #b9cfe8 ${100 - v * 10}%, #f6d98f ${v * 10}%)` }}
          >
            {v}
          </button>
        ))}
      </div>
      <div className="mt-1 flex justify-between px-0.5 text-[10.5px] text-ink-300" aria-hidden>
        <span>무거움</span>
        <span>가벼움</span>
      </div>
      <button type="button" onClick={onSkip} className="mt-2 h-10 w-full text-[13px] text-ink-500 underline underline-offset-4">
        {stage === "before" ? "건너뛰고 바로 시작" : "건너뛰기"}
      </button>
    </motion.section>
  );
}
