"use client";

import { useSyncExternalStore } from "react";
import type { DateKey } from "./date";

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
}

const KEY = "dear-selly:v1";
const EMPTY: AppData = { version: 1, progress: { level: 1, exp: 0 }, entries: {}, periodDays: [], demo: false, daily: {}, prefs: { breathPattern: "calm", breathMinutes: 1, sound: true, haptic: true, music: true, musicVolume: 0.5, sfx: true, sfxVolume: 0.7 } };

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
    window.localStorage.setItem(KEY, JSON.stringify(state));
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
