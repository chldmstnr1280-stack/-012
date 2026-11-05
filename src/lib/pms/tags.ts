import { tagsOf, type ContextTagId } from "@/data/contextTags";
import type { AppData } from "@/lib/data-store";
import { addDays, type DateKey } from "@/lib/date";
import { hasSymptomRecord } from "./analysis";

/**
 * Context tags next to symptoms — descriptive only.
 * Compares the day's highest symptom score on days with a tag vs recorded days
 * without it. Only days with a symptom record count (no record ≠ 0).
 * Shown only when both groups have at least MIN_DAYS days. Never a cause.
 */
export const LOOKBACK_DAYS = 180;
export const MIN_DAYS = 3;

export interface TagCompare {
  id: ContextTagId;
  taggedDays: number;
  otherDays: number;
  taggedAvg: number;
  otherAvg: number;
  /** taggedAvg vs otherAvg, using a 0.5-point band */
  direction: "higher" | "similar" | "lower";
}

export interface TagSummary {
  rows: TagCompare[];
  /** tags used, but on too few recorded days to compare yet */
  pending: { id: ContextTagId; taggedDays: number }[];
  recordedDays: number;
  anyTags: boolean;
}

const avg = (xs: number[]) => Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10;

export function compareTags(data: AppData, today: DateKey): TagSummary {
  const from = addDays(today, -LOOKBACK_DAYS);
  const days = Object.entries(data.symptoms)
    .filter(([k, d]) => k >= from && k <= today && hasSymptomRecord(d))
    .map(([k, d]) => ({ k, max: d.none ? 0 : Math.max(0, ...Object.values(d.scores).map((v) => v ?? 0)), tags: new Set(data.dayTags[k]?.tags ?? []) }));
  const anyTags = Object.keys(data.dayTags).some((k) => k >= from && k <= today);

  const rows: TagCompare[] = [];
  const pending: TagSummary["pending"] = [];
  // situations and body states only: feelings and wants move with symptoms by nature
  for (const id of [...tagsOf("situation"), ...tagsOf("state")]) {
    const withTag = days.filter((d) => d.tags.has(id)).map((d) => d.max);
    if (!withTag.length) continue;
    const without = days.filter((d) => !d.tags.has(id)).map((d) => d.max);
    if (withTag.length < MIN_DAYS || without.length < MIN_DAYS) {
      pending.push({ id, taggedDays: withTag.length });
      continue;
    }
    const t = avg(withTag);
    const o = avg(without);
    rows.push({ id, taggedDays: withTag.length, otherDays: without.length, taggedAvg: t, otherAvg: o, direction: t >= o + 0.5 ? "higher" : t <= o - 0.5 ? "lower" : "similar" });
  }
  rows.sort((a, b) => Math.abs(b.taggedAvg - b.otherAvg) - Math.abs(a.taggedAvg - a.otherAvg) || b.taggedDays - a.taggedDays);
  return { rows, pending, recordedDays: days.length, anyTags };
}
