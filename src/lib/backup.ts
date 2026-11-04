import { CONDITION_KEYS, DAILY_TASKS, type AppData, type DailyEntry, type DailyLog, type Level5 } from "./data-store";

/**
 * Import of a file made by "기록 파일로 내보내기".
 * The file is untrusted input: every field is validated and anything unexpected is dropped.
 */

export const MAX_BACKUP_BYTES = 5 * 1024 * 1024;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const isDate = (v: unknown): v is string => typeof v === "string" && DATE_RE.test(v) && !Number.isNaN(Date.parse(v));
const level5 = (v: unknown): Level5 | undefined => (Number.isInteger(v) && (v as number) >= 1 && (v as number) <= 5 ? (v as Level5) : undefined);

function cleanEntry(v: unknown): DailyEntry | null {
  if (!isObj(v)) return null;
  const condition: DailyEntry["condition"] = {};
  if (isObj(v.condition)) {
    for (const k of CONDITION_KEYS) {
      const lv = level5(v.condition[k]);
      if (lv) condition[k] = lv;
    }
  }
  const steps = Number.isInteger(v.steps) && (v.steps as number) >= 0 && (v.steps as number) <= 200_000 ? (v.steps as number) : undefined;
  const memo = typeof v.memo === "string" && v.memo.trim() ? v.memo.slice(0, 300) : undefined;
  const mood = level5(v.mood);
  const updatedAt = typeof v.updatedAt === "number" && Number.isFinite(v.updatedAt) ? v.updatedAt : 0;
  if (mood == null && !Object.keys(condition).length && steps == null && !memo) return null;
  return { mood, condition, steps, memo, updatedAt };
}

function cleanDaily(v: unknown): DailyLog | null {
  if (!isObj(v) || !isObj(v.done)) return null;
  const done: DailyLog["done"] = {};
  for (const t of DAILY_TASKS) if (v.done[t] === true) done[t] = true;
  const touchExp = Number.isInteger(v.touchExp) && (v.touchExp as number) >= 0 && (v.touchExp as number) <= 100 ? (v.touchExp as number) : undefined;
  return { done, touchExp, bonus: v.bonus === true ? true : undefined };
}

export type ParsedBackup = Pick<AppData, "entries" | "periodDays" | "progress" | "daily">;

export function parseBackup(text: string): { ok: true; data: ParsedBackup } | { ok: false; reason: string } {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, reason: "디어셀리 기록 파일이 아니에요" };
  }
  if (!isObj(raw) || raw.version !== 1) return { ok: false, reason: "디어셀리 기록 파일이 아니거나, 지원하지 않는 버전이에요" };

  const entries: ParsedBackup["entries"] = {};
  if (isObj(raw.entries)) {
    for (const [k, v] of Object.entries(raw.entries)) {
      if (!isDate(k)) continue;
      const e = cleanEntry(v);
      if (e) entries[k] = e;
    }
  }
  const periodDays = Array.isArray(raw.periodDays) ? [...new Set(raw.periodDays.filter(isDate))].sort() : [];
  const daily: ParsedBackup["daily"] = {};
  if (isObj(raw.daily)) {
    for (const [k, v] of Object.entries(raw.daily)) {
      if (!isDate(k)) continue;
      const d = cleanDaily(v);
      if (d) daily[k] = d;
    }
  }
  let progress = { level: 1, exp: 0 };
  if (isObj(raw.progress) && Number.isInteger(raw.progress.level) && Number.isInteger(raw.progress.exp)) {
    const level = raw.progress.level as number;
    const exp = raw.progress.exp as number;
    if (level >= 1 && level <= 999 && exp >= 0 && exp < 500) progress = { level, exp };
  }
  if (!Object.keys(entries).length && !periodDays.length && progress.level === 1 && progress.exp === 0) {
    return { ok: false, reason: "파일에 불러올 기록이 없어요" };
  }
  return { ok: true, data: { entries, periodDays, progress, daily } };
}

/** Combine current data with an import: newer entry wins, period days are unioned, higher growth is kept. */
export function mergeBackup(cur: AppData, inc: ParsedBackup): AppData {
  const entries = { ...cur.entries };
  for (const [k, e] of Object.entries(inc.entries)) {
    if (!entries[k] || e.updatedAt > entries[k].updatedAt) entries[k] = e;
  }
  const higher =
    inc.progress.level > cur.progress.level || (inc.progress.level === cur.progress.level && inc.progress.exp > cur.progress.exp) ? inc.progress : cur.progress;
  const daily = { ...cur.daily };
  for (const [k, d] of Object.entries(inc.daily)) {
    const c = daily[k];
    daily[k] = c ? { done: { ...c.done, ...d.done }, touchExp: Math.max(c.touchExp ?? 0, d.touchExp ?? 0), bonus: c.bonus || d.bonus } : d;
  }
  return { ...cur, entries, periodDays: [...new Set([...cur.periodDays, ...inc.periodDays])].sort(), progress: higher, daily, demo: false };
}

export function replaceWithBackup(cur: AppData, inc: ParsedBackup): AppData {
  return { ...cur, ...inc, demo: false };
}
