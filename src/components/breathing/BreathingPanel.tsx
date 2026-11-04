"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Volume2, VolumeX, Vibrate } from "lucide-react";
import { useSelly } from "@/lib/selly-store";
import { setPrefs, useAppData } from "@/lib/data-store";
import { DURATIONS, PATTERNS, patternById, rhythm, sessionMs, type BreathPattern, type PhaseKind } from "@/lib/breathing";
import { BreathingControls } from "./BreathingControls";
import { useBreathingSession, type PhaseState } from "./useBreathingSession";
import { buzz, canVibrate, chime, unlockAudio } from "./cues";

/** Breathing dock: pick a pattern & length, then run the session. */
export function BreathingPanel({
  onStop,
  onComplete,
  onPhase,
}: {
  onStop: () => void;
  onComplete: (minutes: number) => void;
  onPhase: (p: PhaseKind | "ready", running: boolean) => void;
}) {
  const { prefs } = useAppData();
  const [run, setRun] = useState<{ pattern: BreathPattern; minutes: number } | null>(null);

  const start = () => {
    if (prefs.sound) unlockAudio();
    setRun({ pattern: patternById(prefs.breathPattern), minutes: prefs.breathMinutes });
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      {run ? (
        <motion.div key="run" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
          <Running
            pattern={run.pattern}
            minutes={run.minutes}
            sound={prefs.sound}
            haptic={prefs.haptic}
            onStop={onStop}
            onComplete={() => onComplete(run.minutes)}
            onPhase={onPhase}
          />
        </motion.div>
      ) : (
        <motion.div key="ready" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
          <Ready onStart={start} onCancel={onStop} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Running({
  pattern,
  minutes,
  sound,
  haptic,
  onStop,
  onComplete,
  onPhase,
}: {
  pattern: BreathPattern;
  minutes: number;
  sound: boolean;
  haptic: boolean;
  onStop: () => void;
  onComplete: () => void;
  onPhase: (p: PhaseKind | "ready", running: boolean) => void;
}) {
  const { breath } = useSelly();
  const [total] = useState(() => sessionMs(pattern, minutes));
  const onCue = useCallback(
    (kind: PhaseKind) => {
      if (sound) chime(kind);
      if (haptic) buzz(kind);
    },
    [sound, haptic],
  );
  const s = useBreathingSession(breath, pattern, total, onComplete, onCue);
  usePhaseReport(s.phase, s.running, onPhase);

  return (
    <BreathingControls
      phase={s.phase}
      patternName={pattern.name}
      remainingMs={s.remainingMs}
      sessionProgress={s.sessionProgress}
      running={s.running}
      onToggle={s.toggle}
      onStop={onStop}
    />
  );
}

/** tell the parent (speech bubble) when the phase or pause state changes */
function usePhaseReport(phase: PhaseState, running: boolean, onPhase: (p: PhaseKind, running: boolean) => void) {
  const { index, kind } = phase;
  useEffect(() => {
    onPhase(kind, running);
  }, [index, kind, running, onPhase]);
}

function Ready({ onStart, onCancel }: { onStart: () => void; onCancel: () => void }) {
  const { prefs } = useAppData();
  const vibrate = canVibrate();
  return (
    <div className="mx-4 rounded-[28px] border border-white/70 bg-[rgba(253,250,243,0.9)] p-4 shadow-[0_14px_40px_-16px_rgba(60,45,25,0.6)] backdrop-blur-xl">
      <p className="mb-2 text-[13px] font-bold text-ink-700">호흡 패턴</p>
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="호흡 패턴">
        {PATTERNS.map((p) => {
          const on = p.id === prefs.breathPattern;
          return (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setPrefs({ breathPattern: p.id })}
              className={`rounded-2xl px-3 py-2.5 text-left transition ${on ? "bg-white shadow-[0_0_0_2px_#8faf91,0_6px_14px_-8px_rgba(90,130,85,0.6)]" : "bg-white/55"}`}
            >
              <span className="flex items-baseline justify-between gap-1">
                <span className="text-[13.5px] font-bold text-ink-700">{p.name}</span>
                <span className="text-[11px] tabular-nums text-sage-700">{rhythm(p)}</span>
              </span>
              <span className="block text-[11.5px] text-ink-500">{p.desc}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div className="flex flex-1 gap-1.5" role="radiogroup" aria-label="시간">
          {DURATIONS.map((m) => {
            const on = m === prefs.breathMinutes;
            return (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setPrefs({ breathMinutes: m })}
                className={`h-10 flex-1 rounded-full text-[13px] font-bold transition ${on ? "bg-sage-500 text-white" : "bg-white/60 text-ink-500"}`}
              >
                {m}분
              </button>
            );
          })}
        </div>
        <button
          type="button"
          aria-pressed={prefs.sound}
          aria-label={prefs.sound ? "소리 끄기" : "소리 켜기"}
          onClick={() => setPrefs({ sound: !prefs.sound })}
          className={`grid h-10 w-10 place-items-center rounded-full ${prefs.sound ? "bg-sage-50 text-sage-700" : "bg-white/60 text-ink-300"}`}
        >
          {prefs.sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
        {vibrate && (
          <button
            type="button"
            aria-pressed={prefs.haptic}
            aria-label={prefs.haptic ? "진동 끄기" : "진동 켜기"}
            onClick={() => setPrefs({ haptic: !prefs.haptic })}
            className={`grid h-10 w-10 place-items-center rounded-full ${prefs.haptic ? "bg-sage-50 text-sage-700" : "bg-white/60 text-ink-300"}`}
          >
            <Vibrate size={18} />
          </button>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <button type="button" onClick={onCancel} className="h-12 w-[84px] rounded-full bg-white/70 text-[14px] text-ink-500">
          닫기
        </button>
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={onStart}
          className="h-12 flex-1 rounded-full bg-gradient-to-b from-[#f4c9cc] to-[#e7a9ae] text-[15px] font-bold text-white shadow-[0_10px_24px_-10px_rgba(196,120,128,0.8)] [text-shadow:0_1px_2px_rgba(170,90,100,0.5)]"
        >
          시작하기
        </motion.button>
      </div>
    </div>
  );
}
