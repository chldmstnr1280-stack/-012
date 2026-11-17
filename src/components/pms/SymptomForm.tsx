"use client";

import { Fragment, useState } from "react";
import { Check, Trash2 } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { DropIcon, SproutLeafIcon } from "@/components/ui/icons";
import { IMPACT_ITEMS, SCORE_LABEL, SYMPTOM_GROUPS, type ImpactId, type Score, type SymptomId } from "@/data/pmsSymptoms";
import { deleteSymptoms, saveSymptoms, setPeriodDays, useAppData, type SymptomDay } from "@/lib/data-store";
import type { DateKey } from "@/lib/date";
import { useSelly } from "@/lib/selly-store";
import { HEAVY_DAY } from "@/data/safety";
import { HelpCard } from "./HelpCard";
import { ScoreRow } from "./ScoreRow";
import { ContextTagPicker } from "./ContextTagPicker";

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
    const hasAny = next.none || Object.keys(next.scores).length || Object.keys(next.impact).length || next.sleepHours != null || !!next.note;
    if (hasAny) saveSymptoms(date, next);
    else deleteSymptoms(date);
  };
  // sleep hours and the note travel with every write (they are separate from the symptoms)
  const extras = () => ({ ...(day?.sleepHours != null ? { sleepHours: day.sleepHours } : {}), ...(day?.note ? { note: day.note } : {}) });
  const base = (): Omit<SymptomDay, "updatedAt"> => ({ scores: { ...(day?.scores ?? {}) }, impact: { ...(day?.impact ?? {}) }, ...extras() });
  /** quick record: tap = "보통(2)", tap again = not recorded */
  const quick = (id: SymptomId) => {
    const next = base();
    if (next.scores[id] != null) delete next.scores[id];
    else next.scores[id] = 2;
    write(next);
  };
  const setSleep = (h: number | null) => {
    const next = { ...base(), none: day?.none };
    if (h == null || next.sleepHours === h) delete next.sleepHours;
    else next.sleepHours = h;
    write(next);
  };
  const setNote = (text: string) => {
    const t = text.trim().slice(0, 300);
    const next = { ...base(), none: day?.none };
    if (t) next.note = t;
    else delete next.note;
    if ((day?.note ?? "") !== t) write(next);
  };
  const [noteOpen, setNoteOpen] = useState(false);

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
  // gentle help card on a very hard day — shown under the section that triggered it, so nothing above the tapped row moves
  const heavyMood = !!day && HEAVY_DAY.symptoms.some((id) => day.scores[id] === HEAVY_DAY.score);
  const heavyImpact = !heavyMood && !!day && Object.values(day.impact).some((v) => v === HEAVY_DAY.impactScore);
  const helpLead = "오늘 많이 힘든 날이었네요. 혼자 견디기 어려운 마음이 들면, 지금 바로 이야기를 들어 줄 사람이 있어요.";

  return (
    <div className="flex flex-col gap-3">
      {/* status + quick actions */}
      <section className="glass rounded-[26px] p-4">
        <div className="flex min-h-[30px] items-center justify-between gap-2">
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
            onClick={() => write(day?.none ? { scores: {}, impact: {}, ...extras() } : { scores: {}, impact: {}, none: true, ...extras() })}
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

      {/* quick record: 10–20 seconds — tap what's there; everything else is optional */}
      <section className="glass rounded-[26px] p-4" aria-label="간편 기록">
        <div className="flex items-baseline justify-between">
          <p className="text-[14px] font-bold text-ink-700">간편 기록</p>
          <span className="text-[11px] text-ink-300">톡 = 보통 · 강도는 아래에서</span>
        </div>
        {SYMPTOM_GROUPS.map((g) => (
          <div key={g.id} className="mt-2">
            <p className="mb-1 text-[11.5px] text-ink-500">{g.label === "감정" ? "정서" : g.label}</p>
            <div className="flex flex-wrap gap-1.5">
              {g.items.map((it) => {
                const v = day?.scores[it.id as SymptomId];
                const on = v != null && v >= 1;
                return (
                  <button
                    key={it.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => quick(it.id as SymptomId)}
                    className={`min-h-10 rounded-full px-3 text-[12.5px] font-bold transition active:scale-95 ${on ? "bg-[#f3c6cd] text-[#8c3a47]" : "bg-white text-ink-700 shadow-[0_3px_10px_-7px_rgba(110,88,60,0.5)]"}`}
                  >
                    {it.label}
                    {on && <span className="ml-1 font-normal">{SCORE_LABEL[v as Score]}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        <div className="mt-3">
          <p className="mb-1 text-[11.5px] text-ink-500">어젯밤 잠 (선택)</p>
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="수면 시간">
            {[4, 5, 6, 7, 8, 9, 10].map((h) => (
              <button key={h} type="button" role="radio" aria-checked={day?.sleepHours === h} onClick={() => setSleep(h)} className={`h-9 min-w-11 rounded-full px-2.5 text-[12.5px] font-bold tabular-nums transition ${day?.sleepHours === h ? "bg-[#d9d2f0] text-[#4f4383]" : "bg-white text-ink-700 shadow-[0_3px_10px_-7px_rgba(110,88,60,0.5)]"}`}>
                {h === 4 ? "4시간↓" : h === 10 ? "10시간↑" : `${h}시간`}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3">
          {noteOpen || day?.note ? (
            <label className="block">
              <span className="mb-1 block text-[11.5px] text-ink-500">메모 (선택 · 이 기기에만 저장)</span>
              <textarea
                defaultValue={day?.note ?? ""}
                maxLength={300}
                rows={2}
                onBlur={(e) => setNote(e.target.value)}
                placeholder="오늘 몸과 마음에 대해 남기고 싶은 말"
                className="w-full resize-none rounded-2xl border border-[#eadfce] bg-white px-3 py-2 text-[13.5px] outline-none focus:border-sage-300"
              />
            </label>
          ) : (
            <button type="button" onClick={() => setNoteOpen(true)} className="text-[12px] text-ink-500 underline underline-offset-2">
              + 메모 남기기
            </button>
          )}
        </div>
      </section>

      {/* symptoms (detail: 0–4) */}
      {SYMPTOM_GROUPS.map((g, gi) => (
        <Fragment key={g.id}>
          <SectionCard icon={<SproutLeafIcon />} title={`${g.label} 증상`} aside={<ScaleHint />}>
            <ul className="flex flex-col gap-1.5">
              {g.items.map((it) => (
                <ScoreRow key={it.id} label={it.label} value={day?.scores[it.id as SymptomId]} onPick={(v) => setScore(it.id as SymptomId, v)} />
              ))}
            </ul>
          </SectionCard>
          {gi === 0 && heavyMood && <HelpCard lead={helpLead} />}
        </Fragment>
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
      {heavyImpact && <HelpCard lead={helpLead} />}

      <ContextTagPicker date={date} />

      <p className="px-2 text-center text-[11.5px] leading-relaxed text-ink-300">
        점수는 내가 느낀 정도를 적는 거예요. 진단이 아니에요.
        <br />
        기록은 이 기기에 저장돼요. 수면 시간과 메모는 서버 백업에도 보내지 않아요.
      </p>
    </div>
  );
}

function ScaleHint() {
  return <span className="text-[11px] tabular-nums text-ink-300">0 없음 · 4 매우 심함</span>;
}
