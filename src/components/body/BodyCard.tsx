"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { logEvent } from "@/lib/analytics/events";
import { bodyToday, PHASE_COPY } from "@/lib/body/phase";
import { useAppData } from "@/lib/data-store";
import { useToday } from "@/lib/date";
import { playSfx } from "@/lib/sound/sfx";

/** 홈 상단: 오늘 몸속에서는 — a small picture, "주기 N일차 · 단계 · 추정" and one line. */
export function BodyCard() {
  const today = useToday();
  const data = useAppData();
  const body = useMemo(() => (today ? bodyToday(data.periodDays, today) : null), [data.periodDays, today]);

  useEffect(() => {
    if (body) logEvent("body_card_view", { oncePerDay: true });
  }, [body]);

  if (!today) return null;
  if (!body)
    return (
      <Link href="/calendar" className="glass pointer-events-auto flex max-w-[250px] items-center gap-2 rounded-[18px] px-3 py-2 text-left active:scale-95">
        <span className="text-[18px]" aria-hidden>
          🌸
        </span>
        <span className="text-[11.5px] leading-snug text-ink-700">생리 시작일을 기록하면 몸속 변화를 볼 수 있어요</span>
      </Link>
    );
  const c = PHASE_COPY[body.phase];
  return (
    <Link
      href="/body"
      onClick={() => {
        playSfx("tap");
        logEvent("body_card_tap");
      }}
      aria-label={`오늘 몸속에서는: 주기 ${body.day}일차, ${c.name}, 추정. ${c.headline}`}
      className="glass pointer-events-auto flex max-w-[260px] items-center gap-2 rounded-[18px] py-1.5 pl-1.5 pr-3 text-left active:scale-95"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={c.img} alt="" className="h-11 w-11 shrink-0 rounded-[14px] bg-white object-cover" />
      <span className="min-w-0">
        <span className="block text-[11px] font-bold text-[#b9727b]">
          주기 {body.day}일차 · {c.name} · 추정
        </span>
        <span className="block truncate text-[12px] text-ink-700">{c.headline}</span>
      </span>
    </Link>
  );
}
