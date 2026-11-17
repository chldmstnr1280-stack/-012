import { analyzeCycle, type CycleInfo } from "@/lib/cycle";
import { getData, setData, type AppData } from "@/lib/data-store";
import { addDays, diffDays, type DateKey } from "@/lib/date";
import { analysePms } from "@/lib/pms/analysis";
import { forecastPms, type PmsForecast } from "@/lib/pms/forecast";

/**
 * 이번 달 나의 리듬 — the month laid out around the user's own cycle, so the
 * pre-period week can be planned for instead of arriving as a surprise.
 *
 * Everything shown is either recorded by the user or an estimate that says so:
 * period days (logged / predicted), the expected pre-period window (only from
 * the user's own pattern — records, look-backs or what she said is usual), and
 * the plans she marks herself (important day ☆ / rest slot ☁️).
 * No claims about energy or mood by phase: nothing here says how she will feel.
 */
export interface DayPlan {
  important?: true;
  rest?: true;
  /** a few words (this device and the backup file only) */
  label?: string;
  updatedAt: number;
}

export interface Rhythm {
  info: CycleInfo;
  fc: PmsForecast;
  /** expected pre-period days over the next few predicted cycles (empty while an estimate has passed) */
  pms: Set<DateKey>;
  /** each expected pre-period window: first and last day, and the predicted start it leads to */
  windows: { from: DateKey; to: DateKey; start: DateKey }[];
}

export function rhythmOf(data: AppData, today: DateKey): Rhythm {
  const info = analyzeCycle(data.periodDays, today);
  const fc = forecastPms(data, info, analysePms(data.periodDays, data.symptoms, today, info.nextStart));
  const pms = new Set<DateKey>();
  const windows: Rhythm["windows"] = [];
  if (!fc.paused && fc.nextStart && fc.onset != null) {
    const days = Math.min(14, Math.max(1, fc.onset));
    for (let c = 0; c < 3; c++) {
      const start = addDays(fc.nextStart, c * info.avgCycle);
      const from = addDays(start, -days);
      const to = addDays(start, -1);
      windows.push({ from, to, start });
      for (let i = days; i >= 1; i--) pms.add(addDays(start, -i));
    }
  }
  return { info, fc, pms, windows };
}

export type DayKind = "period" | "period-predicted" | "pms" | null;

export function dayKind(r: Rhythm, periodDays: Set<DateKey>, day: DateKey): DayKind {
  if (periodDays.has(day)) return "period";
  if (r.info.predictedPeriodDays.has(day) && !r.fc.paused) return "period-predicted";
  if (r.pms.has(day)) return "pms";
  return null;
}

/** Important days that fall inside an expected pre-period window (only future ones). */
export function overlaps(plan: Record<DateKey, DayPlan>, r: Rhythm, today: DateKey): DateKey[] {
  return Object.entries(plan)
    .filter(([d, p]) => p.important && d >= today && r.pms.has(d))
    .map(([d]) => d)
    .sort();
}

export function setPlan(day: DateKey, patch: Partial<Omit<DayPlan, "updatedAt">>) {
  setData((d) => {
    const cur = d.plan?.[day] ?? { updatedAt: 0 };
    const next: DayPlan = { ...cur, ...patch, updatedAt: Date.now() };
    if (!next.important) delete next.important;
    if (!next.rest) delete next.rest;
    if (!next.label?.trim()) delete next.label;
    else next.label = next.label.trim().slice(0, 20);
    const plan = { ...(d.plan ?? {}) };
    if (next.important || next.rest || next.label) plan[day] = next;
    else delete plan[day];
    return { ...d, plan };
  });
}

/** Rest slots already set inside a window */
export function restIn(plan: Record<DateKey, DayPlan>, from: DateKey, to: DateKey) {
  return Object.entries(plan).filter(([d, p]) => p.rest && d >= from && d <= to).length;
}

export const daysUntil = (today: DateKey, day: DateKey) => diffDays(today, day);
export const planOf = () => getData().plan ?? {};

/* ---------- backup ---------- */
export function cleanPlan(v: unknown): Record<DateKey, DayPlan> {
  const out: Record<DateKey, DayPlan> = {};
  if (typeof v !== "object" || v === null) return out;
  for (const [k, raw] of Object.entries(v as Record<string, unknown>)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(k) || typeof raw !== "object" || raw === null) continue;
    const o = raw as Record<string, unknown>;
    const p: DayPlan = { updatedAt: typeof o.updatedAt === "number" ? o.updatedAt : 0 };
    if (o.important === true) p.important = true;
    if (o.rest === true) p.rest = true;
    if (typeof o.label === "string" && o.label.trim()) p.label = o.label.trim().slice(0, 20);
    if (p.important || p.rest || p.label) out[k] = p;
  }
  return out;
}
