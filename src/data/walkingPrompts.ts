/**
 * What Selly says on a walk. Rule-based and data-only: add lines freely.
 * `when` narrows a line to a time of day / season later; untagged lines fit anytime.
 * Micro-moments offer choices but never require one — the walk just goes on.
 */
export type WalkTime = "morning" | "day" | "evening" | "night";
export type Season = "spring" | "summer" | "autumn" | "winter";

export interface WalkPrompt {
  id: string;
  text: string;
  when?: { time?: WalkTime[]; season?: Season[] };
  /** optional gentle choice; Selly answers with `reply` */
  choices?: { label: string; reply: string }[];
}

export const WALK_PROMPTS: WalkPrompt[] = [
  { id: "shoulders", text: "어깨 힘 한번 풀어볼까?" },
  { id: "slow", text: "조금 천천히 걸어도 좋아." },
  { id: "breeze", text: "바람이 느껴져?" },
  { id: "nothing", text: "아무 생각 안 해도 괜찮아." },
  { id: "sky", text: "오늘 하늘은 어떤 색이야?", when: { time: ["morning", "day", "evening"] } },
  { id: "breath", text: "숨을 한 번 길게 내쉬어 볼까?" },
  { id: "sounds", text: "지금 들리는 소리 하나만 골라볼래?" },
  { id: "evening", text: "저녁 공기가 포근하다…", when: { time: ["evening"] } },
  { id: "night", text: "밤 산책도 좋다. 천천히 가자.", when: { time: ["night"] } },
  {
    id: "green",
    text: "우리 주변에서\n초록색을 찾아볼까?",
    choices: [
      { label: "찾았어", reply: "와, 눈이 밝구나! ♡" },
      { label: "그냥 걸을래", reply: "좋아, 그냥 걷자~" },
    ],
  },
  {
    id: "shoulder-check",
    text: "어깨가 올라가 있진 않아?",
    choices: [
      { label: "한번 풀어볼게", reply: "스르르… 잘했어 ♡" },
      { label: "괜찮아", reply: "다행이다! 계속 걷자" },
    ],
  },
  {
    id: "color",
    text: "주변에서 예쁜 색\n하나 찾아볼래?",
    choices: [
      { label: "찾았어", reply: "어떤 색이었을까? 궁금하다 ♡" },
      { label: "다음에", reply: "응, 그냥 걸어도 좋아" },
    ],
  },
];

export const WALK_LINES = {
  start: ["가자! 천천히 걸어보자 ♡", "같이 나와서 좋다~"],
  stopped: ["잠깐 쉬어갈까?", "여기 경치 좋다…"],
  end: "같이 걸어서 좋았어 ♡",
  /** shown on the summary; every walk is a good walk */
  summary: ["오늘 함께 걸어줘서 고마워.", "짧아도 충분히 좋은 산책이었어.", "바깥 공기, 같이 마셔서 좋았어."],
  home: "오늘 같이 걸어서 좋았어.",
};

export function pickPrompt(time: WalkTime, recent: string[]): WalkPrompt {
  const pool = WALK_PROMPTS.filter((p) => !recent.includes(p.id) && (!p.when?.time || p.when.time.includes(time)));
  const list = pool.length ? pool : WALK_PROMPTS;
  return list[Math.floor(Math.random() * list.length)];
}
