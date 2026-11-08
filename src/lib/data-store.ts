"use client";

import type { Wish } from "@/lib/wish/wishes";
import { useSyncExternalStore } from "react";
import type { DateKey } from "./date";
import type { Emotion } from "@/data/moodFlowers";
import type { ImpactId, OnsetId, Score, SymptomId } from "@/data/pmsSymptoms";
import type { ContextTagId } from "@/data/contextTags";
import type { NutrientId, SuppTime } from "@/data/nutrition";
import type { FoodId, MealSlot } from "@/data/foods";
import { afterPersist } from "@/lib/platform";

/**
 * On-device data store (Phase 2). Everything lives in this browser's
 * localStorage only — nothing is sent to a server. A real backend replaces
 * `load`/`persist` later; the hooks stay the same.
 */

export type Level5 = 1 | 2 | 3 | 4 | 5;
export const CONDITION_KEYS = ["energy", "sleep", "focus", "stress"] as const;
export type ConditionKey = (typeof CONDITION_KEYS)[number];

export interface DailyEntry {
  mood?: Level5;
  /** a feeling, which plants a flower of its colour in the mood garden */
  emotion?: Emotion;
  condition: Partial<Record<ConditionKey, Level5>>;
  steps?: number;
  memo?: string;
  updatedAt: number;
}

/** Things that grant growth once per day. */
export const DAILY_TASKS = ["record", "breath", "water", "sun", "pat"] as const;
export type DailyTask = (typeof DAILY_TASKS)[number];

export interface DailyLog {
  done: Partial<Record<DailyTask, true>>;
  /** growth earned from touching Selly today (capped) */
  touchExp?: number;
  /** all-tasks bonus already granted */
  bonus?: true;
}

/**
 * One day of PMS symptom record. A day with no entry = NOT RECORDED (unknown),
 * never "no symptoms". "No symptoms" is an explicit `none: true` entry.
 */
export interface SymptomDay {
  scores: Partial<Record<SymptomId, Score>>;
  impact: Partial<Record<ImpactId, Score>>;
  /** the user said "no symptoms today" */
  none?: true;
  updatedAt: number;
}

/** Day context (상황 · 상태 · 마음 · 바람). Device + backup file; on the server only with the consent version that covers it. */
export interface DayTags {
  tags: ContextTagId[];
  updatedAt: number;
}

/**
 * The user's own answer to "how is PMS usually for you?" (pre-question).
 * A self-report used only until the daily records can speak for themselves.
 */
export interface PmsProfile {
  symptoms: Partial<Record<SymptomId, Score>>;
  onset?: OnsetId;
  updatedAt: number;
}

/** Looking back on one cycle ("이번 생리 전엔 어땠어?"), keyed by the logged period start. */
export interface CycleRecap {
  symptoms: Partial<Record<SymptomId, Score>>;
  onset?: OnsetId;
  updatedAt: number;
}

/** One meal: the kinds of food, or "skipped". */
export interface Meal {
  foods: FoodId[];
  skipped?: true;
}
export type MealDay = Partial<Record<MealSlot, Meal>> & { updatedAt: number };

/** A supplement the user takes (their own words; the app never suggests one). */
export interface Supplement {
  id: string;
  name: string;
  nutrients: NutrientId[];
  times: SuppTime[];
  /** false = no longer taking it (kept so past check-ins still have a name) */
  active: boolean;
  createdAt: number;
}

/** Optional context that changes how a cycle should be read (never required). */
export interface CycleContext {
  hormonalContraception?: "yes" | "no" | "unsure";
}

export interface AppData {
  version: 1;
  progress: { level: number; exp: number };
  entries: Record<DateKey, DailyEntry>;
  /** every day marked as a period day */
  periodDays: DateKey[];
  /** true while the sample data set is loaded */
  demo: boolean;
  daily: Record<DateKey, DailyLog>;
  prefs: Prefs;
  /** PMS daily symptom records (Phase A) */
  symptoms: Record<DateKey, SymptomDay>;
  cycleContext: CycleContext;
  /** what happened on a day (context tags) */
  dayTags: Record<DateKey, DayTags>;
  /** usual PMS pattern, as the user described it */
  pmsProfile?: PmsProfile;
  /** per-cycle look-back, keyed by period start */
  cycleRecaps: Record<DateKey, CycleRecap>;
  /** cups of water per day */
  water: Record<DateKey, number>;
  supplements: Supplement[];
  /** taken per day: "supplementId@time" */
  suppLog: Record<DateKey, string[]>;
  /** what I ate (kinds of food per meal) */
  meals: Record<DateKey, MealDay>;
  /** questions to bring to a pharmacist/doctor (picked from a list, plus one of my own) */
  consult?: { questions: string[]; custom?: string };
  /** 셀리와 소망 빌기 (this device and the backup file only) */
  wishes?: Wish[];
}

export interface Prefs {
  breathPattern: string;
  breathMinutes: number;
  /** soft chime on breathing phase changes */
  sound: boolean;
  haptic: boolean;
  /** generative background music */
  music: boolean;
  musicVolume: number;
  /** Selly's cute sound effects */
  sfx: boolean;
  sfxVolume: number;
  /** greenhouse mood: follow the device clock, or a fixed time of day */
  ambience: "auto" | "morning" | "day" | "evening" | "night";
  /** daily water goal in cups (200 ml) */
  waterGoal?: number;
  /** greenhouse weather: chosen, or "auto" (default) */
  weather?: import("@/lib/garden/weather").WeatherPref;
  /** greenhouse season: "auto" follows the calendar (default) */
  season?: import("@/lib/garden/weather").SeasonPref;
  /** nature sounds (rain, birds, wind, crickets) — default on, plays only after a tap */
  nature?: boolean;
  natureVolume?: number;
}

const KEY = "dear-selly:v1";
const EMPTY: AppData = { version: 1, progress: { level: 1, exp: 0 }, entries: {}, periodDays: [], demo: false, daily: {}, symptoms: {}, cycleContext: {}, dayTags: {}, cycleRecaps: {}, water: {}, supplements: [], suppLog: {}, meals: {}, prefs: { breathPattern: "calm", breathMinutes: 1, sound: true, haptic: true, music: true, musicVolume: 0.5, sfx: true, sfxVolume: 0.7, ambience: "auto" } };

let state: AppData = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppData;
      if (parsed?.version === 1) state = { ...EMPTY, ...parsed, prefs: { ...EMPTY.prefs, ...parsed.prefs } };
    }
  } catch {
    // storage blocked (private mode etc.) — run in memory
  }
}

function persist() {
  try {
    const json = JSON.stringify(state);
    window.localStorage.setItem(KEY, json);
    afterPersist(KEY, json);
  } catch {
    // ignore: data stays in memory for this session
  }
}

export function getData(): AppData {
  load();
  return state;
}

export function setData(update: (d: AppData) => AppData) {
  load();
  state = update(state);
  persist();
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    loaded = false;
    load();
    cb();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

/** Subscribe to the store. Returns the empty data set during prerender. */
export function useAppData(): AppData {
  return useSyncExternalStore(subscribe, getData, () => EMPTY);
}

/* ---------- actions ---------- */

export function saveEntry(date: DateKey, entry: Omit<DailyEntry, "updatedAt">): { firstTime: boolean } {
  const firstTime = !getData().entries[date];
  setData((d) => ({ ...d, entries: { ...d.entries, [date]: { ...entry, updatedAt: Date.now() } } }));
  return { firstTime };
}

export function setPeriodDays(days: DateKey[], on: boolean) {
  setData((d) => {
    const set = new Set(d.periodDays);
    days.forEach((k) => (on ? set.add(k) : set.delete(k)));
    return { ...d, periodDays: [...set].sort() };
  });
  healthListeners.forEach((l) => l({ kind: "period", days, on }));
}

export function setProgress(progress: AppData["progress"]) {
  setData((d) => ({ ...d, progress }));
}

export function replaceAll(data: Pick<AppData, "entries" | "periodDays" | "demo">) {
  setData((d) => ({ ...d, ...data }));
}

/** Marks a daily task. Returns true only the first time today (i.e. growth should be granted). */
export function markDaily(date: DateKey, task: DailyTask): boolean {
  const log = getData().daily[date];
  if (log?.done[task]) return false;
  setData((d) => {
    const cur = d.daily[date] ?? { done: {} };
    // keep only the last 60 days of daily logs
    const keys = Object.keys(d.daily).sort().slice(-59).filter((k) => k !== date);
    const kept = Object.fromEntries(keys.map((k) => [k, d.daily[k]]));
    return { ...d, daily: { ...kept, [date]: { ...cur, done: { ...cur.done, [task]: true } } } };
  });
  return true;
}

export const TOUCH_EXP_CAP = 10;

/** Growth for touching Selly, capped per day. Returns how much to grant (0 or 1). */
export function claimTouchExp(date: DateKey): number {
  const log = getData().daily[date] ?? { done: {} };
  if ((log.touchExp ?? 0) >= TOUCH_EXP_CAP) return 0;
  setData((d) => ({ ...d, daily: { ...d.daily, [date]: { ...log, touchExp: (log.touchExp ?? 0) + 1 } } }));
  return 1;
}

/** Grants the all-tasks bonus once per day when every task is done. */
export function claimDailyBonus(date: DateKey): boolean {
  const log = getData().daily[date];
  if (!log || log.bonus || !DAILY_TASKS.every((t) => log.done[t])) return false;
  setData((d) => ({ ...d, daily: { ...d.daily, [date]: { ...log, bonus: true } } }));
  return true;
}

export function resetAll() {
  setData(() => ({ ...EMPTY }));
}

/** Replace the whole data set (used by backup import). */
export function applyData(next: AppData) {
  setData(() => next);
}

export function setPrefs(patch: Partial<Prefs>) {
  setData((d) => ({ ...d, prefs: { ...d.prefs, ...patch } }));
}

/** Add walk steps to a day's record (keeps everything else on that day). */
export function addSteps(date: DateKey, steps: number) {
  if (steps <= 0) return;
  setData((d) => {
    const cur = d.entries[date] ?? { condition: {}, updatedAt: 0 };
    return { ...d, entries: { ...d.entries, [date]: { ...cur, steps: Math.min(200_000, (cur.steps ?? 0) + steps), updatedAt: Date.now() } } };
  });
}

/* ---------- PMS records (Phase A) ---------- */

type HealthListener = (
  change:
    | { kind: "symptoms"; date: DateKey; day: SymptomDay | null }
    | { kind: "period"; days: DateKey[]; on: boolean }
    | { kind: "context"; date: DateKey; day: DayTags | null },
) => void;
const healthListeners = new Set<HealthListener>();
/** Lets the optional server sync follow record changes (nothing listens unless the user opted in). */
export function onHealthChange(l: HealthListener) {
  healthListeners.add(l);
  return () => healthListeners.delete(l);
}

export function saveSymptoms(date: DateKey, day: Omit<SymptomDay, "updatedAt">) {
  const next: SymptomDay = { ...day, updatedAt: Date.now() };
  setData((d) => ({ ...d, symptoms: { ...d.symptoms, [date]: next } }));
  healthListeners.forEach((l) => l({ kind: "symptoms", date, day: next }));
}

/** Sets the context tags of a day; an empty list removes the day. */
export function setDayTags(date: DateKey, tags: ContextTagId[]) {
  const prev = getData().dayTags[date];
  if (!prev && !tags.length) return;
  if (prev && prev.tags.length === tags.length && prev.tags.every((t) => tags.includes(t))) return; // unchanged
  const day: DayTags | null = tags.length ? { tags, updatedAt: Date.now() } : null;
  setData((d) => {
    const next = { ...d.dayTags };
    if (day) next[date] = day;
    else delete next[date];
    return { ...d, dayTags: next };
  });
  healthListeners.forEach((l) => l({ kind: "context", date, day }));
}

export function setPmsProfile(p: Omit<PmsProfile, "updatedAt">) {
  setData((d) => ({ ...d, pmsProfile: { ...p, updatedAt: Date.now() } }));
}

export function setCycleRecap(start: DateKey, r: Omit<CycleRecap, "updatedAt"> | null) {
  setData((d) => {
    const next = { ...d.cycleRecaps };
    if (r) next[start] = { ...r, updatedAt: Date.now() };
    else delete next[start];
    return { ...d, cycleRecaps: next };
  });
}

export function setConsult(c: { questions: string[]; custom?: string }) {
  setData((d) => ({ ...d, consult: { questions: c.questions, ...(c.custom?.trim() ? { custom: c.custom.trim().slice(0, 120) } : {}) } }));
}

/** Sets one meal (null clears it); an empty day is removed. */
export function setMeal(date: DateKey, slot: MealSlot, meal: Meal | null) {
  setData((d) => {
    const day: MealDay = { ...(d.meals[date] ?? {}), updatedAt: Date.now() };
    if (meal && (meal.skipped || meal.foods.length)) day[slot] = meal;
    else delete day[slot];
    const meals = { ...d.meals };
    if (Object.keys(day).some((k) => k !== "updatedAt")) meals[date] = day;
    else delete meals[date];
    return { ...d, meals };
  });
}

/** Adds (or removes, with a negative delta) cups of water; returns the new count. */
export function addWater(date: DateKey, delta: number): number {
  const next = Math.max(0, Math.min(30, (getData().water[date] ?? 0) + delta));
  setData((d) => {
    const water = { ...d.water };
    if (next) water[date] = next;
    else delete water[date];
    return { ...d, water };
  });
  return next;
}

export function saveSupplement(sp: Omit<Supplement, "id" | "createdAt"> & { id?: string }) {
  setData((d) => {
    const existing = sp.id ? d.supplements.find((x) => x.id === sp.id) : undefined;
    const item: Supplement = existing
      ? { ...existing, ...sp, id: existing.id }
      : { ...sp, id: `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, createdAt: Date.now() };
    return { ...d, supplements: existing ? d.supplements.map((x) => (x.id === item.id ? item : x)) : [...d.supplements, item] };
  });
}

/** Stop taking a supplement: hidden from today's list, kept for past days. */
export function retireSupplement(id: string) {
  setData((d) => ({ ...d, supplements: d.supplements.map((x) => (x.id === id ? { ...x, active: false } : x)) }));
}

export function toggleSuppTaken(date: DateKey, key: string) {
  setData((d) => {
    const cur = d.suppLog[date] ?? [];
    const next = cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key];
    const suppLog = { ...d.suppLog };
    if (next.length) suppLog[date] = next;
    else delete suppLog[date];
    return { ...d, suppLog };
  });
}

/** Removes a day's symptom record: the day goes back to "not recorded". */
export function deleteSymptoms(date: DateKey) {
  setData((d) => {
    const rest = { ...d.symptoms };
    delete rest[date];
    return { ...d, symptoms: rest };
  });
  healthListeners.forEach((l) => l({ kind: "symptoms", date, day: null }));
}

export function setCycleContext(patch: Partial<CycleContext>) {
  setData((d) => ({ ...d, cycleContext: { ...d.cycleContext, ...patch } }));
}

/** 셀리와 소망 빌기: add, replace or remove one wish (by id). */
export function putWish(w: Wish) {
  setData((d) => {
    const list = d.wishes ?? [];
    const i = list.findIndex((x) => x.id === w.id);
    return { ...d, wishes: i < 0 ? [...list, w] : list.map((x) => (x.id === w.id ? w : x)) };
  });
}
export function removeWish(id: string) {
  setData((d) => ({ ...d, wishes: (d.wishes ?? []).filter((x) => x.id !== id) }));
}
