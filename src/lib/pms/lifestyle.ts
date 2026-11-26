import { analyzeCycle, groupPeriods } from "@/lib/cycle";
import type { AppData } from "@/lib/data-store";
import { addDays, diffDays, type DateKey } from "@/lib/date";

/**
 * 생활과 주기 — how the user's own cycles went next to her own records of sleep,
 * stress, energy and mood. It only describes: "cycles where sleep was short
 * started N days later than expected, on average". Never "because of".
 *
 * A cycle here = the days from one logged start to the day before the next; its
 * "diff" = how far that next start was from what was expected (predictionLog, or
 * the same calculation redone from the records when the log has no entry).
 * Unrecorded days are left out (missing ≠ "fine").
 * ⚠️ 전문가 검토 전 — thresholds below await review.
 */
export const LIFESTYLE = {
  /** cycles with an estimate and enough records before anything is compared */
  minCycles: 3,
  /** days with a sleep/stress/energy/mood record a cycle needs to be described */
  minRecordedDays: 4,
  /** average sleep (1 거의 못 잤어요 … 5 푹 잤어요) at or below this = "잠이 부족했던 주기" */
  sleepLow: 2.5,
  /** average stress (1 거의 없어요 … 5 아주 많아요) at or above this = "스트레스가 많았던 주기" */
  stressHigh: 3.5,
  /** average mood (1–5) at or below this = "기분이 가라앉았던 주기" */
  moodLow: 2.5,
  /** recorded days this cycle needs before the "may be later" line can show */
  currentMinDays: 3,
  /** look back this many cycles at most */
  maxCycles: 12,
};

export interface CycleLife {
  /** the start this cycle led to (the one that was predicted) */
  start: DateKey;
  from: DateKey;
  to: DateKey;
  /** start − expected (days, + = later); null = no estimate existed */
  diff: number | null;
  diffSource: "log" | "records";
  /** days with any of sleep/stress/energy/mood recorded */
  days: number;
  sleep: number | null;
  stress: number | null;
  energy: number | null;
  mood: number | null;
}

export type FactorId = "sleep" | "stress" | "mood";
export interface Comparison {
  factor: FactorId;
  flagged: { n: number; meanDiff: number };
  other: { n: number; meanDiff: number };
}

export interface LifestyleLink {
  cycles: CycleLife[];
  /** cycles that have both an estimate and enough records */
  usable: number;
  enough: boolean;
  comparisons: Comparison[];
  /** the cycle going on now (last start → today) */
  current: { from: DateKey; days: number; sleep: number | null; stress: number | null; sleepLow: boolean; stressHigh: boolean } | null;
  /** show "이번 달은 평소보다 늦어질 수 있어요" next to the expected date */
  mayBeLater: boolean;
}

const avg = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null);

/** hours slept (PMS record) → the 1–5 sleep scale, for days without a sleep rating */
export function hoursToScale(h: number): number {
  return h < 5 ? 1 : h < 6 ? 2 : h < 7 ? 3 : h < 8 ? 4 : 5;
}

function describe(data: AppData, from: DateKey, to: DateKey) {
  const sleep: number[] = [];
  const stress: number[] = [];
  const energy: number[] = [];
  const mood: number[] = [];
  let days = 0;
  for (let d = from; d <= to; d = addDays(d, 1)) {
    const e = data.entries?.[d];
    const hours = data.symptoms?.[d]?.sleepHours;
    const s = e?.condition?.sleep ?? (typeof hours === "number" ? hoursToScale(hours) : undefined);
    const t = e?.condition?.stress;
    const g = e?.condition?.energy;
    const m = e?.mood;
    if (s != null) sleep.push(s);
    if (t != null) stress.push(t);
    if (g != null) energy.push(g);
    if (m != null) mood.push(m);
    if (s != null || t != null || g != null || m != null) days++;
  }
  return { days, sleep: avg(sleep), stress: avg(stress), energy: avg(energy), mood: avg(mood) };
}

export const flags = (c: { sleep: number | null; stress: number | null; mood?: number | null }) => ({
  sleep: c.sleep != null && c.sleep <= LIFESTYLE.sleepLow,
  stress: c.stress != null && c.stress >= LIFESTYLE.stressHigh,
  mood: c.mood != null && c.mood <= LIFESTYLE.moodLow,
});

export function lifestyleLink(data: AppData, today: DateKey): LifestyleLink {
  const periodDays = (data.periodDays ?? []).filter((d) => d <= today);
  const periods = groupPeriods(periodDays);
  const log = data.predictionLog ?? [];
  const cycles: CycleLife[] = [];
  for (let i = Math.max(1, periods.length - LIFESTYLE.maxCycles); i < periods.length; i++) {
    const from = periods[i - 1].start;
    const start = periods[i].start;
    const to = addDays(start, -1);
    const logged = log.find((e) => e.start === start && e.diff != null);
    let diff: number | null = logged?.diff ?? null;
    if (diff == null) {
      // the same estimate logNewStart makes, redone from the days before this start
      const expected = analyzeCycle(periodDays.filter((d) => d < start), start).expectedStart;
      diff = expected ? diffDays(expected, start) : null;
    }
    cycles.push({ start, from, to, diff, diffSource: logged ? "log" : "records", ...describe(data, from, to) });
  }

  const usableCycles = cycles.filter((c) => c.diff != null && c.days >= LIFESTYLE.minRecordedDays);
  const enough = usableCycles.length >= LIFESTYLE.minCycles;
  const comparisons: Comparison[] = [];
  if (enough) {
    for (const factor of ["sleep", "stress", "mood"] as FactorId[]) {
      const known = usableCycles.filter((c) => c[factor] != null);
      const flagged = known.filter((c) => flags(c)[factor]);
      const other = known.filter((c) => !flags(c)[factor]);
      if (!flagged.length || !other.length) continue;
      comparisons.push({
        factor,
        flagged: { n: flagged.length, meanDiff: avg(flagged.map((c) => c.diff!))! },
        other: { n: other.length, meanDiff: avg(other.map((c) => c.diff!))! },
      });
    }
  }

  const last = periods[periods.length - 1];
  let current: LifestyleLink["current"] = null;
  if (last && !periodDays.includes(today)) {
    const d = describe(data, last.start, today);
    const f = flags(d);
    current = { from: last.start, days: d.days, sleep: d.sleep, stress: d.stress, sleepLow: f.sleep, stressHigh: f.stress };
  }
  const info = periods.length ? analyzeCycle(periodDays, today) : null;
  const mayBeLater = !!current && !!info?.nextStart && info.overdue === 0 && current.days >= LIFESTYLE.currentMinDays && (current.sleepLow || current.stressHigh);

  return { cycles, usable: usableCycles.length, enough, comparisons, current, mayBeLater };
}

/** "예상보다 평균 4일 늦게" / "예상보다 평균 2일 일찍" / "예상한 날 즈음" */
export function diffPhrase(d: number): string {
  const r = Math.round(Math.abs(d) * 10) / 10;
  if (r < 1) return "예상한 날 즈음";
  return `예상보다 평균 ${r}일 ${d > 0 ? "늦게" : "일찍"}`;
}

export const FACTOR_LABEL: Record<FactorId, { flagged: string; other: string }> = {
  sleep: { flagged: "잠이 부족했던 주기", other: "잠을 비교적 잘 잔 주기" },
  stress: { flagged: "스트레스가 많았던 주기", other: "스트레스가 덜했던 주기" },
  mood: { flagged: "기분이 가라앉았던 주기", other: "기분이 비교적 괜찮았던 주기" },
};
