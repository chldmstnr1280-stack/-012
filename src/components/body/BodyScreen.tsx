"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SubPage } from "@/components/screens/SubPage";
import { BodyScene } from "./BodyScene";
import { BODY_NOTICE, PHASE_COPY, PHASE_ORDER, bodyToday, type BodyPhase } from "@/lib/body/phase";
import { useAppData } from "@/lib/data-store";
import { useToday } from "@/lib/date";
import { playSfx } from "@/lib/sound/sfx";

const ROWS = [
  { key: "ovary", icon: "🥚", label: "난소" },
  { key: "lining", icon: "🌸", label: "자궁내막" },
  { key: "hormone", icon: "🧪", label: "호르몬" },
  { key: "temp", icon: "🌡️", label: "체온" },
] as const;

/** 오늘 몸속에서는 — the big picture for today, four lines, a feeling it may bring, and the notice. */
export function BodyScreen() {
  const today = useToday();
  const data = useAppData();
  const body = useMemo(() => (today ? bodyToday(data.periodDays, today) : null), [data.periodDays, today]);
  const [preview, setPreview] = useState<BodyPhase | null>(null);
  if (!today) return <SubPage title="오늘 몸속에서는">{null}</SubPage>;

  if (!body)
    return (
      <SubPage title="오늘 몸속에서는">
        <section className="glass rounded-[26px] px-5 py-8 text-center">
          <p className="text-[34px]" aria-hidden>
            🌸
          </p>
          <p className="mt-2 break-keep text-[15px] font-bold text-ink-700">생리 시작일을 기록하면 몸속 변화를 볼 수 있어요</p>
          <Link href="/calendar" className="mt-4 inline-block rounded-full bg-sage-50 px-4 py-2 text-[13px] font-bold text-sage-700">
            캘린더에서 기록하기
          </Link>
        </section>
      </SubPage>
    );

  const phase = preview ?? body.phase;
  const c = PHASE_COPY[phase];
  return (
    <SubPage title="오늘 몸속에서는">
      <div className="flex flex-col gap-3 pb-2">
        <section className="glass overflow-hidden rounded-[26px] bg-white/80 p-3">
          <BodyScene phase={phase} className="mx-auto w-full max-w-[340px]" />
          <p className="mt-1 text-center text-[12px] font-bold text-[#b9727b]">
            {preview ? `미리 보기 · ${c.name}` : `주기 ${body.day}일차 · ${c.name} · 추정`}
          </p>
          <h2 className="mt-1 break-keep px-2 text-center text-[17px] font-bold leading-snug text-ink-700">{c.headline}</h2>
          {body.late && !preview && <p className="mt-1 text-center text-[11.5px] text-ink-500">예상했던 시작일이 지났어요. 생리가 시작됐다면 기록해 주세요.</p>}
        </section>

        {/* where today sits in the cycle; tap a step to look at it */}
        <div className="flex items-center justify-between gap-1 px-1" role="radiogroup" aria-label="주기 단계 미리 보기">
          {PHASE_ORDER.map((p) => {
            const isToday = p === body.phase;
            const on = p === phase;
            return (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => {
                  playSfx("tap");
                  setPreview(p === body.phase ? null : p);
                }}
                className={`flex min-h-11 flex-1 flex-col items-center justify-center rounded-2xl px-1 text-[11px] font-bold ${on ? "bg-[#f3c6cd] text-[#8c3a47]" : "bg-white/80 text-ink-500"}`}
              >
                {PHASE_COPY[p].name.replace(" 구간", "")}
                {isToday && <span className="text-[9.5px] font-normal">오늘</span>}
              </button>
            );
          })}
        </div>

        <section className="glass rounded-[24px] px-4 py-3" aria-label="몸속 변화">
          <ul className="flex flex-col gap-2.5">
            {ROWS.map((r) => (
              <li key={r.key} className="flex gap-2.5">
                <span className="mt-0.5 text-[18px]" aria-hidden>
                  {r.icon}
                </span>
                <span className="min-w-0">
                  <span className="block text-[11.5px] font-bold text-ink-500">{r.label}</span>
                  <span className="block break-keep text-[13.5px] leading-snug text-ink-700">{c[r.key]}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-[24px] bg-[#fdf1f3] px-4 py-3" aria-label="오늘 이런 기분일 수 있어요">
          <p className="text-[12px] font-bold text-[#b9727b]">오늘 이런 기분일 수 있어요</p>
          <p className="mt-1 break-keep text-[13.5px] leading-relaxed text-ink-700">{c.mood}</p>
        </section>

        <p className="sticky bottom-0 rounded-2xl bg-cream-50/95 px-3 py-2.5 text-center text-[10.5px] leading-relaxed text-ink-500 backdrop-blur">
          {BODY_NOTICE}
          {body.defaultLength && " 아직 주기 길이 기록이 없어 28일 주기로 계산했어요."} ⚠️ 전문가 검토 전
        </p>
      </div>
    </SubPage>
  );
}
