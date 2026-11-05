import { COMPARABLE_FOODS, FOOD_IDS, FOOD_LABEL, MEAL_SLOT_IDS, type FoodId } from "@/data/foods";
import type { AppData } from "@/lib/data-store";
import type { DateKey } from "@/lib/date";
import { foodsOn } from "@/lib/pms/tags";

/**
 * What was eaten over a report range — counts and co-occurrence only.
 * Mood comparison uses days that have both a meal record and a mood.
 */
export const MIN_MEAL_DAYS = 3;
const MIN_SIDE = 3;

export interface MealPatterns {
  mealDays: number;
  top: { id: FoodId; label: string; days: number }[];
  vegFruitDays: number;
  skipped: number;
  water: { days: number; avg: number } | null;
  mood: { id: FoodId; label: string; withAvg: number; withoutAvg: number; withDays: number; withoutDays: number }[];
}

const avg = (xs: number[]) => Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10;

export function mealPatterns(data: AppData, days: DateKey[]): MealPatterns | null {
  const mealDays = days.filter((d) => data.meals[d]);
  if (mealDays.length < MIN_MEAL_DAYS) return null;
  const counts = new Map<FoodId, number>();
  let vegFruitDays = 0;
  let skipped = 0;
  for (const d of mealDays) {
    const f = foodsOn(data, d);
    for (const id of f) counts.set(id, (counts.get(id) ?? 0) + 1);
    if (f.has("vegetables") || f.has("fruit")) vegFruitDays++;
    for (const slot of MEAL_SLOT_IDS) if (data.meals[d]?.[slot]?.skipped) skipped++;
  }
  const top = FOOD_IDS.filter((id) => counts.has(id))
    .map((id) => ({ id, label: FOOD_LABEL[id], days: counts.get(id)! }))
    .sort((a, b) => b.days - a.days)
    .slice(0, 5);

  const waterDays = days.filter((d) => (data.water[d] ?? 0) > 0);
  const water = waterDays.length ? { days: waterDays.length, avg: avg(waterDays.map((d) => data.water[d])) } : null;

  const withMood = mealDays.filter((d) => data.entries[d]?.mood != null);
  const mood: MealPatterns["mood"] = [];
  for (const id of COMPARABLE_FOODS) {
    const w = withMood.filter((d) => foodsOn(data, d).has(id)).map((d) => data.entries[d].mood!);
    const wo = withMood.filter((d) => !foodsOn(data, d).has(id)).map((d) => data.entries[d].mood!);
    if (w.length >= MIN_SIDE && wo.length >= MIN_SIDE) mood.push({ id, label: FOOD_LABEL[id], withAvg: avg(w), withoutAvg: avg(wo), withDays: w.length, withoutDays: wo.length });
  }
  mood.sort((a, b) => Math.abs(b.withAvg - b.withoutAvg) - Math.abs(a.withAvg - a.withoutAvg));
  return { mealDays: mealDays.length, top, vegFruitDays, skipped, water, mood: mood.slice(0, 3) };
}
