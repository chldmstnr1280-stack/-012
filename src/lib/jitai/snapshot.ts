import { analyzeCycle } from "@/lib/cycle";
import { CONDITION_KEYS, type AppData, type ConditionKey, type Level5 } from "@/lib/data-store";
import { addDays, diffDays, toKey, type DateKey } from "@/lib/date";
import type { GameData } from "@/lib/game/gameStore";
import { timeOfDay, type TimeOfDay } from "@/lib/game/behaviorEngine";

/**
 * 상태 스냅샷 — everything the app already knows about "how is she now", in one
 * object, for the rule engine (JITAI). Built only from the on-device record.
 * Every part may be null: a missing record is "unknown", never "fine" or "0".
 * Never throws: a broken part becomes null.
 */
export interface StateSnapshot {
  at: number;
  today: DateKey;
  /** the latest daily mood (1–5, the app's own scale) and when it was saved */
  mood: { score: Level5; date: DateKey; at: number; daysAgo: number } | null;
  /** the latest condition record (each 1–5; only what was filled in) */
  condition: { values: Partial<Record<ConditionKey, Level5>>; date: DateKey; at: number; daysAgo: number } | null;
  /** from logged periods; null when there are none */
  cycle: {
    /** day of the current cycle (day 1 = last logged start) */
    day: number;
    /** days to the next expected start; null while the estimate has passed or there is too little history */
    daysToNext: number | null;
    /** days past the expected start with no new start logged (0 = not passed) */
    overdue: number;
    /** how many cycle lengths the estimate rests on (0 = default 28 days) */
    basis: number;
    onPeriod: boolean;
  } | null;
  timeOfDay: TimeOfDay;
  /** what was done in the last 7 days (today included): dates per activity */
  recentMissions: {
    breath: DateKey[];
    walk: DateKey[];
    sky: DateKey[];
    walkMission: DateKey[];
    checkin: DateKey[];
    kindness: DateKey[];
    whine: DateKey[];
  };
  /**
   * Consecutive days without any record, counted back from today (0 = recorded
   * today). null = nothing recorded yet at all (a first visit, not a gap).
   */
  missingDays: number | null;
  /** the last breath's before/after (0–10), if any in the last 7 days */
  lastBreath: { date: DateKey; before?: number; after?: number; recoveryDelta?: number } | null;
}

const safe = <T>(f: () => T, fallback: T): T => {
  try {
    return f();
  } catch {
    return fallback;
  }
};

/** a day counts as "recorded" if the user wrote anything about herself that day */
export function recordedDays(data: AppData): Set<DateKey> {
  const days = new Set<DateKey>();
  for (const [d, e] of Object.entries(data.entries ?? {})) if (e && (e.mood != null || e.emotion || Object.keys(e.condition ?? {}).length || e.memo)) days.add(d);
  for (const d of Object.keys(data.symptoms ?? {})) days.add(d);
  for (const c of data.checkins ?? []) days.add(c.date);
  for (const d of data.periodDays ?? []) days.add(d);
  return days;
}

export function snapshot(data: AppData, game: GameData, now = new Date()): StateSnapshot {
  const today = toKey(now);
  const weekAgo = addDays(today, -6);
  const inWeek = (d: string) => d >= weekAgo && d <= today;
  const uniq = (xs: DateKey[]) => [...new Set(xs.filter(inWeek))].sort();

  const mood = safe(() => {
    const days = Object.keys(data.entries ?? {})
      .filter((d) => d <= today && data.entries[d]?.mood != null)
      .sort();
    const d = days[days.length - 1];
    if (!d) return null;
    const e = data.entries[d];
    return { score: e.mood!, date: d, at: e.updatedAt, daysAgo: diffDays(d, today) };
  }, null);

  const condition = safe(() => {
    const days = Object.keys(data.entries ?? {})
      .filter((d) => d <= today && CONDITION_KEYS.some((k) => data.entries[d]?.condition?.[k] != null))
      .sort();
    const d = days[days.length - 1];
    if (!d) return null;
    const e = data.entries[d];
    return { values: { ...e.condition }, date: d, at: e.updatedAt, daysAgo: diffDays(d, today) };
  }, null);

  const cycle = safe(() => {
    if (!data.periodDays?.length) return null;
    const info = analyzeCycle(data.periodDays, today);
    const last = info.periods.filter((p) => p.start <= today).pop();
    if (!last) return null;
    return {
      day: diffDays(last.start, today) + 1,
      daysToNext: info.overdue > 0 || !info.nextStart ? null : diffDays(today, info.nextStart),
      overdue: info.overdue,
      basis: info.basis,
      onPeriod: data.periodDays.includes(today),
    };
  }, null);

  const recentMissions = safe(
    () => ({
      breath: uniq([...Object.keys(data.daily ?? {}).filter((d) => data.daily[d]?.done?.breath), ...(data.breathLog ?? []).filter((b) => b.completed).map((b) => b.date)]),
      walk: uniq((game.walks ?? []).map((w) => w.date)),
      sky: uniq((game.missions ?? []).filter((m) => m.id === "sky").map((m) => m.date)),
      walkMission: uniq((game.missions ?? []).map((m) => m.date)),
      checkin: uniq((data.checkins ?? []).map((c) => c.date)),
      kindness: uniq([...(game.kindness?.dates ?? []), ...(data.kindLog ?? []).map((k) => k.date)]),
      whine: uniq(game.whineDates ?? []),
    }),
    { breath: [], walk: [], sky: [], walkMission: [], checkin: [], kindness: [], whine: [] },
  );

  const missingDays = safe(() => {
    const days = recordedDays(data);
    if (![...days].some((d) => d <= today)) return null;
    let n = 0;
    while (n < 60 && !days.has(addDays(today, -n))) n++;
    return n;
  }, null);

  const lastBreath = safe(() => {
    const b = [...(data.breathLog ?? [])].filter((x) => inWeek(x.date)).sort((a, c) => a.at - c.at).pop();
    return b ? { date: b.date, before: b.before, after: b.after, recoveryDelta: b.recoveryDelta } : null;
  }, null);

  return { at: now.getTime(), today, mood, condition, cycle, timeOfDay: timeOfDay(now), recentMissions, missingDays, lastBreath };
}
