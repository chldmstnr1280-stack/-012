"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SYMPTOM_LABEL } from "@/data/pmsSymptoms";
import { useAppData } from "@/lib/data-store";
import { addDays, formatMonthDay, formatShort, fromKey, toKey, WEEKDAY_LABELS, type DateKey } from "@/lib/date";
import { SOURCE_LABEL } from "@/lib/pms/forecast";
import { estimateAccuracy } from "@/lib/pms/late";
import { dayKind, overlaps, restIn, rhythmOf, setPlan, type DayKind } from "@/lib/rhythm";
import { playSfx } from "@/lib/sound/sfx";
import { CYCLE_COLORS as C } from "./colors";
import { PMS_WINDOW, PMS_WINDOW_EDGE } from "@/components/pms/colors";

const KIND_LABEL: Record<Exclude<DayKind, null>, string> = {
  period: "생리일 (기록)",
  "period-predicted": "생리 예정 (예측)",
  pms: "생리 전 예상 기간 (예측)",
};

/**
 * 이번 달 나의 리듬 — the month around the user's own cycle: plan the pre-period
 * week ahead (rest slots, a heads-up on important days), instead of meeting it
 * unprepared. Only records and clearly-labelled estimates; nothing about how
 * she will feel.
 */
export function RhythmView({ today }: { today: DateKey }) {
  const data = useAppData();
  const plan = useMemo(() => data.plan ?? {}, [data.plan]);
  const r = useMemo(() => rhythmOf(data, today), [data, today]);
  const periodSet = useMemo(() => new Set(data.periodDays), [data.periodDays]);
  const [offset, setOffset] = useState(0); // months from this one (0–2)
  const [selected, setSelected] = useState<DateKey | null>(null);
  const t = fromKey(today);
  const first = new Date(t.getFullYear(), t.getMonth() + offset, 1);
  const monthLabel = `${first.getMonth() + 1}월의 리듬`;
  const lead = first.getDay();
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const cells: (DateKey | null)[] = [...Array.from({ length: lead }, () => null), ...Array.from({ length: daysInMonth }, (_, i) => toKey(new Date(first.getFullYear(), first.getMonth(), i + 1)))];

  const next = r.windows.find((w) => w.to >= today) ?? null;
  const clash = overlaps(plan, r, today);
  const acc = estimateAccuracy(data.predictionLog ?? []);
  const hasPeriods = data.periodDays.length > 0;
  const pastSymptoms = r.fc.symptoms.map((s) => SYMPTOM_LABEL[s.id]).filter(Boolean).slice(0, 3);
  // what the user told us is not "a record": say which it is
  const fromProfile = r.fc.symptomSource === "profile";
  const symptomLead = fromProfile ? "평소에 있다고 알려 준 것" : "지난 기록에서 자주 있었던 것";
  const sel = selected ? plan[selected] : undefined;
  const selKind = selected ? dayKind(r, periodSet, selected) : null;

  return (
    <div className="flex flex-col gap-3">
      {/* what this month looks like */}
      <section className="glass rounded-[26px] p-4" aria-label="이번 달 요약">
        {!hasPeriods ? (
          <>
            <p className="text-[15px] font-bold text-ink-700">생리 시작일을 한 번 기록하면, 한 달의 리듬을 그려 줄게요.</p>
            <p className="mt-1 text-[12.5px] text-ink-500">캘린더 탭에서 생리 날짜를 눌러 표시해 주세요.</p>
          </>
        ) : r.fc.paused ? (
          <>
            <p className="text-[15px] font-bold text-ink-700">예상했던 시작일이 지났어요.</p>
            <p className="mt-1 break-keep text-[12.5px] leading-relaxed text-ink-500">생리가 시작되면 캘린더에 기록해 주세요. 그 날을 기준으로 리듬을 다시 그릴게요. 그동안 일정과 쉬는 칸은 그대로 쓸 수 있어요.</p>
          </>
        ) : (
          <>
            {next ? (
              <p className="text-[15px] font-bold leading-relaxed text-ink-700">
                생리 전 예상 기간 <span className="tabular-nums">{formatMonthDay(next.from)}~{formatMonthDay(next.to)}</span>
                <span className="ml-1 text-[11px] font-normal text-ink-500">(예측)</span>
              </p>
            ) : (
              <p className="break-keep text-[14px] font-bold leading-relaxed text-ink-700">평소 PMS가 언제쯤 시작되는지 알려 주면, 생리 전 기간도 미리 보여 줄게요.</p>
            )}
            {r.fc.nextStart && (
              <p className="mt-0.5 text-[13px] text-ink-700">
                다음 생리 예정 <b className="tabular-nums">{formatMonthDay(r.fc.nextStart)}</b> <span className="text-[11px] text-ink-500">(예측)</span>
              </p>
            )}
            {next && r.fc.onsetSource && <p className="mt-1 text-[11.5px] text-ink-500">‘{SOURCE_LABEL[r.fc.onsetSource]}’ 기준으로 계산했어요.</p>}
            {!next && (
              <Link href="/pms/profile" className="mt-2 inline-block rounded-full bg-sage-50 px-3 py-1.5 text-[12.5px] font-bold text-sage-700">
                평소 PMS 패턴 알려 주기 (1분)
              </Link>
            )}
            <p className="mt-2 text-[11px] leading-relaxed text-ink-300">
              {r.fc.onsetSource === "profile" ? "최근 주기 기록과 알려 준 평소 패턴을 바탕으로 예상한 기간이에요." : "최근 기록을 바탕으로 예상한 기간이에요."} 실제 증상 발생 시점은 달라질 수 있어요.
              {r.info.irregular ? " 주기 길이 차이가 커서 덜 정확할 수 있어요." : r.info.basis < 2 ? " 주기 기록이 적어서 덜 정확할 수 있어요." : ""}
              {acc.meanAbs != null ? ` 최근 ${acc.n}번 예측은 실제와 평균 ${acc.meanAbs}일 차이였어요.` : ""}
            </p>
          </>
        )}
      </section>

      {/* the month */}
      <section className="glass rounded-[26px] p-3" aria-label={monthLabel}>
        <div className="mb-2 flex items-center justify-between px-1">
          <button type="button" aria-label="이전 달" disabled={offset === 0} onClick={() => setOffset((o) => o - 1)} className="grid h-9 w-9 place-items-center rounded-full text-ink-500 disabled:opacity-25">
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-[15px] font-bold text-ink-700">{monthLabel}</h2>
          <button type="button" aria-label="다음 달" disabled={offset === 2} onClick={() => setOffset((o) => o + 1)} className="grid h-9 w-9 place-items-center rounded-full text-ink-500 disabled:opacity-25">
            <ChevronRight size={20} />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAY_LABELS.map((w) => (
            <span key={w} className="text-[11px] text-ink-300">
              {w}
            </span>
          ))}
          {cells.map((d, i) => {
            if (!d) return <span key={`e${i}`} />;
            const k = dayKind(r, periodSet, d);
            const p = plan[d];
            const isToday = d === today;
            const style: React.CSSProperties =
              k === "period"
                ? { background: C.periodFill }
                : k === "period-predicted"
                  ? { border: `1.5px dashed ${C.period}` }
                  : k === "pms"
                    ? { background: PMS_WINDOW }
                    : {};
            return (
              <button
                key={d}
                type="button"
                onClick={() => {
                  playSfx("tap");
                  setSelected(d === selected ? null : d);
                }}
                aria-label={`${formatShort(d)}${k ? `, ${KIND_LABEL[k]}` : ""}${p?.important ? ", 중요한 일정" : ""}${p?.rest ? ", 쉬는 칸" : ""}`}
                aria-pressed={d === selected}
                className={`relative flex h-[52px] flex-col items-center justify-start rounded-xl pt-1.5 text-[13px] tabular-nums text-ink-700 ${d === selected ? "ring-2 ring-sage-500" : ""} ${d < today ? "opacity-55" : ""}`}
                style={style}
              >
                <span className={isToday ? "grid h-6 w-6 place-items-center rounded-full bg-sage-500 font-bold text-white" : ""}>{fromKey(d).getDate()}</span>
                <span className="mt-0.5 flex h-4 items-center gap-0.5 text-[10.5px] leading-none" aria-hidden>
                  {p?.important && "★"}
                  {p?.rest && "☁️"}
                </span>
              </button>
            );
          })}
        </div>
        <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1 text-[11px] text-ink-500">
          <Legend swatch={<span className="h-3 w-3 rounded" style={{ background: C.periodFill }} />} label="생리일" />
          <Legend swatch={<span className="h-3 w-3 rounded border border-dashed" style={{ borderColor: C.period }} />} label="생리 예정(예측)" />
          <Legend swatch={<span className="h-3 w-3 rounded" style={{ background: PMS_WINDOW, boxShadow: `inset 0 0 0 1px ${PMS_WINDOW_EDGE}` }} />} label="생리 전 예상(예측)" />
          <Legend swatch={<span>★</span>} label="중요한 일정" />
          <Legend swatch={<span>☁️</span>} label="쉬는 칸" />
        </div>
      </section>

      {/* the chosen day */}
      {selected && (
        <section className="glass rounded-[24px] p-4" aria-label={`${formatShort(selected)} 계획`}>
          <p className="text-[14px] font-bold text-ink-700">{formatShort(selected)}</p>
          {selKind && <p className="text-[12px] text-ink-500">{KIND_LABEL[selKind]}</p>}
          {selKind === "pms" && pastSymptoms.length > 0 && r.fc.symptomSource && (
            <p className="mt-1 break-keep text-[12.5px] text-ink-700">
              {symptomLead}: {pastSymptoms.join(" · ")} <span className="text-[11px] text-ink-500">(‘{SOURCE_LABEL[r.fc.symptomSource]}’ 기준 · 이번에도 그렇다는 뜻은 아니에요)</span>
            </p>
          )}
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button type="button" aria-pressed={!!sel?.important} onClick={() => setPlan(selected, { important: sel?.important ? undefined : true })} className={`h-11 rounded-2xl text-[13px] font-bold ${sel?.important ? "bg-[#f6e6b8] text-[#7a5a14]" : "bg-white text-ink-700 shadow-[0_3px_10px_-7px_rgba(110,88,60,0.5)]"}`}>
              ★ 중요한 일정
            </button>
            <button type="button" aria-pressed={!!sel?.rest} onClick={() => setPlan(selected, { rest: sel?.rest ? undefined : true })} className={`h-11 rounded-2xl text-[13px] font-bold ${sel?.rest ? "bg-[#dfe8f5] text-[#3f5f8a]" : "bg-white text-ink-700 shadow-[0_3px_10px_-7px_rgba(110,88,60,0.5)]"}`}>
              ☁️ 쉬는 칸으로 비워 두기
            </button>
          </div>
          <label className="mt-2 block">
            <span className="sr-only">짧은 메모</span>
            <input
              key={selected}
              defaultValue={sel?.label ?? ""}
              maxLength={20}
              placeholder="짧은 메모 (선택 · 예: 발표, 친구 생일)"
              onBlur={(e) => setPlan(selected, { label: e.target.value })}
              className="h-11 w-full rounded-2xl border border-[#eadfce] bg-white px-3 text-[13.5px] outline-none focus:border-sage-300"
            />
          </label>
        </section>
      )}

      {/* getting ready for the pre-period week */}
      {next && !r.fc.paused && (
        <section className="glass rounded-[26px] p-4" aria-label="생리 전 기간 준비">
          <p className="text-[14.5px] font-bold text-ink-700">이번 생리 전 기간, 미리 챙겨 볼까요?</p>
          {pastSymptoms.length > 0 && r.fc.symptomSource && (
            <p className="mt-1 break-keep text-[12.5px] text-ink-700">
              {symptomLead}: {pastSymptoms.join(" · ")} <span className="text-[11px] text-ink-500">(‘{SOURCE_LABEL[r.fc.symptomSource]}’ 기준)</span>
            </p>
          )}
          <p className="mt-2 text-[12.5px] text-ink-500">이 기간에 쉬는 칸을 미리 정해 두면 좋아요. 지금 {restIn(plan, next.from, next.to)}칸 · 날짜를 눌러 추가/해제</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {Array.from({ length: Math.min(14, (fromKey(next.to).getTime() - fromKey(next.from).getTime()) / 864e5 + 1) }, (_, i) => addDays(next.from, i)).map((d) => (
              <button key={d} type="button" aria-pressed={!!plan[d]?.rest} onClick={() => setPlan(d, { rest: plan[d]?.rest ? undefined : true })} className={`h-9 rounded-full px-2.5 text-[12px] font-bold tabular-nums ${plan[d]?.rest ? "bg-[#dfe8f5] text-[#3f5f8a]" : "bg-white text-ink-700 shadow-[0_3px_10px_-7px_rgba(110,88,60,0.5)]"}`}>
                {plan[d]?.rest ? "☁️ " : ""}
                {formatMonthDay(d)}
              </button>
            ))}
          </div>
          {clash.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {clash.map((d) => {
                const before = addDays(d, -1);
                return (
                  <li key={d} className="rounded-2xl bg-[#fbf6ee] px-3 py-2.5 text-[12.5px] leading-relaxed text-ink-700">
                    ★ {formatMonthDay(d)}{plan[d]?.label ? ` ${plan[d].label}` : ""} 일정이 생리 전 예상 기간과 겹쳐요(예측).
                    {plan[before]?.rest ? (
                      <span className="text-ink-500"> 전날은 쉬는 칸으로 비워 뒀어요.</span>
                    ) : (
                      <button type="button" onClick={() => setPlan(before, { rest: true })} className="ml-1 font-bold text-sage-700 underline underline-offset-2">
                        전날({formatMonthDay(before)})을 쉬는 칸으로 비워 둘까요?
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          <Link href="/pms/care?from=pms" className="mt-3 flex items-center justify-between rounded-2xl bg-sage-50 px-3.5 py-2.5 text-[13px] font-bold text-sage-700">
            <span>그 주에 할 돌봄 미리 골라 보기</span>
            <ChevronRight size={16} />
          </Link>
        </section>
      )}

      <p className="px-2 text-center text-[11px] leading-relaxed text-ink-300">
        일정·쉬는 칸·메모는 이 기기와 기록 파일에만 저장돼요. 생리 전 예상 기간은 내 기록으로 계산한 참고용 예측이고, 그때 어떤 기분일지 정해 주는 건 아니에요.
      </p>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: React.ReactNode; label: string }) {
  return (
    <span className="flex items-center gap-1">
      {swatch}
      {label}
    </span>
  );
}
