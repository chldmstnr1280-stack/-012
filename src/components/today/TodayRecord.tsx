"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Check, ChevronRight } from "lucide-react";
import { SubPage } from "@/components/screens/SubPage";
import { PmsMoodNote } from "@/components/body/PmsMoodNote";
import { MoodFace, MOODS } from "@/components/ui/MoodFace";
import { DRSP_AREA_OF } from "@/data/drspAreas";
import { FLOW_AMOUNTS, FLOW_SIGNS, SCORE_LABEL, SYMPTOM_LABEL, type Score } from "@/data/pmsSymptoms";
import { useAppData, type ConditionKey, type Level5 } from "@/lib/data-store";
import { formatShort, useToday } from "@/lib/date";
import { useSelly } from "@/lib/selly-store";
import { playSfx } from "@/lib/sound/sfx";
import { cycleSymptom, fullSymptomSet, recordedToday, setCondition, setDailyImpact, setFlow, setMood, setNoSymptoms, setOnPeriod, symptomsToShow } from "@/lib/today/quickRecord";

const BODY_ROWS: { key: ConditionKey; label: string; low: string; high: string }[] = [
  { key: "sleep", label: "어젯밤 잠", low: "거의 못 잤어", high: "푹 잤어" },
  { key: "stress", label: "스트레스", low: "거의 없어", high: "아주 많아" },
  { key: "energy", label: "기운", low: "지쳤어", high: "활기차" },
];
const IMPACT = ["전혀", "조금", "꽤", "많이", "아주 많이"];

/**
 * 오늘 기록 (30초) — one screen, saved on every tap: period · mood · symptoms ·
 * sleep/stress/energy · how much it got in the way. Around a period every
 * DRSP-area item is shown; otherwise the core few (+ 더 보기).
 */
export function TodayRecord() {
  const today = useToday();
  const data = useAppData();
  const router = useRouter();
  const { completeTask, showToast, react } = useSelly();
  const [more, setMore] = useState(false);
  if (!today) return <SubPage title="오늘 기록">{null}</SubPage>;

  const entry = data.entries[today];
  const day = data.symptoms[today];
  const onPeriod = data.periodDays.includes(today);
  const full = fullSymptomSet(data, today);
  const items = symptomsToShow(data, today, full || more);
  const rated = Object.values(day?.scores ?? {}).filter((v) => (v ?? 0) >= 1).length;
  const tap = () => playSfx("tap");

  const done = () => {
    if (!recordedToday(data, today)) {
      showToast("하나만 골라도 괜찮아요");
      return;
    }
    const { exp } = completeTask("record");
    showToast(exp ? `오늘 기록을 담았어요 · 성장 +${exp}` : "오늘 기록을 담았어요");
    react("cheer");
    router.push("/");
  };

  return (
    <SubPage title="오늘 기록">
      <div className="flex flex-col gap-3 pb-6">
        <p className="px-1 text-center text-[12.5px] text-ink-500">
          {formatShort(today)} · 아는 것만 톡톡, 30초면 충분해요. 누르는 대로 저장돼요.
        </p>

        {/* 1. period */}
        <Card title="생리">
          <button
            type="button"
            role="switch"
            aria-checked={onPeriod}
            onClick={() => {
              tap();
              setOnPeriod(today, !onPeriod);
            }}
            className={`flex h-12 w-full items-center justify-center gap-1.5 rounded-2xl text-[14px] font-bold ${onPeriod ? "bg-[#f7c9cf] text-[#9c3f4d]" : "bg-white text-ink-500 shadow-[0_4px_12px_-8px_rgba(110,88,60,0.4)]"}`}
          >
            {onPeriod && <Check size={16} strokeWidth={3} />}
            {onPeriod ? "오늘 생리 중이에요" : "오늘 생리 중이면 눌러 주세요"}
          </button>
          {onPeriod && (
            <div className="mt-2">
              <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="오늘 생리 양">
                {FLOW_AMOUNTS.map((a) => (
                  <Pill key={a.id} on={day?.flow?.amount === a.id} role="radio" onClick={() => (tap(), setFlow(today, { amount: a.id }))}>
                    {a.label}
                  </Pill>
                ))}
              </div>
              <div className="mt-1.5 flex flex-col gap-1.5">
                {FLOW_SIGNS.map((f) => {
                  const on = !!day?.flow?.signs?.includes(f.id);
                  return (
                    <button key={f.id} type="button" aria-pressed={on} onClick={() => (tap(), setFlow(today, { sign: f.id }))} className={`flex min-h-10 items-center gap-2 rounded-2xl px-3 text-left text-[12.5px] ${on ? "bg-[#fbe3e6] font-bold text-[#8c3a47]" : "bg-white text-ink-700"}`}>
                      <span className={`grid h-4 w-4 shrink-0 place-items-center rounded border ${on ? "border-[#c9636f] bg-[#c9636f] text-white" : "border-[#d8cfc2]"}`} aria-hidden>
                        {on && <Check size={11} strokeWidth={3} />}
                      </span>
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </Card>

        {/* 2. mood */}
        <Card title="기분">
          <div className="flex items-end justify-between px-1" role="radiogroup" aria-label="오늘 기분">
            {MOODS.map((m) => (
              <motion.button
                key={m.value}
                type="button"
                role="radio"
                aria-checked={entry?.mood === m.value}
                aria-label={m.label}
                animate={{ scale: entry?.mood === m.value ? 1.12 : 1 }}
                onClick={() => {
                  tap();
                  setMood(today, entry?.mood === m.value ? undefined : (m.value as Level5));
                }}
                className="grid place-items-center"
              >
                <MoodFace value={m.value} active={entry?.mood === m.value} size={44} />
              </motion.button>
            ))}
          </div>
          <p className="mt-1 h-5 text-center text-[12.5px] text-ink-500">{entry?.mood ? MOODS[entry.mood - 1].label : "오늘 마음은 어땠어?"}</p>
          <PmsMoodNote date={today} mood={entry?.mood} />
        </Card>

        {/* 3. symptoms */}
        <Card title="몸과 마음 증상" aside={<span className="text-[10.5px] text-ink-300">톡: 보통 → 심함 → 매우 심함 → 지우기</span>}>
          {full && <p className="mb-2 rounded-xl bg-[#fdf1f3] px-3 py-1.5 text-[11.5px] text-[#9c4f5d]">생리 전후라 표준 기록지(DRSP)의 모든 영역을 보여 드려요</p>}
          <Pill
            on={!!day?.none}
            onClick={() => {
              tap();
              setNoSymptoms(today, !day?.none);
            }}
            wide
          >
            {day?.none && <Check size={14} strokeWidth={3} className="mr-1 inline" />}
            오늘은 증상이 없어요
          </Pill>
          <div className="mt-2 flex flex-col gap-2">
            {groupByArea(items).map(([area, ids]) => (
              <div key={area}>
                {(full || more) && <p className="mb-1 text-[11px] text-ink-500">{area}</p>}
                <div className="flex flex-wrap gap-1.5">
                  {ids.map((id) => {
                    const v = day?.scores[id];
                    const on = v != null && v >= 1;
                    return (
                      <button
                        key={id}
                        type="button"
                        aria-pressed={on}
                        aria-label={`${SYMPTOM_LABEL[id]}${on ? `, ${SCORE_LABEL[v as Score]}` : ""}`}
                        onClick={() => {
                          tap();
                          cycleSymptom(today, id);
                        }}
                        className={`min-h-10 rounded-full px-3 text-[12.5px] font-bold transition active:scale-95 ${!on ? "bg-white text-ink-700 shadow-[0_3px_10px_-7px_rgba(110,88,60,0.5)]" : v! >= 4 ? "bg-[#d9788d] text-white" : v === 3 ? "bg-[#ec9fae] text-white" : "bg-[#f6cfd6] text-[#8c3a47]"}`}
                      >
                        {SYMPTOM_LABEL[id]}
                        {on && <span className="ml-1 font-normal">{SCORE_LABEL[v as Score]}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          {!full && (
            <button type="button" onClick={() => setMore((m) => !m)} className="mt-2 text-[12px] text-ink-500 underline underline-offset-2">
              {more ? "자주 쓰는 것만 보기" : "증상 더 보기"}
            </button>
          )}
        </Card>

        {/* 4. sleep · stress · energy */}
        <Card title="잠 · 스트레스 · 기운">
          <div className="flex flex-col gap-2.5">
            {BODY_ROWS.map((r) => {
              const v = entry?.condition?.[r.key];
              return (
                <div key={r.key}>
                  <p className="mb-1 text-[12px] font-bold text-ink-700">{r.label}</p>
                  <div className="grid grid-cols-5 gap-1" role="radiogroup" aria-label={r.label}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        role="radio"
                        aria-checked={v === n}
                        aria-label={`${r.label} ${n}점`}
                        onClick={() => (tap(), setCondition(today, r.key, n as Level5))}
                        className={`h-9 rounded-xl text-[12.5px] font-bold tabular-nums ${v === n ? "bg-sage-500 text-white" : "bg-white text-ink-500"}`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <div className="mt-0.5 flex justify-between px-0.5 text-[10.5px] text-ink-300">
                    <span>{r.low}</span>
                    <span>{r.high}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* 5. how much it got in the way (only when something was rated) */}
        {rated > 0 && (
          <Card title="증상 때문에 오늘 일상이 얼마나 힘들었어?">
            <div className="grid grid-cols-5 gap-1" role="radiogroup" aria-label="일상에 준 영향">
              {IMPACT.map((label, n) => (
                <button
                  key={label}
                  type="button"
                  role="radio"
                  aria-checked={day?.impact.daily === n}
                  onClick={() => (tap(), setDailyImpact(today, n as Score))}
                  className={`h-10 rounded-xl text-[11.5px] font-bold ${day?.impact.daily === n ? "bg-[#e6b54a] text-white" : "bg-white text-ink-500"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[10.5px] text-ink-300">진료가 필요한지 볼 때 가장 중요한 질문이에요. 업무·관계처럼 나눠서 적으려면 ‘더 자세히’에서요.</p>
          </Card>
        )}

        <button type="button" onClick={done} className="h-12 rounded-full bg-gradient-to-b from-[#9cc095] to-[#7ea47a] text-[15px] font-bold text-white shadow-[0_10px_24px_-10px_rgba(90,130,85,0.8)] active:scale-[0.98]">
          다 했어
        </button>
        <Link href="/record" className="flex items-center justify-center gap-1 text-[12.5px] text-ink-500">
          더 자세히 기록하기 (감정 꽃 · 메모 · 강도 · 하루 맥락) <ChevronRight size={14} />
        </Link>
        <p className="px-2 text-center text-[10.5px] leading-relaxed text-ink-300">점수는 내가 느낀 정도예요. 진단이 아니에요. 기록은 이 기기에 저장돼요.</p>
      </div>
    </SubPage>
  );
}

function groupByArea(ids: ReturnType<typeof symptomsToShow>): [string, typeof ids][] {
  const out: [string, typeof ids][] = [];
  for (const id of ids) {
    const area = DRSP_AREA_OF[id] ?? "그 밖의 증상";
    const last = out[out.length - 1];
    if (last && last[0] === area) last[1].push(id);
    else out.push([area, [id]]);
  }
  return out;
}

function Card({ title, aside, children }: { title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="glass rounded-[24px] p-4" aria-label={title}>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="text-[14px] font-bold text-ink-700">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Pill({ on, onClick, children, role, wide }: { on: boolean; onClick: () => void; children: React.ReactNode; role?: "radio"; wide?: boolean }) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={role ? on : undefined}
      aria-pressed={role ? undefined : on}
      onClick={onClick}
      className={`${wide ? "w-full" : ""} h-10 rounded-2xl px-3 text-[13px] font-bold ${on ? "bg-[#f3c6cd] text-[#8c3a47]" : "bg-white text-ink-700 shadow-[0_3px_10px_-7px_rgba(110,88,60,0.5)]"}`}
    >
      {children}
    </button>
  );
}
