"use client";

import { motion } from "motion/react";
import { Pause, Play, X } from "lucide-react";
import type { BreathPhase } from "./useBreathingSession";

interface Props {
  phase: BreathPhase;
  phaseSecondsLeft: number;
  remainingMs: number;
  sessionProgress: number;
  running: boolean;
  onToggle: () => void;
  onStop: () => void;
}

const R = 58;
const C = 2 * Math.PI * R;

export function BreathingControls({ phase, phaseSecondsLeft, remainingMs, sessionProgress, running, onToggle, onStop }: Props) {
  const remaining = Math.ceil(remainingMs / 1000);
  const mm = Math.floor(remaining / 60);
  const ss = String(remaining % 60).padStart(2, "0");

  return (
    <div className="flex flex-col items-center gap-4 px-6">
      <div className="relative grid h-[132px] w-[132px] place-items-center">
        <div className="absolute inset-0 rounded-full bg-[rgba(255,252,246,0.18)] backdrop-blur-sm" />
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 132 132" aria-hidden>
          <circle cx="66" cy="66" r={R} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="5" />
          <circle
            cx="66"
            cy="66"
            r={R}
            fill="none"
            stroke="white"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={`${sessionProgress * C} ${C}`}
          />
        </svg>
        <div className="relative text-center text-white [text-shadow:0_1px_4px_rgba(80,60,40,0.4)]" aria-live="polite">
          <motion.p key={phase} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="text-[14px] tracking-widest">
            ·· {phase === "inhale" ? "들숨" : "날숨"} ··
          </motion.p>
          <p className="text-[30px] font-bold leading-tight tabular-nums">{phaseSecondsLeft}초</p>
        </div>
      </div>

      <div className="flex w-full max-w-[280px] items-center justify-between">
        <button
          type="button"
          onClick={onStop}
          aria-label="호흡 종료"
          className="grid h-12 w-12 place-items-center rounded-full border border-white/50 bg-white/25 text-white backdrop-blur-md active:scale-90"
        >
          <X size={20} />
        </button>
        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          onClick={onToggle}
          aria-label={running ? "일시정지" : "다시 시작"}
          className="grid h-[62px] w-[62px] place-items-center rounded-full bg-[rgba(255,253,248,0.95)] text-sage-700 shadow-[0_10px_24px_-8px_rgba(60,50,30,0.45)]"
        >
          {running ? <Pause size={24} fill="currentColor" strokeWidth={0} /> : <Play size={24} fill="currentColor" strokeWidth={0} className="translate-x-0.5" />}
        </motion.button>
        <div className="grid h-12 min-w-12 place-items-center rounded-full border border-white/50 bg-white/25 px-2.5 text-[13px] tabular-nums text-white backdrop-blur-md">
          {mm}:{ss}
        </div>
      </div>
    </div>
  );
}
