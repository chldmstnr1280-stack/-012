/**
 * Water & supplement check-in. Records only — no calories, no judging food,
 * no supplement advice (see README §30). Nutrient tags exist so the app can
 * later point out *overlaps* ("two of your products list vitamin D — ask a
 * pharmacist"), never to recommend a product or a dose.
 */
export const WATER_CUP_ML = 200;
export const DEFAULT_WATER_GOAL = 8; // cups — the user sets their own

export const NUTRIENTS = [
  { id: "multi", label: "종합비타민" },
  { id: "vitamin_d", label: "비타민 D" },
  { id: "vitamin_b", label: "비타민 B군" },
  { id: "vitamin_c", label: "비타민 C" },
  { id: "calcium", label: "칼슘" },
  { id: "magnesium", label: "마그네슘" },
  { id: "iron", label: "철분" },
  { id: "zinc", label: "아연" },
  { id: "folate", label: "엽산" },
  { id: "omega3", label: "오메가3" },
  { id: "probiotics", label: "유산균" },
  { id: "other", label: "기타" },
] as const;
export type NutrientId = (typeof NUTRIENTS)[number]["id"];
export const NUTRIENT_IDS = NUTRIENTS.map((n) => n.id) as NutrientId[];
export const NUTRIENT_LABEL = Object.fromEntries(NUTRIENTS.map((n) => [n.id, n.label])) as Record<NutrientId, string>;

export const SUPP_TIMES = [
  { id: "morning", label: "아침" },
  { id: "lunch", label: "점심" },
  { id: "evening", label: "저녁" },
  { id: "bedtime", label: "자기 전" },
] as const;
export type SuppTime = (typeof SUPP_TIMES)[number]["id"];
export const SUPP_TIME_IDS = SUPP_TIMES.map((t) => t.id) as SuppTime[];
export const SUPP_TIME_LABEL = Object.fromEntries(SUPP_TIMES.map((t) => [t.id, t.label])) as Record<SuppTime, string>;
