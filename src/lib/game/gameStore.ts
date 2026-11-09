"use client";

import { afterPersist } from "@/lib/platform";

/**
 * Game-world storage (separate from wellness records on purpose).
 * Holds only playful, non-sensitive state: last visit, later garden layout & items.
 * Swap `read`/`write` for a server later without touching callers.
 */
const KEY = "dear-selly:game:v1";

/** Little things found on walks; they decorate the greenhouse. */
export const FIND_KINDS = ["petal", "stone", "seed", "leaf", "firefly", "shard"] as const;
export type FindKind = (typeof FIND_KINDS)[number];
export const FIND_LABEL: Record<FindKind, { emoji: string; name: string }> = {
  petal: { emoji: "🌸", name: "꽃잎" },
  stone: { emoji: "🪨", name: "작은 돌" },
  seed: { emoji: "🌱", name: "씨앗" },
  leaf: { emoji: "🌿", name: "작은 잎" },
  firefly: { emoji: "✨", name: "반딧불이" },
  shard: { emoji: "💫", name: "빛 조각" },
};

export interface GameData {
  version: 1;
  lastVisit: number | null;
  /** everything found on walks, in order (kept to the last 60) */
  finds: FindKind[];
  /** set when a walk ends; the greenhouse plays a small "welcome back" and clears it */
  pendingReturn: { finds: FindKind[]; minutes: number } | null;
  walkIntroSeen: boolean;
  /** local date of the last walk that granted growth (once a day, never required) */
  lastWalkGrowth: string | null;
  /** greenhouse decorations: slot id → item id */
  deco: Record<string, string>;
  /** which care suggestions were shown ("date:opaque-id"), so Selly doesn't repeat herself */
  careShown: string[];
  /** let friends see mood flowers in my greenhouse (off by default) */
  shareFlowers?: boolean;
  /** self-compassion practice: how many times, and the last local date (growth once a day) */
  kindness?: { total: number; lastDate: string | null; /** date of each practice (last 200) */ dates?: string[] };
  /** each finished walk (last 200), for weekly goals and the sticker book */
  walks?: { date: string; minutes: number }[];
  /** weeks (Monday date) whose weekly stamp was collected */
  weeklyClaimed?: string[];
  /** walk missions done (newest last, kept to 100); photos live in IndexedDB by id */
  missions?: { id: string; date: string; found: boolean; photo?: string }[];
  /** local date of the last mission that granted growth */
  lastMissionGrowth?: string | null;
  /** 몸의 날씨 check-ins today → small lights in the garden (same for any feeling; max 3) */
  checkinLights?: { date: string; n: number };
}

const EMPTY: GameData = { version: 1, lastVisit: null, finds: [], pendingReturn: null, walkIntroSeen: false, lastWalkGrowth: null, deco: {}, careShown: [] };

export function readGame(): GameData {
  return read();
}

export function updateGame(patch: (d: GameData) => Partial<GameData>) {
  const d = read();
  write({ ...d, ...patch(d) });
}

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
    const json = JSON.stringify(d);
    localStorage.setItem(KEY, json);
    afterPersist(KEY, json);
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
