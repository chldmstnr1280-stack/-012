/**
 * 나에게 와닿는 자기자비 연습 (3분) — the felt version of self-compassion.
 *
 * Built on Kristin Neff's published exercises (self-compassion.org), see
 * SC_SOURCES in ./selfCompassion.ts: friend exercise (Exercise 1), the
 * Self-Compassion Break (Exercise 2) and Supportive Touch (Exercise 4), plus the
 * guidance on "backdraft" below. The sentence ladder ("믿어지는 만큼") is Dear
 * Selly's own way of asking for words that feel true right now — not a clinical
 * technique and not a claim of effect.
 * ⚠️ 전문가 검토 전 — wording to be reviewed by a Korean mental-health professional.
 */

export const BACKDRAFT_SOURCE = {
  title: "Working with Backdraft (Preview of Guided Practice)",
  url: "https://self-compassion.org/working-with-backdraft-preview-of-guided-practice/",
  quote:
    "Backdraft refers to the distressing feelings that can arise with self-compassion practice. It’s part of the healing process and isn’t a problem, but it means you want to go slowly so you don’t feel overwhelmed.",
  accessed: "2026-11-18",
} as const;

export type MomentId = "hard" | "critic" | "practice";
export const MOMENTS: { id: MomentId; emoji: string; label: string; selly: string }[] = [
  { id: "hard", emoji: "🌧️", label: "힘든 일이 있었어", selly: "그랬구나.\n천천히, 같이 해 보자." },
  { id: "critic", emoji: "🌀", label: "나를 자꾸 탓하게 돼", selly: "그 목소리, 많이 시끄러웠지.\n같이 들여다보자." },
  { id: "practice", emoji: "🌱", label: "그냥 연습해 볼래", selly: "좋아. 괜찮은 날에\n연습해 두면 힘든 날에 꺼내 쓸 수 있어." },
];

/** the inner critic: what it often says (the user's own text is never stored) */
export const CRITICS = [
  { id: "why", text: "나는 왜 이 모양이야", friend: "누구나 이런 날이 있어. 너는 이 모양이 아니라, 지금 힘든 거야.", self: "나는 이 모양이 아니라, 지금 힘든 거야." },
  { id: "ruined", text: "또 망쳤어", friend: "한 번 어긋났다고 다 망친 건 아니야. 여기서 다시 하면 돼.", self: "한 번 어긋났을 뿐이야. 다시 하면 돼." },
  { id: "notenough", text: "이 정도도 못 해?", friend: "지금 할 수 있는 만큼 한 거야. 그걸로 충분해.", self: "나는 지금 할 수 있는 만큼 했어." },
  { id: "compare", text: "다들 잘하는데 나만…", friend: "다들 보이지 않는 곳에서 헤매. 너만 그런 게 아니야.", self: "다들 헤매. 나만 그런 게 아니야." },
  { id: "sensitive", text: "내가 너무 예민한가 봐", friend: "그만큼 마음이 많이 쓰였던 거야. 그럴 수 있어.", self: "그만큼 마음이 쓰였던 거야. 그럴 수 있어." },
  { id: "burden", text: "나는 다른 사람에게 짐이야", friend: "너는 짐이 아니야. 도움이 필요할 때가 있는 것뿐이야.", self: "나는 짐이 아니야. 도움이 필요할 때가 있을 뿐이야." },
] as const;
export type CriticId = (typeof CRITICS)[number]["id"] | "own" | "none";

export const LOUDNESS = [
  { v: 0, label: "조용해" },
  { v: 1, label: "조금" },
  { v: 2, label: "꽤 커" },
  { v: 3, label: "아주 커" },
] as const;

/** Supportive Touch — choose what feels okay; the last one is the lightest */
export const TOUCHES = [
  { id: "heart", emoji: "🤲", label: "가슴에 손 얹기", guide: "한 손, 또는 두 손을 가슴 위에 살며시 얹어 봐." },
  { id: "hug", emoji: "🫂", label: "두 팔로 나를 감싸기", guide: "두 팔로 나를 살짝 감싸 안아 봐." },
  { id: "cheek", emoji: "😌", label: "두 손으로 볼 감싸기", guide: "두 손바닥으로 볼을 살며시 감싸 봐." },
  { id: "arm", emoji: "🫱", label: "팔 천천히 쓸어내리기", guide: "한 손으로 반대쪽 팔을 천천히 쓸어내려 봐." },
  { id: "cup", emoji: "☕", label: "따뜻한 것 쥐기", guide: "따뜻한 컵이나 이불 끝을 두 손으로 쥐어 봐." },
] as const;
export type TouchId = (typeof TOUCHES)[number]["id"];

export const TOUCH_LINES = ["손의 무게를 느껴 봐.", "숨이 들어오고 나가는 걸 그냥 바라봐.", "따뜻함이 전해지는지, 알아차리기만 해.", "느껴지지 않아도 괜찮아. 손을 얹은 것만으로 충분해."];
export const TOUCH_SECONDS = 24;

export const WARMTH = [
  { v: 0, label: "잘 모르겠어" },
  { v: 1, label: "아주 조금" },
  { v: 2, label: "조금 따뜻해" },
  { v: 3, label: "따뜻해" },
] as const;

/** 백드래프트: warmth can bring old pain up. Normal, and a reason to go slowly. */
export const BACKDRAFT = {
  title: "오히려 슬퍼지거나 불편해졌구나",
  lines: [
    "다정함을 받으면, 그동안 꾹 참아 온 마음이 같이 올라오기도 해.",
    "이상한 게 아니야. 천천히 가면 된다는 신호야.",
  ],
  ground: "발바닥이 바닥에 닿는 느낌에 잠깐 머물러 봐. 눈을 뜨고, 방 안에 보이는 것 세 가지를 찾아봐도 좋아.",
};

/** 믿어지는 만큼 — from the easiest to the hardest */
export const LADDER = [
  "지금 힘들다.",
  "힘든 게 당연한 상황이야.",
  "나만 이런 건 아니야.",
  "완벽하지 않아도 괜찮다고 해 볼래.",
  "나는 나에게 조금 더 다정해지고 싶어.",
  "나는 나를 아껴.",
] as const;

export const NEEDS = [
  { id: "water", emoji: "💧", label: "물 한 잔", href: null },
  { id: "rest", emoji: "☁️", label: "잠깐 눕기", href: "/?do=rest" },
  { id: "breathe", emoji: "🫁", label: "숨 고르기", href: "/?do=breathe" },
  { id: "walk", emoji: "🌿", label: "바깥 공기", href: "/walk" },
  { id: "warm", emoji: "🍵", label: "따뜻한 것 먹기", href: null },
  { id: "reach", emoji: "📱", label: "누군가에게 연락", href: null },
  { id: "nothing", emoji: "🌙", label: "그냥 이대로 있기", href: null },
] as const;
export type NeedId = (typeof NEEDS)[number]["id"];

export const HUMANITY = {
  selly: "이런 순간은 누구에게나 와.\n지금 이 순간에도 어딘가에서\n누군가 같은 마음일 거야.",
  me: "나도 그런 날 있어. 정말로.",
};
