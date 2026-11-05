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
import type { DailyEntry, SymptomDay } from "@/lib/data-store";
import { SYMPTOM_LABEL, type SymptomId } from "./pmsSymptoms";
import { TAGS, type ContextTagId } from "./contextTags";

export type CareAction =
  | "rest" // 함께 쉬기 (Selly sits on the cushion)
  | "quiet" // 조용한 온실 모드
  | "breathe-short" // 1분 편안한 호흡
  | "breathe-long" // 길게 내쉬기
  | "breathe-sleep" // 4-7-8 호흡
  | "walk" // 셀리와 산책
  | "talk" // 이야기하기
  | "record" // 오늘의 기록
  | "record-pms"; // 오늘의 증상 기록

export const ACTION_LABEL: Record<CareAction, string> = {
  rest: "함께 쉬기",
  quiet: "조용한 온실",
  "breathe-short": "짧은 호흡",
  "breathe-long": "길게 내쉬기",
  "breathe-sleep": "잠들기 전 호흡",
  walk: "같이 산책",
  talk: "이야기하기",
  record: "기록하기",
  "record-pms": "증상 기록",
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
  /** today's own PMS symptom record, if any */
  symptoms?: SymptomDay;
  /**
   * today falls where the user's own past records usually showed symptoms
   * (≥ 2 analysed cycles; reference only — it never says how they feel today)
   */
  pmsWindow: boolean;
  /** the symptom recorded most often before past periods, if any */
  pastSymptom?: SymptomId;
  /** what the user said they want today (바람 tags that Selly can answer) */
  needs?: ContextTagId[];
}

export interface CareRule {
  id: string;
  when: (c: CareContext) => boolean;
  line: string | ((c: CareContext) => string);
  actions: CareAction[];
}

const low = (v?: number) => v != null && v <= 2;
const high = (v?: number) => v != null && v >= 4;
/** a symptom the user rated 심함(3) or more today */
const strong = (c: CareContext, ids: SymptomId[]) => !!c.symptoms && !c.symptoms.none && ids.some((id) => (c.symptoms!.scores[id] ?? 0) >= 3);
const eul = (w: string) => {
  const ch = w.charCodeAt(w.length - 1);
  return `${w}${ch >= 0xac00 && ch <= 0xd7a3 && (ch - 0xac00) % 28 ? "을" : "를"}`;
};

export const CARE_RULES: CareRule[] = [
  // PMS symptoms the user rated themselves today (Phase E)
  {
    id: "pms-low",
    when: (c) => (c.symptoms?.scores.low_mood ?? 0) >= 4 || (c.symptoms?.scores.anxiety ?? 0) >= 4,
    line: "오늘은 내가\n곁에 꼭 붙어 있을게.",
    actions: ["talk", "rest"],
  },
  // the user's own stated want comes before any guess
  {
    id: "need",
    when: (c) => !!c.needs?.length,
    line: (c) => TAGS[c.needs![0]].selly ?? "",
    actions: [],
  },
  {
    id: "period-tired",
    when: (c) => c.period && (c.today?.emotion === "tired" || low(c.today?.condition.energy) || low(c.today?.mood)),
    line: "오늘은 조금 더\n편안하게 쉬어볼까?",
    actions: ["rest", "breathe-short", "quiet"],
  },
  {
    id: "pms-body",
    when: (c) => strong(c, ["cramps", "headache", "bloating", "breast_tenderness"]),
    line: "몸이 많이 불편한 날이구나.\n오늘은 같이 천천히 쉬자.",
    actions: ["rest", "breathe-short"],
  },
  {
    id: "pms-tense",
    when: (c) => strong(c, ["irritability", "anxiety", "mood_swings", "sensitivity"]),
    line: "마음이 많이 예민한 날이구나.\n숨을 길게 한 번 내쉬어 볼까?",
    actions: ["breathe-long", "talk"],
  },
  {
    id: "pms-tired",
    when: (c) => strong(c, ["fatigue", "sleep_problems", "hard_daily_tasks"]),
    line: "몸이 무거운 날이네.\n오늘은 천천히 가도 돼.",
    actions: ["rest", "quiet"],
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
    id: "pms-window",
    // only the user's own history: what was recorded around this time before, never a guess about today
    when: (c) => c.pmsWindow && !c.symptoms && c.tod !== "night",
    line: (c) =>
      c.pastSymptom
        ? `지난 주기엔 이맘때\n${eul(SYMPTOM_LABEL[c.pastSymptom])} 기록했었어. 오늘은 어때?`
        : "지난 주기엔 이맘때\n증상을 기록했었어. 오늘은 어때?",
    actions: ["record-pms", "walk"],
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

export interface PickedSuggestion {
  id: string;
  line: string;
  actions: CareAction[];
}

export function pickSuggestion(c: CareContext): PickedSuggestion | null {
  const r = CARE_RULES.find((x) => x.when(c));
  if (!r) return null;
  if (r.id === "need") {
    const t = TAGS[c.needs![0]];
    return { id: `need-${t.id}`, line: t.selly!, actions: [t.action!] };
  }
  return { id: r.id, line: typeof r.line === "function" ? r.line(c) : r.line, actions: r.actions };
}
