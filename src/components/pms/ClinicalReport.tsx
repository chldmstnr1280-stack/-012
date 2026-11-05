"use client";

import Link from "next/link";
import { Fragment, useMemo, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, Printer } from "lucide-react";
import { IMPACT_ITEMS, ONSET_OPTIONS, SYMPTOM_IDS, SYMPTOM_LABEL, type ImpactId, type SymptomId } from "@/data/pmsSymptoms";
import { addDays, formatMonthDay, toKey, useToday, type DateKey } from "@/lib/date";
import { setConsult, useAppData, type AppData, type Supplement } from "@/lib/data-store";
import { PRE_DAYS, type CycleMemory } from "@/lib/pms/analysis";
import { buildClinical, markFor, type ClinicalSummary, type Mark } from "@/lib/pms/clinical";
import { CONSULT_QUESTIONS, findOverlaps, overlapText } from "@/lib/nutrition/overlap";
import { NUTRIENT_LABEL, SUPP_TIME_LABEL } from "@/data/nutrition";
import { IS_TOSS } from "@/lib/platform";

/**
 * Printable summary of the user's own PMS records to show a clinician.
 * Built entirely on this device from local data — nothing is uploaded.
 * The browser's "Save as PDF" makes the PDF (no extra library).
 */
const noop = () => () => {};
const subscribeResize = (cb: () => void) => {
  window.addEventListener("resize", cb);
  return () => window.removeEventListener("resize", cb);
};
const PAPER = 760;
const IMPACT_LABEL = Object.fromEntries(IMPACT_ITEMS.map((i) => [i.id, i.label])) as Record<ImpactId, string>;
const CONTRA = { yes: "예", no: "아니요", unsure: "잘 모르겠음" } as const;

export function ClinicalReport() {
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const width = useSyncExternalStore(subscribeResize, () => window.innerWidth, () => PAPER);
  const today = useToday();
  const data = useAppData();
  const [count, setCount] = useState(3);
  const s = useMemo(() => (today ? buildClinical(data, today, count) : null), [data, today, count]);
  if (!mounted || !today || !s) return null;
  const zoom = Math.min(1, (width - 24) / PAPER);

  return createPortal(
    <div className="print-root fixed inset-0 z-[80] overflow-auto bg-[#e9e4da] pb-10">
      <div className="no-print sticky top-0 z-10 flex items-center gap-2 bg-[#f7f2ea]/95 px-3 pb-2.5 pt-[calc(env(safe-area-inset-top)+10px)] shadow-[0_4px_14px_-10px_rgba(80,60,40,0.5)] backdrop-blur">
{!IS_TOSS && (<Link href="/report" aria-label="리포트로 돌아가기" className="grid h-10 w-10 place-items-center rounded-full text-ink-500 active:bg-white">
          <ChevronLeft size={24} />
        </Link>)}
        <label className="flex items-center gap-1.5 text-[12.5px] text-ink-500">
          최근
          <select value={count} onChange={(e) => setCount(Number(e.target.value))} className="rounded-lg bg-white px-2 py-1.5 text-[13px] text-ink-700">
            {[2, 3, 6].map((n) => (
              <option key={n} value={n}>
                {n}주기
              </option>
            ))}
          </select>
        </label>
        {!IS_TOSS && (
        <button
          type="button"
          onClick={() => window.print()}
          className="ml-auto flex h-10 items-center gap-1.5 rounded-full bg-gradient-to-b from-[#9cc095] to-[#7ea47a] px-4 text-[13.5px] font-bold text-white"
        >
          <Printer size={16} /> PDF로 저장·인쇄
        </button>
        )}
      </div>
      <p className="no-print mx-auto mt-2 max-w-[420px] px-4 text-center text-[11.5px] leading-relaxed text-ink-500">
        {IS_TOSS
          ? "토스 앱에서는 PDF 저장을 준비 중이에요. 진료 때 이 화면을 보여 주세요. 이 문서는 이 기기에서만 만들어져요."
          : "인쇄 창에서 ‘PDF로 저장’을 고르면 파일로 저장돼요. 이 문서는 이 기기에서만 만들어져요."}
      </p>
      <ConsultPicker />
      <article
        className="paper mx-auto mt-3 bg-white p-[28px] text-[11px] leading-snug text-[#2c2620] shadow-[0_10px_30px_-12px_rgba(60,40,20,0.4)]"
        style={{ width: PAPER, zoom, fontFamily: '"Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic",system-ui,sans-serif' }}
      >
        <Paper s={s} data={data} today={today} />
      </article>
    </div>,
    document.body,
  );
}

function Paper({ s, data, today }: { s: ClinicalSummary; data: AppData; today: DateKey }) {
  const recentPeriods = s.info.periods.slice(-Math.max(s.cycles.length + 1, 3)).reverse();
  const contra = data.cycleContext.hormonalContraception;
  return (
    <>
      <header className="flex items-end justify-between border-b-2 border-[#2c2620] pb-2">
        <div>
          <h1 className="text-[18px] font-bold">월경 전 증상 자가 기록 요약</h1>
          <p className="text-[10px] text-[#6b6157]">Premenstrual symptom self-record summary</p>
        </div>
        <dl className="grid grid-cols-[auto_auto] gap-x-2 text-right text-[10.5px]">
          <dt className="text-[#6b6157]">작성일</dt>
          <dd>{today}</dd>
          <dt className="text-[#6b6157]">기록 기간</dt>
          <dd>{s.from && s.to ? `${s.from} ~ ${s.to}` : "–"}</dd>
        </dl>
      </header>

      <div className="mt-2 grid grid-cols-2 gap-3 text-[10.5px]">
        <p>
          이름: <span className="inline-block w-[150px] border-b border-[#9c948a]" />
        </p>
        <p>
          생년월일: <span className="inline-block w-[150px] border-b border-[#9c948a]" />
        </p>
      </div>

      <p className="print-block mt-3 rounded border border-[#d8d0c4] bg-[#faf7f2] px-3 py-2 text-[10.5px] leading-relaxed">
        이 문서는 사용자가 앱(Dear Selly)에 직접 입력한 <b>주관적 기록</b>을 정리한 것입니다. 증상 점수는 0(없음)~4(매우 심함)의 자가 평가이며{" "}
        <b>검증된 임상 척도(예: DRSP)가 아니고, 진단을 의미하지 않습니다.</b> 기록하지 않은 날은 0점으로 간주하지 않았습니다.
      </p>

      <Section title="1. 생리 기록">
        <div className="grid grid-cols-[1fr_1.3fr] gap-4">
          <table className="w-full border-collapse text-[10.5px]">
            <thead>
              <tr className="border-b border-[#2c2620] text-left">
                <th className="py-1 font-bold">시작일</th>
                <th className="font-bold">기간</th>
                <th className="font-bold">다음 시작까지</th>
              </tr>
            </thead>
            <tbody>
              {recentPeriods.map((p) => {
                const len = s.info.cycleLengths.find((c) => c.start === p.start)?.length;
                return (
                  <tr key={p.start} className="border-b border-[#e6dfd4]">
                    <td className="py-0.5 tabular-nums">{p.start}</td>
                    <td className="tabular-nums">{p.length}일</td>
                    <td className="tabular-nums">{len ? `${len}일` : "–"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <dl className="grid grid-cols-[auto_1fr] content-start gap-x-3 gap-y-1 text-[10.5px]">
            <dt className="text-[#6b6157]">평균 주기</dt>
            <dd>{s.info.hasHistory ? `${s.info.avgCycle}일 (기록된 주기 ${s.info.cycleLengths.length}개)` : "기록 부족"}</dd>
            <dt className="text-[#6b6157]">평균 생리 기간</dt>
            <dd>{s.info.periods.length ? `${s.info.avgPeriod}일` : "–"}</dd>
            <dt className="text-[#6b6157]">주기 변동</dt>
            <dd>{s.info.irregular ? "주기 길이 차이가 큼 (21–35일 밖이거나 차이 7일 초과)" : "큰 변동 없음"}</dd>
            <dt className="text-[#6b6157]">호르몬 피임</dt>
            <dd>{contra ? CONTRA[contra] : "응답 없음"}</dd>
          </dl>
        </div>
      </Section>

      <RecallSection data={data} />

      {s.cycles.length ? (
        <>
          <Section title={`2. 주기별 요약 — 매일 기록 (최근 ${s.cycles.length}주기)`}>
            <table className="w-full border-collapse text-[10.5px]">
              <thead>
                <tr className="border-b border-[#2c2620] text-left align-bottom">
                  <th className="py-1 font-bold">생리 시작일</th>
                  <th className="font-bold">시작 전 기록일</th>
                  <th className="font-bold">증상 있던 날</th>
                  <th className="font-bold">첫 증상</th>
                  <th className="font-bold">최고 점수</th>
                  <th className="font-bold">생활 영향 평균(최고)</th>
                  <th className="font-bold">시작 후 2–6일</th>
                </tr>
              </thead>
              <tbody>
                {s.cycles.map((c) => (
                  <tr key={c.start} className="border-b border-[#e6dfd4]">
                    <td className="py-0.5 tabular-nums">{c.start}</td>
                    <td className="tabular-nums">
                      {c.recordedDays}/{c.windowDays}일
                    </td>
                    <td className="tabular-nums">{c.symptomDays}일</td>
                    <td className="tabular-nums">{c.onset != null ? `${c.onset}일 전` : "–"}</td>
                    <td className="tabular-nums">{c.maxIntensity || "–"}</td>
                    <td className="tabular-nums">{c.impactAvg != null ? `${c.impactAvg} (${c.impactMax})` : "–"}</td>
                    <td>{c.eased ? { lower: "낮아짐", similar: "비슷함", higher: "높아짐" }[c.eased] : "기록 부족"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {s.pattern.enough && s.pattern.repeated.length > 0 && (
              <p className="mt-1.5 text-[10.5px]">
                2주기 이상 반복 기록된 증상:{" "}
                {s.pattern.repeated.map((r) => `${SYMPTOM_LABEL[r.id]}(${r.cycles}주기, 평균 ${r.avg})`).join(", ")}
              </p>
            )}
          </Section>

          <Section title="3. 일별 기록">
            <p className="mb-1.5 text-[10px] text-[#6b6157]">
              숫자 = 그날 점수(0–4) · ‘·’ = 그날 기록했지만 이 항목은 평가하지 않음 · 빈칸 = 그날 기록 없음 · 회색 열 = 생리일
            </p>
            {s.cycles.map((c) => (
              <DayTable key={c.start} c={c} s={s} data={data} />
            ))}
          </Section>
        </>
      ) : (
        <Section title="2. 증상 기록">
          <p className="text-[10.5px]">
            생리 시작 전 {PRE_DAYS}일 동안 3일 이상 기록한 주기가 아직 없어 정리할 증상 기록이 없습니다.
          </p>
        </Section>
      )}

      <SupplementSection data={data} today={today} />

      <Section title="정리 방법">
        <ul className="list-disc pl-4 text-[10px] leading-relaxed text-[#4a423a]">
          <li>사용자가 기록한 생리 시작일을 기준으로, 시작 전 {PRE_DAYS}일(이전 생리와 겹치지 않게)과 시작 후 6일을 보았습니다.</li>
          <li>‘증상이 있던 날’은 한 항목이라도 1점 이상인 날입니다. ‘증상 없음’을 직접 선택한 날만 0점으로 셌습니다.</li>
          <li>‘첫 증상’은 시작 전 기간에서 가장 이른 증상 기록일이 시작일로부터 며칠 전인지입니다.</li>
          <li>‘시작 후 2–6일’은 그 기간 하루 최고 점수의 평균을 시작 전과 비교했습니다(차이 0.5점 기준, 2일 이상 기록 시).</li>
          <li>시작 전 기간에 기록이 3일 미만인 주기는 제외했습니다.</li>
        </ul>
        <footer className="mt-3 border-t border-[#d8d0c4] pt-1.5 text-[9.5px] text-[#6b6157]">
        Dear Selly에서 사용자가 직접 만든 문서 · 이 기기의 기록으로 만들어졌으며 서버로 전송되지 않았습니다 · 생성 {toKey(new Date())}
        </footer>
      </Section>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="print-block mt-4">
      <h2 className="mb-1.5 border-b border-[#9c948a] pb-0.5 text-[12.5px] font-bold">{title}</h2>
      {children}
    </section>
  );
}

const OFFSETS = Array.from({ length: PRE_DAYS + 7 }, (_, i) => i - PRE_DAYS);

function DayTable({ c, s, data }: { c: CycleMemory; s: ClinicalSummary; data: AppData }) {
  const period = new Set(data.periodDays);
  const shown = new Map(c.cells.map((x) => [x.offset, x.date]));
  const dateAt = (o: number): DateKey | null => shown.get(o) ?? null;
  const rows: ({ kind: "symptom"; id: SymptomId } | { kind: "impact"; id: ImpactId })[] = [
    ...s.rows.map((id) => ({ kind: "symptom" as const, id })),
    ...s.impactRows.map((id) => ({ kind: "impact" as const, id })),
  ];
  return (
    <div className="print-block mb-3">
      <p className="mb-0.5 text-[10.5px] font-bold">
        생리 시작 {c.start} 주기 <span className="font-normal text-[#6b6157]">({formatMonthDay(c.windowStart)} ~ {formatMonthDay(addDays(c.start, 6))})</span>
      </p>
      <table className="w-full table-fixed border-collapse text-center text-[9.5px] tabular-nums">
        <colgroup>
          <col style={{ width: 92 }} />
          {OFFSETS.map((o) => (
            <col key={o} />
          ))}
        </colgroup>
        <thead>
          <tr className="text-[#6b6157]">
            <th className="text-left font-normal">시작 기준</th>
            {OFFSETS.map((o) => (
              <th key={o} className={`font-normal ${o === 0 ? "font-bold text-[#2c2620]" : ""}`}>
                {o === 0 ? "0" : o > 0 ? `+${o}` : o}
              </th>
            ))}
          </tr>
          <tr className="border-b border-[#2c2620] text-[8.5px] text-[#6b6157]">
            <th className="text-left font-normal">날짜</th>
            {OFFSETS.map((o) => {
              const d = dateAt(o);
              return (
                <th key={o} className="font-normal" style={{ background: d && period.has(d) ? "#ece7e0" : undefined }}>
                  {d ? formatMonthDay(d).split(".")[1] : ""}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <Fragment key={`${r.kind}-${r.id}`}>
              {r.kind === "impact" && (i === 0 || rows[i - 1].kind === "symptom") && (
                <tr>
                  <td colSpan={OFFSETS.length + 1} className="pt-1 text-left text-[9px] text-[#6b6157]">
                    생활 영향 (0 전혀 ~ 4 매우 많이)
                  </td>
                </tr>
              )}
              <tr className="border-b border-[#eee8de]">
                <th scope="row" className="truncate py-[2px] text-left font-normal">
                  {r.kind === "symptom" ? SYMPTOM_LABEL[r.id] : IMPACT_LABEL[r.id]}
                </th>
                {OFFSETS.map((o) => {
                  const d = dateAt(o);
                  const m: Mark = d ? markFor(data, d, r) : "none";
                  return (
                    <td key={o} style={{ background: d && period.has(d) ? "#f4f1ec" : undefined, fontWeight: typeof m === "number" && m >= 3 ? 700 : 400 }}>
                      {m === "none" ? "" : m === "unrated" ? "·" : m}
                    </td>
                  );
                })}
              </tr>
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** What the user recalled (usual pattern + per-cycle look-backs) — kept apart from daily records. */
function RecallSection({ data }: { data: AppData }) {
  const recaps = Object.entries(data.cycleRecaps)
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .slice(0, 4);
  const cols: { key: string; label: string; p: { symptoms: Partial<Record<SymptomId, number>>; onset?: string } }[] = [
    ...(data.pmsProfile ? [{ key: "profile", label: "평소", p: data.pmsProfile }] : []),
    ...recaps.map(([k, r]) => ({ key: k, label: `${k} 주기`, p: r })),
  ];
  if (!cols.length) return null;
  const rows = SYMPTOM_IDS.filter((id) => cols.some((c) => (c.p.symptoms[id] ?? 0) >= 1));
  const onsetLabel = (o?: string) => ONSET_OPTIONS.find((x) => x.id === o)?.label ?? "–";
  return (
    <Section title="사용자가 기억해 답한 패턴">
      <p className="mb-1.5 text-[10px] text-[#6b6157]">
        ‘평소’는 사용자가 처음에 답한 평소 패턴, ‘○○ 주기’는 그 생리가 시작된 뒤 돌아보며 답한 것입니다. 매일 기록이 아닌 회상 응답입니다.
      </p>
      <table className="w-full border-collapse text-[10.5px]">
        <thead>
          <tr className="border-b border-[#2c2620] text-left">
            <th className="py-1 font-bold">항목</th>
            {cols.map((c) => (
              <th key={c.key} className="font-bold tabular-nums">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-[#e6dfd4]">
            <td className="py-0.5">증상 시작</td>
            {cols.map((c) => (
              <td key={c.key}>{onsetLabel(c.p.onset)}</td>
            ))}
          </tr>
          {rows.map((id) => (
            <tr key={id} className="border-b border-[#e6dfd4]">
              <td className="py-0.5">{SYMPTOM_LABEL[id]}</td>
              {cols.map((c) => (
                <td key={c.key} className="tabular-nums">
                  {c.p.symptoms[id] ?? "·"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  );
}

/** On screen only: pick the questions to bring (saved on the device, printed below). */
function ConsultPicker() {
  const data = useAppData();
  const chosen = new Set(data.consult?.questions ?? []);
  const [custom, setCustom] = useState(data.consult?.custom ?? "");
  const save = (questions: string[], c = custom) => setConsult({ questions, custom: c });
  return (
    <section id="consult" className="no-print mx-auto mt-3 max-w-[420px] rounded-[22px] bg-[#fdfaf3] px-4 py-3.5 shadow-[0_8px_24px_-14px_rgba(60,40,20,0.5)]">
      <p className="text-[14px] font-bold text-ink-700">상담 때 물어볼 것 고르기</p>
      <p className="mt-0.5 text-[11.5px] text-ink-500">고른 질문은 아래 문서의 ‘영양제 · 상담 때 물어볼 것’에 들어가요.</p>
      <ul className="mt-2 flex flex-col gap-1">
        {CONSULT_QUESTIONS.map((q) => {
          const on = chosen.has(q);
          return (
            <li key={q}>
              <button
                type="button"
                role="checkbox"
                aria-checked={on}
                onClick={() => save(on ? [...chosen].filter((x) => x !== q) : [...chosen, q])}
                className={`flex w-full items-start gap-2 rounded-xl px-2.5 py-2 text-left text-[12.5px] ${on ? "bg-[#eef5e9] font-bold text-sage-700" : "text-ink-700"}`}
              >
                <span className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded border ${on ? "border-sage-500 bg-sage-500 text-white" : "border-[#cfc4b4]"}`}>{on ? "✓" : ""}</span>
                {q}
              </button>
            </li>
          );
        })}
      </ul>
      <input
        value={custom}
        maxLength={120}
        onChange={(e) => setCustom(e.target.value)}
        onBlur={() => save([...chosen], custom)}
        placeholder="직접 적기 (선택)"
        className="mt-2 h-10 w-full rounded-xl border border-[#ece4d6] bg-white px-3 text-[12.5px] outline-none focus:border-sage-300"
      />
    </section>
  );
}

/** Printed: what I take, how often I checked it off lately, overlaps, and my questions. */
function SupplementSection({ data, today }: { data: AppData; today: DateKey }) {
  const active = data.supplements.filter((x) => x.active);
  const questions = [...(data.consult?.questions ?? []), ...(data.consult?.custom ? [data.consult.custom] : [])];
  if (!active.length && !questions.length) return null;
  const days = Array.from({ length: 14 }, (_, i) => addDays(today, -i));
  const rate = (sp: Supplement) => {
    const slots = sp.times.length ? sp.times : ["morning"];
    const expected = days.length * slots.length;
    const taken = days.reduce((a, d) => a + slots.filter((t) => (data.suppLog[d] ?? []).includes(`${sp.id}@${t}`)).length, 0);
    return `${taken}/${expected}`;
  };
  const overlaps = findOverlaps(data.supplements);
  return (
    <Section title="영양제 · 상담 때 물어볼 것">
      {active.length > 0 && (
        <table className="w-full border-collapse text-[10.5px]">
          <thead>
            <tr className="border-b border-[#2c2620] text-left">
              <th className="py-1 font-bold">이름 (사용자 입력)</th>
              <th className="font-bold">성분 (사용자 선택)</th>
              <th className="font-bold">먹는 때</th>
              <th className="font-bold">최근 14일 체크</th>
            </tr>
          </thead>
          <tbody>
            {active.map((sp) => (
              <tr key={sp.id} className="border-b border-[#e6dfd4]">
                <td className="py-0.5">{sp.name}</td>
                <td>{sp.nutrients.map((n) => NUTRIENT_LABEL[n]).join(", ") || "–"}</td>
                <td>{sp.times.map((t) => SUPP_TIME_LABEL[t]).join(", ") || "–"}</td>
                <td className="tabular-nums">{rate(sp)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {overlaps.length > 0 && (
        <ul className="mt-1.5 list-disc pl-4 text-[10.5px]">
          {overlaps.map((o) => (
            <li key={o.nutrient}>겹치는 성분: {overlapText(o)}</li>
          ))}
        </ul>
      )}
      {questions.length > 0 && (
        <>
          <p className="mt-2 text-[10.5px] font-bold">물어보고 싶은 것</p>
          <ol className="list-decimal pl-4 text-[10.5px]">
            {questions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ol>
        </>
      )}
      <p className="mt-1 text-[9.5px] text-[#6b6157]">영양제 이름·성분은 사용자가 직접 입력·선택한 것이며, 앱은 영양제를 추천하지 않습니다.</p>
    </Section>
  );
}
