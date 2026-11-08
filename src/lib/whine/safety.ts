import type { WhineReply } from "./types";

/**
 * Crisis check, run on the device and again on the server, before any reply.
 * Looks for wanting to die / self-harm. Everyday idioms ("피곤해 죽겠어",
 * "배고파 죽을 것 같아") are NOT crisis — only wanting to die or to hurt
 * oneself is. ⚠️ Patterns and wording pending clinical review.
 */
const CRISIS = [
  /죽고\s*싶/,
  /자살/,
  /자해/,
  /극단적인?\s*선택/,
  /살기\s*싫/,
  /살고\s*싶지\s*않/,
  /사라지고\s*싶/,
  /없어지고\s*싶/,
  /세상에서\s*없어지/,
  /목숨을?\s*끊/,
  /손목을?\s*(긋|그었|그을)/,
  /뛰어내리고\s*싶/,
  /(삶|인생)을?\s*끝내/,
  /나를?\s*(다치게|해치)/,
  /kill\s*myself|suicid|want\s*to\s*die|self[-\s]?harm/i,
];

export function isCrisis(text: string): boolean {
  const t = text.normalize("NFC");
  return CRISIS.some((r) => r.test(t));
}

export const CRISIS_REPLY: WhineReply = {
  message: "그 마음까지 꺼내 줘서 고마워. 지금 많이 힘들면, 109(자살예방상담전화, 24시간)에서 바로 이야기를 들어 줄 수 있어. 위험하다고 느껴지면 119에 연락해 줘.",
  emotion: "comforting",
  animation: "COMFORTING",
  suggestedAction: "help",
};
