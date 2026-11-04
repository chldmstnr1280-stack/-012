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

export interface AppData {
  version: 1;
  progress: { level: number; exp: number };
  entries: Record<DateKey, DailyEntry>;
  /** every day marked as a period day */
  periodDays: DateKey[];
  /** true while the sample data set is loaded */
  demo: boolean;
}

const KEY = "dear-selly:v1";
const EMPTY: AppData = { version: 1, progress: { level: 7, exp: 322 }, entries: {}, periodDays: [], demo: false };

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
      if (parsed?.version === 1) state = { ...EMPTY, ...parsed };
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

export function replaceAll(data: Omit<AppData, "version" | "progress">) {
  setData((d) => ({ ...d, ...data }));
}
