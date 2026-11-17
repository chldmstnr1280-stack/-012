import { analyzeCycle, groupPeriods } from "@/lib/cycle";
import { diffDays, toKey, type DateKey } from "@/lib/date";

/**
 * 생리 지연 돌봄 — when the expected start has passed with no new period logged.
 * A passed estimate is only that: the period may have started without being
 * logged, the estimate may be off, or it may be late. Nothing here concludes
 * which, and nothing guesses about pregnancy.
 */
export type LateAnswer = "started" | "not_yet" | "later";

export interface LateCheck {
  /** the expected start the question was about */
  expected: DateKey;
  answer: LateAnswer;
  at: number;
}

/** A logged period start compared with the estimate that stood before it. */
export interface PredictionEntry {
  start: DateKey;
  /** the start expected from the records before it (null = there was no estimate) */
  expected: DateKey | null;
  /** start − expected, in days (positive = later than expected) */
  diff: number | null;
  /** how many cycle lengths the estimate rested on (0 = the default 28 days) */
  basis: number;
  irregular: boolean;
  at: number;
}

/**
 * Called when period days are added. If the change creates a period start after
 * the last one, record it against the estimate made from the earlier days.
 * Returns the updated log, or null when nothing new started.
 */
export function logNewStart(before: DateKey[], after: DateKey[], log: PredictionEntry[]): PredictionEntry[] | null {
  const prev = groupPeriods(before);
  const next = groupPeriods(after);
  const lastPrev = prev[prev.length - 1];
  const fresh = next.filter((p) => (!lastPrev || p.start > lastPrev.end) && !prev.some((q) => q.start === p.start));
  if (!fresh.length || !lastPrev) return null;
  const start = fresh[0].start;
  if (log.some((e) => e.start === start)) return null;
  const info = analyzeCycle(before, start);
  const expected = info.expectedStart;
  const entry: PredictionEntry = { start, expected, diff: expected ? diffDays(expected, start) : null, basis: info.basis, irregular: info.irregular, at: Date.now() };
  return [...log, entry].slice(-36);
}

/** The answer already given for this expected start (today's "later" only lasts today). */
export function answerFor(checks: LateCheck[], expected: DateKey, today: DateKey): LateAnswer | null {
  const c = [...checks].reverse().find((x) => x.expected === expected);
  if (!c) return null;
  if (c.answer === "later" && toKey(new Date(c.at)) !== today) return null;
  return c.answer;
}

/** Days since the last logged period started (null = none logged). */
export function daysSinceLastStart(periodDays: DateKey[], today: DateKey): number | null {
  const ps = groupPeriods(periodDays).filter((p) => p.start <= today);
  return ps.length ? diffDays(ps[ps.length - 1].start, today) : null;
}

/** How the recent estimates did: mean absolute difference over the last entries with a diff. */
export function estimateAccuracy(log: PredictionEntry[]): { n: number; meanAbs: number | null } {
  const d = log.filter((e) => e.diff != null).slice(-6).map((e) => Math.abs(e.diff!));
  return { n: d.length, meanAbs: d.length ? Math.round((d.reduce((a, b) => a + b, 0) / d.length) * 10) / 10 : null };
}
