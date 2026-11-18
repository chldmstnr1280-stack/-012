import { LADDER, type CriticId, type MomentId, type NeedId, type TouchId } from "@/data/kindJourney";
import { getData, setData } from "@/lib/data-store";

/**
 * One 3-minute self-compassion practice. Only choices and 0–3 ratings are kept
 * (this device + backup file); nothing the user typed is ever stored.
 */
export interface KindSession {
  id: string;
  at: number;
  updatedAt: number;
  date: string;
  moment: MomentId;
  critic?: CriticId;
  /** how loud the inner critic was, before → after (0–3) */
  loudBefore?: number;
  loudAfter?: number;
  touch?: TouchId;
  /** felt warmth after the touch (0–3); "hard" = it brought up pain (backdraft) */
  warmth?: number | "hard";
  /** index into LADDER: the sentence that felt believable */
  ladder?: number;
  need?: NeedId;
}

const now = () => Date.now();

export function saveKind(s: Omit<KindSession, "id" | "at" | "updatedAt">): KindSession {
  const at = now();
  const rec: KindSession = { ...s, id: `${at.toString(36)}-k`, at, updatedAt: at };
  setData((d) => ({ ...d, kindLog: [...(d.kindLog ?? []), rec].slice(-200) }));
  return rec;
}

export function kindLog() {
  return getData().kindLog ?? [];
}

/** the last sentence on the ladder that felt true, if any */
export function lastLadder(log: KindSession[]): number | null {
  for (let i = log.length - 1; i >= 0; i--) if (log[i].ladder != null) return log[i].ladder!;
  return null;
}

/** "비판의 목소리" before/after, over sessions that have both (own records only) */
export function loudnessChange(log: KindSession[]) {
  const both = log.filter((s) => s.loudBefore != null && s.loudAfter != null);
  if (both.length < 3) return null;
  const avg = (xs: number[]) => Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10;
  return { n: both.length, before: avg(both.map((s) => s.loudBefore!)), after: avg(both.map((s) => s.loudAfter!)) };
}

/* ---------- backup ---------- */
const MOMENT_IDS = ["hard", "critic", "practice"];
const r03 = (v: unknown) => (typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 3 ? v : undefined);
export function cleanKindLog(v: unknown): KindSession[] {
  if (!Array.isArray(v)) return [];
  const out: KindSession[] = [];
  for (const raw of v) {
    if (typeof raw !== "object" || raw === null) continue;
    const o = raw as Record<string, unknown>;
    if (typeof o.id !== "string" || typeof o.at !== "number" || typeof o.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(o.date) || !MOMENT_IDS.includes(o.moment as string)) continue;
    const s: KindSession = { id: o.id.slice(0, 40), at: o.at, updatedAt: typeof o.updatedAt === "number" ? o.updatedAt : o.at, date: o.date, moment: o.moment as MomentId };
    if (typeof o.critic === "string") s.critic = o.critic.slice(0, 20) as CriticId;
    if (r03(o.loudBefore) != null) s.loudBefore = r03(o.loudBefore);
    if (r03(o.loudAfter) != null) s.loudAfter = r03(o.loudAfter);
    if (typeof o.touch === "string") s.touch = o.touch.slice(0, 20) as TouchId;
    if (o.warmth === "hard") s.warmth = "hard";
    else if (r03(o.warmth) != null) s.warmth = r03(o.warmth);
    if (typeof o.ladder === "number" && Number.isInteger(o.ladder) && o.ladder >= 0 && o.ladder < LADDER.length) s.ladder = o.ladder;
    if (typeof o.need === "string") s.need = o.need.slice(0, 20) as NeedId;
    out.push(s);
  }
  return out.slice(-200);
}
