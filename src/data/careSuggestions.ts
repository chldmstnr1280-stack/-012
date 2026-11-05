/**
 * Personalised care suggestions (Phase E) — rule-based, evaluated on the device only.
 *
 * Principles
 *  - Selly suggests, never prescribes. Every suggestion can be ignored with no consequence.
 *  - No diagnosis, no prediction of illness, no judging of numbers.
 *  - The cycle alone never decides how someone feels: rules that name a feeling only use
 *    what the user recorded themselves (feeling, energy, sleep, stress).
 * Rules are checked top to bottom; the first match is shown, at most once a day.
 */
import type { TimeOfDay } from "@/lib/game/behaviorEngine";
import type { DailyEntry } from "@/lib/data-store";

export type CareAction =
  | "rest" // 함께 쉬기 (Selly sits on the cushion)
  | "quiet" // 조용한 온실 모드
  | "breathe-short" // 1분 편안한 호흡
  | "breathe-long" // 길게 내쉬기
  | "breathe-sleep" // 4-7-8 호흡
  | "walk" // 셀리와 산책
  | "talk" // 이야기하기
  | "record"; // 오늘의 기록

export const ACTION_LABEL: Record<CareAction, string> = {
  rest: "함께 쉬기",
  quiet: "조용한 온실",
  "breathe-short": "짧은 호흡",
  "breathe-long": "길게 내쉬기",
  "breathe-sleep": "잠들기 전 호흡",
  walk: "같이 산책",
  talk: "이야기하기",
  record: "기록하기",
};

export interface CareContext {
  tod: TimeOfDay;
  /** today's own record, if any */
  today?: DailyEntry;
  /** the user marked today as a period day (or is within a logged period) */
  period: boolean;
  /** a period is predicted to start within two days (calendar estimate) */
  periodSoon: boolean;
  /** what has already happened today */
  breathedToday: boolean;
  walkedToday: boolean;
}

export interface CareRule {
  id: string;
  when: (c: CareContext) => boolean;
  line: string;
  actions: CareAction[];
}

const low = (v?: number) => v != null && v <= 2;
const high = (v?: number) => v != null && v >= 4;

export const CARE_RULES: CareRule[] = [
  {
    id: "period-tired",
    when: (c) => c.period && (c.today?.emotion === "tired" || low(c.today?.condition.energy) || low(c.today?.mood)),
    line: "오늘은 조금 더\n편안하게 쉬어볼까?",
    actions: ["rest", "breathe-short", "quiet"],
  },
  {
    id: "sleep-low",
    when: (c) => low(c.today?.condition.sleep),
    line: "어젯밤 잠이 좀 부족했구나.\n잠깐 같이 쉬어갈래?",
    actions: ["rest", "breathe-long"],
  },
  {
    id: "busy-mind",
    when: (c) => c.today?.emotion === "anxious" || high(c.today?.condition.stress),
    line: "마음이 분주한 날이네.\n숨을 한 번 길게 내쉬어 볼까?",
    actions: ["breathe-long", "talk"],
  },
  {
    id: "sad",
    when: (c) => c.today?.emotion === "sad" || low(c.today?.mood),
    line: "오늘은 내가\n곁에 조금 더 있을게.",
    actions: ["talk", "rest"],
  },
  {
    id: "tired",
    when: (c) => c.today?.emotion === "tired" || low(c.today?.condition.energy),
    line: "많이 애썼구나.\n오늘은 천천히 가도 돼.",
    actions: ["rest", "quiet"],
  },
  {
    id: "night",
    when: (c) => c.tod === "night",
    line: "이제 하루를\n살며시 내려놓을 시간이야.",
    actions: ["quiet", "breathe-sleep"],
  },
  {
    id: "bright",
    when: (c) => (c.today?.emotion === "happy" || high(c.today?.mood)) && !c.walkedToday && c.tod !== "night",
    line: "기분 좋은 날이다!\n바람 쐬러 같이 걸을까?",
    actions: ["walk", "record"],
  },
  {
    id: "period",
    // cycle only: no assumption about how they feel — just permission to go easy
    when: (c) => c.period,
    line: "오늘은 너에게\n필요한 만큼만 해도 괜찮아.",
    actions: ["rest", "breathe-short"],
  },
  {
    id: "period-soon",
    when: (c) => c.periodSoon,
    line: "요즘 몸을 조금 더\n따뜻하게 챙겨주자.",
    actions: ["rest", "breathe-short"],
  },
  {
    id: "no-record",
    when: (c) => !c.today && c.tod !== "night",
    line: "오늘 마음은\n어떤 색이야?",
    actions: ["record", "talk"],
  },
  {
    id: "no-breath",
    when: (c) => !c.breathedToday && c.tod !== "morning",
    line: "잠깐 숨 고르고 갈래?",
    actions: ["breathe-short"],
  },
];

export function pickSuggestion(c: CareContext): CareRule | null {
  return CARE_RULES.find((r) => r.when(c)) ?? null;
}
