import type { Prefs } from "@/lib/data-store";
import { fromKey, type DateKey } from "@/lib/date";

/**
 * 크리스마스 온실 — a tree in the greenhouse and music-box carols.
 * "auto" (default): from 20 November to 31 December. "on" / "off": always / never.
 */
export type ChristmasPref = "auto" | "on" | "off";

export function inChristmasSeason(d = new Date()): boolean {
  const m = d.getMonth() + 1;
  return (m === 11 && d.getDate() >= 20) || m === 12;
}

/** `today` comes from the device clock after mount (null while prerendering → off) */
export function christmasOn(prefs: Pick<Prefs, "christmas">, today: DateKey | Date | null): boolean {
  if (!today) return false;
  const p = prefs.christmas ?? "auto";
  return p === "on" || (p === "auto" && inChristmasSeason(typeof today === "string" ? fromKey(today) : today));
}

/** what Selly says when the tree is tapped */
export const TREE_LINES = [
  "반짝반짝 예쁘지?\n올해도 정말 수고했어 🎄",
  "오르골에서 캐럴이 나와!\n같이 들을까? ♪",
  "트리 아래 선물은…\n오늘을 버틴 너한테 주는 거야 🎁",
  "고요한 밤, 거룩한 밤…\n오늘 밤은 푹 쉬자.",
  "별이 제일 위에서\n너를 비춰 주고 있어 ⭐",
];
