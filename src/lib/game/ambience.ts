"use client";

import { useSyncExternalStore } from "react";
import { getData, useAppData, type Prefs } from "@/lib/data-store";
import { timeOfDay, type TimeOfDay } from "./behaviorEngine";

/** The time of day the greenhouse shows: the device clock, or the user's chosen mood. */
export function effectiveTimeOfDay(ambience: Prefs["ambience"], now = new Date()): TimeOfDay {
  return ambience === "auto" ? timeOfDay(now) : ambience;
}

/** For non-React code (Selly's brain, the walk scene). */
export function currentTimeOfDay(): TimeOfDay {
  return effectiveTimeOfDay(getData().prefs.ambience ?? "auto");
}

// a tiny clock that ticks once a minute so "auto" follows the real time
const listeners = new Set<() => void>();
let hour = -1;
let timer: ReturnType<typeof setInterval> | null = null;
function subscribe(cb: () => void) {
  listeners.add(cb);
  if (!timer)
    timer = setInterval(() => {
      const h = new Date().getHours();
      if (h !== hour) {
        hour = h;
        listeners.forEach((l) => l());
      }
    }, 60_000);
  return () => {
    listeners.delete(cb);
    if (!listeners.size && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}
const getHour = () => (hour = hour < 0 ? new Date().getHours() : hour);

/** Current greenhouse mood. "day" during prerender, the real value after hydration. */
export function useAmbience(): TimeOfDay {
  const { prefs } = useAppData();
  const h = useSyncExternalStore(subscribe, getHour, () => -1);
  if (h < 0) return "day";
  const now = new Date();
  now.setHours(h);
  return effectiveTimeOfDay(prefs.ambience ?? "auto", now);
}
