import { getData, setData } from "@/lib/data-store";
import { toKey, type DateKey } from "@/lib/date";

/**
 * PMS 돌봄 모드 — choosing a small way to look after yourself, and (only if you
 * want) saying whether it helped. Not doing it, or saying it didn't help, is
 * never treated as failure: nothing is scored, and nothing changes in the garden.
 * Stored on this device and in the backup file only.
 */
export type CareKind = "sleep" | "meal" | "walk" | "record" | "breathe" | "alone";
export type Helped = "yes" | "unsure" | "no" | "skip";
export type CareSource = "pms" | "late" | "self";

export interface CareEntry {
  id: string;
  at: number;
  date: DateKey;
  kind: CareKind;
  source: CareSource;
  done?: boolean;
  helped?: Helped;
  updatedAt: number;
}

export const CARE_ITEMS: { kind: CareKind; label: string; emoji: string; hint: string; href: string; doneOnTap: boolean }[] = [
  { kind: "sleep", label: "충분한 수면과 휴식", emoji: "🌙", hint: "셀리와 쿠션에서 잠깐 쉬기", href: "/?do=rest", doneOnTap: true },
  { kind: "meal", label: "규칙적인 식사", emoji: "🍚", hint: "먹은 것 가볍게 남기기", href: "/record?tab=care", doneOnTap: true },
  { kind: "walk", label: "가벼운 산책", emoji: "🌿", hint: "셀리와 5분 걷기", href: "/walk", doneOnTap: false },
  { kind: "record", label: "감정 기록", emoji: "🌦️", hint: "몸의 날씨, 30초", href: "/checkin", doneOnTap: false },
  { kind: "breathe", label: "호흡과 이완", emoji: "🫁", hint: "1분 길게 내쉬기", href: "/?do=breathe", doneOnTap: false },
  { kind: "alone", label: "혼자만의 시간 갖기", emoji: "🕯️", hint: "조용한 온실", href: "/?do=quiet", doneOnTap: true },
];
export const CARE_LABEL = Object.fromEntries(CARE_ITEMS.map((c) => [c.kind, c.label])) as Record<CareKind, string>;

export const HELPED_OPTIONS: { id: Exclude<Helped, "skip">; label: string }[] = [
  { id: "yes", label: "도움이 되었어요" },
  { id: "unsure", label: "잘 모르겠어요" },
  { id: "no", label: "도움이 되지 않았어요" },
];

const uid = (n: number) => `c${n.toString(36)}${Math.floor((n % 1000) * 3.7).toString(36)}`;

export function chooseCare(kind: CareKind, source: CareSource, now = Date.now()): CareEntry {
  const item = CARE_ITEMS.find((c) => c.kind === kind)!;
  const e: CareEntry = { id: uid(now), at: now, date: toKey(new Date(now)), kind, source, ...(item.doneOnTap ? { done: true } : {}), updatedAt: now };
  setData((d) => ({ ...d, careLog: [...(d.careLog ?? []), e].slice(-500) }));
  return e;
}

export function updateCare(id: string, patch: Partial<Pick<CareEntry, "done" | "helped">>) {
  setData((d) => ({ ...d, careLog: (d.careLog ?? []).map((c) => (c.id === id ? { ...c, ...patch, updatedAt: Date.now() } : c)) }));
}

export function deleteCare(id: string) {
  setData((d) => ({ ...d, careLog: (d.careLog ?? []).filter((c) => c.id !== id) }));
}

/** An activity finished somewhere in the app: mark today's matching care choice as done. */
export function noteCareDone(kind: CareKind, now = Date.now()) {
  const today = toKey(new Date(now));
  const e = [...(getData().careLog ?? [])].reverse().find((c) => c.date === today && c.kind === kind && !c.done);
  if (e) updateCare(e.id, { done: true });
}

/** The care choice waiting for "조금 도움이 되었나요?" — once, within 6 hours, a few minutes after choosing. */
export function careAwaiting(list: CareEntry[], now: number): CareEntry | null {
  const e = list[list.length - 1];
  if (!e || e.helped) return null;
  const since = now - e.at;
  if (since > 6 * 3600_000) return null;
  return e.done && since > 2 * 60_000 ? e : null;
}

/* ---------- backup ---------- */
const KINDS = new Set(CARE_ITEMS.map((c) => c.kind));
export function cleanCare(v: unknown): CareEntry | null {
  if (typeof v !== "object" || v === null) return null;
  const o = v as Record<string, unknown>;
  if (typeof o.id !== "string" || o.id.length > 40 || typeof o.at !== "number" || typeof o.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(o.date)) return null;
  if (!KINDS.has(o.kind as CareKind)) return null;
  const source: CareSource = o.source === "late" || o.source === "pms" ? o.source : "self";
  const helped = ["yes", "unsure", "no", "skip"].includes(o.helped as string) ? (o.helped as Helped) : undefined;
  return { id: o.id, at: o.at, date: o.date, kind: o.kind as CareKind, source, ...(o.done === true ? { done: true } : {}), ...(helped ? { helped } : {}), updatedAt: typeof o.updatedAt === "number" ? o.updatedAt : 0 };
}
export function mergeById<T extends { id: string; updatedAt: number }>(cur: T[], inc: T[], cap: number, by: (x: T) => number): T[] {
  const m = new Map(cur.map((x) => [x.id, x]));
  for (const x of inc) {
    const c = m.get(x.id);
    if (!c || x.updatedAt > c.updatedAt) m.set(x.id, x);
  }
  return [...m.values()].sort((a, b) => by(a) - by(b)).slice(-cap);
}
