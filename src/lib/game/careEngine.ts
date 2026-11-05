import { analyzeCycle, currentPhase } from "@/lib/cycle";
import { addDays, type DateKey } from "@/lib/date";
import type { AppData } from "@/lib/data-store";
import { pickSuggestion, type CareContext, type PickedSuggestion } from "@/data/careSuggestions";
import { analysePms, expectedPmsDays, hasSymptomRecord } from "@/lib/pms/analysis";
import type { TimeOfDay } from "./behaviorEngine";
import { readGame, updateGame } from "./gameStore";

/** Build the context from the on-device record and pick today's suggestion (or null). */
export function suggestionFor(data: AppData, today: DateKey, tod: TimeOfDay): PickedSuggestion | null {
  const info = analyzeCycle(data.periodDays, today);
  const pms = analysePms(data.periodDays, data.symptoms, today, info.nextStart);
  const todaySym = data.symptoms[today];
  const phase = currentPhase(info, today);
  const soon = !!info.nextStart && info.nextStart > today && info.nextStart <= addDays(today, 2);
  const ctx: CareContext = {
    tod,
    today: data.entries[today],
    period: data.periodDays.includes(today) || phase.kind === "period",
    periodSoon: soon,
    breathedToday: !!data.daily[today]?.done.breath,
    walkedToday: readGame().lastWalkGrowth === today,
    symptoms: hasSymptomRecord(todaySym) ? todaySym : undefined,
    pmsWindow: expectedPmsDays(pms, info.nextStart).has(today),
    pastSymptom: pms.repeated[0]?.id,
  };
  return pickSuggestion(ctx);
}

/**
 * Show at most one suggestion per day, plus one more if the day's record changes
 * what Selly would say. Only an opaque marker is stored (no wellness data).
 */
export function shouldShow(today: DateKey, rule: PickedSuggestion): boolean {
  const g = readGame();
  const key = `${today}:${hash(rule.id)}`;
  if (g.careShown.includes(key)) return false;
  if (g.careShown.filter((k) => k.startsWith(today)).length >= 2) return false;
  return true;
}

export function markShown(today: DateKey, rule: PickedSuggestion) {
  updateGame((g) => ({ careShown: [...g.careShown.filter((k) => k >= addDays(today, -3)), `${today}:${hash(rule.id)}`] }));
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}
