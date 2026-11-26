import type { ImpactId, SymptomId } from "./pmsSymptoms";

/**
 * DRSP 영역에 맞춘 정리 — the order and grouping of the Daily Record of Severity
 * of Problems (Endicott, Nee & Harrison 2006, PMID 16172836), used only to lay
 * the clinical summary out the way clinicians know it. The app's own items and
 * its 0–4 scale are NOT the DRSP (which needs the authors' permission and uses
 * 1–6); only the areas are followed. Item numbers and short English keywords
 * refer to the original list as reproduced in Table 1 of the open-access J-DRSP
 * paper (PMC7977312, CC BY 4.0).
 * ⚠️ 전문가 검토 전 — the mapping awaits review.
 */
export const DRSP_SOURCE = {
  original: "Endicott J, Nee J, Harrison W. Daily Record of Severity of Problems (DRSP): reliability and validity. Arch Womens Ment Health. 2006;9(1):41-9. PMID 16172836",
  itemList: "Table 1, The reliability and validity of the Japanese version of the DRSP (J-DRSP), PMC7977312 (CC BY 4.0)",
  quote: "The DRSP comprises 21 items describing premenstrual symptoms and 3 items concerning the dysfunction in daily life caused by these symptoms. Throughout the menstrual cycle, all 24 items are ranked daily from 1 (not at all) to 6 (extreme).",
  quoteFrom: "Development of a Japanese Version of the DRSP for Diagnosing PMS, PMC7784737 (CC BY 4.0)",
  accessed: "2026-11-26",
};

export interface DrspArea {
  /** the area name shown in the summary */
  label: string;
  /** DRSP item numbers in this area, with a short English keyword */
  items: { n: number; key: string }[];
  /** the app's own items recorded under this area */
  symptoms: SymptomId[];
  impact?: ImpactId[];
}

export const DRSP_AREAS: DrspArea[] = [
  { label: "우울", items: [{ n: 1, key: "depressed" }, { n: 2, key: "hopeless" }, { n: 3, key: "worthless or guilty" }], symptoms: ["low_mood", "hopeless", "guilt"] },
  { label: "불안", items: [{ n: 4, key: "anxious, tense" }], symptoms: ["anxiety"] },
  { label: "기분 기복·예민함", items: [{ n: 5, key: "mood swings" }, { n: 6, key: "sensitive to rejection" }], symptoms: ["mood_swings", "tearful", "sensitivity"] },
  { label: "분노·짜증", items: [{ n: 7, key: "angry, irritable" }, { n: 8, key: "conflicts with people" }], symptoms: ["irritability", "conflict"] },
  { label: "흥미·집중·기운", items: [{ n: 9, key: "less interest" }, { n: 10, key: "difficulty concentrating" }, { n: 11, key: "lethargic, fatigued" }], symptoms: ["less_interest", "poor_focus", "fatigue"] },
  { label: "식욕", items: [{ n: 12, key: "increased appetite" }, { n: 13, key: "food cravings" }], symptoms: ["appetite", "cravings"] },
  { label: "수면", items: [{ n: 14, key: "slept more" }, { n: 15, key: "trouble sleeping" }], symptoms: ["oversleep", "sleep_problems"] },
  { label: "압도감·통제", items: [{ n: 16, key: "overwhelmed" }, { n: 17, key: "out of control" }], symptoms: ["overwhelmed", "out_of_control"] },
  { label: "몸 증상", items: [{ n: 18, key: "breast tenderness" }, { n: 19, key: "bloated, weight gain" }, { n: 20, key: "headache" }, { n: 21, key: "joint or muscle pain" }], symptoms: ["breast_tenderness", "bloating", "headache", "joint_pain"] },
  { label: "생활 지장", items: [{ n: 22, key: "productivity" }, { n: 23, key: "hobbies or social activities" }, { n: 24, key: "relationships" }], symptoms: ["hard_daily_tasks"], impact: ["work", "daily", "hobbies", "relations"] },
];

/** The app's items outside the DRSP areas (kept, shown last) */
export const OUTSIDE_DRSP: SymptomId[] = ["cramps"];

/** the summary's row order: DRSP areas, then the rest */
export const DRSP_ORDER: SymptomId[] = [...DRSP_AREAS.flatMap((a) => a.symptoms), ...OUTSIDE_DRSP];
export const DRSP_AREA_OF = Object.fromEntries(DRSP_AREAS.flatMap((a) => a.symptoms.map((s) => [s, a.label]))) as Partial<Record<SymptomId, string>>;
