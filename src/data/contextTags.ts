/**
 * "오늘의 상황" — context tags for a day (one tap each, optional).
 *
 * Tags describe what happened, not how the user felt, so the report can show
 * symptoms on tagged days next to other days. They never claim a cause.
 * Stored on this device only (and in the backup file) — NOT part of the
 * health-record server sync, whose consent covers period days and symptom
 * scores only.
 */
export const CONTEXT_TAG_GROUPS = [
  {
    id: "life",
    label: "생활",
    items: [
      { id: "overwork", label: "야근·과로" },
      { id: "late_sleep", label: "늦게 잠" },
      { id: "exercise", label: "운동함" },
      { id: "travel", label: "여행·이동" },
    ],
  },
  {
    id: "food",
    label: "먹은 것",
    items: [
      { id: "caffeine", label: "카페인" },
      { id: "alcohol", label: "술" },
      { id: "sweets", label: "단 음식" },
      { id: "salty", label: "짠 음식·야식" },
    ],
  },
  {
    id: "mind",
    label: "마음·관계",
    items: [
      { id: "stress_event", label: "스트레스 받은 일" },
      { id: "conflict", label: "다툼·갈등" },
      { id: "good_event", label: "좋은 일" },
    ],
  },
  {
    id: "body",
    label: "몸",
    items: [
      { id: "sick", label: "감기·아픔" },
      { id: "medication", label: "약 먹음" },
    ],
  },
] as const;

export type ContextTagId = (typeof CONTEXT_TAG_GROUPS)[number]["items"][number]["id"];
export const CONTEXT_TAG_IDS = CONTEXT_TAG_GROUPS.flatMap((g) => g.items.map((i) => i.id)) as ContextTagId[];
export const CONTEXT_TAG_LABEL = Object.fromEntries(CONTEXT_TAG_GROUPS.flatMap((g) => g.items.map((i) => [i.id, i.label]))) as Record<ContextTagId, string>;
