/**
 * Self-compassion practice with Selly ("마음 전하기").
 *
 * Built on Kristin Neff's published exercises (self-compassion.org):
 *  - the three elements: mindfulness, common humanity, self-kindness
 *  - Exercise 2 "Self-Compassion Break" (incl. soothing touch)
 *  - Exercise 4 "Supportive Touch"
 *  - Exercise 1 "How would you treat a friend?"
 * The Korean wording renders those steps; `quote` keeps the original lines.
 * Not therapy, not a treatment. ⚠️ review: "pending" — wording to be reviewed
 * by a Korean mental-health professional before launch.
 */

export const SC_SOURCES = [
  {
    title: "Exercise 2: Self-Compassion Break",
    url: "https://self-compassion.org/exercises/exercise-2-self-compassion-break/",
    quote: "1. This is a moment of suffering … 2. Suffering is a part of life … put your hands over your heart … 3. May I be kind to myself",
  },
  {
    title: "Exercise 4: Supportive Touch",
    url: "https://self-compassion.org/exercises/exercise-4-supportive-touch/",
    quote: "Gently place your hand over your heart, feeling the gentle pressure and warmth of your hand.",
  },
  {
    title: "Exercise 1: How would you treat a friend?",
    url: "https://self-compassion.org/exercises/exercise-1-how-would-you-treat-a-friend/",
    quote: "Why not try treating yourself like a good friend and see what happens?",
  },
  {
    title: "What is self-compassion? (three elements)",
    url: "https://self-compassion.org/what-is-self-compassion/",
    quote: "These are the three main elements of compassion: mindfulness, common humanity, and kindness.",
  },
] as const;
export const SC_ACCESSED = "2026-11-05";
export const SC_REVIEW: "pending" | "reviewed" = "pending";

export type PracticeId = "words" | "break" | "friend";

export const PRACTICES: { id: PracticeId; title: string; desc: string; icon: string }[] = [
  { id: "words", title: "셀리에게 마음 전하기", desc: "다정한 말을 주고받고, 나에게도 돌려줘요", icon: "💌" },
  { id: "break", title: "자기자비 쉼", desc: "힘든 순간, 나를 다독이는 세 걸음", icon: "🌿" },
  { id: "friend", title: "친구에게 하듯", desc: "친구에게 해 줄 말을 나에게 해 봐요", icon: "🤝" },
];

/** 셀리에게 마음 전하기: what I say to Selly → her reply → the same kindness, turned to me. */
export const KIND_WORDS = [
  { id: "thanks", say: "고마워", reply: "헤헤, 나도 고마워!\n늘 와 줘서.", toSelf: "오늘도 애쓴 나, 고마워", reaction: "cheer" },
  { id: "love", say: "사랑해", reply: "히잉… 나도 사랑해! ♡", toSelf: "나는 나를 아껴", reaction: "cheer" },
  { id: "precious", say: "소중해", reply: "정말? 너도 나한테\n정말 소중해.", toSelf: "나는 소중해", reaction: "pat" },
  { id: "welldone", say: "수고했어", reply: "고마워. 너도 오늘\n정말 수고 많았어.", toSelf: "오늘도 수고했어, 나", reaction: "pat" },
  { id: "okay", say: "괜찮아", reply: "응, 괜찮아.\n우리 천천히 가자.", toSelf: "괜찮아, 천천히 해도 돼", reaction: "pat" },
] as const;
export type KindWordId = (typeof KIND_WORDS)[number]["id"];

/** 자기자비 쉼 — the three steps of the Self-Compassion Break, each with a few ways to say it. */
export const BREAK_STEPS = [
  {
    id: "mindfulness",
    label: "① 알아차리기",
    selly: "먼저, 지금 마음을\n있는 그대로 알아봐 줄까?",
    options: ["지금 힘든 순간이구나", "마음이 아프다", "스트레스를 받고 있구나"],
  },
  {
    id: "humanity",
    label: "② 나만 그런 게 아니야",
    selly: "이런 마음은\n누구에게나 찾아와.",
    options: ["누구나 이럴 때가 있어", "나만 그런 게 아니야", "다들 각자 힘든 시간을 지나"],
  },
  {
    id: "kindness",
    label: "③ 나에게 다정하게",
    selly: "이제 나에게\n다정한 말을 건네 볼까?",
    options: ["나에게 다정하게 대해 줄게", "지금 필요한 다정함을 나에게 줄게", "있는 그대로의 나를 받아들일게", "나를 용서할게", "조금 더 기다려 줄게"],
  },
] as const;

/** 친구에게 하듯 — what I'd tell a struggling friend, and the same words for me. */
export const FRIEND_WORDS = [
  { toFriend: "많이 힘들었겠다", toSelf: "많이 힘들었지, 나" },
  { toFriend: "충분히 잘하고 있어", toSelf: "나는 충분히 잘하고 있어" },
  { toFriend: "쉬어도 괜찮아", toSelf: "나도 쉬어도 괜찮아" },
  { toFriend: "네 잘못이 아니야", toSelf: "내 잘못만은 아니야" },
  { toFriend: "내가 옆에 있을게", toSelf: "내가 내 곁에 있어 줄게" },
] as const;

/** Soothing touch alternatives (Supportive Touch). */
export const TOUCH_ALTERNATIVES = ["팔짱을 끼고 나를 살짝 안아 주기", "가슴을 손으로 천천히 원을 그리며 쓸어 주기", "한 손은 배, 한 손은 가슴에 얹기", "무릎 위에서 두 손을 포개 쥐기"];
