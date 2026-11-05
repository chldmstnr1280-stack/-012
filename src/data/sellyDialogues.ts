/**
 * Rule-based lines for Selly. Add lines freely — code picks from these arrays.
 * Tone: warm, never judging, never guilt ("Held, not healed").
 */

export const GREETINGS = {
  first: ["안녕! 나는 셀리야.\n여기는 우리 온실이야 ♡"],
  sameDay: ["오늘도\n잘 쉬어가고 있지? ♡", "또 와줬네!\n반가워 ♡"],
  nextDay: ["왔구나!\n오늘도 반가워 ♡", "좋은 아침이야…\n아니, 언제든 좋아 ♡"],
  // a few days away — no guilt, just welcome
  longAway: ["오랜만이야!\n천천히 둘러봐 ♡", "다시 와줘서 기뻐.\n온실은 그대로야 ♡"],
};

export const TOUCH_LINES = ["헤헤, 간지러워!", "오늘 하루도\n고생 많았어 ♡", "네가 와줘서 좋아", "천천히 쉬어가도\n괜찮아"];

export const WAKE_LINES = ["음… 왔구나?\n헤헤 ♡", "살짝 졸았어.\n반가워 ♡"];

export const CARE_LINES: Record<"water" | "sun" | "pat", { first: string; again: string }> = {
  water: { first: "시원해!\n고마워 ♡", again: "오늘은 충분히 마셨어.\n고마워!" },
  sun: { first: "따뜻하다…\n마음까지 포근해져", again: "햇살 가득 받았어.\n반짝반짝!" },
  pat: { first: "에헤헤,\n좋아 ♡", again: "또 쓰다듬어 줘서\n행복해 ♡" },
};

/** Occasional lines while Selly goes about her day (shown now and then, not every time). */
export const AMBIENT: Partial<Record<string, string[]>> = {
  sunbathing: ["햇살이 포근해…", "창가가 제일 따뜻해"],
  looking_at_flower: ["이 꽃 향기 좋다~", "오늘은 꽃이 더 예뻐 보여"],
  watering: ["무럭무럭 자라라~", "물 한 모금 어때?"],
  sitting: ["여기 앉아 있으면\n마음이 편해", "잠깐 쉬어가자"],
  looking_at_user: ["뭐 하고 있었어?", "같이 있어서 좋다"],
  lantern: ["랜턴 불빛이\n따뜻해"],
};

export const CALLED_LINES = ["불렀어?\n여기 있어!", "응, 갈게~"];

export const pick = <T,>(xs: readonly T[]) => xs[Math.floor(Math.random() * xs.length)];
