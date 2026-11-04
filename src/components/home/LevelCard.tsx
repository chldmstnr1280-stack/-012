"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useSelly } from "@/lib/selly-store";
import { DAILY_TASKS, useAppData } from "@/lib/data-store";
import { useToday } from "@/lib/date";
import { LeafBadgeIcon, SproutBadgeIcon } from "@/components/ui/icons";

export function LevelCard() {
  const { level, exp, expMax, stage } = useSelly();
  const pct = Math.min(100, (exp / expMax) * 100);
  const today = useToday();
  const { daily } = useAppData();
  const careDone = today ? DAILY_TASKS.filter((t) => daily[today]?.done[t]).length : 0;
  const carePct = (careDone / DAILY_TASKS.length) * 100;
  return (
    <div className="flex items-center justify-between px-4">
      <Link href="/growth" aria-label={`셀리의 성장: Lv. ${level} ${stage.name}`} className="glass flex w-[204px] items-center gap-3 rounded-[24px] py-2.5 pl-2.5 pr-4 transition active:scale-[0.98]">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-b from-[#f3f8ee] to-sage-50 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.9),0_2px_6px_rgba(110,140,90,0.25)]">
          <LeafBadgeIcon />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[15px] font-bold tracking-tight text-ink-700">
              Lv. {level} <span className="text-[12.5px] font-normal text-ink-500">{stage.name}</span>
            </span>
            <span className="text-[11px] tabular-nums text-ink-500">
              {exp} / {expMax}
            </span>
          </div>
          <div className="mt-1.5 h-[7px] overflow-hidden rounded-full bg-[#ebe4d6] shadow-[inset_0_1px_2px_rgba(120,100,70,0.2)]">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[#a8cb97] to-[#79a674]"
              initial={false}
              animate={{ width: `${pct}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
            />
          </div>
        </div>
      </Link>

      <Link href="/growth" aria-label={`오늘의 돌봄 ${careDone}/${DAILY_TASKS.length}`} className="glass relative grid h-[54px] w-[54px] place-items-center rounded-full transition active:scale-95">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 54 54" aria-hidden>
          <circle cx="27" cy="27" r="24.5" fill="none" stroke="rgba(143,175,145,0.25)" strokeWidth="2.5" />
          <circle
            cx="27"
            cy="27"
            r="24.5"
            fill="none"
            stroke="#8faf91"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={`${(carePct / 100) * 154} 154`}
            style={{ transition: "stroke-dasharray 0.6s ease" }}
          />
        </svg>
        <SproutBadgeIcon />
      </Link>
    </div>
  );
}
