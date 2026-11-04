"use client";

import { useSyncExternalStore } from "react";

/** Local-calendar date key, "YYYY-MM-DD". All app data is keyed by these. */
export type DateKey = string;

const pad = (n: number) => String(n).padStart(2, "0");

export function toKey(d: Date): DateKey {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromKey(key: DateKey): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: DateKey, n: number): DateKey {
  const d = fromKey(key);
  d.setDate(d.getDate() + n);
  return toKey(d);
}

/** Whole days from a to b (b - a). */
export function diffDays(a: DateKey, b: DateKey): number {
  return Math.round((fromKey(b).getTime() - fromKey(a).getTime()) / 86_400_000);
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
export const WEEKDAY_LABELS = WEEKDAYS;

export function formatShort(key: DateKey) {
  const d = fromKey(key);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAYS[d.getDay()]})`;
}

export function formatMonthDay(key: DateKey) {
  const d = fromKey(key);
  return `${d.getMonth() + 1}.${d.getDate()}`;
}

/* ---- today, read only on the client (prerender has no "today") ---- */
let todayCache: DateKey | null = null;
function subscribeToday(cb: () => void) {
  const id = setInterval(() => {
    const k = toKey(new Date());
    if (k !== todayCache) {
      todayCache = k;
      cb();
    }
  }, 60_000);
  return () => clearInterval(id);
}
function getToday() {
  if (!todayCache) todayCache = toKey(new Date());
  return todayCache;
}

/** Today's DateKey on the client; null during prerender / before hydration. */
export function useToday(): DateKey | null {
  return useSyncExternalStore(subscribeToday, getToday, () => null);
}
