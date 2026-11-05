/**
 * PMS daily symptom record (Phase A).
 * Items and the 0–4 scale follow the product spec; they are the user's own
 * subjective ratings, not a validated clinical instrument. The structure keeps
 * one score per symptom per day so a validated tool (e.g. DRSP) can be mapped
 * later after clinical review — no mapping is claimed here.
 */
export const SYMPTOM_GROUPS = [
  {
    id: "emotional",
    label: "감정",
    items: [
      { id: "irritability", label: "짜증" },
      { id: "anxiety", label: "불안" },
      { id: "low_mood", label: "우울감" },
      { id: "mood_swings", label: "감정 기복" },
      { id: "sensitivity", label: "예민함" },
    ],
  },
  {
    id: "physical",
    label: "신체",
    items: [
      { id: "bloating", label: "복부 팽만" },
      { id: "breast_tenderness", label: "유방 압통" },
      { id: "headache", label: "두통" },
      { id: "fatigue", label: "피로" },
      { id: "cramps", label: "생리통" },
    ],
  },
  {
    id: "daily",
    label: "생활",
    items: [
      { id: "poor_focus", label: "집중력 저하" },
      { id: "appetite", label: "식욕 변화" },
      { id: "sleep_problems", label: "수면 문제" },
      { id: "hard_daily_tasks", label: "일상 활동의 어려움" },
    ],
  },
] as const;

export type SymptomId = (typeof SYMPTOM_GROUPS)[number]["items"][number]["id"];
export const SYMPTOM_IDS = SYMPTOM_GROUPS.flatMap((g) => g.items.map((i) => i.id)) as SymptomId[];
export const SYMPTOM_LABEL = Object.fromEntries(SYMPTOM_GROUPS.flatMap((g) => g.items.map((i) => [i.id, i.label]))) as Record<SymptomId, string>;

export const IMPACT_ITEMS = [
  { id: "work", label: "업무·학업" },
  { id: "relations", label: "대인관계" },
  { id: "daily", label: "일상 활동" },
] as const;
export type ImpactId = (typeof IMPACT_ITEMS)[number]["id"];
export const IMPACT_IDS = IMPACT_ITEMS.map((i) => i.id) as ImpactId[];

export type Score = 0 | 1 | 2 | 3 | 4;
export const SCORE_LABEL = ["없음", "가벼움", "보통", "심함", "매우 심함"] as const;
