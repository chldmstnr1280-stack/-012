import { analyzeCycle } from "@/lib/cycle";
import { deleteSymptoms, getData, saveEntry, saveSymptoms, setPeriodDays, type AppData, type ConditionKey, type Level5, type SymptomDay } from "@/lib/data-store";
import { addDays, diffDays, type DateKey } from "@/lib/date";
import { DRSP_ORDER } from "@/data/drspAreas";
import type { FlowAmount, FlowSign, Score, SymptomId } from "@/data/pmsSymptoms";

/**
 * 오늘 기록 (30초) — one screen that writes into the records the app already
 * keeps (daily entry, symptom day, period days). Every tap saves right away and
 * keeps whatever else that day already holds.
 */

/** the few items shown on ordinary days (DRSP areas: mood, anxiety, irritability, lability, energy, body) */
export const CORE_SYMPTOMS: SymptomId[] = ["low_mood", "anxiety", "irritability", "mood_swings", "fatigue", "cramps", "headache", "bloating"];
/** days before an expected start when the full list is shown */
export const FULL_BEFORE_DAYS = 14;

/**
 * Show every DRSP-area item around a period (the days that matter most for a
 * premenstrual record): on/after a period day, in the 14 days before an
 * expected start, or once an expected start has passed.
 */
export function fullSymptomSet(data: AppData, today: DateKey): boolean {
  const days = (data.periodDays ?? []).filter((d) => d <= today);
  if (!days.length) return false;
  if ([0, 1, 2].some((n) => days.includes(addDays(today, -n)))) return true;
  const info = analyzeCycle(days, today);
  if (info.overdue > 0) return true;
  return !!info.nextStart && diffDays(today, info.nextStart) <= FULL_BEFORE_DAYS;
}

/** items to show: full or core, always including anything already rated today, in DRSP-area order */
export function symptomsToShow(data: AppData, today: DateKey, all = fullSymptomSet(data, today)): SymptomId[] {
  const rated = Object.keys(data.symptoms?.[today]?.scores ?? {}) as SymptomId[];
  const keep = new Set<SymptomId>([...(all ? DRSP_ORDER : CORE_SYMPTOMS), ...rated]);
  return DRSP_ORDER.filter((id) => keep.has(id));
}

/* ---------- writes (each keeps the rest of the day) ---------- */

export function setMood(date: DateKey, v: Level5 | undefined) {
  const e = getData().entries[date];
  saveEntry(date, { ...(e ?? { condition: {} }), mood: v });
}

export function setCondition(date: DateKey, key: ConditionKey, v: Level5 | undefined) {
  const e = getData().entries[date] ?? { condition: {} };
  const condition = { ...e.condition };
  if (v == null || condition[key] === v) delete condition[key];
  else condition[key] = v;
  saveEntry(date, { ...e, condition });
}

const dayOf = (date: DateKey): Omit<SymptomDay, "updatedAt"> => {
  const d = getData().symptoms[date];
  return { scores: { ...(d?.scores ?? {}) }, impact: { ...(d?.impact ?? {}) }, ...(d?.sleepHours != null ? { sleepHours: d.sleepHours } : {}), ...(d?.note ? { note: d.note } : {}), ...(d?.flow ? { flow: d.flow } : {}) };
};
const writeDay = (date: DateKey, next: Omit<SymptomDay, "updatedAt">) => {
  const any = next.none || Object.keys(next.scores).length || Object.keys(next.impact).length || next.sleepHours != null || !!next.note || !!next.flow;
  if (any) saveSymptoms(date, next);
  else deleteSymptoms(date);
};

/** tap = 보통(2) · again = 심함(3) · again = 매우 심함(4) · again = not recorded */
export function cycleSymptom(date: DateKey, id: SymptomId): Score | undefined {
  const next = dayOf(date);
  const cur = next.scores[id];
  const v: Score | undefined = cur == null || cur < 2 ? 2 : cur === 4 ? undefined : ((cur + 1) as Score);
  if (v == null) delete next.scores[id];
  else next.scores[id] = v;
  writeDay(date, next); // rating anything drops "증상 없음"
  return v;
}

export function setNoSymptoms(date: DateKey, on: boolean) {
  const d = dayOf(date);
  writeDay(date, on ? { ...d, scores: {}, impact: {}, none: true } : { ...d, scores: {}, impact: {} });
}

/** "증상 때문에 일상이 얼마나 힘들었어?" → the 일상 활동 life-impact item (0–4) */
export function setDailyImpact(date: DateKey, v: Score | undefined) {
  const next = { ...dayOf(date), none: getData().symptoms[date]?.none };
  if (v == null || next.impact.daily === v) delete next.impact.daily;
  else next.impact.daily = v;
  writeDay(date, next);
}

export function setOnPeriod(date: DateKey, on: boolean) {
  setPeriodDays([date], on);
}

export function setFlow(date: DateKey, patch: { amount?: FlowAmount; sign?: FlowSign }) {
  const next = { ...dayOf(date), none: getData().symptoms[date]?.none };
  const cur = { ...(next.flow ?? {}) };
  if (patch.amount) cur.amount = cur.amount === patch.amount ? undefined : patch.amount;
  if (patch.sign) {
    const s = new Set(cur.signs ?? []);
    if (s.has(patch.sign)) s.delete(patch.sign);
    else s.add(patch.sign);
    cur.signs = [...s];
  }
  const clean = { ...(cur.amount ? { amount: cur.amount } : {}), ...(cur.signs?.length ? { signs: cur.signs } : {}) };
  if (Object.keys(clean).length) next.flow = clean;
  else delete next.flow;
  writeDay(date, next);
}

/** anything recorded today through this screen (for the daily growth) */
export function recordedToday(data: AppData, date: DateKey): boolean {
  const e = data.entries[date];
  const s = data.symptoms[date];
  return !!(e && (e.mood != null || Object.keys(e.condition ?? {}).length)) || !!(s && (s.none || Object.keys(s.scores).length || Object.keys(s.impact).length || s.flow)) || data.periodDays.includes(date);
}
