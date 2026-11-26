import { getData, setData } from "@/lib/data-store";
import { toKey, type DateKey } from "@/lib/date";

/**
 * 호흡 전후 마음 점수 — "지금 마음은 몇 점?" (0–10) asked right before and right
 * after a 1-minute breath. Both answers are optional (skip). recoveryDelta =
 * after − before, only when both were answered. Device + backup file only.
 */
export interface BreathSession {
  id: string;
  /** when the breath started (ms) and its local day */
  at: number;
  date: DateKey;
  minutes: number;
  completed: boolean;
  before?: number;
  after?: number;
  recoveryDelta?: number;
  updatedAt: number;
}

const now = () => Date.now();
const score = (v: unknown) => (typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 10 ? v : undefined);

export function saveBreath(s: { at: number; minutes: number; completed: boolean; before?: number; after?: number }): BreathSession {
  const before = score(s.before);
  const after = s.completed ? score(s.after) : undefined;
  const rec: BreathSession = {
    id: `${s.at.toString(36)}-b`,
    at: s.at,
    date: toKey(new Date(s.at)),
    minutes: s.minutes,
    completed: s.completed,
    ...(before != null ? { before } : {}),
    ...(after != null ? { after } : {}),
    ...(before != null && after != null ? { recoveryDelta: after - before } : {}),
    updatedAt: now(),
  };
  setData((d) => ({ ...d, breathLog: [...(d.breathLog ?? []).filter((b) => b.id !== rec.id), rec].slice(-300) }));
  return rec;
}

export const breathLog = () => getData().breathLog ?? [];

/* ---------- backup ---------- */
export function cleanBreathLog(v: unknown): BreathSession[] {
  if (!Array.isArray(v)) return [];
  const out: BreathSession[] = [];
  for (const raw of v) {
    if (typeof raw !== "object" || raw === null) continue;
    const o = raw as Record<string, unknown>;
    if (typeof o.id !== "string" || typeof o.at !== "number" || typeof o.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(o.date)) continue;
    const before = score(o.before);
    const after = score(o.after);
    out.push({
      id: o.id.slice(0, 40),
      at: o.at,
      date: o.date,
      minutes: typeof o.minutes === "number" && o.minutes > 0 && o.minutes <= 60 ? o.minutes : 1,
      completed: o.completed === true,
      ...(before != null ? { before } : {}),
      ...(after != null ? { after } : {}),
      ...(before != null && after != null ? { recoveryDelta: after - before } : {}),
      updatedAt: typeof o.updatedAt === "number" ? o.updatedAt : o.at,
    });
  }
  return out.slice(-300);
}
