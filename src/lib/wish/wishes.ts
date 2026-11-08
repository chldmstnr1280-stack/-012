import { CATS, LIGHTS_PER_LEVEL, STEP_TEXT_MAX, TINIEST, WISH_TEXT_MAX, ladder, type WishAnswer, type WishCat, type WishKind } from "@/data/wishes";
import { diffDays, type DateKey } from "@/lib/date";

/**
 * 셀리와 소망 빌기 — pure logic. Wishes live in AppData (this device and the
 * backup file only; never sent to a server or an AI).
 */
export interface Wish {
  id: string;
  kind: WishKind;
  text: string;
  cat: WishCat;
  /** the tiny step Selly asks about */
  step: string;
  /** position of `step` in the category ladder; -1 = TINIEST; null = written by the user */
  stepIdx: number | null;
  /** one light per answered check-in; never goes down */
  light: number;
  status: "active" | "resting" | "done";
  createdAt: DateKey;
  doneAt?: DateKey;
  /** answers, oldest first (last 120) */
  checks: { date: DateKey; a: WishAnswer }[];
  updatedAt: number;
}

export const levelOf = (w: Pick<Wish, "light">) => Math.floor(w.light / LIGHTS_PER_LEVEL);
export const lastCheck = (w: Wish): DateKey | null => w.checks[w.checks.length - 1]?.date ?? null;
export const checkedOn = (w: Wish, day: DateKey) => w.checks.some((c) => c.date === day);

/** The one wish Selly asks about today (one question a day), or null. */
export function todaysAsk(wishes: Wish[], today: DateKey): Wish | null {
  if (wishes.some((w) => checkedOn(w, today))) return null;
  const active = wishes.filter((w) => w.status === "active");
  if (!active.length) return null;
  // the one asked longest ago (never asked = first)
  return [...active].sort((a, b) => (lastCheck(a) ?? "").localeCompare(lastCheck(b) ?? "") || a.createdAt.localeCompare(b.createdAt))[0];
}

/** Days since any wish was last answered (null = never). */
export function daysAway(wishes: Wish[], today: DateKey): number | null {
  const last = wishes.map(lastCheck).filter((d): d is DateKey => !!d).sort().pop();
  return last ? diffDays(last, today) : null;
}

/** Answer today's question. Every answer adds one light (showing up counts). */
export function answer(w: Wish, a: WishAnswer, today: DateKey, now: number): { wish: Wish; levelUp: boolean } {
  if (checkedOn(w, today)) return { wish: w, levelUp: false };
  const light = w.light + 1;
  return {
    wish: { ...w, light, checks: [...w.checks, { date: today, a }].slice(-120), updatedAt: now },
    levelUp: Math.floor(light / LIGHTS_PER_LEVEL) > levelOf(w),
  };
}

/** "today is hard" twice or more in the last 7 days → offer where to get help (softly). */
export function hardLately(wishes: Wish[], today: DateKey): boolean {
  let n = 0;
  for (const w of wishes) for (const c of w.checks) if (c.a === "hard" && diffDays(c.date, today) < 7) n++;
  return n >= 2;
}

export function canSmaller(w: Wish) {
  return w.step !== TINIEST;
}
export function smaller(w: Wish, now: number): Wish {
  const steps = ladder(w.cat);
  const i = w.stepIdx === null ? steps.length : w.stepIdx;
  if (i <= 0) return { ...w, step: TINIEST, stepIdx: -1, updatedAt: now };
  return { ...w, step: steps[i - 1], stepIdx: i - 1, updatedAt: now };
}
export function canBigger(w: Wish) {
  return w.stepIdx !== null && w.stepIdx < ladder(w.cat).length - 1;
}
export function bigger(w: Wish, now: number): Wish {
  if (!canBigger(w)) return w;
  const i = (w.stepIdx as number) + 1;
  return { ...w, step: ladder(w.cat)[i], stepIdx: i, updatedAt: now };
}

export function makeWish(p: { kind: WishKind; text: string; cat: WishCat; step: string; stepIdx: number | null }, today: DateKey, now: number): Wish {
  return {
    id: `${now.toString(36)}-${Math.floor(now % 997).toString(36)}`,
    kind: p.kind,
    text: p.text.trim().slice(0, WISH_TEXT_MAX),
    cat: p.cat,
    step: p.step.trim().slice(0, STEP_TEXT_MAX),
    stepIdx: p.stepIdx,
    light: 0,
    status: "active",
    createdAt: today,
    checks: [],
    updatedAt: now,
  };
}

/* ---- validation for backup import ---- */
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const isDate = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
const ANS: WishAnswer[] = ["did", "not", "skip", "hard"];

export function cleanWish(v: unknown): Wish | null {
  if (!isObj(v)) return null;
  if (typeof v.id !== "string" || !v.id || v.id.length > 40) return null;
  if (v.kind !== "dream" && v.kind !== "heart") return null;
  const text = typeof v.text === "string" ? v.text.trim().slice(0, WISH_TEXT_MAX) : "";
  const step = typeof v.step === "string" ? v.step.trim().slice(0, STEP_TEXT_MAX) : "";
  if (!text || !step || !isDate(v.createdAt)) return null;
  const cat = CATS.some((c) => c.id === v.cat) ? (v.cat as WishCat) : "other";
  const steps = ladder(cat);
  const stepIdx = Number.isInteger(v.stepIdx) && (v.stepIdx as number) >= -1 && (v.stepIdx as number) < steps.length ? (v.stepIdx as number) : null;
  const status = v.status === "resting" || v.status === "done" ? v.status : "active";
  const checks = (Array.isArray(v.checks) ? v.checks : [])
    .filter((c): c is { date: string; a: WishAnswer } => isObj(c) && isDate(c.date) && ANS.includes(c.a as WishAnswer))
    .map((c) => ({ date: c.date, a: c.a }))
    .slice(-120);
  const light = Number.isInteger(v.light) && (v.light as number) >= 0 && (v.light as number) < 100000 ? (v.light as number) : checks.length;
  return {
    id: v.id,
    kind: v.kind,
    text,
    cat,
    step,
    stepIdx,
    light,
    status,
    createdAt: v.createdAt,
    ...(status === "done" && isDate(v.doneAt) ? { doneAt: v.doneAt } : {}),
    checks,
    updatedAt: typeof v.updatedAt === "number" && Number.isFinite(v.updatedAt) ? v.updatedAt : 0,
  };
}

/** newer copy of the same wish wins; keeps at most 30 (active ones first) */
export function mergeWishes(cur: Wish[], inc: Wish[]): Wish[] {
  const byId = new Map(cur.map((w) => [w.id, w]));
  for (const w of inc) {
    const c = byId.get(w.id);
    if (!c || w.updatedAt > c.updatedAt) byId.set(w.id, w);
  }
  return [...byId.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).slice(-30);
}
