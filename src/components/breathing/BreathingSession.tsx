"use client";

import { useSelly } from "@/lib/selly-store";
import { BreathingControls } from "./BreathingControls";
import { useBreathingSession, type BreathPhase } from "./useBreathingSession";
import { useEffect } from "react";

/** Mounted for the duration of one 1-minute session. */
export function BreathingSession({
  onStop,
  onComplete,
  onPhase,
}: {
  onStop: () => void;
  onComplete: () => void;
  onPhase: (p: BreathPhase, running: boolean) => void;
}) {
  const { breath } = useSelly();
  const s = useBreathingSession(breath, onComplete);

  useEffect(() => {
    onPhase(s.phase, s.running);
  }, [s.phase, s.running, onPhase]);

  return (
    <BreathingControls
      phase={s.phase}
      phaseSecondsLeft={s.phaseSecondsLeft}
      remainingMs={s.remainingMs}
      sessionProgress={s.sessionProgress}
      running={s.running}
      onToggle={s.toggle}
      onStop={onStop}
    />
  );
}
