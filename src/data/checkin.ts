import type { ContextTagId } from "./contextTags";

/**
 * 오늘, 몸의 날씨 — a 30-second check-in: body → feelings → what happened → my weather.
 * Every choice maps to an id in the day ontology (src/data/contextTags.ts), so a
 * check-in joins the day's record instead of being a second, separate diary.
 *
 * "잘 모르겠어" is a real answer (stored as a flag, never as a tag).
 * Nothing here is a diagnosis: body signals are not read as feelings, feelings
 * are not scored good or bad, and a situation is never called the cause.
 * ⚠️ Wording pending review by a mental-health professional.
 */
export interface Choice {
  id: ContextTagId;
  label: string;
  emoji: string;
}

export const BODY: Choice[] = [
  { id: "chest_tight", label: "가슴이 답답해", emoji: "🫁" },
  { id: "stiff_shoulders", label: "어깨와 목이 뻣뻣해", emoji: "🪨" },
  { id: "stomach_upset", label: "배가 불편해", emoji: "🌀" },
  { id: "racing_heart", label: "심장이 빠르게 뛰는 것 같아", emoji: "💓" },
  { id: "drained", label: "몸에 힘이 없어", emoji: "🪫" },
  { id: "heavy_head", label: "머리가 무겁거나 아파", emoji: "☁️" },
  { id: "body_at_ease", label: "몸이 편안해", emoji: "🌿" },
];

export const FEELINGS: Choice[] = [
  { id: "at_ease", label: "편안함", emoji: "🍃" },
  { id: "joyful", label: "기쁨", emoji: "🌼" },
  { id: "fluttered", label: "설렘", emoji: "💗" },
  { id: "uneasy", label: "불안", emoji: "🌫️" },
  { id: "tense", label: "긴장", emoji: "🪢" },
  { id: "angry", label: "분노", emoji: "🔥" },
  { id: "wronged", label: "억울함", emoji: "😤" },
  { id: "sorrow", label: "슬픔", emoji: "💧" },
  { id: "lonely", label: "외로움", emoji: "🌙" },
  { id: "weary", label: "피로감", emoji: "🥱" },
  { id: "lethargic", label: "무기력", emoji: "🫠" },
  { id: "mixed", label: "복잡한 마음", emoji: "🧶" },
];

export const SITUATIONS: Choice[] = [
  { id: "busy", label: "일이 많았어", emoji: "📚" },
  { id: "conflict", label: "누군가와 갈등이 있었어", emoji: "⚡" },
  { id: "short_sleep", label: "잠을 충분히 못 잤어", emoji: "🌙" },
  { id: "drained", label: "몸이 피곤해", emoji: "🪫" },
  { id: "cycle_related", label: "생리주기와 관련 있을 것 같아", emoji: "🌸" },
  { id: "good_event", label: "기분 좋은 일이 있었어", emoji: "✨" },
  { id: "ordinary_day", label: "특별한 일은 없었어", emoji: "🍵" },
];

/** intensity: soft words, never "good/bad" */
export const INTENSITY = ["살짝", "조금", "꽤", "많이", "아주 크게"] as const;

/** 몸의 날씨 — chosen by the user, never assigned. Every weather is lovely. */
export const BODY_WEATHERS = [
  { id: "clear", emoji: "☀️", label: "맑음", hint: "편안하고 가벼운" },
  { id: "cloudy", emoji: "☁️", label: "흐림", hint: "조금 지치고 느린" },
  { id: "rain", emoji: "🌧️", label: "비", hint: "마음이 촉촉하고 무거운" },
  { id: "windy", emoji: "🌬️", label: "바람", hint: "마음이 살랑살랑 흔들리는" },
  { id: "rainbow", emoji: "🌈", label: "무지개", hint: "여러 마음이 섞인" },
  { id: "snow", emoji: "❄️", label: "눈", hint: "고요히 쉬어 가는" },
] as const;
export type BodyWeather = (typeof BODY_WEATHERS)[number]["id"];

export const LINES = {
  body: ["오늘은 마음보다 몸의 이야기를 먼저 들어볼까?", "지금 몸에서 가장 크게 느껴지는 건 뭐야?"],
  feel: "그 느낌과 함께 어떤 마음이 찾아왔을까?",
  intensity: "이 마음이 지금 얼마나 크게 느껴져?",
  situation: "오늘 몸과 마음에 영향을 준 일이 있었을까?",
  weather: "오늘 너의 몸과 마음은 어떤 날씨 같아?",
  weatherNote: "정답은 없어. 비 오는 날도 정원은 예뻐.",
  nod: ["응응", "그렇구나", "끄덕끄덕", "알려 줘서 고마워"],
};

/**
 * Warning signs that are not for a breathing exercise (shown as a link on the
 * body step, and as a note when chest/heart signals are chosen). Not a diagnosis.
 */
export const BODY_SAFETY = {
  link: "숨쉬기 힘들거나, 가슴이 아프거나, 쓰러질 것 같아",
  title: "지금은 몸을 먼저 돌봐 줘",
  body: "가슴이 아프거나 조이는 느낌이 계속되거나, 숨쉬기가 힘들거나, 쓰러질 것 같거나 정신이 흐려지면 마음 때문이라고 넘기지 말고 바로 119에 연락하거나 가까운 응급실로 가 줘.",
  note: "가슴 통증이 심해지거나, 숨이 차거나, 어지러우면 마음 때문이라고 넘기지 말고 바로 119나 병원에 도움을 요청해 줘.",
};
