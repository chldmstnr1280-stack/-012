import { addDays, type DateKey } from "./date";
import type { AppData, DailyEntry } from "./data-store";

export type RangeKind = "week" | "month" | "all";

export const AXES = [
  { key: "mood", label: "기분", particle: "이" },
  { key: "energy", label: "에너지", particle: "가" },
  { key: "sleep", label: "수면", particle: "이" },
  { key: "focus", label: "집중", particle: "이" },
  { key: "ease", label: "마음 여유", particle: "가" },
] as const;
export type AxisKey = (typeof AXES)[number]["key"];

function axisValue(e: DailyEntry, k: AxisKey): number | undefined {
  if (k === "mood") return e.mood;
  if (k === "ease") return e.condition.stress != null ? 6 - e.condition.stress : undefined;
  return e.condition[k];
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

export interface RangeStats {
  days: DateKey[];
  recordedDays: number;
  axes: Record<AxisKey, number | null>;
  avgSteps: number | null;
}

function statsFor(data: AppData, days: DateKey[]): RangeStats {
  const entries = days.map((d) => data.entries[d]).filter(Boolean) as DailyEntry[];
  const axes = Object.fromEntries(
    AXES.map(({ key }) => [key, avg(entries.map((e) => axisValue(e, key)).filter((v): v is number => v != null))]),
  ) as Record<AxisKey, number | null>;
  const steps = avg(entries.map((e) => e.steps).filter((v): v is number => v != null));
  return { days, recordedDays: entries.length, axes, avgSteps: steps == null ? null : Math.round(steps) };
}

export function rangeDays(kind: RangeKind, today: DateKey, data: AppData): DateKey[] {
  if (kind === "all") {
    const keys = Object.keys(data.entries).sort();
    if (!keys.length) return [];
    const out: DateKey[] = [];
    for (let k = keys[0]; k <= today; k = addDays(k, 1)) out.push(k);
    return out;
  }
  const n = kind === "week" ? 7 : 30;
  return Array.from({ length: n }, (_, i) => addDays(today, i - n + 1));
}

export interface Report {
  current: RangeStats;
  previous: RangeStats | null;
  title: string;
  summary: string[];
}

export function buildReport(kind: RangeKind, today: DateKey, data: AppData): Report {
  const days = rangeDays(kind, today, data);
  const current = statsFor(data, days);
  let previous: RangeStats | null = null;
  if (kind !== "all") {
    const n = days.length;
    previous = statsFor(data, Array.from({ length: n }, (_, i) => addDays(days[0], i - n)));
    if (!previous.recordedDays) previous = null;
  }
  const title = kind === "week" ? "이번 주의 나" : kind === "month" ? "이번 달의 나" : "지금까지의 나";
  return { current, previous, title, summary: summarize(current, previous) };
}

function summarize(cur: RangeStats, prev: RangeStats | null): string[] {
  if (!cur.recordedDays) return [];
  const mood = cur.axes.mood;
  const first =
    mood == null ? "꾸준히 나를 들여다봤어요." : mood >= 3.8 ? "전체적으로 밝은 흐름이에요." : mood >= 2.8 ? "전체적으로 안정적인 흐름이에요." : "조금 지친 시기였어요. 그래도 잘 버텨줬어요.";

  let second = "";
  if (prev) {
    const gains = AXES.map((a) => ({ a, d: (cur.axes[a.key] ?? 0) - (prev.axes[a.key] ?? 0), ok: cur.axes[a.key] != null && prev.axes[a.key] != null }))
      .filter((g) => g.ok && g.d >= 0.3)
      .sort((x, y) => y.d - x.d);
    const stepsUp = cur.avgSteps != null && prev.avgSteps != null && cur.avgSteps - prev.avgSteps >= 800;
    if (gains.length && stepsUp) second = `특히 ${gains[0].a.label}${gains[0].a.particle === "이" ? "과" : "와"} 활동량이 좋아졌어요! ♡`;
    else if (gains.length >= 2) second = `특히 ${gains[0].a.label}${gains[0].a.particle} 좋아졌고, ${gains[1].a.label}도 올라왔어요 ♡`;
    else if (gains.length) second = `특히 ${gains[0].a.label}${gains[0].a.particle} 좋아졌어요! ♡`;
    else if (stepsUp) second = "특히 활동량이 늘었어요! ♡";
  }
  if (!second) {
    const best = AXES.filter((a) => cur.axes[a.key] != null).sort((x, y) => (cur.axes[y.key] ?? 0) - (cur.axes[x.key] ?? 0))[0];
    second = best ? `${best.label}${best.particle} 가장 든든한 버팀목이었어요 ♡` : "기록해 준 것만으로도 충분해요 ♡";
  }
  return [first, second];
}

export const LEVEL_WORDS = ["낮음", "조금 낮음", "보통", "좋음", "아주 좋음"];
export const levelWord = (v: number) => LEVEL_WORDS[Math.max(0, Math.min(4, Math.round(v) - 1))];
