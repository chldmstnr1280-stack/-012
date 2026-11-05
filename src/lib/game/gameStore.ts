"use client";

/**
 * Game-world storage (separate from wellness records on purpose).
 * Holds only playful, non-sensitive state: last visit, later garden layout & items.
 * Swap `read`/`write` for a server later without touching callers.
 */
const KEY = "dear-selly:game:v1";

export interface GameData {
  version: 1;
  lastVisit: number | null;
}

const EMPTY: GameData = { version: 1, lastVisit: null };

function read(): GameData {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const d = JSON.parse(raw);
      if (d?.version === 1) return { ...EMPTY, ...d };
    }
  } catch {
    // ignore
  }
  return { ...EMPTY };
}

function write(d: GameData) {
  try {
    localStorage.setItem(KEY, JSON.stringify(d));
  } catch {
    // ignore
  }
}

export type VisitKind = "first" | "sameDay" | "nextDay" | "longAway";

/** Records this visit and tells how long it has been — only ever used to say hello warmly. */
export function registerVisit(now = new Date()): VisitKind {
  const d = read();
  let kind: VisitKind = "first";
  if (d.lastVisit) {
    const last = new Date(d.lastVisit);
    const days = Math.floor((new Date(now.toDateString()).getTime() - new Date(last.toDateString()).getTime()) / 86_400_000);
    kind = days <= 0 ? "sameDay" : days < 3 ? "nextDay" : "longAway";
  }
  write({ ...d, lastVisit: now.getTime() });
  return kind;
}
