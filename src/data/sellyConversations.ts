/**
 * "이야기하기" — rule-based conversations with Selly (Phase B).
 *
 * A conversation is a small graph of nodes. Each node is something Selly says,
 * optionally with a reaction / an action in the greenhouse, and either choices
 * for the user or an ending. Add or edit conversations here only — no code changes.
 *
 * Tone: Held, not healed. Selly listens; she never diagnoses, judges or pushes.
 * Nothing the user picks here is stored.
 */

export type TalkIcon = "sun" | "leaf" | "cloud" | "moon" | "heart" | "wind" | "pen" | "sparkle";

/** What happens in the greenhouse when a node or choice is reached. */
export type TalkAction =
  | "cheer" // happy hop + sparkles
  | "comfort" // soft hearts
  | "rest" // Selly walks to the cushion and sits (the talk continues)
  | "nap" // Selly curls up on the cushion
  | "comeClose" // Selly comes to the front, close to the user
  | "breathe" // ends the talk and opens breathing
  | "record" // ends the talk and opens today's record
  | "recordPms" // ends the talk and opens today's symptom record
  | "kindness"; // ends the talk and opens 마음 전하기 (self-compassion practice)

export interface TalkChoice {
  label: string;
  icon?: TalkIcon;
  next?: string;
  action?: TalkAction;
}

export interface TalkNode {
  /** Selly's line; several = she says them one after another */
  say: string[];
  action?: TalkAction;
  choices?: TalkChoice[];
  /** no choices: the talk ends here with a soft closing button */
  closeLabel?: string;
}

export const TALK_START = "root";

// shared "keep the good feeling?" choices
const KEEP: TalkChoice[] = [
  { label: "기록하러 갈래.", icon: "pen", action: "record" },
  { label: "다음에 할래.", icon: "heart", next: "good-later" },
];

export const TALK: Record<string, TalkNode> = {
  root: {
    say: ["오늘은 어떤 하루였어?"],
    choices: [
      { label: "기분 좋은 하루였어.", icon: "sun", next: "good" },
      { label: "조금 지쳤어.", icon: "leaf", next: "tired" },
      { label: "마음이 복잡해.", icon: "cloud", next: "tangled" },
      { label: "그냥 쉬고 싶어.", icon: "moon", next: "rest" },
      { label: "몸이 좀 불편해.", icon: "wind", next: "body" },
    ],
  },

  /* ---------- 기분 좋은 하루 ---------- */
  good: {
    say: ["정말? 나도 덩달아 기뻐! ♡", "어떤 게 제일 좋았어?"],
    action: "cheer",
    choices: [
      { label: "작은 일이 잘 풀렸어.", icon: "sparkle", next: "good-small" },
      { label: "누군가 다정했어.", icon: "heart", next: "good-kind" },
      { label: "그냥 기분이 좋아.", icon: "sun", next: "good-just" },
    ],
  },
  "good-small": { say: ["작은 일이 잘 풀리는 날, 참 좋지.", "오늘의 좋은 마음, 기록으로 남겨둘까?"], choices: KEEP },
  "good-kind": { say: ["다정한 사람 덕분에 마음이 따뜻해졌구나.", "오늘의 좋은 마음, 기록으로 남겨둘까?"], action: "comfort", choices: KEEP },
  "good-just": { say: ["이유 없이 좋은 날도 있어야지! 헤헤", "오늘의 좋은 마음, 기록으로 남겨둘까?"], choices: KEEP },
  "good-later": { say: ["좋아! 그럼 이 기분 그대로 쉬다 가 ♡"], closeLabel: "고마워 ♡" },

  /* ---------- 조금 지쳤어 ---------- */
  tired: {
    say: ["그럼 오늘은 나랑 천천히 쉬자."],
    action: "rest",
    choices: [
      { label: "짧게 숨 고를래.", icon: "wind", action: "breathe" },
      { label: "그냥 같이 있을래.", icon: "heart", next: "tired-stay" },
    ],
  },
  "tired-stay": { say: ["응, 여기 같이 있을게.", "아무것도 안 해도 괜찮아."], action: "comfort", closeLabel: "고마워 ♡" },

  /* ---------- 마음이 복잡해 ---------- */
  tangled: {
    say: ["그럴 때도 있지.", "말 안 해도 괜찮아. 조금만 내려놓아 볼까?"],
    action: "comfort",
    choices: [
      { label: "천천히 숨 쉬어볼래.", icon: "wind", action: "breathe" },
      { label: "생각을 적어볼래.", icon: "pen", action: "record" },
      { label: "나에게 다정한 말 해 볼래.", icon: "heart", action: "kindness" },
      { label: "그냥 옆에 있어줘.", icon: "heart", next: "tangled-near" },
    ],
  },
  "tangled-near": { say: ["응, 바로 옆에 있을게.", "복잡한 마음도 너의 일부야. 천천히 가자."], action: "comeClose", closeLabel: "고마워 ♡" },

  /* ---------- 그냥 쉬고 싶어 ---------- */
  rest: {
    say: ["좋아, 아무것도 안 해도 돼.", "나도 옆에서 조용히 있을게."],
    action: "nap",
    choices: [
      { label: "조용히 쉴게.", icon: "moon", next: "rest-quiet" },
      { label: "잠깐 숨 고를래.", icon: "wind", action: "breathe" },
    ],
  },
  "rest-quiet": { say: ["쉿… 편히 쉬어. ♡"], closeLabel: "응 ♡" },

  /* ---------- 몸이 좀 불편해 (PMS, Phase E) — listens only; no advice about the body ---------- */
  body: {
    say: ["그랬구나. 어떤 게 제일 힘들어?"],
    action: "comeClose",
    choices: [
      { label: "몸 여기저기가 아파.", icon: "cloud", next: "body-ache" },
      { label: "몸이 무겁고 피곤해.", icon: "leaf", next: "tired" },
      { label: "자꾸 예민해져.", icon: "wind", next: "body-tense" },
      { label: "말로 하기 어려워.", icon: "heart", next: "body-vague" },
    ],
  },
  "body-ache": {
    say: ["많이 불편하겠다.", "오늘은 무리하지 말고, 나랑 같이 쉬자."],
    action: "rest",
    choices: [
      { label: "증상 기록해 둘래.", icon: "pen", action: "recordPms" },
      { label: "그냥 쉴래.", icon: "moon", next: "rest-quiet" },
    ],
  },
  "body-tense": {
    say: ["작은 일에도 마음이 쉽게 출렁이는 날이 있지.", "네가 이상한 게 아니야. 숨 한 번 길게 내쉬어 볼까?"],
    action: "comfort",
    choices: [
      { label: "숨 고를래.", icon: "wind", action: "breathe" },
      { label: "증상 기록해 둘래.", icon: "pen", action: "recordPms" },
      { label: "그냥 옆에 있어줘.", icon: "heart", next: "tangled-near" },
    ],
  },
  "body-vague": {
    say: ["응, 꼭 말로 설명하지 않아도 돼.", "적어 두면 다음 주기에 같이 돌아볼 수 있어."],
    action: "comfort",
    choices: [
      { label: "증상 기록해 둘래.", icon: "pen", action: "recordPms" },
      { label: "오늘은 쉴래.", icon: "moon", next: "rest" },
    ],
  },
};

