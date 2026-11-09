import { BODY, FEELINGS, SITUATIONS, BODY_WEATHERS, type BodyWeather } from "@/data/checkin";
import { CONTEXT_TAG_IDS, TAGS, type ContextTagId } from "@/data/contextTags";
import { getData, setData, setDayTags } from "@/lib/data-store";
import { toKey, type DateKey } from "@/lib/date";

/**
 * 오늘, 몸의 날씨 — the check-in record and what Selly offers afterwards.
 *
 * A check-in lives on this device (and in the backup file). Its tags are also
 * added to the day's context (dayTags), so the existing record, reports and —
 * only with the user's 2026-11-06 consent — the server copy of the day context
 * include them. Nothing is ever sent to an AI.
 */
export type Lane = "LIGHT" | "REST" | "TALK";
export type ActivityId = "breathe" | "stretch" | "walk" | "garden" | "rest" | "quiet" | "whine" | "kindness" | "talk" | "record";
export type After = "lighter" | "same" | "unsure" | "skip";

export interface CheckIn {
  id: string;
  /** when (ms) and the local day */
  at: number;
  date: DateKey;
  body: ContextTagId[];
  feelings: ContextTagId[];
  /** how big the feelings felt now, 1–5 (optional; never good/bad) */
  intensity?: 1 | 2 | 3 | 4 | 5;
  situations: ContextTagId[];
  /** steps answered "잘 모르겠어" */
  unsure: { body?: true; feel?: true; situation?: true };
  weather?: BodyWeather;
  /** what Selly offered, and what the user picked (if anything) */
  offered: ActivityId[];
  chosen?: ActivityId;
  chosenAt?: number;
  done?: boolean;
  /** how it felt after the activity (optional) */
  after?: After;
  /** tags this check-in added to the day (so deleting it can take them back) */
  added: ContextTagId[];
  updatedAt: number;
}

export const ACTIVITIES: Record<ActivityId, { lane: Lane; label: string; emoji: string; href?: string }> = {
  breathe: { lane: "LIGHT", label: "1분 호흡", emoji: "🫁", href: "/?do=breathe" },
  stretch: { lane: "LIGHT", label: "2분 몸 풀기", emoji: "🙆" },
  walk: { lane: "LIGHT", label: "5분 산책", emoji: "🌿", href: "/walk" },
  garden: { lane: "LIGHT", label: "정원에서 셀리와 놀기", emoji: "🌷", href: "/" },
  rest: { lane: "REST", label: "셀리랑 같이 쉬기", emoji: "☁️", href: "/?do=rest" },
  quiet: { lane: "REST", label: "조용한 온실", emoji: "🕯️", href: "/?do=quiet" },
  whine: { lane: "TALK", label: "셀리에게 징징대기", emoji: "🫧", href: "/whine" },
  kindness: { lane: "TALK", label: "마음 전하기", emoji: "💗", href: "/?do=kind" },
  talk: { lane: "TALK", label: "셀리와 이야기하기", emoji: "💬", href: "/?do=talk" },
  record: { lane: "TALK", label: "더 자세히 기록하기", emoji: "📝", href: "/record" },
};
export const LANE_INFO: Record<Lane, { label: string; hint: string }> = {
  LIGHT: { label: "가볍게", hint: "부담 없이 잠깐" },
  REST: { label: "쉬어 가기", hint: "자극 없이 조용히" },
  TALK: { label: "꺼내 놓기", hint: "마음을 말로" },
};

export interface Response {
  lines: [string, string];
  /** the lane Selly offers first, then the others */
  lanes: Lane[];
  /** offered activities, best guess first (all optional) */
  offered: ActivityId[];
  /** chest / heart signals were chosen: show when to get medical help */
  bodySafety: boolean;
  /** heavy feelings felt very strongly: show where to talk to someone (109) */
  heavy: boolean;
}

const any = (xs: ContextTagId[], ids: ContextTagId[]) => xs.some((x) => ids.includes(x));

/**
 * Selly's reply — built only from what the user chose. It names no feeling the
 * user didn't pick, invents no event, and calls nothing a cause.
 */
export function respond(c: Pick<CheckIn, "body" | "feelings" | "situations" | "intensity">): Response {
  const { body: B, feelings: F, situations: S } = c;
  const bodySafety = any(B, ["chest_tight", "racing_heart"]);
  const heavy = (c.intensity ?? 0) >= 5 && any(F, ["sorrow", "lonely", "lethargic"]);
  const pleasant: ContextTagId[] = ["at_ease", "joyful", "fluttered"];
  const lanes = (first: Lane): Lane[] => [first, ...(["LIGHT", "REST", "TALK"] as Lane[]).filter((l) => l !== first)];
  const base = { bodySafety, heavy };

  // D. only pleasant things chosen
  if (F.length && F.every((f) => pleasant.includes(f)) && B.every((b) => b === "body_at_ease")) {
    return { ...base, lines: ["오늘은 몸과 마음이 편안하게 느껴지는구나.", "이 순간을 정원에 남겨볼까?"], lanes: lanes("LIGHT"), offered: ["garden", "walk", "talk"] };
  }
  // B. something weighing on the heart
  if (any(F, ["wronged", "angry", "sorrow", "lonely", "mixed"]) || S.includes("conflict")) {
    return { ...base, lines: ["오늘 마음에 남아 있는 일이 있나 봐.", "하고 싶은 말이 있다면 내가 들어줄게."], lanes: lanes("TALK"), offered: ["whine", "kindness", "breathe", "rest"] };
  }
  // A / C. tired, heavy, low on energy
  if (any(F, ["weary", "lethargic"]) || B.includes("drained") || any(S, ["short_sleep", "drained"])) {
    if (any(B, ["stiff_shoulders", "heavy_head"])) {
      return { ...base, lines: ["오늘은 몸이 조금 무겁게 느껴지는구나.", "잠깐 어깨를 풀어보는 건 어떨까?"], lanes: lanes("LIGHT"), offered: ["stretch", "rest", "quiet"] };
    }
    return { ...base, lines: ["오늘은 움직이기조차 귀찮을 수 있지.", "쉬어도 괜찮아. 원하면 나랑 잠깐 걸어도 좋고."], lanes: lanes("REST"), offered: ["rest", "quiet", "walk"] };
  }
  // tension in the body or the mind
  if (any(F, ["uneasy", "tense"]) || any(B, ["chest_tight", "racing_heart", "stiff_shoulders", "stomach_upset", "heavy_head"])) {
    return { ...base, lines: ["몸과 마음이 조금 바짝 서 있는 것 같아.", "숨을 길게 한 번 내쉬어 볼까?"], lanes: lanes("LIGHT"), offered: ["breathe", "stretch", "rest"] };
  }
  // nothing chosen / not sure
  return { ...base, lines: ["잘 모르겠는 날도 있어.", "이렇게 살펴본 것만으로도 충분해."], lanes: lanes("LIGHT"), offered: ["breathe", "garden", "rest"] };
}

/* ---------- saving ---------- */

const uid = (now: number) => `${now.toString(36)}${Math.floor((now % 1000) * 7.3).toString(36)}`;

/** Save a finished check-in and add its tags to the day (without removing any). */
export function saveCheckIn(c: Omit<CheckIn, "id" | "date" | "added" | "updatedAt" | "at"> & { at: number }): CheckIn {
  const date = toKey(new Date(c.at));
  const before = getData().dayTags[date]?.tags ?? [];
  const mine = [...new Set([...c.body, ...c.feelings, ...c.situations])];
  const added = mine.filter((t) => !before.includes(t));
  const rec: CheckIn = { ...c, id: uid(c.at), date, added, updatedAt: c.at };
  setData((d) => ({ ...d, checkins: [...(d.checkins ?? []), rec].slice(-400) }));
  if (added.length) setDayTags(date, [...before, ...added]);
  return rec;
}

export function updateCheckIn(id: string, patch: Partial<Pick<CheckIn, "chosen" | "chosenAt" | "done" | "after">>) {
  setData((d) => ({ ...d, checkins: (d.checkins ?? []).map((c) => (c.id === id ? { ...c, ...patch, updatedAt: Date.now() } : c)) }));
}

/**
 * Delete a check-in. Tags it added to the day are taken back, unless another
 * check-in of the same day also has them. Tags the user set in the record stay.
 */
export function deleteCheckIn(id: string) {
  const all = getData().checkins ?? [];
  const c = all.find((x) => x.id === id);
  if (!c) return;
  const rest = all.filter((x) => x.id !== id);
  const stillThere = new Set(rest.filter((x) => x.date === c.date).flatMap((x) => [...x.body, ...x.feelings, ...x.situations]));
  const drop = c.added.filter((t) => !stillThere.has(t));
  setData((d) => ({ ...d, checkins: rest }));
  if (drop.length) {
    const tags = getData().dayTags[c.date]?.tags ?? [];
    setDayTags(c.date, tags.filter((t) => !drop.includes(t)));
  }
}

/** An activity finished somewhere in the app: mark today's check-in that offered it. */
export function noteActivityDone(a: ActivityId, now = Date.now()) {
  const today = toKey(new Date(now));
  const c = [...(getData().checkins ?? [])].reverse().find((x) => x.date === today && x.chosen === a && !x.done);
  if (c) updateCheckIn(c.id, { done: true });
}

/** The check-in waiting for a gentle "지금은 어때?" (once, within 6 hours, a few minutes after starting). */
export function awaitingAfter(list: CheckIn[], now: number): CheckIn | null {
  const c = list[list.length - 1];
  if (!c || !c.chosen || c.after || !c.chosenAt) return null;
  if (c.chosen === "record" || c.chosen === "garden") return null;
  const since = now - c.chosenAt;
  if (since > 6 * 3600_000) return null;
  return c.done || since > 3 * 60_000 ? c : null;
}

/* ---------- backup ---------- */

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const isDate = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
const KNOWN = new Set<string>(CONTEXT_TAG_IDS);
const ids = (v: unknown, allowed: Set<string>) => (Array.isArray(v) ? [...new Set(v.filter((x): x is ContextTagId => typeof x === "string" && allowed.has(x)))] : []);
const BODY_IDS = new Set<string>(BODY.map((b) => b.id));
const FEEL_IDS = new Set<string>(FEELINGS.map((b) => b.id).filter((id) => TAGS[id]?.dimension === "feeling"));
const SIT_IDS = new Set<string>(SITUATIONS.map((b) => b.id));
const ACT_IDS = new Set<string>(Object.keys(ACTIVITIES));

export function cleanCheckIn(v: unknown): CheckIn | null {
  if (!isObj(v) || typeof v.id !== "string" || v.id.length > 40 || !isDate(v.date)) return null;
  if (typeof v.at !== "number" || !Number.isFinite(v.at)) return null;
  const u = isObj(v.unsure) ? v.unsure : {};
  const intensity = Number.isInteger(v.intensity) && (v.intensity as number) >= 1 && (v.intensity as number) <= 5 ? (v.intensity as CheckIn["intensity"]) : undefined;
  const weather = BODY_WEATHERS.some((w) => w.id === v.weather) ? (v.weather as BodyWeather) : undefined;
  const chosen = ACT_IDS.has(v.chosen as string) ? (v.chosen as ActivityId) : undefined;
  const after = ["lighter", "same", "unsure", "skip"].includes(v.after as string) ? (v.after as After) : undefined;
  return {
    id: v.id,
    at: v.at,
    date: v.date,
    body: ids(v.body, BODY_IDS),
    feelings: ids(v.feelings, FEEL_IDS),
    ...(intensity ? { intensity } : {}),
    situations: ids(v.situations, SIT_IDS),
    unsure: { ...(u.body === true ? { body: true as const } : {}), ...(u.feel === true ? { feel: true as const } : {}), ...(u.situation === true ? { situation: true as const } : {}) },
    ...(weather ? { weather } : {}),
    offered: Array.isArray(v.offered) ? (v.offered.filter((x) => ACT_IDS.has(x as string)) as ActivityId[]) : [],
    ...(chosen ? { chosen } : {}),
    ...(chosen && typeof v.chosenAt === "number" ? { chosenAt: v.chosenAt } : {}),
    ...(v.done === true ? { done: true } : {}),
    ...(after ? { after } : {}),
    added: ids(v.added, KNOWN),
    updatedAt: typeof v.updatedAt === "number" && Number.isFinite(v.updatedAt) ? v.updatedAt : 0,
  };
}

export function mergeCheckIns(cur: CheckIn[], inc: CheckIn[]): CheckIn[] {
  const m = new Map(cur.map((c) => [c.id, c]));
  for (const c of inc) {
    const x = m.get(c.id);
    if (!x || c.updatedAt > x.updatedAt) m.set(c.id, c);
  }
  return [...m.values()].sort((a, b) => a.at - b.at).slice(-400);
}
