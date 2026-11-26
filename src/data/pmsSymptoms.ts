/**
 * PMS daily symptom record (Phase A).
 * Items and the 0–4 scale are the user's own subjective ratings, not a validated
 * clinical instrument. Since 2026-11 the items cover every DRSP area (see
 * data/drspAreas.ts) so the clinical summary can be read in that familiar order;
 * the wording is the app's own (not the DRSP's), and it is not the DRSP.
 */
export const SYMPTOM_GROUPS = [
  {
    id: "emotional",
    label: "감정",
    items: [
      { id: "tearful", label: "눈물이 남" },
      { id: "irritability", label: "짜증" },
      { id: "anxiety", label: "불안" },
      { id: "low_mood", label: "우울감" },
      { id: "mood_swings", label: "감정 기복" },
      { id: "sensitivity", label: "예민함" },
      { id: "hopeless", label: "절망감" },
      { id: "guilt", label: "자책·죄책감" },
      { id: "overwhelmed", label: "감당하기 벅참" },
      { id: "out_of_control", label: "통제가 안 되는 느낌" },
      { id: "less_interest", label: "흥미 감소" },
      { id: "conflict", label: "다툼·갈등" },
    ],
  },
  {
    id: "physical",
    label: "신체",
    items: [
      { id: "bloating", label: "복부 팽만" },
      { id: "breast_tenderness", label: "가슴(유방) 통증" },
      { id: "headache", label: "두통" },
      { id: "fatigue", label: "피로" },
      { id: "cramps", label: "복통·생리통" },
      { id: "joint_pain", label: "관절·근육 통증" },
    ],
  },
  {
    id: "daily",
    label: "생활",
    items: [
      { id: "poor_focus", label: "집중력 저하" },
      { id: "appetite", label: "식욕 변화" },
      { id: "sleep_problems", label: "수면 변화" },
      { id: "oversleep", label: "잠이 늘어남" },
      { id: "cravings", label: "특정 음식이 당김" },
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
  { id: "hobbies", label: "취미·사회 활동" },
] as const;
export type ImpactId = (typeof IMPACT_ITEMS)[number]["id"];
export const IMPACT_IDS = IMPACT_ITEMS.map((i) => i.id) as ImpactId[];

export type Score = 0 | 1 | 2 | 3 | 4;
export const SCORE_LABEL = ["없음", "가벼움", "보통", "심함", "매우 심함"] as const;

/**
 * When symptoms usually start before a period — the user's own estimate.
 * `days` is the far end of the range, so a reference window covers it.
 */
export const ONSET_OPTIONS = [
  { id: "d1_2", label: "1~2일 전", days: 2 },
  { id: "d3_5", label: "3~5일 전", days: 5 },
  { id: "d6_9", label: "6~9일 전", days: 9 },
  { id: "d10", label: "10일 이상 전", days: 12 },
  { id: "unsure", label: "잘 모르겠어", days: null },
] as const;
export type OnsetId = (typeof ONSET_OPTIONS)[number]["id"];
export const ONSET_IDS = ONSET_OPTIONS.map((o) => o.id) as OnsetId[];
export const onsetDays = (id?: OnsetId | null): number | null => ONSET_OPTIONS.find((o) => o.id === id)?.days ?? null;

/**
 * 생리 양 (period days only) — the three signs NHS lists for heavy periods, plus
 * how it felt. This device and the backup file only (not sent to the server).
 */
export const FLOW_AMOUNTS = [
  { id: "light", label: "적음" },
  { id: "medium", label: "보통" },
  { id: "heavy", label: "많음" },
] as const;
export type FlowAmount = (typeof FLOW_AMOUNTS)[number]["id"];
export const FLOW_SIGNS = [
  { id: "hourly", label: "생리대·탐폰을 1~2시간마다 바꿔야 했어" },
  { id: "clots", label: "500원 동전보다 큰 핏덩어리가 나왔어" },
  { id: "leak", label: "옷이나 이불에 샐 정도였어" },
] as const;
export type FlowSign = (typeof FLOW_SIGNS)[number]["id"];
