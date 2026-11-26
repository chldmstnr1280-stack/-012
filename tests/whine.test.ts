import { isCrisis, CRISIS_REPLY } from "../src/lib/whine/safety";
import { fallbackReply } from "../src/lib/whine/fallback";
import { parseReply, parseRequest, ANIMATIONS } from "../src/lib/whine/types";
let fail = 0;
const ok = (c: boolean, m: string) => { if (!c) { fail++; console.log("FAIL", m); } };
for (const t of ["죽고 싶어", "그냥 사라지고 싶다", "자해하고 싶어", "살기 싫어", "I want to die"]) ok(isCrisis(t), "crisis " + t);
for (const t of ["피곤해 죽겠어", "배고파 죽을 것 같아", "회사 폭파하고 싶어", "부장 죽이고 싶음 ㅋㅋ", "집 가고 싶어", "짜증나 미치겠다"]) ok(!isCrisis(t), "not crisis " + t);
ok(fallbackReply("죽고 싶어", "together") === CRISIS_REPLY, "fallback crisis");
for (const mode of ["together", "listen"] as const) for (const q of ["😫 집 가고 싶어!", "😤 아 진짜 짜증 나!", "😭 너무 힘들어!", "🥺 나 좀 위로해 줘!", "😴 아무것도 하기 싫어!", "오늘 그냥 그래"]) {
  const r = fallbackReply(q, mode);
  ok(parseReply(r) !== null, "valid " + q);
  if (mode === "listen") ok(!["WHINING", "ANGRY_CUTE"].includes(r.animation), "listen calm " + q + " " + r.animation);
  // never repeats
  for (let i = 0; i < 20; i++) ok(fallbackReply(q, mode, r.message).message !== r.message, "no repeat " + q);
}
ok(parseReply({ message: "hi", emotion: "happy", animation: "DANCE", suggestedAction: null }) === null, "bad anim");
ok(parseReply({ message: "", emotion: "happy", animation: "HAPPY", suggestedAction: null }) === null, "empty");
ok(parseReply({ message: "hi", emotion: "happy", animation: "HAPPY", suggestedAction: "buy" }) === null, "bad action");
ok(parseReply("x") === null, "string");
ok(parseReply({ message: "a".repeat(300), emotion: "happy", animation: "HAPPY", suggestedAction: "walk" })?.message.length === 240, "trim");
ok(parseRequest({ mode: "together", turns: [{ role: "selly", text: "hi" }] }) === null, "last must be user");
ok(parseRequest({ mode: "x", turns: [{ role: "user", text: "hi" }] }) === null, "bad mode");
ok(parseRequest({ mode: "listen", turns: Array.from({ length: 20 }, () => ({ role: "user", text: "a".repeat(500) })) })?.turns.length === 8, "cap turns");
ok(ANIMATIONS.length === 8, "8 anims");
console.log(fail ? `${fail} failures` : "unit ok");
