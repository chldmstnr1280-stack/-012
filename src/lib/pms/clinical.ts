import { IMPACT_IDS, SYMPTOM_IDS, type ImpactId, type SymptomId } from "@/data/pmsSymptoms";
import { analyzeCycle } from "@/lib/cycle";
import type { AppData } from "@/lib/data-store";
import type { DateKey } from "@/lib/date";
import { analysePms, hasSymptomRecord, type CycleMemory, type PmsPattern } from "./analysis";
import { IMPACT_NUDGE } from "@/data/safety";
import { DRSP_ORDER } from "@/data/drspAreas";

/** Cell in the printed table: a score, "not rated that day" or "no record that day". */
export type Mark = number | "unrated" | "none";

export function markFor(data: AppData, date: DateKey, item: { kind: "symptom"; id: SymptomId } | { kind: "impact"; id: ImpactId }): Mark {
  const d = data.symptoms[date];
  if (!d) return "none";
  if (item.kind === "impact") return d.impact[item.id] ?? "unrated";
  if (!hasSymptomRecord(d)) return "none";
  if (d.none) return 0;
  return d.scores[item.id] ?? "unrated";
}

export interface ClinicalSummary {
  cycles: CycleMemory[]; // newest first
  rows: SymptomId[]; // symptoms scored ≥ 1 in any included cycle
  impactRows: ImpactId[];
  info: ReturnType<typeof analyzeCycle>;
  pattern: PmsPattern;
  from: DateKey | null;
  to: DateKey | null;
}

export function buildClinical(data: AppData, today: DateKey, count: number): ClinicalSummary {
  const info = analyzeCycle(data.periodDays, today);
  const pattern = analysePms(data.periodDays, data.symptoms, today, info.nextStart);
  const cycles = pattern.cycles.slice(0, count);
  const seen = new Set(cycles.flatMap((c) => c.symptoms.map((s) => s.id)));
  // DRSP area order (data/drspAreas.ts); anything else after
  const rows = [...DRSP_ORDER, ...SYMPTOM_IDS.filter((id) => !DRSP_ORDER.includes(id))].filter((id) => seen.has(id));
  const impactRows = IMPACT_IDS.filter((id) => cycles.some((c) => c.cells.some((x) => data.symptoms[x.date]?.impact[id] != null)));
  const dates = cycles.flatMap((c) => c.cells.map((x) => x.date)).sort();
  return { cycles, rows, impactRows, info, pattern, from: dates[0] ?? null, to: dates[dates.length - 1] ?? null };
}

/** Cycles (among the analysed ones) where life impact was rated ≥ the nudge score. */
export function heavyImpactCycles(p: PmsPattern) {
  return p.cycles.filter((c) => c.impactMax >= IMPACT_NUDGE.score).length;
}

/**
 * 기분 증상 중심 / 몸 증상 중심 — which group stands out in the analysed cycles.
 * Per cycle, each group's score is its highest symptom average (0–4, days
 * scored ≥1); the two are then averaged over cycles. Only a description of the
 * user's own records, to help choose where to ask — never a diagnosis.
 * ⚠️ 전문가 검토 전 — groups and thresholds await review.
 */
export const MOOD_SYMPTOMS: SymptomId[] = ["low_mood", "anxiety", "irritability", "mood_swings", "tearful", "sensitivity", "hopeless", "guilt", "overwhelmed", "out_of_control", "less_interest", "conflict"];
export const BODY_SYMPTOMS: SymptomId[] = ["cramps", "headache", "bloating", "breast_tenderness", "fatigue", "joint_pain"];
export const FOCUS = {
  /** |mood − body| below this = "비슷함" */
  tie: 0.5,
  /** both group scores below this = nothing stands out */
  minScore: 1,
};
export type SymptomFocus = "mood" | "body" | "both";

export function symptomFocus(cycles: CycleMemory[]): { focus: SymptomFocus | null; mood: number; body: number; n: number } {
  const groupScore = (c: CycleMemory, ids: SymptomId[]) => Math.max(0, ...c.symptoms.filter((s) => ids.includes(s.id)).map((s) => s.avg));
  const n = cycles.length;
  if (!n) return { focus: null, mood: 0, body: 0, n };
  const round = (x: number) => Math.round(x * 10) / 10;
  const mood = round(cycles.reduce((a, c) => a + groupScore(c, MOOD_SYMPTOMS), 0) / n);
  const body = round(cycles.reduce((a, c) => a + groupScore(c, BODY_SYMPTOMS), 0) / n);
  if (mood < FOCUS.minScore && body < FOCUS.minScore) return { focus: null, mood, body, n };
  const focus: SymptomFocus = Math.abs(mood - body) < FOCUS.tie ? "both" : mood > body ? "mood" : "body";
  return { focus, mood, body, n };
}

/** the one line added to the doctor-visit card */
export const DEPARTMENT_LINE: Record<SymptomFocus, string> = {
  mood: "이런 패턴은 정신건강의학과에서도 상담받을 수 있어요.",
  body: "이런 패턴은 보통 산부인과에서 상담받아요.",
  both: "기분 증상과 몸 증상이 비슷하게 기록됐어요. 산부인과와 정신건강의학과 어느 쪽에서든 상담받을 수 있어요.",
};
export const FOCUS_LABEL: Record<SymptomFocus, string> = { mood: "기분 증상 중심", body: "몸 증상 중심", both: "기분·몸 증상이 비슷함" };
