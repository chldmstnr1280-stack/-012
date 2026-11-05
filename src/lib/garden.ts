import { diffDays, type DateKey } from "./date";
import type { AppData } from "./data-store";
import type { Emotion } from "@/data/moodFlowers";

export interface PlantedFlower {
  date: DateKey;
  emotion: Emotion;
  /** 0 seed · 1 sprout · 2 bud · 3 bloom */
  stage: number;
}

/**
 * The mood garden, derived from the wellness record (nothing extra is stored).
 * Each day with a recorded feeling plants one flower. It grows one stage per day
 * that passes, and one more for each day Selly's garden was watered — so care
 * helps, but time alone is enough. Flowers never wilt, whatever the feeling.
 */
export function plantedFlowers(data: Pick<AppData, "entries" | "daily">, today: DateKey): PlantedFlower[] {
  const waterDays = Object.keys(data.daily).filter((k) => data.daily[k]?.done.water);
  return Object.keys(data.entries)
    .filter((k) => data.entries[k].emotion && k <= today)
    .sort()
    .map((date) => {
      const days = Math.max(0, diffDays(date, today));
      const watered = waterDays.filter((w) => w >= date && w <= today).length;
      return { date, emotion: data.entries[date].emotion!, stage: Math.min(3, days + watered) };
    });
}
