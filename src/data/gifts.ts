import type { FindKind } from "@/lib/game/gameStore";

/** Small gifts between friends. Preset only — no free text travels between people. */
export const GIFT_KINDS = ["water", "seed", "petal", "firefly", "hug"] as const;
export type GiftKind = (typeof GIFT_KINDS)[number];

export const GIFT_INFO: Record<GiftKind, { emoji: string; label: string; done: string; find?: FindKind }> = {
  water: { emoji: "💧", label: "물 주기", done: "물을 주고 갔어" },
  seed: { emoji: "🌱", label: "씨앗", done: "씨앗을 두고 갔어", find: "seed" },
  petal: { emoji: "🌸", label: "꽃잎", done: "꽃잎을 선물했어", find: "petal" },
  firefly: { emoji: "✨", label: "반딧불이", done: "반딧불이를 보내줬어", find: "firefly" },
  hug: { emoji: "🤍", label: "포옹", done: "꼭 안아주고 갔어" },
};

export const GIFT_MESSAGES = ["오늘도 수고했어 ♡", "천천히 쉬어가", "생각나서 왔어", "응원해!", "같이 힘내자 🌿"] as const;
