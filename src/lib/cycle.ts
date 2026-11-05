import { addDays, diffDays, type DateKey } from "./date";

/**
 * Cycle estimates from the period days a user logged.
 * Calendar-method estimates only — for everyday self-care, not medical use.
 */

export const DEFAULT_CYCLE = 28;
export const DEFAULT_PERIOD = 5;
const LUTEAL = 14;

export interface Period {
  start: DateKey;
  end: DateKey;
  length: number;
}

export interface CycleInfo {
  periods: Period[];
  /** lengths between consecutive period starts (plausible ones only) */
  cycleLengths: { start: DateKey; length: number }[];
  avgCycle: number;
  avgPeriod: number;
  hasHistory: boolean;
  /**
   * Cycle lengths vary a lot (range > 7 days) or fall outside 21–35 days.
   * Only a signal that predictions are less certain — not a medical finding.
   */
  irregular: boolean;
  predictedPeriodDays: Set<DateKey>;
  fertileDays: Set<DateKey>;
  ovulationDays: Set<DateKey>;
  nextStart: DateKey | null;
}

/** Group sorted period days into periods; a 1-day gap still counts as the same period. */
export function groupPeriods(days: DateKey[]): Period[] {
  const sorted = [...new Set(days)].sort();
  const out: Period[] = [];
  for (const k of sorted) {
    const last = out[out.length - 1];
    if (last && diffDays(last.end, k) <= 2) {
      last.end = k;
      last.length = diffDays(last.start, k) + 1;
    } else out.push({ start: k, end: k, length: 1 });
  }
  return out;
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

export function analyzeCycle(periodDays: DateKey[], today: DateKey | null, horizon = 3): CycleInfo {
  const periods = groupPeriods(periodDays);
  const cycleLengths: CycleInfo["cycleLengths"] = [];
  for (let i = 1; i < periods.length; i++) {
    const length = diffDays(periods[i - 1].start, periods[i].start);
    if (length >= 15 && length <= 60) cycleLengths.push({ start: periods[i - 1].start, length });
  }
  const recent = cycleLengths.slice(-6).map((c) => c.length);
  const avgCycle = recent.length ? Math.round(mean(recent)) : DEFAULT_CYCLE;
  // the most recent period may still be in progress — don't let it pull the average down
  const finished = periods.filter((p) => !today || diffDays(p.end, today) > 1);
  const avgPeriod = finished.length ? Math.round(mean(finished.slice(-6).map((p) => p.length))) : DEFAULT_PERIOD;

  const predictedPeriodDays = new Set<DateKey>();
  const fertileDays = new Set<DateKey>();
  const ovulationDays = new Set<DateKey>();
  const logged = new Set(periodDays);
  let nextStart: DateKey | null = null;

  const markWindow = (cycleStart: DateKey, length = avgCycle) => {
    const ov = addDays(cycleStart, length - LUTEAL);
    ovulationDays.add(ov);
    for (let i = -5; i <= 1; i++) fertileDays.add(addDays(ov, i));
  };

  if (periods.length) {
    const last = periods[periods.length - 1];
    markWindow(last.start);
    // past cycles: ovulation counted back from the actual next start
    periods.slice(0, -1).forEach((p, i) => markWindow(p.start, diffDays(p.start, periods[i + 1].start)));
    let start = addDays(last.start, avgCycle);
    // keep predictions from landing in the past when logging lapsed
    if (today) while (diffDays(start, today) > avgPeriod) start = addDays(start, avgCycle);
    nextStart = start;
    for (let c = 0; c < horizon; c++) {
      for (let i = 0; i < avgPeriod; i++) {
        const k = addDays(start, i);
        if (!logged.has(k)) predictedPeriodDays.add(k);
      }
      if (c < horizon - 1) markWindow(start);
      start = addDays(start, avgCycle);
    }
  }
  logged.forEach((k) => {
    fertileDays.delete(k);
    ovulationDays.delete(k);
  });

  return {
    periods,
    cycleLengths,
    avgCycle,
    avgPeriod,
    hasHistory: periods.length > 0,
    irregular:
      recent.length >= 2 && (Math.max(...recent) - Math.min(...recent) > 7 || recent.some((l) => l < 21 || l > 35)),
    predictedPeriodDays,
    fertileDays,
    ovulationDays,
    nextStart,
  };
}

export type CyclePhase =
  | { kind: "none" }
  | { kind: "period"; day: number }
  | { kind: "cycle"; day: number; daysToNext: number | null; fertile: boolean; ovulation: boolean };

export function currentPhase(info: CycleInfo, today: DateKey): CyclePhase {
  const past = info.periods.filter((p) => p.start <= today);
  const last = past[past.length - 1];
  if (!last) return { kind: "none" };
  if (today <= last.end) return { kind: "period", day: diffDays(last.start, today) + 1 };
  return {
    kind: "cycle",
    day: diffDays(last.start, today) + 1,
    daysToNext: info.nextStart ? diffDays(today, info.nextStart) : null,
    fertile: info.fertileDays.has(today),
    ovulation: info.ovulationDays.has(today),
  };
}
