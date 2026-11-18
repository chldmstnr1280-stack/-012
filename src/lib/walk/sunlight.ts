import { readGame, updateGame, type GameData } from "@/lib/game/gameStore";

/**
 * 햇빛 조각 모으기 — walking fills Selly's sunlight jar, one piece at a time.
 *
 * - motion walk: 1 piece per 100 steps (an estimate from the phone's motion sensor)
 * - 마음 산책 (no sensor): 1 piece per minute, roughly the same pace
 * Pieces are never lost; a full jar (20 pieces ≈ 2,000 steps) becomes a stop on
 * the sunlight journey with a small gift. Nothing resets and nothing is required.
 */
export const STEPS_PER_PIECE = 100;
export const MS_PER_PIECE = 60_000;
export const JAR_SIZE = 20;
/** an upper bound per day, so a shaken phone can't fill jars endlessly */
export const DAILY_CAP = 120;

export interface SunStop {
  n: number;
  emoji: string;
  name: string;
  /** what Selly says when the jar is full */
  line: string;
}

const STOPS: Omit<SunStop, "n">[] = [
  { emoji: "🌅", name: "첫 햇살 언덕", line: "첫 햇빛 병이 꽉 찼어!\n우리 온실에 첫 햇살이 들어왔어." },
  { emoji: "🌼", name: "들꽃 오솔길", line: "들꽃 길에서 모은 햇빛이야.\n온실이 노랗게 따뜻해졌어." },
  { emoji: "🍃", name: "바람의 숲길", line: "바람 냄새가 나는 햇빛이야.\n같이 걸어서 모았지?" },
  { emoji: "💧", name: "반짝이는 냇가", line: "물빛에 반짝이던 햇빛,\n한 병 가득 담아 왔어." },
  { emoji: "🌻", name: "해바라기 밭", line: "해바라기들이 우리 쪽을 봤어.\n햇빛 한 병, 또 가득!" },
  { emoji: "🍯", name: "꿀빛 오후", line: "꿀처럼 느긋한 오후 햇살이야.\n천천히 걸어서 더 좋았어." },
  { emoji: "🌇", name: "노을 정원", line: "노을빛까지 담았어.\n오늘도 여기까지 와 줘서 고마워." },
  { emoji: "🌈", name: "무지개 다리", line: "무지개 다리에 도착했어!\n여기까지 함께 걸어온 거야." },
];

export function stopOf(n: number): SunStop {
  if (n <= STOPS.length) return { n, ...STOPS[n - 1] };
  return { n, emoji: "☀️", name: `햇살 별 ${n - STOPS.length}번째`, line: "햇빛 병이 또 가득 찼어!\n우리 햇살 여정은 계속돼." };
}
export const JOURNEY = STOPS.map((s, i) => ({ n: i + 1, ...s }));

export interface SunState {
  /** pieces in the current jar (0..JAR_SIZE-1) */
  inJar: number;
  /** jars filled so far = journey stops reached */
  jars: number;
  total: number;
  /** pieces gathered today (for the daily cap) */
  today: { date: string; n: number };
}

export function sunOf(g: GameData = readGame(), day?: string): SunState {
  const s = g.sun ?? { total: 0, today: { date: "", n: 0 } };
  const today = day && s.today.date !== day ? { date: day, n: 0 } : s.today;
  return { inJar: s.total % JAR_SIZE, jars: Math.floor(s.total / JAR_SIZE), total: s.total, today };
}

/** Pieces earned by a walk so far (before the daily cap). */
export function piecesFor(mode: "motion" | "mind", steps: number, elapsedMs: number) {
  return mode === "motion" ? Math.floor(steps / STEPS_PER_PIECE) : Math.floor(elapsedMs / MS_PER_PIECE);
}

/** How many of `earned` still fit under today's cap. */
export function capped(earned: number, s: SunState) {
  return Math.max(0, Math.min(earned, DAILY_CAP - s.today.n));
}

/** Save a finished walk's pieces; returns what was added and the stops reached. */
export function addSun(earned: number, day: string): { added: number; stops: SunStop[]; after: SunState } {
  const before = sunOf(readGame(), day);
  const added = capped(earned, before);
  if (added > 0) updateGame((d) => ({ sun: { total: (d.sun?.total ?? 0) + added, today: { date: day, n: before.today.n + added } } }));
  const after = sunOf(readGame(), day);
  const stops: SunStop[] = [];
  for (let n = before.jars + 1; n <= after.jars; n++) stops.push(stopOf(n));
  return { added, stops, after };
}

/** A goal in steps → minutes for a 마음 산책 (same pace as a piece). */
export const goalMinutes = (steps: number) => Math.round((steps / STEPS_PER_PIECE) * (MS_PER_PIECE / 60_000));
