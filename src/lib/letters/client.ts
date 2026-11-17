"use client";

import { getData, setData } from "@/lib/data-store";
import { toKey } from "@/lib/date";
import { readGame } from "@/lib/game/gameStore";
import { currentWeather, resolveSeason } from "@/lib/garden/weather";
import { stageFor } from "@/lib/growth";
import { deliver, type LetterRec } from "./engine";

/** Look for today's letter (call when the greenhouse opens). Returns a new letter, if one just arrived. */
export function checkLetters(now = Date.now()): LetterRec | null {
  const data = getData();
  const d = new Date(now);
  const { box, letter } = deliver(data, {
    today: toKey(d),
    hour: d.getHours(),
    now,
    weather: currentWeather(d),
    season: resolveSeason(data.prefs.season, d),
    stage: stageFor(data.progress.level).id,
    game: readGame(),
  });
  setData((x) => ({ ...x, letterBox: box }));
  return letter;
}

export function markLetter(id: string, patch: Partial<Pick<LetterRec, "read" | "fav">>) {
  setData((x) => ({ ...x, letterBox: x.letterBox ? { ...x.letterBox, items: x.letterBox.items.map((l) => (l.id === id ? { ...l, ...patch, updatedAt: Date.now() } : l)) } : x.letterBox }));
}

export function deleteLetter(id: string) {
  setData((x) => ({ ...x, letterBox: x.letterBox ? { ...x.letterBox, items: x.letterBox.items.filter((l) => l.id !== id) } : x.letterBox }));
}
