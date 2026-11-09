import type { Emotion } from "./moodFlowers";

/**
 * Day ontology — what a day's record is made of, as stable, typed concepts.
 *
 *   Day ─┬─ 상황 situation  (where · with whom · what happened · habits)
 *        ├─ 상태 state      (energy · body)                     + condition scores 1–5
 *        ├─ 마음 feeling    (fine feelings)                     + mood 1–5, garden emotion
 *        └─ 바람 need       (what I want right now)
 *
 * Every item has a stable id (never reuse or rename an id — add new ones), a
 * dimension and a group. Feelings carry valence/arousal (the two axes of the
 * circumplex model of affect) and the garden emotion they belong to, so fine
 * feelings roll up to the 5 garden colours and to 4 quadrants. Needs carry the
 * care action Selly can offer, so Selly answers what the user asked for
 * instead of guessing.
 *
 * Privacy: stored on this device and in the backup file only — never part of
 * the health-record server sync.
 */
/** v2 (2026-11-09): items for the 몸의 날씨 check-in — body signals, more fine feelings, a few situations */
export const ONTOLOGY_VERSION = 2;

export type Dimension = "situation" | "state" | "feeling" | "need";
export type NeedAction = "rest" | "quiet" | "breathe-long" | "breathe-sleep" | "walk" | "talk" | "kindness";

interface Item {
  id: string;
  label: string;
  /** feelings: pleasant (+1) or unpleasant (−1) */
  valence?: 1 | -1;
  /** feelings: activation */
  arousal?: "high" | "low";
  /** feelings: the garden emotion this feeling rolls up to */
  family?: Emotion;
  /** needs: what Selly can offer, and how she says it */
  action?: NeedAction;
  selly?: string;
}

export const DIMENSIONS = [
  {
    id: "situation",
    label: "상황",
    question: "오늘 어떤 하루였어?",
    groups: [
      {
        id: "place",
        label: "어디서",
        items: [
          { id: "home", label: "집" },
          { id: "work", label: "회사·학교" },
          { id: "commute", label: "이동 중" },
          { id: "outdoors", label: "밖·야외" },
        ],
      },
      {
        id: "people",
        label: "누구와",
        items: [
          { id: "by_myself", label: "혼자" },
          { id: "family", label: "가족" },
          { id: "partner", label: "연인" },
          { id: "friends", label: "친구" },
          { id: "coworkers", label: "동료" },
        ],
      },
      {
        id: "event",
        label: "있었던 일",
        items: [
          { id: "overwork", label: "야근·과로" },
          { id: "deadline", label: "마감·시험" },
          { id: "stress_event", label: "스트레스 받은 일" },
          { id: "conflict", label: "다툼·갈등" },
          { id: "good_event", label: "좋은 일" },
          { id: "travel", label: "여행" },
          { id: "busy", label: "일이 많음" },
          { id: "cycle_related", label: "생리주기와 관련 있는 것 같음" },
          { id: "ordinary_day", label: "특별한 일 없음" },
        ],
      },
      {
        id: "habit",
        label: "생활",
        items: [
          { id: "late_sleep", label: "늦게 잠" },
          { id: "short_sleep", label: "잠이 부족함" },
          { id: "exercise", label: "운동함" },
          { id: "caffeine", label: "카페인" },
          { id: "alcohol", label: "술" },
          { id: "sweets", label: "단 음식" },
          { id: "salty", label: "짠 음식·야식" },
          { id: "medication", label: "약 먹음" },
        ],
      },
    ],
  },
  {
    id: "state",
    label: "상태",
    question: "몸은 어땠어?",
    groups: [
      {
        id: "energy",
        label: "에너지",
        items: [
          { id: "energized", label: "기운 넘침" },
          { id: "refreshed", label: "개운함" },
          { id: "drained", label: "기운 없음" },
          { id: "sleepy", label: "졸림" },
        ],
      },
      {
        id: "body",
        label: "몸",
        items: [
          { id: "heavy_body", label: "몸이 무거움" },
          { id: "tense_body", label: "몸이 굳음" },
          { id: "sick", label: "감기·아픔" },
          { id: "appetite_up", label: "식욕 많음" },
          { id: "appetite_down", label: "입맛 없음" },
          { id: "chest_tight", label: "가슴이 답답함" },
          { id: "stiff_shoulders", label: "어깨·목이 뻣뻣함" },
          { id: "stomach_upset", label: "배가 불편함" },
          { id: "racing_heart", label: "심장이 빨리 뜀" },
          { id: "heavy_head", label: "머리가 무겁거나 아픔" },
          { id: "body_at_ease", label: "몸이 편안함" },
        ],
      },
    ],
  },
  {
    id: "feeling",
    label: "마음",
    question: "마음을 조금 더 자세히 적어 볼까?",
    groups: [
      {
        id: "lively",
        label: "활기찬",
        items: [
          { id: "excited", label: "신남", valence: 1, arousal: "high", family: "happy" },
          { id: "joyful", label: "기쁨", valence: 1, arousal: "high", family: "happy" },
          { id: "fluttered", label: "설렘", valence: 1, arousal: "high", family: "happy" },
          { id: "proud", label: "뿌듯함", valence: 1, arousal: "high", family: "happy" },
        ],
      },
      {
        id: "easy",
        label: "편안한",
        items: [
          { id: "serene", label: "차분함", valence: 1, arousal: "low", family: "calm" },
          { id: "content", label: "만족", valence: 1, arousal: "low", family: "calm" },
          { id: "grateful", label: "감사", valence: 1, arousal: "low", family: "calm" },
          { id: "relieved", label: "안도", valence: 1, arousal: "low", family: "calm" },
          { id: "at_ease", label: "편안함", valence: 1, arousal: "low", family: "calm" },
        ],
      },
      {
        id: "edgy",
        label: "날선",
        items: [
          { id: "worried", label: "걱정", valence: -1, arousal: "high", family: "anxious" },
          { id: "nervous", label: "초조", valence: -1, arousal: "high", family: "anxious" },
          { id: "irritated", label: "짜증", valence: -1, arousal: "high", family: "anxious" },
          { id: "angry", label: "화남", valence: -1, arousal: "high", family: "anxious" },
          { id: "overwhelmed", label: "벅참", valence: -1, arousal: "high", family: "anxious" },
          { id: "uneasy", label: "불안", valence: -1, arousal: "high", family: "anxious" },
          { id: "tense", label: "긴장", valence: -1, arousal: "high", family: "anxious" },
          { id: "wronged", label: "억울함", valence: -1, arousal: "high", family: "anxious" },
        ],
      },
      {
        id: "low",
        label: "가라앉은",
        items: [
          { id: "down", label: "울적함", valence: -1, arousal: "low", family: "sad" },
          { id: "lonely", label: "외로움", valence: -1, arousal: "low", family: "sad" },
          { id: "empty", label: "공허함", valence: -1, arousal: "low", family: "sad" },
          { id: "lethargic", label: "무기력", valence: -1, arousal: "low", family: "tired" },
          { id: "worn_out", label: "녹초", valence: -1, arousal: "low", family: "tired" },
          { id: "sorrow", label: "슬픔", valence: -1, arousal: "low", family: "sad" },
          { id: "weary", label: "피로감", valence: -1, arousal: "low", family: "tired" },
        ],
      },
      {
        id: "complex",
        label: "여러 마음",
        // no single place on the two axes: never rolled up into a quadrant or a colour
        items: [{ id: "mixed", label: "복잡한 마음" }],
      },
    ],
  },
  {
    id: "need",
    label: "바람",
    question: "지금 내가 원하는 건?",
    groups: [
      {
        id: "body_need",
        label: "몸",
        items: [
          { id: "want_rest", label: "쉬고 싶어", action: "rest", selly: "쉬고 싶은 날이구나.\n나랑 같이 쉬자." },
          { id: "want_sleep", label: "푹 자고 싶어", action: "breathe-sleep", selly: "푹 자고 싶구나.\n잠들기 전 호흡 같이 해볼까?" },
          { id: "want_move", label: "움직이고 싶어", action: "walk", selly: "몸을 움직이고 싶구나!\n같이 걸으러 갈래?" },
          { id: "want_treat", label: "맛있는 걸 먹고 싶어" },
        ],
      },
      {
        id: "mind_need",
        label: "마음",
        items: [
          { id: "want_calm", label: "마음을 가라앉히고 싶어", action: "breathe-long", selly: "마음을 가라앉히고 싶구나.\n숨을 길게 내쉬어 볼까?" },
          { id: "want_alone", label: "혼자 있고 싶어", action: "quiet", selly: "혼자 있고 싶은 날이구나.\n조용히 곁에만 있을게." },
          { id: "want_comfort", label: "위로받고 싶어", action: "kindness", selly: "위로가 필요한 날이구나.\n나랑 다정한 말 나눠 볼래?" },
          { id: "want_talk", label: "이야기하고 싶어", action: "talk", selly: "이야기하고 싶구나.\n나 여기 있어, 들려줘." },
        ],
      },
      {
        id: "do_need",
        label: "하고 싶은 것",
        items: [
          { id: "want_achieve", label: "뭔가 해내고 싶어" },
          { id: "want_fun", label: "즐겁게 놀고 싶어" },
          { id: "want_tidy", label: "정리하고 싶어" },
        ],
      },
    ],
  },
] as const satisfies readonly { id: Dimension; label: string; question: string; groups: readonly { id: string; label: string; items: readonly Item[] }[] }[];

type Dims = (typeof DIMENSIONS)[number];
export type ContextTagId = Dims["groups"][number]["items"][number]["id"];

export interface TagInfo extends Item {
  id: ContextTagId;
  dimension: Dimension;
  group: string;
  groupLabel: string;
}

export const TAGS: Record<ContextTagId, TagInfo> = Object.fromEntries(
  DIMENSIONS.flatMap((d) => d.groups.flatMap((g) => g.items.map((it) => [it.id, { ...(it as Item), dimension: d.id, group: g.id, groupLabel: g.label } as TagInfo]))),
) as Record<ContextTagId, TagInfo>;

export const CONTEXT_TAG_IDS = Object.keys(TAGS) as ContextTagId[];
export const CONTEXT_TAG_LABEL = Object.fromEntries(CONTEXT_TAG_IDS.map((id) => [id, TAGS[id].label])) as Record<ContextTagId, string>;
export const tagsOf = (dimension: Dimension) => CONTEXT_TAG_IDS.filter((id) => TAGS[id].dimension === dimension);

/** Feeling quadrants (valence × arousal). */
export const QUADRANTS = [
  { id: "lively", label: "활기찬", valence: 1, arousal: "high" },
  { id: "easy", label: "편안한", valence: 1, arousal: "low" },
  { id: "edgy", label: "날선", valence: -1, arousal: "high" },
  { id: "low", label: "가라앉은", valence: -1, arousal: "low" },
] as const;
export type QuadrantId = (typeof QUADRANTS)[number]["id"];
