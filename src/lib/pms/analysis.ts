import { addDays, diffDays, type DateKey } from "@/lib/date";
import type { SymptomDay } from "@/lib/data-store";
import { groupPeriods } from "@/lib/cycle";
import { IMPACT_IDS, SYMPTOM_IDS, type SymptomId } from "@/data/pmsSymptoms";

/**
 * PMS Cycle Memory (Phase B) — descriptive statistics of what the user recorded,
 * aligned to each logged (actual) period start. Not a diagnosis of PMS/PMDD.
 *
 * Rules (documented so the numbers can be checked):
 *  - Pre-period window: the 14 days before a logged period start (day −14 … −1),
 *    cut short so it never overlaps the previous period.
 *  - After-start window: period days +2 … +6 (to see whether symptoms eased).
 *  - Only recorded days count. A day with no entry is "not recorded", never 0.
 *    A day with only impact ratings is not a symptom record (its impact still counts).
 *    An explicit "no symptoms" day counts as 0 for every symptom.
 *  - A "symptom day" has at least one symptom scored ≥ 1.
 *  - Onset = how many days before the start the earliest symptom day was.
 *  - Average intensity = mean of the scores ≥ 1 on symptom days (how strong it felt when present);
 *    per-symptom average uses that symptom's scores ≥ 1.
 *  - A cycle is "analysable" when its pre window has ≥ 3 recorded days.
 */
export const PRE_DAYS = 14;
const MIN_RECORDED = 3;

export interface SymptomStat {
  id: SymptomId;
  days: number; // days scored ≥ 1
  max: number;
  avg: number; // mean of scores ≥ 1
}

export interface DayCell {
  date: DateKey;
  offset: number; // relative to the period start (−14 … +6)
  recorded: boolean;
  /** highest symptom score that day (0 if recorded with none) */
  max: number;
}

export interface CycleMemory {
  start: DateKey;
  windowStart: DateKey;
  recordedDays: number;
  windowDays: number;
  analysable: boolean;
  symptomDays: number;
  /** earliest symptom day, in days before the start (null = none recorded) */
  onset: number | null;
  avgIntensity: number | null;
  maxIntensity: number;
  symptoms: SymptomStat[];
  impactAvg: number | null; // mean of the 3 impact items over recorded days that rated any
  impactMax: number;
  /** after-start comparison (null when too few days were recorded after the start) */
  afterAvg: number | null;
  eased: "lower" | "similar" | "higher" | null;
  cells: DayCell[];
}

export interface PmsPattern {
  /** analysable cycles, newest first (max 6) */
  cycles: CycleMemory[];
  enough: boolean; // ≥ 2 analysable cycles
  typicalOnset: number | null; // median onset across analysable cycles
  typicalSymptomDays: number | null;
  /** symptoms present before ≥ 2 cycles, most frequent first */
  repeated: { id: SymptomId; cycles: number; avg: number }[];
  /** the current (next) cycle so far, before its predicted start */
  current: CycleMemory | null;
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const round1 = (v: number | null) => (v == null ? null : Math.round(v * 10) / 10);
const median = (xs: number[]) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/** A day counts as a symptom record only if it rated a symptom or said "no symptoms" (impact-only days don't). */
export function hasSymptomRecord(day: SymptomDay | undefined): day is SymptomDay {
  return !!day && (!!day.none || Object.values(day.scores).some((v) => v != null));
}

function scoresOf(day: SymptomDay): Partial<Record<SymptomId, number>> {
  if (day.none) return Object.fromEntries(SYMPTOM_IDS.map((id) => [id, 0]));
  return day.scores;
}

export function memoryFor(start: DateKey, windowStart: DateKey, symptoms: Record<DateKey, SymptomDay>, lastDay?: DateKey): CycleMemory {
  const cells: DayCell[] = [];
  const perSymptom = new Map<SymptomId, number[]>();
  const strengths: number[] = [];
  const impacts: number[] = [];
  let impactMax = 0;
  let recordedDays = 0;
  let symptomDays = 0;
  let onset: number | null = null;
  let maxIntensity = 0;

  const windowDays = diffDays(windowStart, start);
  for (let k = windowStart; k < start; k = addDays(k, 1)) {
    if (lastDay && k > lastDay) break;
    const raw = symptoms[k];
    const offset = diffDays(start, k); // negative
    const imp = raw ? IMPACT_IDS.map((id) => raw.impact[id]).filter((v): v is NonNullable<typeof v> => v != null) : [];
    if (imp.length) {
      impacts.push(...imp);
      impactMax = Math.max(impactMax, ...imp);
    }
    const d = hasSymptomRecord(raw) ? raw : undefined;
    if (!d) {
      cells.push({ date: k, offset, recorded: false, max: 0 });
      continue;
    }
    recordedDays++;
    const sc = scoresOf(d);
    const present = Object.entries(sc).filter(([, v]) => (v ?? 0) >= 1) as [SymptomId, number][];
    const dayMax = Math.max(0, ...present.map(([, v]) => v));
    cells.push({ date: k, offset, recorded: true, max: dayMax });
    if (present.length) {
      symptomDays++;
      if (onset == null) onset = -offset;
      maxIntensity = Math.max(maxIntensity, dayMax);
      for (const [id, v] of present) {
        strengths.push(v);
        perSymptom.set(id, [...(perSymptom.get(id) ?? []), v]);
      }
    }
  }

  // after the start: +2 … +6
  const after: number[] = [];
  let afterRecorded = 0;
  for (let i = 0; i <= 6; i++) {
    const k = addDays(start, i);
    if (lastDay && k > lastDay) break;
    const d = hasSymptomRecord(symptoms[k]) ? symptoms[k] : undefined;
    cells.push({ date: k, offset: i, recorded: !!d, max: d ? Math.max(0, ...Object.values(scoresOf(d)).map((v) => v ?? 0)) : 0 });
    if (i < 2 || !d) continue;
    afterRecorded++;
    const vals = Object.values(scoresOf(d)).map((v) => v ?? 0);
    after.push(vals.length ? Math.max(...vals) : 0);
  }

  const symptomsStats: SymptomStat[] = [...perSymptom.entries()]
    .map(([id, vs]) => ({ id, days: vs.length, max: Math.max(...vs), avg: round1(mean(vs))! }))
    .sort((a, b) => b.days - a.days || b.avg - a.avg);

  // compare the typical daily peak before vs after the start
  const beforePeaks = cells.filter((c) => c.offset < 0 && c.recorded).map((c) => c.max);
  const bp = mean(beforePeaks);
  const ap = afterRecorded >= 2 ? mean(after) : null;
  const eased = bp == null || ap == null ? null : ap <= bp - 0.5 ? "lower" : ap >= bp + 0.5 ? "higher" : "similar";

  return {
    start,
    windowStart,
    recordedDays,
    windowDays,
    analysable: recordedDays >= MIN_RECORDED,
    symptomDays,
    onset,
    avgIntensity: round1(mean(strengths)),
    maxIntensity,
    symptoms: symptomsStats,
    impactAvg: round1(mean(impacts)),
    impactMax,
    afterAvg: round1(ap),
    eased,
    cells,
  };
}

export function analysePms(periodDays: DateKey[], symptoms: Record<DateKey, SymptomDay>, today: DateKey, nextStart: DateKey | null): PmsPattern {
  const periods = groupPeriods(periodDays).filter((p) => p.start <= today);
  const memories: CycleMemory[] = periods.map((p, i) => {
    const prevEnd = i > 0 ? periods[i - 1].end : null;
    let ws = addDays(p.start, -PRE_DAYS);
    if (prevEnd && ws <= prevEnd) ws = addDays(prevEnd, 1);
    return memoryFor(p.start, ws, symptoms, today);
  });
  const cycles = memories.filter((m) => m.analysable).reverse().slice(0, 6);
  const enough = cycles.length >= 2;

  const counts = new Map<SymptomId, { cycles: number; avgs: number[] }>();
  for (const c of cycles) for (const s of c.symptoms) {
    const e = counts.get(s.id) ?? { cycles: 0, avgs: [] };
    e.cycles++;
    e.avgs.push(s.avg);
    counts.set(s.id, e);
  }
  const repeated = [...counts.entries()]
    .filter(([, e]) => e.cycles >= 2)
    .map(([id, e]) => ({ id, cycles: e.cycles, avg: round1(mean(e.avgs))! }))
    .sort((a, b) => b.cycles - a.cycles || b.avg - a.avg);

  let current: CycleMemory | null = null;
  if (nextStart && nextStart > today) {
    const last = periods[periods.length - 1];
    let ws = addDays(nextStart, -PRE_DAYS);
    if (last && ws <= last.end) ws = addDays(last.end, 1);
    if (ws <= today) current = memoryFor(nextStart, ws, symptoms, today);
  }

  const onsets = cycles.map((c) => c.onset).filter((v): v is number => v != null);
  return {
    cycles,
    enough,
    typicalOnset: enough ? median(onsets) : null,
    typicalSymptomDays: enough ? median(cycles.map((c) => c.symptomDays)) : null,
    repeated,
    current,
  };
}

/**
 * Days that may fall in the pre-period symptom window of the next cycle, for
 * the calendar. Shown only with ≥ 2 analysable cycles, and only as a reference
 * ("참고"): it is the typical onset applied to a calendar-method prediction.
 */
export function expectedPmsDays(pattern: PmsPattern, nextStart: DateKey | null): Set<DateKey> {
  const out = new Set<DateKey>();
  if (!pattern.enough || pattern.typicalOnset == null || !nextStart) return out;
  const onset = Math.min(PRE_DAYS, Math.max(1, Math.round(pattern.typicalOnset)));
  for (let i = onset; i >= 1; i--) out.add(addDays(nextStart, -i));
  return out;
}
