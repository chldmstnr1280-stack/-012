"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { logEvent } from "@/lib/analytics/events";
import { bodyToday } from "@/lib/body/phase";
import { useAppData } from "@/lib/data-store";
import type { DateKey } from "@/lib/date";

/** In a mood record: a low mood (1–2) chosen in the PMS window → a gentle note and the 몸속 picture. */
export function PmsMoodNote({ date, mood }: { date: DateKey; mood: number | undefined }) {
  const data = useAppData();
  if (mood == null || mood > 2) return null;
  const body = bodyToday(data.periodDays, date);
  if (!body || body.phase !== "pms") return null;
  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mt-2 rounded-2xl bg-[#fdf1f3] px-3.5 py-2.5 text-left">
      <p className="break-keep text-[13px] font-bold text-[#8c3a47]">지금은 호르몬이 함께 내려가는 구간이에요</p>
      <Link href="/body" onClick={() => logEvent("body_link_from_mood")} className="mt-0.5 inline-block text-[12px] font-bold text-sage-700 underline underline-offset-2">
        오늘 몸속에서는 어떤지 보기 →
      </Link>
    </motion.div>
  );
}
