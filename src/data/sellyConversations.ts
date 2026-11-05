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
  | "record"; // ends the talk and opens today's record

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
};

