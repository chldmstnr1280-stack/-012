"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Check, Trash2 } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { DropIcon, SproutLeafIcon } from "@/components/ui/icons";
import { IMPACT_ITEMS, SCORE_LABEL, SYMPTOM_GROUPS, type ImpactId, type Score, type SymptomId } from "@/data/pmsSymptoms";
import { deleteSymptoms, saveSymptoms, setPeriodDays, useAppData, type SymptomDay } from "@/lib/data-store";
import type { DateKey } from "@/lib/date";
import { useSelly } from "@/lib/selly-store";

/**
 * PMS daily record — built to take under 30 seconds:
 * one tap per symptom (0–4), saved on every tap. Tapping the chosen score again
 * clears it (back to "not recorded"). A day without any entry is "not recorded",
 * which is different from the explicit "오늘은 증상이 없어요".
 */
export function SymptomForm({ date, isFuture }: { date: DateKey; isFuture: boolean }) {
  const data = useAppData();
  const { showToast } = useSelly();
  const day = data.symptoms[date];
  const isPeriod = data.periodDays.includes(date);
  const [openImpact, setOpenImpact] = useState(true);

  const write = (next: Omit<SymptomDay, "updatedAt">) => {
    const hasAny = next.none || Object.keys(next.scores).length || Object.keys(next.impact).length;
    if (hasAny) saveSymptoms(date, next);
    else deleteSymptoms(date);
  };
  const base = (): Omit<SymptomDay, "updatedAt"> => ({ scores: { ...(day?.scores ?? {}) }, impact: { ...(day?.impact ?? {}) } });

  const setScore = (id: SymptomId, v: Score) => {
    const next = base();
    if (next.scores[id] === v) delete next.scores[id];
    else next.scores[id] = v;
    write(next); // rating anything drops the "no symptoms" flag
  };
  const setImpact = (id: ImpactId, v: Score) => {
    const next = { ...base(), none: day?.none };
    if (next.impact[id] === v) delete next.impact[id];
    else next.impact[id] = v;
    write(next);
  };

  if (isFuture) return <p className="glass rounded-[22px] p-5 text-center text-[13px] text-ink-500">아직 오지 않은 날이에요.</p>;

  const rated = Object.values(day?.scores ?? {}).filter((v) => v != null).length;

  return (
    <div className="flex flex-col gap-3">
      {/* status + quick actions */}
      <section className="glass rounded-[26px] p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[13px] text-ink-500" aria-live="polite">
            {day ? (day.none ? "‘증상 없음’으로 기록했어요" : `증상 ${rated}개 기록 · 자동 저장`) : "아직 기록하지 않은 날이에요"}
          </p>
          {day && (
            <button
              type="button"
              onClick={() => {
                deleteSymptoms(date);
                showToast("이날 증상 기록을 지웠어요");
              }}
              className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[12px] text-ink-300 active:bg-[#f3ece2]"
            >
              <Trash2 size={13} /> 지우기
            </button>
          )}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            aria-pressed={!!day?.none}
            onClick={() => write(day?.none ? { scores: {}, impact: {} } : { scores: {}, impact: {}, none: true })}
            className={`flex h-12 items-center justify-center gap-1.5 rounded-2xl text-[13.5px] font-bold transition ${
              day?.none ? "bg-sage-500 text-white" : "bg-white text-sage-700 shadow-[0_4px_12px_-8px_rgba(110,88,60,0.4)]"
            }`}
          >
            {day?.none && <Check size={15} strokeWidth={3} />}
            오늘은 증상이 없어요
          </button>
          <button
            type="button"
            role="switch"
            aria-checked={isPeriod}
            onClick={() => setPeriodDays([date], !isPeriod)}
            className={`flex h-12 items-center justify-center gap-1.5 rounded-2xl text-[13.5px] font-bold transition ${
              isPeriod ? "bg-[#f7c9cf] text-[#9c3f4d]" : "bg-white text-ink-500 shadow-[0_4px_12px_-8px_rgba(110,88,60,0.4)]"
            }`}
          >
            <DropIcon size={18} />
            {isPeriod ? "생리 중" : "생리 중이에요"}
          </button>
        </div>
      </section>

      {/* symptoms */}
      {SYMPTOM_GROUPS.map((g) => (
        <SectionCard key={g.id} icon={<SproutLeafIcon />} title={`${g.label} 증상`} aside={<ScaleHint />}>
          <ul className="flex flex-col gap-1.5">
            {g.items.map((it) => (
              <ScoreRow key={it.id} label={it.label} value={day?.scores[it.id as SymptomId]} onPick={(v) => setScore(it.id as SymptomId, v)} />
            ))}
          </ul>
        </SectionCard>
      ))}

      {/* functional impact */}
      <SectionCard
        icon={<SproutLeafIcon />}
        title="일상생활에 준 영향"
        aside={
          <button type="button" onClick={() => setOpenImpact((o) => !o)} className="text-[11.5px] text-ink-300 underline underline-offset-2">
            {openImpact ? "접기" : "펼치기"}
          </button>
        }
      >
        {openImpact && (
          <ul className="flex flex-col gap-1.5">
            {IMPACT_ITEMS.map((it) => (
              <ScoreRow key={it.id} label={it.label} value={day?.impact[it.id]} onPick={(v) => setImpact(it.id, v)} />
            ))}
          </ul>
        )}
        <p className="mt-2 text-[11px] text-ink-300">증상이 오늘의 생활을 얼마나 어렵게 했는지 0(전혀)~4(매우 많이)로 골라 주세요.</p>
      </SectionCard>

      <p className="px-2 text-center text-[11.5px] leading-relaxed text-ink-300">
        점수는 내가 느낀 정도를 적는 거예요. 진단이 아니에요.
        <br />
        기록은 이 기기에 저장돼요.
      </p>
    </div>
  );
}

function ScaleHint() {
  return <span className="text-[11px] tabular-nums text-ink-300">0 없음 · 4 매우 심함</span>;
}

/** One symptom: five one-tap buttons. The chosen score's word shows for clarity (not colour alone). */
function ScoreRow({ label, value, onPick }: { label: string; value: Score | undefined; onPick: (v: Score) => void }) {
  return (
    <li className="flex items-center gap-2 rounded-2xl bg-white/60 py-1.5 pl-3 pr-1.5">
      <span className="min-w-0 flex-1">
        <span className="block break-keep text-[14px] leading-tight text-ink-700">{label}</span>
        <span className="block h-4 text-[11px] text-ink-500">{value != null ? SCORE_LABEL[value] : ""}</span>
      </span>
      <span className="flex shrink-0 gap-1" role="radiogroup" aria-label={`${label} 정도`}>
        {([0, 1, 2, 3, 4] as Score[]).map((v) => {
          const on = value === v;
          return (
            <motion.button
              key={v}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={`${label} ${SCORE_LABEL[v]}`}
              whileTap={{ scale: 0.88 }}
              onClick={() => onPick(v)}
              className={`grid h-9 w-9 place-items-center rounded-xl text-[13px] font-bold tabular-nums transition-colors ${
                on ? (v === 0 ? "bg-[#cfdccb] text-sage-700" : SCORE_ON[v]) : "bg-[#f1ece3] text-ink-300"
              }`}
            >
              {v}
            </motion.button>
          );
        })}
      </span>
    </li>
  );
}

// increasing warmth with the score; the number itself is always shown
const SCORE_ON: Record<Score, string> = {
  0: "",
  1: "bg-[#f6e3b4] text-[#7a5a14]",
  2: "bg-[#f3c79a] text-[#7a3f12]",
  3: "bg-[#e9a092] text-white",
  4: "bg-[#c9707a] text-white",
};
