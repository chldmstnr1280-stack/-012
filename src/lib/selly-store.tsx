"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { motionValue, type MotionValue } from "motion/react";

export type SellyReaction = "touch" | "greet" | "water" | "sun" | "pat" | "cheer";

export interface ReactionEvent {
  id: number;
  type: SellyReaction;
}

interface SellyState {
  level: number;
  exp: number;
  expMax: number;
  addExp: (amount: number) => void;
  reaction: ReactionEvent | null;
  react: (type: SellyReaction) => void;
  /** 0 = fully exhaled, 1 = fully inhaled. Written by the breathing session every frame. */
  breath: MotionValue<number>;
  immersive: boolean;
  setImmersive: (v: boolean) => void;
  toast: { id: number; text: string } | null;
  showToast: (text: string) => void;
}

const SellyContext = createContext<SellyState | null>(null);

const EXP_PER_LEVEL = 500;

export function SellyProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState({ level: 7, exp: 322 });
  const [reaction, setReaction] = useState<ReactionEvent | null>(null);
  const [immersive, setImmersive] = useState(false);
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const [breath] = useState(() => motionValue(0));
  const counter = useRef(0);

  const addExp = useCallback((amount: number) => {
    setProgress((p) => {
      let exp = p.exp + amount;
      let level = p.level;
      while (exp >= EXP_PER_LEVEL) {
        exp -= EXP_PER_LEVEL;
        level += 1;
      }
      return { level, exp };
    });
  }, []);

  const react = useCallback((type: SellyReaction) => {
    counter.current += 1;
    setReaction({ id: counter.current, type });
  }, []);

  const showToast = useCallback((text: string) => {
    counter.current += 1;
    setToast({ id: counter.current, text });
  }, []);

  const value = useMemo<SellyState>(
    () => ({
      level: progress.level,
      exp: progress.exp,
      expMax: EXP_PER_LEVEL,
      addExp,
      reaction,
      react,
      breath,
      immersive,
      setImmersive,
      toast,
      showToast,
    }),
    [progress, addExp, reaction, react, breath, immersive, toast, showToast],
  );

  return <SellyContext.Provider value={value}>{children}</SellyContext.Provider>;
}

export function useSelly() {
  const ctx = useContext(SellyContext);
  if (!ctx) throw new Error("useSelly must be used inside <SellyProvider>");
  return ctx;
}
