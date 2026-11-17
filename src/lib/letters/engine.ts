import { LETTERS, LETTER_BY_ID, SCIENCE, type LetterGroup, type ScienceId } from "@/data/letters";
import { analyzeCycle, groupPeriods } from "@/lib/cycle";
import type { AppData } from "@/lib/data-store";
import { addDays, diffDays, type DateKey } from "@/lib/date";
import type { GameData } from "@/lib/game/gameStore";
import type { Season, Weather } from "@/lib/garden/weather";
import { analysePms } from "@/lib/pms/analysis";
import { forecastPms } from "@/lib/pms/forecast";
import { onsetLines } from "@/lib/pms/insight";
import { answerFor } from "@/lib/pms/late";
import { findPatterns, periodStartsOf } from "@/lib/checkin/patterns";

/**
 * 셀리의 편지 — which letter (if any) arrives today. Pure: everything comes in
 * through the arguments, so it can be tested; nothing leaves the device.
 *
 * Rules (from docs/selly-letters-draft.md):
 *  - at most one letter a day, only after the hour the user chose
 *  - about 5–6 / 3–4 / 1–2 a week (자주 / 보통 / 가끔), or none
 *  - moments that matter (coming back, the expected start passing, a period
 *    starting, a first record, a wish coming true, special days) come anyway
 *  - letters that answer a record (C·L·D·E) never three in a row
 *  - heavy-hearted letters at most once a week; the same letter not within 60 days
 *    (plain "그냥" letters: 30 days, so there are enough for 자주)
 *  - a card (science or the user's own pattern) with every second or third letter;
 *    the same science card not within 90 days, a pattern card at most twice a month
 */
export type LetterFreq = "often" | "normal" | "rare" | "off";
export interface LetterPrefs {
  freq: LetterFreq;
  /** letters arrive from this hour (0–23) */
  hour: number;
  /** letters about the cycle (C·L) */
  cycle: boolean;
  /** letters about recorded feelings (D) */
  mood: boolean;
}
export const DEFAULT_LETTER_PREFS: LetterPrefs = { freq: "normal", hour: 18, cycle: true, mood: true };
const ROLL: Record<LetterFreq, number> = { often: 0.8, normal: 0.5, rare: 0.22, off: 0 };

export interface LetterRec {
  id: string;
  tpl: string;
  date: DateKey;
  at: number;
  card?: ScienceId;
  /** a sentence from the user's own records */
  pattern?: string;
  read?: boolean;
  fav?: boolean;
  updatedAt: number;
}
export interface LetterBox {
  items: LetterRec[];
  /** first day Selly started writing (for 7 / 30 / 100 days) */
  since?: DateKey;
  /** the last day the app was opened, and today's gap (kept once per day) */
  lastSeen?: DateKey;
  gapDate?: DateKey;
  gap?: number | null;
  lastSeason?: string;
  lastStage?: string;
}

export interface LetterEnv {
  today: DateKey;
  hour: number;
  now: number;
  weather: Weather;
  season: Season;
  stage: string;
  game: GameData;
}

const hash01 = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return ((h >>> 0) % 100000) / 100000;
};
const TRIGGERED: LetterGroup[] = ["C", "L", "D", "E"];

interface Cand {
  tpl: string;
  important?: boolean;
}

export function prefsOf(data: AppData): LetterPrefs {
  return { ...DEFAULT_LETTER_PREFS, ...(data.prefs.letters ?? {}) };
}

/** Days in the last 5 that carry a recorded feeling of each kind (entries, check-ins, day tags). */
function moodDays(data: AppData, today: DateKey) {
  const low = new Set(["down", "lonely", "empty", "lethargic", "worn_out", "sorrow", "weary"]);
  const edgy = new Set(["worried", "nervous", "irritated", "angry", "overwhelmed", "uneasy", "tense", "wronged"]);
  const good = new Set(["excited", "joyful", "fluttered", "proud", "serene", "content", "grateful", "relieved", "at_ease"]);
  let l = 0;
  let e = 0;
  let g = 0;
  for (let i = 0; i < 5; i++) {
    const d = addDays(today, -i);
    const en = data.entries[d];
    const tags = new Set<string>([...(data.dayTags[d]?.tags ?? []), ...(data.checkins ?? []).filter((c) => c.date === d).flatMap((c) => c.feelings)]);
    const has = (s: Set<string>) => [...tags].some((t) => s.has(t));
    if ((en?.mood != null && en.mood <= 2) || en?.emotion === "sad" || en?.emotion === "tired" || has(low)) l++;
    if (en?.emotion === "anxious" || (en?.condition.stress ?? 0) >= 4 || has(edgy)) e++;
    if ((en?.mood != null && en.mood >= 4) || en?.emotion === "happy" || en?.emotion === "calm" || has(good)) g++;
  }
  return { low: l, edgy: e, good: g };
}

/** The letter for today, or null. Returns the updated box either way. */
export function deliver(data: AppData, env: LetterEnv): { box: LetterBox; letter: LetterRec | null } {
  const prefs = prefsOf(data);
  const { today } = env;
  const prev = data.letterBox ?? { items: [] };
  const box: LetterBox = { ...prev, items: [...prev.items] };
  // remember the gap since the last visit once a day (before lastSeen moves)
  if (box.gapDate !== today) {
    box.gap = box.lastSeen ? diffDays(box.lastSeen, today) : null;
    box.gapDate = today;
  }
  box.lastSeen = today;
  box.since ??= earliestDay(data) ?? today;
  const seasonChanged = !!box.lastSeason && box.lastSeason !== env.season;
  const stageChanged = !!box.lastStage && box.lastStage !== env.stage;
  const done = (b: LetterBox) => ({ box: { ...b, lastSeason: env.season, lastStage: env.stage }, letter: null as LetterRec | null });

  if (prefs.freq === "off" || box.items.some((l) => l.date === today) || env.hour < prefs.hour) {
    // a season/stage change is kept for a later day only while no letter could come today
    return prefs.freq === "off" || box.items.some((l) => l.date === today) ? done(box) : { box, letter: null };
  }

  const sent = (tpl: string, days: number) => box.items.some((l) => l.tpl === tpl && diffDays(l.date, today) < days);
  const sentEver = (tpl: string) => box.items.some((l) => l.tpl === tpl);
  const lastTwo = box.items.slice(-2).map((l) => LETTER_BY_ID[l.tpl]?.group);
  const triggeredRun = lastTwo.length === 2 && lastTwo.every((g) => g && TRIGGERED.includes(g));
  const heavyRecent = box.items.some((l) => LETTER_BY_ID[l.tpl]?.heavy && diffDays(l.date, today) < 7);
  const y = addDays(today, -1);
  const c: Cand[] = [];

  // F — coming back (never about the missed days)
  const gap = box.gap ?? 0;
  if (gap >= 30) c.push({ tpl: "F3", important: true });
  else if (gap >= 7) c.push({ tpl: "F2", important: true });
  else if (gap >= 3) c.push({ tpl: "F1", important: true });

  // C · L — the cycle (only the user's own records and the estimate)
  if (prefs.cycle && data.periodDays.length) {
    const info = analyzeCycle(data.periodDays, today);
    const periods = groupPeriods(data.periodDays).filter((p) => p.start <= today);
    const last = periods[periods.length - 1];
    if (info.overdue > 0 && info.expectedStart && answerFor(data.lateChecks ?? [], info.expectedStart, today) == null && !box.items.some((l) => l.tpl === "L1" && l.date >= info.expectedStart!))
      c.push({ tpl: "L1", important: true });
    if (last && (last.start === today || last.start === y) && !box.items.some((l) => l.tpl === "C4" && l.date >= last.start)) c.push({ tpl: "C4", important: true });
    if (last && last.end === y && last.length >= 2 && !box.items.some((l) => l.tpl === "C5" && l.date >= last.start)) c.push({ tpl: "C5" });
    const fc = forecastPms(data, info, analysePms(data.periodDays, data.symptoms, today, info.nextStart));
    if (!fc.window.has(today) && (fc.window.has(addDays(today, 2)) || fc.window.has(addDays(today, 3))) && !sent("C1", 20) && !sent("C2", 20))
      c.push({ tpl: hash01(today) < 0.5 ? "C1" : "C2" });
    if (fc.window.has(today) && !sent("C3", 20)) c.push({ tpl: "C3" });
    const recapAt = Math.max(0, ...Object.values(data.cycleRecaps).map((r) => r.updatedAt));
    if (recapAt && env.now - recapAt < 2 * 864e5 && !sent("C6", 20)) c.push({ tpl: "C6" });
  }

  // D — what the user recorded about feelings
  if (prefs.mood) {
    const entryDays = Object.keys(data.entries).sort();
    if (entryDays.length && (entryDays[0] === today || entryDays[0] === y) && !sentEver("D4")) c.push({ tpl: "D4", important: true });
    if (entryDays.length >= 10 && !sentEver("D5")) c.push({ tpl: "D5" });
    const m = moodDays(data, today);
    if (!heavyRecent && m.low >= 3) c.push({ tpl: "D1" });
    else if (!heavyRecent && m.edgy >= 3) c.push({ tpl: "D2" });
    if (m.good >= 3 && !sent("D3", 14)) c.push({ tpl: "D3" });
    const recentAny = [0, 1, 2, 3, 4, 5, 6].some((i) => data.entries[addDays(today, -i)] || (data.checkins ?? []).some((x) => x.date === addDays(today, -i)));
    if (entryDays.length && !recentAny && !sent("D6", 30)) c.push({ tpl: "D6" });
  }

  // E — things done with Selly
  const g = env.game;
  if ((g.whineDates ?? []).includes(y) && !sent("E1", 5) && !sent("E2", 5)) c.push({ tpl: hash01(today + "w") < 0.5 ? "E1" : "E2" });
  const wishes = data.wishes ?? [];
  if (wishes.some((w) => w.status === "done" && (w.doneAt === today || w.doneAt === y)) && !sent("E5", 3)) c.push({ tpl: "E5", important: true });
  if (wishes.some((w) => w.light > 0 && w.light % 7 === 0 && w.checks[w.checks.length - 1]?.date === y) && !sent("E3", 5)) c.push({ tpl: "E3" });
  if (wishes.some((w) => w.createdAt === y) && !sent("E4", 10)) c.push({ tpl: "E4" });
  const walks = g.walks ?? [];
  if (walks.length === 3 && (walks[2].date === today || walks[2].date === y) && !sentEver("E6")) c.push({ tpl: "E6" });
  if (g.kindness?.lastDate === y && !sent("E7", 10)) c.push({ tpl: "E7" });
  if (Object.values(data.daily).filter((d) => d.done.breath).length === 5 && !sentEver("E8")) c.push({ tpl: "E8" });
  if ([0, 1, 2, 3, 4, 5, 6].every((i) => (data.water[addDays(today, -i)] ?? 0) > 0) && !sent("E9", 30)) c.push({ tpl: "E9" });

  // G — special days
  const days = diffDays(box.since!, today);
  // only around the day itself (someone who started long ago doesn't get "100일!" out of nowhere)
  const near = (n: number) => days >= n && days < n + 5;
  if (near(100) && !sentEver("G3")) c.push({ tpl: "G3", important: true });
  else if (near(30) && !sentEver("G2")) c.push({ tpl: "G2", important: true });
  else if (near(7) && !sentEver("G1")) c.push({ tpl: "G1", important: true });
  if (stageChanged) c.push({ tpl: "G4", important: true });

  // B — weather and season
  if (env.weather === "snow" && !sent("B3", 120)) c.push({ tpl: "B3", important: true });
  if (seasonChanged) c.push({ tpl: { spring: "B8", summer: "B9", autumn: "B10", winter: "B11" }[env.season] });
  const wx: Partial<Record<Weather, string[]>> = { rain: ["B1", "B2"], snow: ["B4"], rainbow: ["B5"], clear: ["B6"], cloudy: ["B7"] };
  const wxPick = (wx[env.weather] ?? []).filter((t) => !sent(t, 10));
  if (wxPick.length && hash01(today + "b") < 0.35) c.push({ tpl: wxPick[0] });

  const ok = (x: Cand) => !(triggeredRun && TRIGGERED.includes(LETTER_BY_ID[x.tpl].group)) && (x.tpl === "L1" || !sent(x.tpl, 60) || ["F1", "F2", "F3", "G4", "E5"].includes(x.tpl));
  let pick = c.find((x) => x.important && ok(x));
  if (!pick && hash01(`${today}:${prefs.freq}`) < ROLL[prefs.freq]) {
    pick = c.find((x) => !x.important && ok(x));
    if (!pick) {
      const plain = LETTERS.filter((l) => l.group === "A" && !sent(l.id, 30));
      if (plain.length) pick = { tpl: plain[Math.floor(hash01(today + "a") * plain.length)].id };
    }
  }
  if (!pick) return done(box);

  const tpl = LETTER_BY_ID[pick.tpl];
  const letter: LetterRec = { id: `l${env.now.toString(36)}`, tpl: tpl.id, date: today, at: env.now, updatedAt: env.now };
  // a card with every second or third letter
  const recent = box.items.slice(-2);
  if (recent.length >= 1 && recent.every((l) => !l.card && !l.pattern)) {
    const pattern = data.prefs.patterns !== false && !box.items.some((l) => l.pattern && diffDays(l.date, today) < 15) ? patternFor(data, today) : null;
    if (pattern) letter.pattern = pattern;
    else {
      const usedRecently = (id: ScienceId) => box.items.some((l) => l.card === id && diffDays(l.date, today) < 90);
      const card = (tpl.cards ?? []).find((id) => !usedRecently(id)) ?? SCIENCE.map((s) => s.id).find((id) => !usedRecently(id) && id !== "lowTwoWeeks" && id !== "pmsDiary");
      if (card) letter.card = card;
    }
  }
  return { box: { ...box, items: [...box.items, letter].slice(-200), lastSeason: env.season, lastStage: env.stage }, letter };
}

/** A sentence from the user's own records (check-in patterns, then the PMS pattern) — or nothing. */
export function patternFor(data: AppData, today: DateKey): string | null {
  const ci = findPatterns(data.checkins ?? [], today, periodStartsOf(data.periodDays));
  if (ci.patterns.length) return ci.patterns[0].text;
  const info = analyzeCycle(data.periodDays, today);
  const lines = onsetLines(analysePms(data.periodDays, data.symptoms, today, info.nextStart), data.symptoms);
  return lines[0] ?? null;
}

function earliestDay(data: AppData): DateKey | null {
  const all = [...Object.keys(data.entries), ...(data.checkins ?? []).map((c) => c.date), ...data.periodDays].sort();
  return all[0] ?? null;
}
