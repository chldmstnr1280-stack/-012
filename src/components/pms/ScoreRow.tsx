"use client";

import { motion } from "motion/react";
import { SCORE_LABEL, type Score } from "@/data/pmsSymptoms";

/** One symptom: five one-tap buttons. The chosen score's word shows for clarity (not colour alone). */
export function ScoreRow({ label, value, onPick }: { label: string; value: Score | undefined; onPick: (v: Score) => void }) {
  return (
    <li className="flex items-center gap-2 rounded-2xl bg-white/60 py-1.5 pl-3 pr-1.5">
      <span className="min-w-0 flex-1">
        <span className="block break-keep text-[14px] leading-tight text-ink-700">{label}</span>
        <span className="block h-4 text-[11px] text-ink-500">{value != null ? SCORE_LABEL[value] : ""}</span>
      </span>
      <span className="flex shrink-0 gap-1" role="radiogroup" aria-label={`${label} 정도`}>
        {([0, 1, 2, 3, 4] as Score[]).map((v) => {
          const on = value === v;
          return (
            <motion.button
              key={v}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={`${label} ${SCORE_LABEL[v]}`}
              whileTap={{ scale: 0.88 }}
              onClick={() => onPick(v)}
              className={`grid h-9 w-9 place-items-center rounded-xl text-[13px] font-bold tabular-nums transition-colors ${
                on ? (v === 0 ? "bg-[#cfdccb] text-sage-700" : SCORE_ON[v]) : "bg-[#f1ece3] text-ink-300"
              }`}
            >
              {v}
            </motion.button>
          );
        })}
      </span>
    </li>
  );
}

// increasing warmth with the score; the number itself is always shown
const SCORE_ON: Record<Score, string> = {
  0: "",
  1: "bg-[#f6e3b4] text-[#7a5a14]",
  2: "bg-[#f3c79a] text-[#7a3f12]",
  3: "bg-[#e9a092] text-white",
  4: "bg-[#c9707a] text-white",
};
