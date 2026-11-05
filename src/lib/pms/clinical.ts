import { IMPACT_IDS, SYMPTOM_IDS, type ImpactId, type SymptomId } from "@/data/pmsSymptoms";
import { analyzeCycle } from "@/lib/cycle";
import type { AppData } from "@/lib/data-store";
import type { DateKey } from "@/lib/date";
import { analysePms, hasSymptomRecord, type CycleMemory, type PmsPattern } from "./analysis";
import { IMPACT_NUDGE } from "@/data/safety";

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
  const rows = SYMPTOM_IDS.filter((id) => seen.has(id));
  const impactRows = IMPACT_IDS.filter((id) => cycles.some((c) => c.cells.some((x) => data.symptoms[x.date]?.impact[id] != null)));
  const dates = cycles.flatMap((c) => c.cells.map((x) => x.date)).sort();
  return { cycles, rows, impactRows, info, pattern, from: dates[0] ?? null, to: dates[dates.length - 1] ?? null };
}

/** Cycles (among the analysed ones) where life impact was rated ≥ the nudge score. */
export function heavyImpactCycles(p: PmsPattern) {
  return p.cycles.filter((c) => c.impactMax >= IMPACT_NUDGE.score).length;
}
