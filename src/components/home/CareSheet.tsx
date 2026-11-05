"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, Plus, X } from "lucide-react";
import type { SellyReaction } from "@/lib/selly-store";
import { addWater, useAppData } from "@/lib/data-store";
import { DEFAULT_WATER_GOAL } from "@/data/nutrition";
import { useToday } from "@/lib/date";
import { REWARDS } from "@/lib/growth";
import { HandHeartIcon, SunIcon, WateringCanIcon } from "@/components/ui/icons";

const actions: { type: "water" | "sun" | "pat"; label: string; icon: React.ReactNode; tint: string }[] = [
  { type: "water", label: "물 주기", icon: <WateringCanIcon size={34} />, tint: "from-[#eef6fa] to-[#dcecf3]" },
  { type: "sun", label: "햇빛 주기", icon: <SunIcon />, tint: "from-[#fff8e6] to-[#fcecc4]" },
  { type: "pat", label: "쓰다듬기", icon: <HandHeartIcon />, tint: "from-[#fff1f2] to-[#fbdde0]" },
];

/** Floating care panel that sits above the dock while Selly stays visible. */
export function CareSheet({ open, onClose, onCare, onDrink }: { open: boolean; onClose: () => void; onCare: (t: SellyReaction) => void; onDrink: (cups: number, goal: number) => void }) {
  const today = useToday();
  const { daily, water, prefs } = useAppData();
  const cups = (today && water[today]) || 0;
  const goal = prefs.waterGoal ?? DEFAULT_WATER_GOAL;
  const done = (today && daily[today]?.done) || {};
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-label="셀리 돌보기"
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="glass absolute inset-x-4 bottom-0 z-20 rounded-[30px] !bg-[rgba(253,250,243,0.95)] px-4 pb-4 pt-3"
        >
          <div className="mb-3 flex items-center justify-between pl-1">
            <p className="text-[15px] font-bold text-ink-700">셀리 돌보기</p>
            <button type="button" onClick={onClose} aria-label="닫기" className="grid h-9 w-9 place-items-center rounded-full bg-white/70 text-ink-500 active:scale-90">
              <X size={18} />
            </button>
          </div>
          {/* the user's own water — Selly waters her plants with every cup */}
          <div className="mb-2.5 flex items-center gap-3 rounded-[20px] border border-white bg-gradient-to-b from-[#eef6fa] to-[#dcecf3] px-3.5 py-2.5">
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-bold text-ink-700">나도 물 마시기 💧</span>
              <span className="mt-1 flex gap-[3px]" aria-label={`오늘 ${cups}컵, 목표 ${goal}컵`}>
                {Array.from({ length: goal }, (_, i) => (
                  <span key={i} className={`h-2 flex-1 rounded-full ${i < cups ? "bg-[#7fb6d0]" : "bg-white/80"}`} />
                ))}
              </span>
            </span>
            <span className="text-[13px] font-bold tabular-nums text-[#3f7590]">
              {cups}/{goal}
            </span>
            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              aria-label="물 한 컵 마셨어요"
              onClick={() => today && onDrink(addWater(today, 1), goal)}
              className="flex h-10 items-center gap-1 rounded-full bg-white px-3 text-[13px] font-bold text-[#3f7590] shadow-sm"
            >
              <Plus size={15} /> 1컵
            </motion.button>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {actions.map((a) => (
              <motion.button
                key={a.type}
                type="button"
                whileTap={{ scale: 0.93 }}
                onClick={() => onCare(a.type)}
                className={`relative flex h-[86px] flex-col items-center justify-center gap-1.5 rounded-[22px] border border-white bg-gradient-to-b ${a.tint} text-[13px] font-bold text-ink-700 shadow-[0_6px_16px_-8px_rgba(110,88,60,0.35)]`}
              >
                <span className="absolute right-2 top-2">
                  {done[a.type] ? (
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-sage-500 text-white" aria-label="오늘 완료">
                      <Check size={12} strokeWidth={3} />
                    </span>
                  ) : (
                    <span className="rounded-full bg-white/85 px-1.5 py-0.5 text-[10px] font-bold text-sage-700">+{REWARDS[a.type]}</span>
                  )}
                </span>
                {a.icon}
                {a.label}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
