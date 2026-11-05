"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Info } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { SproutLeafIcon } from "@/components/ui/icons";
import { Selly } from "@/components/selly/Selly";
import { SYMPTOM_LABEL, type SymptomId } from "@/data/pmsSymptoms";
import { analyzeCycle } from "@/lib/cycle";
import { addDays, formatMonthDay, type DateKey } from "@/lib/date";
import type { AppData } from "@/lib/data-store";
import { analysePms, PRE_DAYS, type CycleMemory, type DayCell } from "@/lib/pms/analysis";
import { sellyPmsLine } from "@/lib/pms/insight";
import { focusSymptoms, pickCare } from "@/lib/pms/care";
import { CareCards } from "./CareCards";
import { ForecastCard } from "./ForecastCard";
import { forecastPms } from "@/lib/pms/forecast";
import { groupPeriods } from "@/lib/cycle";
import { TagReport } from "./TagReport";
import { compareTags } from "@/lib/pms/tags";
import { HelpCard } from "./HelpCard";
import { heavyImpactCycles } from "@/lib/pms/clinical";
import { IMPACT_NUDGE } from "@/data/safety";
import { FileText } from "lucide-react";
import { INTENSITY_FILL, INTENSITY_INK, MISSING_EDGE } from "./colors";

/**
 * PMS Cycle Memory (Phase B) — what the user recorded around each period start.
 * Descriptive only: no diagnosis, no causes. Missing days stay visibly missing.
 */
export function PmsReport({ data, today }: { data: AppData; today: DateKey }) {
  const info = useMemo(() => analyzeCycle(data.periodDays, today), [data.periodDays, today]);
  const p = useMemo(() => analysePms(data.periodDays, data.symptoms, today, info.nextStart), [data.periodDays, data.symptoms, today, info.nextStart]);
  const anyRecords = Object.keys(data.symptoms).length > 0;
  const chrono = [...p.cycles].reverse(); // oldest → newest for comparisons
  const single = p.cycles.length === 1 ? p.cycles[0] : null;
  const care = useMemo(() => pickCare(focusSymptoms(p), p.enough), [p]);
  const tagSummary = useMemo(() => compareTags(data, today), [data, today]);
  const forecast = useMemo(() => forecastPms(data, info, p), [data, info, p]);
  // the latest logged period (started in the last 3 weeks) that has neither a look-back nor enough daily records
  const recapDue = useMemo(() => {
    const last = groupPeriods(data.periodDays).filter((x) => x.start <= today).pop();
    if (!last || last.start < addDays(today, -21) || data.cycleRecaps[last.start]) return null;
    return p.cycles.some((c) => c.start === last.start) ? null : last.start;
  }, [data.periodDays, data.cycleRecaps, today, p.cycles]);

  return (
    <div className="flex flex-col gap-3">
      {/* Selly's read */}
      <section className="glass flex items-center gap-3 rounded-[26px] p-4">
        <div className="w-[76px] shrink-0">
          <Selly pose="relaxed" className="w-full" />
        </div>
        <div className="min-w-0">
          <p className="break-keep text-[14px] leading-relaxed text-ink-700">{sellyPmsLine(p, anyRecords)}</p>
          <p className="mt-1 text-[11.5px] tabular-nums text-ink-300">
            분석한 주기 {p.cycles.length}개{!p.enough && " · 비교하려면 2개 이상 필요해요"}
          </p>
        </div>
      </section>

      <ForecastCard f={forecast} today={today} hasProfile={!!data.pmsProfile} recapDue={recapDue} />

      {info.irregular && p.cycles.length > 0 && (
        <p className="flex items-start gap-2 rounded-2xl bg-[#fff6e8] px-4 py-3 text-[12.5px] leading-relaxed text-[#7a5a14]">
          <Info size={15} className="mt-0.5 shrink-0" />
          주기 길이의 차이가 커서, 생리 시작일을 기준으로 맞춘 비교가 덜 정확할 수 있어요.
        </p>
      )}

      {p.cycles.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          <Tile
            label={p.enough ? "보통 증상이 시작된 때" : "이번 주기 증상 시작"}
            value={(p.enough ? p.typicalOnset : single?.onset) != null ? `약 ${Math.round((p.enough ? p.typicalOnset : single!.onset)!)}일 전` : "–"}
            note={p.enough ? "주기별 값의 중앙값" : "한 주기 기록"}
          />
          <Tile
            label="증상이 있던 날"
            value={`${p.enough ? p.typicalSymptomDays : single!.symptomDays}일`}
            note={p.enough ? "주기별 값의 중앙값" : `기록한 ${single!.recordedDays}일 중`}
          />
        </div>
      )}

      {p.cycles.length > 0 && (
        <SectionCard icon={<SproutLeafIcon />} title="주기별 증상 흐름" aside={<span className="text-[11px] text-ink-300">그날 가장 높은 점수</span>}>
          <Timeline cycles={p.cycles} />
          <TimelineLegend />
        </SectionCard>
      )}

      {p.cycles.length > 0 && <SymptomGrid chrono={chrono} repeated={p.repeated.map((r) => r.id)} />}

      {p.cycles.length > 0 && <ImpactAndAfter chrono={chrono} />}

      {anyRecords && <TagReport s={tagSummary} />}

      {p.current && p.current.recordedDays > 0 && (
        <SectionCard icon={<SproutLeafIcon />} title="이번 주기 지금까지">
          <p className="text-[13px] leading-relaxed text-ink-500">
            다음 생리 예정일({formatMonthDay(p.current.start)}, 예측) 전 기록 <b className="text-ink-700">{p.current.recordedDays}일</b> · 증상이 있던 날{" "}
            <b className="text-ink-700">{p.current.symptomDays}일</b>
            {p.current.maxIntensity > 0 && (
              <>
                {" "}
                · 가장 높은 점수 <b className="text-ink-700">{p.current.maxIntensity}</b>
              </>
            )}
          </p>
        </SectionCard>
      )}

      <CareCards picks={care} />

      <CareBridge cycles={p.cycles.length} heavy={heavyImpactCycles(p)} />

      <Link
        href="/record?tab=pms"
        className="h-12 rounded-full bg-gradient-to-b from-[#9cc095] to-[#7ea47a] text-center text-[15px] font-bold leading-[48px] text-white shadow-[0_10px_24px_-10px_rgba(90,130,85,0.8)]"
      >
        오늘 증상 기록하기
      </Link>

      <ul className="flex flex-col gap-1 px-2 text-[11.5px] leading-relaxed text-ink-300">
        <li>· 생리 시작일(직접 기록한 날) 전 {PRE_DAYS}일과 시작 후 6일을 기준으로 정리해요.</li>
        <li>· 기록하지 않은 날은 계산에서 빠져요. ‘증상 없음’을 누른 날만 0점으로 세요.</li>
        <li>· 함께 기록됐다는 뜻이지, 어떤 것이 원인이라는 뜻은 아니에요.</li>
        <li>· 내가 느낀 정도를 정리한 것으로, 진단이 아니에요.</li>
      </ul>

      <HelpCard />
    </div>
  );
}

function Tile({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="glass rounded-[22px] px-4 py-3.5">
      <p className="text-[12px] text-ink-500">{label}</p>
      <p className="mt-1 text-[22px] font-bold tabular-nums text-ink-700">{value}</p>
      <p className="text-[10.5px] text-ink-300">{note}</p>
    </div>
  );
}

const OFFSETS = Array.from({ length: PRE_DAYS + 7 }, (_, i) => i - PRE_DAYS); // −14 … +6

function cellLabel(c: DayCell) {
  const when = c.offset < 0 ? `시작 ${-c.offset}일 전` : c.offset === 0 ? "시작일" : `시작 ${c.offset}일 후`;
  return `${formatMonthDay(c.date)} ${when}: ${!c.recorded ? "기록 없음" : c.max === 0 ? "증상 없음" : `최고 ${c.max}점`}`;
}

/** One row per cycle; each square is a day aligned to the period start. */
function Timeline({ cycles }: { cycles: CycleMemory[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-end gap-1.5 text-[10px] tabular-nums text-ink-300">
        <span className="w-9 shrink-0" />
        <div className="relative h-3 flex-1">
          {[-14, -7, 0, 6].map((o) => (
            <span key={o} className="absolute -translate-x-1/2" style={{ left: `${((o + PRE_DAYS + 0.5) / OFFSETS.length) * 100}%` }}>
              {o === 0 ? "시작" : o > 0 ? `+${o}` : o}
            </span>
          ))}
        </div>
      </div>
      {cycles.map((c) => {
        const byOffset = new Map(c.cells.map((x) => [x.offset, x]));
        return (
          <div key={c.start} className="flex items-center gap-1.5">
            <span className="w-9 shrink-0 text-[11px] tabular-nums text-ink-500">{formatMonthDay(c.start)}</span>
            <ul className="grid flex-1 gap-[2px]" style={{ gridTemplateColumns: `repeat(${OFFSETS.length}, minmax(0, 1fr))` }} aria-label={`${formatMonthDay(c.start)} 시작 주기`}>
              {OFFSETS.map((o) => {
                const cell = byOffset.get(o);
                if (!cell) return <li key={o} className="h-[18px]" aria-hidden />;
                return (
                  <li
                    key={o}
                    title={cellLabel(cell)}
                    aria-label={cellLabel(cell)}
                    className="h-[18px] rounded-[4px]"
                    style={
                      cell.recorded
                        ? { background: INTENSITY_FILL[cell.max], boxShadow: o === 0 ? "0 0 0 1.5px #E3707E" : undefined }
                        : { border: `1px dashed ${MISSING_EDGE}`, boxShadow: o === 0 ? "0 0 0 1.5px #E3707E" : undefined }
                    }
                  />
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function TimelineLegend() {
  return (
    <ul className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-500">
      <li className="flex items-center gap-1">
        <span className="h-3 w-3 rounded-[3px]" style={{ border: `1px dashed ${MISSING_EDGE}` }} />
        기록 없음
      </li>
      <li className="flex items-center gap-1">
        <span className="h-3 w-3 rounded-[3px]" style={{ background: INTENSITY_FILL[0] }} />
        증상 없음
      </li>
      <li className="flex items-center gap-1">
        {[1, 2, 3, 4].map((v) => (
          <span key={v} className="h-3 w-3 rounded-[3px]" style={{ background: INTENSITY_FILL[v] }} />
        ))}
        <span className="ml-0.5">1→4점</span>
      </li>
      <li className="flex items-center gap-1">
        <span className="h-3 w-3 rounded-[3px]" style={{ boxShadow: "inset 0 0 0 1.5px #E3707E" }} />
        생리 시작일
      </li>
    </ul>
  );
}

/** Symptom × cycle: the average score on the days it was present (blank = not recorded that cycle). */
function SymptomGrid({ chrono, repeated }: { chrono: CycleMemory[]; repeated: SymptomId[] }) {
  const ids: SymptomId[] = repeated.length
    ? repeated.slice(0, 6)
    : [...new Map(chrono.flatMap((c) => c.symptoms.map((s) => [s.id, s.days] as const))).entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([id]) => id);
  if (!ids.length) return null;
  const N = chrono.length;
  return (
    <SectionCard icon={<SproutLeafIcon />} title={repeated.length ? "반복해서 기록된 증상" : "기록된 증상"} aside={<span className="text-[11px] text-ink-300">평균 점수 (있던 날)</span>}>
      <table className="w-full table-fixed border-separate border-spacing-y-1 text-[12px]">
        <thead>
          <tr className="text-[10.5px] tabular-nums text-ink-300">
            <th className="w-[36%] text-left font-normal">시작일</th>
            {chrono.map((c) => (
              <th key={c.start} className="font-normal">
                {formatMonthDay(c.start)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ids.map((id) => {
            const per = chrono.map((c) => c.symptoms.find((s) => s.id === id));
            const n = per.filter(Boolean).length;
            return (
              <tr key={id}>
                <th scope="row" className="text-left font-normal">
                  <span className="block break-keep text-[13px] leading-tight text-ink-700">{SYMPTOM_LABEL[id]}</span>
                  <span className="text-[10.5px] tabular-nums text-ink-300">
                    {N}주기 중 {n}번
                  </span>
                </th>
                {per.map((s, i) => {
                  const lvl = s ? Math.max(1, Math.min(4, Math.round(s.avg))) : 0;
                  return (
                    <td key={chrono[i].start} className="px-[2px] text-center">
                      {s ? (
                        <span
                          className="mx-auto grid h-8 max-w-[44px] place-items-center rounded-lg font-bold tabular-nums"
                          style={{ background: INTENSITY_FILL[lvl], color: INTENSITY_INK[lvl] }}
                          aria-label={`${SYMPTOM_LABEL[id]} ${formatMonthDay(chrono[i].start)} 주기: 평균 ${s.avg}점, ${s.days}일`}
                        >
                          {s.avg}
                        </span>
                      ) : (
                        <span className="text-ink-300" aria-label={`${SYMPTOM_LABEL[id]} ${formatMonthDay(chrono[i].start)} 주기: 기록되지 않음`}>
                          –
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-1 text-[11px] text-ink-300">‘–’는 그 주기에 이 증상이 기록되지 않았다는 뜻이에요.</p>
    </SectionCard>
  );
}

const EASED_TEXT = { lower: "줄었어요", similar: "비슷했어요", higher: "더 높았어요" } as const;

function ImpactAndAfter({ chrono }: { chrono: CycleMemory[] }) {
  const rows = chrono.filter((c) => c.impactAvg != null || c.eased);
  if (!rows.length) return null;
  return (
    <SectionCard icon={<SproutLeafIcon />} title="생활 영향 · 시작 후 변화">
      <ul className="flex flex-col gap-1.5">
        {rows.map((c) => (
          <li key={c.start} className="flex items-center gap-2 rounded-2xl bg-white/60 px-3 py-2 text-[12.5px]">
            <span className="w-9 shrink-0 tabular-nums text-ink-500">{formatMonthDay(c.start)}</span>
            <span className="min-w-0 flex-1 text-ink-700">
              {c.impactAvg != null ? (
                <>
                  생활 영향 평균 <b className="tabular-nums">{c.impactAvg}</b>
                  <span className="text-ink-300"> (최고 {c.impactMax})</span>
                </>
              ) : (
                <span className="text-ink-300">생활 영향 기록 없음</span>
              )}
            </span>
            <span className="shrink-0 text-[11.5px] text-ink-500">{c.eased ? `시작 후 ${EASED_TEXT[c.eased]}` : "시작 후 기록 부족"}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] leading-relaxed text-ink-300">
        ‘시작 후’는 생리 시작 2~6일째의 하루 최고 점수를 시작 전과 비교한 거예요 (그 기간에 2일 이상 기록했을 때만).
      </p>
    </SectionCard>
  );
}

/** Phase D: bridge to a clinician — a printable summary of the user's own records. */
function CareBridge({ cycles, heavy }: { cycles: number; heavy: number }) {
  const nudge = heavy >= IMPACT_NUDGE.cycles;
  return (
    <SectionCard icon={<FileText size={20} className="text-sage-700" />} title="진료 준비">
      {nudge && (
        <p className="mb-2.5 break-keep rounded-2xl bg-[#fdf3f4] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-ink-700">
          최근 {cycles}번의 주기 중 {heavy}번, 생활 영향을 ‘심함’ 이상으로 기록했어요. NHS·ACOG 안내에서는 증상이 일상생활에 영향을 줄 때 진료를
          고려해 보라고 해요.
        </p>
      )}
      <p className="break-keep text-[12.5px] leading-relaxed text-ink-500">
        진료를 볼 때 생리 날짜와 2~3주기 동안의 증상 기록을 보여 주면 도움이 돼요. 내 기록을 한 장으로 정리해 PDF로 저장할 수 있어요.
      </p>
      <Link
        href="/report/clinical"
        className="mt-3 flex h-11 items-center justify-center gap-1.5 rounded-full bg-sage-50 text-[13.5px] font-bold text-sage-700"
      >
        <FileText size={16} /> 진료용 기록 요약 만들기
      </Link>
      <p className="mt-2 text-[10.5px] text-ink-300">이 기기에서만 만들어지고 어디에도 전송되지 않아요. 복용 중인 약이나 영양제가 있다면 함께 알려 주세요.</p>
    </SectionCard>
  );
}
