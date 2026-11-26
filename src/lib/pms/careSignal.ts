import { analyzeCycle, groupPeriods } from "@/lib/cycle";
import type { AppData } from "@/lib/data-store";
import { diffDays, type DateKey } from "@/lib/date";
import { IMPACT_NUDGE } from "@/data/safety";
import { analysePms } from "./analysis";
import { heavyImpactCycles, symptomFocus, type SymptomFocus } from "./clinical";

/**
 * 진료 신호등 — where the user stands, from her own records, against the
 * "see a doctor if…" lines the app already keeps with their NHS sources
 * (data/lateCycle.ts › doctor card). It never names an illness.
 *
 *  🟢 watch    — nothing in the records meets those lines (keep recording)
 *  🟡 consult  — at least one line is met: consider booking a visit
 *  🔴 is not computed from records: urgent signs are things the user feels now,
 *     so they are listed for her to check herself (see URGENT_SIGNS).
 * ⚠️ 전문가 검토 전.
 */
export type SignalLevel = "watch" | "consult";
export type Department = "gyn" | "psy";

export interface SignalReason {
  id: "impact" | "pain" | "missed" | "irregular" | "long";
  text: string;
  /** which source line it rests on (LATE_SOURCES id) */
  source: "nhs-pms" | "nhs-pain" | "nhs-missed" | "nhs-irregular";
  departments: Department[];
}

export interface CareSignal {
  level: SignalLevel;
  reasons: SignalReason[];
  departments: Department[];
  focus: SymptomFocus | null;
  /** how much the records can say: analysed PMS cycles and logged cycle lengths */
  basis: { pmsCycles: number; cycleLengths: number; periods: number };
}

export const DEPARTMENT_NAME: Record<Department, string> = { gyn: "산부인과", psy: "정신건강의학과" };

export const SIGNAL = {
  /** "3번 연속 건너뜀": days since the last logged start ≥ this many average cycles */
  missedCycles: 3,
  /** a period longer than this (days) in the last 3 */
  longPeriod: 7,
  /** cycle lengths needed before "불규칙" is said */
  irregularMinLengths: 3,
  /** cycles where cramps ≥ 3 and life impact ≥ 3 */
  painCycles: 2,
};

export function careSignal(data: AppData, today: DateKey): CareSignal {
  const days = (data.periodDays ?? []).filter((d) => d <= today);
  const info = analyzeCycle(days, today);
  const pattern = analysePms(days, data.symptoms ?? {}, today, info.nextStart);
  const periods = groupPeriods(days);
  const reasons: SignalReason[] = [];
  const f = symptomFocus(pattern.cycles);
  const pmsDepts: Department[] = f.focus === "mood" ? ["psy", "gyn"] : f.focus === "both" ? ["gyn", "psy"] : ["gyn"];

  const heavy = heavyImpactCycles(pattern);
  if (heavy >= IMPACT_NUDGE.cycles)
    reasons.push({ id: "impact", text: `생리 전후 증상이 일상생활에 ‘심하게’ 영향을 줬다고 기록한 주기가 ${heavy}번 있어요.`, source: "nhs-pms", departments: pmsDepts });

  const painful = pattern.cycles.filter((c) => c.impactMax >= IMPACT_NUDGE.score && c.symptoms.some((s) => s.id === "cramps" && s.max >= 3)).length;
  if (painful >= SIGNAL.painCycles) reasons.push({ id: "pain", text: `생리통을 ‘심함’ 이상으로, 일상에 영향이 있었다고 기록한 주기가 ${painful}번 있어요.`, source: "nhs-pain", departments: ["gyn"] });

  const last = periods[periods.length - 1];
  if (last && info.hasHistory) {
    const since = diffDays(last.start, today);
    if (since >= info.avgCycle * SIGNAL.missedCycles + 7)
      reasons.push({ id: "missed", text: `마지막 생리 기록 뒤로 ${since}일 동안 새 생리가 기록되지 않았어요(평소 주기의 3배가 넘어요). 기록을 놓친 게 아니라면 상담을 고려해 볼 만해요.`, source: "nhs-missed", departments: ["gyn"] });
  }
  if (info.irregular && info.cycleLengths.length >= SIGNAL.irregularMinLengths)
    reasons.push({ id: "irregular", text: "최근 주기 길이가 들쭉날쭉하게 기록됐어요(차이가 크거나 21~35일을 벗어나요).", source: "nhs-irregular", departments: ["gyn"] });

  const long = periods.slice(-3).filter((p) => p.end < today && p.length > SIGNAL.longPeriod);
  if (long.length) reasons.push({ id: "long", text: `최근 생리 중 ${long.length}번이 ${SIGNAL.longPeriod}일보다 길게 기록됐어요.`, source: "nhs-irregular", departments: ["gyn"] });

  const departments = [...new Set(reasons.flatMap((r) => r.departments))];
  return {
    level: reasons.length ? "consult" : "watch",
    reasons,
    departments,
    focus: f.focus,
    basis: { pmsCycles: pattern.cycles.length, cycleLengths: info.cycleLengths.length, periods: periods.length },
  };
}

/** Signs to check herself — "바로 진료" — each from a source the app keeps (LATE_SOURCES). */
export const URGENT_SIGNS: { text: string; source: "nhs-pain" | "nhs-ectopic" }[] = [
  { text: "생리통이나 아랫배 통증이 아주 심하거나 평소보다 심한데, 진통제로도 나아지지 않을 때 → 빨리 진료를 받아 보세요.", source: "nhs-pain" },
  { text: "임신 가능성이 있는데 갑자기 찌르듯 심한 배 통증과 심한 어지럼·실신이 함께 올 때 → 바로 119 또는 응급실로 가 주세요.", source: "nhs-ectopic" },
];
