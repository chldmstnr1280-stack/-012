"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { motionValue, type MotionValue } from "motion/react";
import { claimDailyBonus, claimTouchExp, getData, markDaily, setProgress, useAppData, type DailyTask } from "./data-store";
import { EXP_PER_LEVEL, REWARDS, stageFor, type Stage } from "./growth";
import { toKey } from "./date";

export type SellyReaction = "touch" | "greet" | "water" | "sun" | "pat" | "cheer";

export interface ReactionEvent {
  id: number;
  type: SellyReaction;
}

export interface LevelUpEvent {
  id: number;
  level: number;
  stage: Stage;
  stageChanged: boolean;
}

export interface GrantResult {
  /** growth granted for the task itself (0 when it was already done today) */
  exp: number;
  /** the all-tasks daily bonus was unlocked by this action */
  bonus: boolean;
}

interface SellyState {
  level: number;
  exp: number;
  expMax: number;
  stage: Stage;
  addExp: (amount: number) => void;
  /** Complete a daily task: grants growth once per day + the all-done bonus. */
  completeTask: (task: DailyTask) => GrantResult;
  /** Touch growth, capped per day. Returns the amount granted. */
  touchExp: () => number;
  levelUp: LevelUpEvent | null;
  dismissLevelUp: () => void;
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

export function SellyProvider({ children }: { children: React.ReactNode }) {
  const { progress } = useAppData();
  const [reaction, setReaction] = useState<ReactionEvent | null>(null);
  const [immersive, setImmersive] = useState(false);
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const [levelUp, setLevelUp] = useState<LevelUpEvent | null>(null);
  const [breath] = useState(() => motionValue(0));
  const counter = useRef(0);

  const showToast = useCallback((text: string) => {
    counter.current += 1;
    setToast({ id: counter.current, text });
  }, []);

  const addExp = useCallback((amount: number) => {
    if (amount <= 0) return;
    const p = getData().progress;
    let exp = p.exp + amount;
    let level = p.level;
    while (exp >= EXP_PER_LEVEL) {
      exp -= EXP_PER_LEVEL;
      level += 1;
    }
    setProgress({ level, exp });
    if (level > p.level) {
      const stage = stageFor(level);
      counter.current += 1;
      setLevelUp({ id: counter.current, level, stage, stageChanged: stage.id !== stageFor(p.level).id });
    }
  }, []);

  const completeTask = useCallback(
    (task: DailyTask): GrantResult => {
      const today = toKey(new Date());
      const fresh = markDaily(today, task);
      const exp = fresh ? REWARDS[task] : 0;
      addExp(exp);
      const bonus = fresh && claimDailyBonus(today);
      if (bonus) {
        addExp(REWARDS.bonus);
        // let the task's own toast show first
        setTimeout(() => showToast(`오늘의 돌봄을 모두 마쳤어요 · 성장 +${REWARDS.bonus}`), 2400);
      }
      return { exp, bonus };
    },
    [addExp, showToast],
  );

  const touchExp = useCallback(() => {
    const n = claimTouchExp(toKey(new Date()));
    addExp(n);
    return n;
  }, [addExp]);

  const react = useCallback((type: SellyReaction) => {
    counter.current += 1;
    setReaction({ id: counter.current, type });
  }, []);

  const dismissLevelUp = useCallback(() => setLevelUp(null), []);

  const value = useMemo<SellyState>(
    () => ({
      level: progress.level,
      exp: progress.exp,
      expMax: EXP_PER_LEVEL,
      stage: stageFor(progress.level),
      addExp,
      completeTask,
      touchExp,
      levelUp,
      dismissLevelUp,
      reaction,
      react,
      breath,
      immersive,
      setImmersive,
      toast,
      showToast,
    }),
    [progress, addExp, completeTask, touchExp, levelUp, dismissLevelUp, reaction, react, breath, immersive, toast, showToast],
  );

  return <SellyContext.Provider value={value}>{children}</SellyContext.Provider>;
}

export function useSelly() {
  const ctx = useContext(SellyContext);
  if (!ctx) throw new Error("useSelly must be used inside <SellyProvider>");
  return ctx;
}
