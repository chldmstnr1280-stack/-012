/**
 * Safety resources (Phase D). Numbers verified against official pages:
 *  - 109: 보건복지부 보도자료 「10월부터 요금미납 시에도 ‘자살예방상담전화 109’를 긴급전화로
 *    이용 가능해진다」 (2026-09-08) — "365일 24시간 운영되는 자살예방용 상담전화로
 *    발신자에게 요금이 부과되지 않는 수신자부담 전화". The same release names 112·119
 *    as the emergency numbers.
 *  - NHS PMS page (reviewed 2024-06-18): "Call 999 or go to A&E if you have symptoms of
 *    premenstrual dysphoric disorder (PMDD) and are feeling suicidal" — the Korean
 *    equivalent emergency number is 119.
 * ⚠️ Wording and trigger thresholds await clinical review. Re-verify numbers before launch.
 */
export const CRISIS_LINES = [
  { number: "109", name: "자살예방상담전화", note: "24시간 · 365일 · 무료" },
  { number: "119", name: "응급 상황", note: "지금 위험하다면 바로" },
] as const;

export const SAFETY_SOURCES = [
  {
    org: "보건복지부 보도자료",
    title: "10월부터 요금미납 시에도 ‘자살예방상담전화 109’를 긴급전화로 이용 가능해진다",
    url: "https://www.mohw.go.kr/board.es?mid=a10503000000&bid=0027&act=view&list_no=1491820",
    date: "2026-09-08",
    accessed: "2026-11-05",
  },
  {
    org: "NHS",
    title: "PMS (premenstrual syndrome) — Premenstrual dysphoric disorder (PMDD)",
    url: "https://www.nhs.uk/conditions/pre-menstrual-syndrome/",
    date: "2024-06-18",
    accessed: "2026-11-05",
  },
] as const;

/**
 * When a single day's record gently surfaces the help card (not a diagnosis,
 * not a risk assessment — the app never asks about self-harm).
 * Pending clinical review.
 */
export const HEAVY_DAY = {
  symptoms: ["low_mood", "anxiety"] as const,
  score: 4,
  impactScore: 4,
};

/**
 * "Affecting daily life" (NHS/ACOG criterion for considering a doctor's visit),
 * read from the records as: life-impact rated ≥ 3 (심함) in at least 2 analysed cycles.
 * Pending clinical review.
 */
export const IMPACT_NUDGE = { score: 3, cycles: 2 };
