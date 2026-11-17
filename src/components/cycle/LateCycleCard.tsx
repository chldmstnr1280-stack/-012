"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
import { LATE_CARDS, LATE_LINES, LATE_SOURCES, type InfoCard } from "@/data/lateCycle";
import type { CycleInfo } from "@/lib/cycle";
import { setData, setPeriodDays, useAppData } from "@/lib/data-store";
import { addDays, formatMonthDay, formatShort, type DateKey } from "@/lib/date";
import { answerFor, daysSinceLastStart, type LateAnswer } from "@/lib/pms/late";
import { openExternal } from "@/lib/platform";
import { playSfx } from "@/lib/sound/sfx";

/**
 * 생리 지연 돌봄 — shown in the calendar once the expected start has passed with
 * no new period logged. First it asks (maybe it just wasn't logged); it never
 * concludes the period is late, and pregnancy information appears only when the
 * user opens that card herself. Calm wording, no warning colours.
 */
export function LateCycleCard({ info, today }: { info: CycleInfo; today: DateKey }) {
  const data = useAppData();
  const [picking, setPicking] = useState(false);
  const expected = info.expectedStart;
  if (!expected || info.overdue <= 0) return null;
  const answer = answerFor(data.lateChecks ?? [], expected, today);
  const since = daysSinceLastStart(data.periodDays, today);

  const answerWith = (a: LateAnswer) => {
    playSfx("tap");
    setData((d) => ({ ...d, lateChecks: [...(d.lateChecks ?? []), { expected, answer: a, at: Date.now() }].slice(-60) }));
  };
  const startedOn = (day: DateKey) => {
    playSfx("cheer");
    answerWith("started");
    setPeriodDays([day], true);
    setPicking(false);
  };

  // "나중에 기록할게요" — a single quiet line for the rest of today
  if (answer === "later") {
    return (
      <button type="button" onClick={() => setData((d) => ({ ...d, lateChecks: (d.lateChecks ?? []).filter((c) => !(c.expected === expected && c.answer === "later")) }))} className="glass flex items-center justify-between rounded-[20px] px-4 py-3 text-left text-[12.5px] text-ink-500">
        <span>예상 시작일({formatMonthDay(expected)})이 지났어요 · 생리 시작 기록하기</span>
        <ChevronRight size={16} />
      </button>
    );
  }

  return (
    <section className="glass rounded-[26px] p-5" aria-label="예상 시작일이 지났어요">
      <p className="text-[15.5px] font-bold text-ink-700">{LATE_LINES.title}</p>
      <p className="mt-1 break-keep text-[13px] leading-relaxed text-ink-500">
        {LATE_LINES.body} <span className="tabular-nums">(예상 {formatMonthDay(expected)} · {info.overdue}일 지남)</span>
      </p>

      {answer !== "not_yet" && (
        <>
          <p className="mt-3 break-keep text-[13px] text-ink-700">{LATE_LINES.ask}</p>
          {picking ? (
            <div className="mt-2">
              <p className="mb-1.5 text-[12px] text-ink-500">언제 시작했어요?</p>
              <div className="flex flex-wrap gap-1.5">
                {Array.from({ length: Math.min(10, info.overdue + 4) }, (_, i) => addDays(today, -i)).map((d, i) => (
                  <button key={d} type="button" onClick={() => startedOn(d)} className="h-10 rounded-full bg-white px-3 text-[12.5px] font-bold text-ink-700 shadow-[0_3px_10px_-7px_rgba(110,88,60,0.5)] active:scale-95">
                    {i === 0 ? "오늘" : i === 1 ? "어제" : formatShort(d).replace(/\s*\(.+\)$/, "")}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[11px] text-ink-500">그 전이라면 달력에서 그날을 눌러 표시해 주세요.</p>
            </div>
          ) : (
            <div className="mt-2 grid gap-2">
              <button type="button" onClick={() => setPicking(true)} className="h-11 rounded-2xl bg-[#f7d9de] text-[13.5px] font-bold text-[#9c3f4d] active:scale-95">
                생리가 시작됐어요
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => answerWith("not_yet")} className="h-11 rounded-2xl bg-white text-[13px] font-bold text-ink-700 shadow-[0_3px_10px_-7px_rgba(110,88,60,0.5)] active:scale-95">
                  아직 시작되지 않았어요
                </button>
                <button type="button" onClick={() => answerWith("later")} className="h-11 rounded-2xl bg-white/70 text-[13px] text-ink-500 active:scale-95">
                  나중에 기록할게요
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {answer === "not_yet" && (
        <>
          <p className="mt-3 break-keep text-[13.5px] leading-relaxed text-ink-700">{LATE_LINES.notYet}</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Link href="/checkin" className="grid h-11 place-items-center rounded-2xl bg-white text-[13px] font-bold text-ink-700 shadow-[0_3px_10px_-7px_rgba(110,88,60,0.5)]">
              🌦️ 몸의 날씨 살펴보기
            </Link>
            <Link href="/record?tab=pms" className="grid h-11 place-items-center rounded-2xl bg-white text-[13px] font-bold text-ink-700 shadow-[0_3px_10px_-7px_rgba(110,88,60,0.5)]">
              📝 오늘 증상 기록
            </Link>
          </div>
          {since != null && since >= 90 && (
            <p className="mt-3 rounded-2xl bg-[#fbf6ee] px-3 py-2.5 text-[12.5px] leading-relaxed text-ink-700">
              마지막 생리 기록이 {since}일 전이에요. 기록을 놓친 게 아니라면, 생리를 3번 연속 건너뛴 경우에는 진료를 받아 보라고 안내해요.
            </p>
          )}
          <button type="button" onClick={() => setData((d) => ({ ...d, lateChecks: (d.lateChecks ?? []).filter((c) => c.expected !== expected) }))} className="mt-2 text-[12px] text-ink-500 underline underline-offset-2">
            생리가 시작됐다면 여기서 기록하기
          </button>
        </>
      )}

      {/* information the user opens herself */}
      <div className="mt-4">
        <p className="mb-1.5 text-[12px] font-bold text-ink-500">필요한 정보만 골라서 볼 수 있어요</p>
        <div className="grid gap-1.5">
          {LATE_CARDS.map((c) => (
            <InfoCardView key={c.id} card={c} />
          ))}
        </div>
        <Link href="/pms/care?from=late" className="mt-2 flex items-center justify-between rounded-2xl bg-sage-50 px-3.5 py-2.5 text-[13px] font-bold text-sage-700">
          <span>지금 나를 돌보는 방법 고르기</span>
          <ChevronRight size={16} />
        </Link>
      </div>
      <p className="mt-2 text-[10.5px] leading-relaxed text-ink-300">예상일은 지난 기록으로 계산한 추정이에요. 디어셀리는 의료 서비스가 아니어서 늦어진 이유를 판단하지 않아요.</p>
    </section>
  );
}

function InfoCardView({ card }: { card: InfoCard }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl bg-white/80">
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="flex min-h-11 w-full items-center gap-2 px-3.5 py-2 text-left text-[13px] font-bold text-ink-700">
        <span className="flex-1">{card.title}</span>
        <ChevronDown size={16} className={`shrink-0 text-ink-300 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-3.5 pb-3 text-[12.5px] leading-relaxed text-ink-700">
          {card.lead && <p className="mb-1.5 break-keep text-ink-500">{card.lead}</p>}
          <ul className="list-disc space-y-1 pl-4 break-keep">
            {card.points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          {card.urgent && (
            <div className="mt-2.5 rounded-xl border border-[#f0d9c8] bg-[#fffaf3] px-3 py-2.5">
              <p className="font-bold">{card.urgent.title}</p>
              <ul className="mt-1 list-disc pl-4">
                {card.urgent.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
              <p className="mt-1.5 break-keep">{card.urgent.after}</p>
              <button type="button" onClick={() => void openExternal("tel:119")} className="mt-1.5 rounded-full bg-white px-3 py-1.5 text-[12px] font-bold text-[#9c3f4d] shadow-sm">
                119에 전화하기
              </button>
            </div>
          )}
          {card.action && (
            <Link href={card.action.href} className="mt-2 inline-flex items-center gap-1 rounded-full bg-sage-50 px-3 py-1.5 text-[12px] font-bold text-sage-700">
              {card.action.label} <ChevronRight size={14} />
            </Link>
          )}
          {card.sources.length > 0 && (
            <details className="mt-2 text-[10.5px] text-ink-300">
              <summary>출처 · ⚠️ 전문가 검토 전</summary>
              <ul className="mt-1 space-y-1">
                {card.sources.map((s, i) => {
                  const src = LATE_SOURCES[s.id];
                  return (
                    <li key={i}>
                      {src.org} · “{src.title}” ({src.url}) · 검토 {src.sourceReviewed} · 열람 {src.accessed}
                      <span className="mt-0.5 block italic">{s.quote}</span>
                    </li>
                  );
                })}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
