import { CONTEXT_TAG_LABEL, tagsOf } from "@/data/contextTags";
import { COMPARABLE_FOODS, FOOD_LABEL, MEAL_SLOT_IDS, type FoodId } from "@/data/foods";
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
  id: string;
  label: string;
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
  pending: { id: string; label: string; taggedDays: number }[];
  /** the same comparison for foods (only days with both a symptom and a meal record) */
  foods: TagCompare[];
  foodPending: { id: string; label: string; taggedDays: number }[];
  recordedDays: number;
  anyTags: boolean;
}

/** with-vs-without for one item over a set of days; null if either side is too small */
function compareItem(id: string, label: string, days: { max: number; has: boolean }[]): TagCompare | { pending: true; id: string; label: string; taggedDays: number } | null {
  const withIt = days.filter((d) => d.has).map((d) => d.max);
  if (!withIt.length) return null;
  const without = days.filter((d) => !d.has).map((d) => d.max);
  // too few days *with* it → "a few more days"; too few days *without* it (eaten/tagged almost always) → nothing to compare
  if (withIt.length < MIN_DAYS) return { pending: true, id, label, taggedDays: withIt.length };
  if (without.length < MIN_DAYS) return null;
  const t = avg(withIt);
  const o = avg(without);
  return { id, label, taggedDays: withIt.length, otherDays: without.length, taggedAvg: t, otherAvg: o, direction: t >= o + 0.5 ? "higher" : t <= o - 0.5 ? "lower" : "similar" };
}

/** food kinds eaten on a day, across all meals */
export function foodsOn(data: AppData, day: DateKey): Set<FoodId> {
  const m = data.meals[day];
  const out = new Set<FoodId>();
  if (m) for (const slot of MEAL_SLOT_IDS) for (const f of m[slot]?.foods ?? []) out.add(f);
  return out;
}

const avg = (xs: number[]) => Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10;

export function compareTags(data: AppData, today: DateKey): TagSummary {
  const from = addDays(today, -LOOKBACK_DAYS);
  const days = Object.entries(data.symptoms)
    .filter(([k, d]) => k >= from && k <= today && hasSymptomRecord(d))
    .map(([k, d]) => ({ k, max: d.none ? 0 : Math.max(0, ...Object.values(d.scores).map((v) => v ?? 0)), tags: new Set(data.dayTags[k]?.tags ?? []) }));
  const anyTags = Object.keys(data.dayTags).some((k) => k >= from && k <= today) || Object.keys(data.meals).some((k) => k >= from && k <= today);

  const split = (items: { id: string; label: string; has: (d: (typeof days)[number]) => boolean }[], pool: typeof days) => {
    const rows: TagCompare[] = [];
    const pending: TagSummary["pending"] = [];
    for (const it of items) {
      const r = compareItem(it.id, it.label, pool.map((d) => ({ max: d.max, has: it.has(d) })));
      if (!r) continue;
      if ("pending" in r) pending.push({ id: r.id, label: r.label, taggedDays: r.taggedDays });
      else rows.push(r);
    }
    rows.sort((a, b) => Math.abs(b.taggedAvg - b.otherAvg) - Math.abs(a.taggedAvg - a.otherAvg) || b.taggedDays - a.taggedDays);
    return { rows, pending };
  };

  // situations and body states only: feelings and wants move with symptoms by nature
  const tagged = split(
    [...tagsOf("situation"), ...tagsOf("state")].map((id) => ({ id, label: CONTEXT_TAG_LABEL[id], has: (d) => d.tags.has(id) })),
    days,
  );
  // foods: only days that have a meal record too (no meal record ≠ "didn't eat it")
  const withMeals = days.filter((d) => !!data.meals[d.k]).map((d) => ({ ...d, foods: foodsOn(data, d.k) }));
  const foods = split(
    COMPARABLE_FOODS.map((id) => ({ id, label: FOOD_LABEL[id], has: (d) => (d as (typeof withMeals)[number]).foods.has(id) })),
    withMeals,
  );
  return { rows: tagged.rows, pending: tagged.pending, foods: foods.rows, foodPending: foods.pending, recordedDays: days.length, anyTags };
}
