import { toKey } from "@/lib/date";
import { IS_TOSS } from "@/lib/platform";

/**
 * Feature-use events for return-visit analysis: { name, date }.
 * Always kept on this device (last 500). Sent to the platform's analytics
 * (Toss eventLog / Vercel) only when `remote` is true — events whose mere
 * existence says something about health (a period logged, a low mood) stay
 * on the device unless the user agrees otherwise. Never any record content.
 */
export type EventName = "body_card_view" | "body_card_tap" | "body_sheet_after_period_log" | "body_link_from_mood";

/** which events may leave the device (name + date only) */
export const REMOTE_EVENTS: Record<EventName, boolean> = {
  body_card_view: true,
  body_card_tap: true,
  body_sheet_after_period_log: false, // tells that a period was logged that day
  body_link_from_mood: false, // tells that a low mood was recorded in the PMS window
};

const KEY = "dear-selly:events";

export interface LoggedEvent {
  name: EventName;
  date: string;
  at: number;
}

export function readEvents(): LoggedEvent[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

/** once per day per name when `oncePerDay` (views), every time otherwise */
export function logEvent(name: EventName, opts: { oncePerDay?: boolean } = {}) {
  const now = Date.now();
  const date = toKey(new Date(now));
  const all = readEvents();
  if (opts.oncePerDay && all.some((e) => e.name === name && e.date === date)) return;
  try {
    localStorage.setItem(KEY, JSON.stringify([...all, { name, date, at: now }].slice(-500)));
  } catch {
    // storage full: skip
  }
  if (!REMOTE_EVENTS[name]) return;
  void (async () => {
    try {
      if (IS_TOSS) {
        const { eventLog } = await import("@apps-in-toss/web-framework");
        await eventLog({ log_name: name, log_type: name.endsWith("_view") ? "impression" : "click", params: { date } });
      } else {
        const { track } = await import("@vercel/analytics");
        track(name, { date });
      }
    } catch {
      // analytics unavailable: the device copy is enough
    }
  })();
}
