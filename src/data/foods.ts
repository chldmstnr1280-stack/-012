/**
 * What I ate — food kinds, not amounts. No calories, no "good/bad" labels:
 * these only let the report show what was recorded alongside mood and symptoms.
 * Ids are stable (never rename; add new ones).
 */
export const MEAL_SLOTS = [
  { id: "breakfast", label: "아침", emoji: "🌤️" },
  { id: "lunch", label: "점심", emoji: "☀️" },
  { id: "dinner", label: "저녁", emoji: "🌙" },
  { id: "snack", label: "간식", emoji: "🍪" },
] as const;
export type MealSlot = (typeof MEAL_SLOTS)[number]["id"];
export const MEAL_SLOT_IDS = MEAL_SLOTS.map((m) => m.id) as MealSlot[];

export const FOOD_GROUPS = [
  { id: "staple", label: "주식", items: [{ id: "rice", label: "밥" }, { id: "noodles", label: "면" }, { id: "bread", label: "빵" }] },
  { id: "side", label: "반찬·곁들임", items: [{ id: "protein", label: "고기·생선·달걀·두부" }, { id: "vegetables", label: "채소·나물" }, { id: "fruit", label: "과일" }, { id: "dairy", label: "우유·요거트·치즈" }, { id: "soup", label: "국·찌개" }] },
  { id: "treat", label: "간식·음료", items: [{ id: "sweets", label: "단 것" }, { id: "salty_snack", label: "짠 과자·야식" }, { id: "coffee", label: "커피·카페인 음료" }, { id: "sweet_drink", label: "단 음료" }, { id: "alcohol", label: "술" }] },
  { id: "how", label: "어떻게", items: [{ id: "home_cooked", label: "집밥" }, { id: "eating_out", label: "외식·배달" }, { id: "instant", label: "간편식" }] },
] as const;

export type FoodId = (typeof FOOD_GROUPS)[number]["items"][number]["id"];
export const FOOD_IDS = FOOD_GROUPS.flatMap((g) => g.items.map((i) => i.id)) as FoodId[];
export const FOOD_LABEL = Object.fromEntries(FOOD_GROUPS.flatMap((g) => g.items.map((i) => [i.id, i.label]))) as Record<FoodId, string>;
/** foods worth comparing with how the day felt (not "how" — that's context) */
export const COMPARABLE_FOODS: FoodId[] = ["vegetables", "fruit", "dairy", "protein", "sweets", "salty_snack", "coffee", "sweet_drink", "alcohol", "eating_out", "instant"];
