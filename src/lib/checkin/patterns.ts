import { TAGS, type ContextTagId } from "@/data/contextTags";
import { addDays, diffDays, type DateKey } from "@/lib/date";
import { ACTIVITIES, type ActivityId, type CheckIn } from "./checkin";

/**
 * 셀리가 발견한 작은 패턴 — simple counts over the user's own check-ins.
 * No model, no prediction. A note appears only when there is enough data, and
 * every note says what was counted (n of m) and that it is not a cause.
 * Deleting a check-in changes the notes, since they are computed every time.
 */
export const LOOKBACK = 90;
/** check-ins needed before any note is shown */
export const MIN_CHECKINS = 5;
/** a situation (or activity) must appear at least this often to say anything about it */
const MIN_GROUP = 3;
const MIN_TOGETHER = 3;

export type Pattern =
  | { kind: "with"; text: string; n: number; of: number; a: ContextTagId; b: ContextTagId }
  | { kind: "after"; text: string; n: number; of: number; activity: ActivityId }
  | { kind: "cycle"; text: string; n: number; of: number; b: ContextTagId };

const hasJong = (w: string) => {
  const ch = w.charCodeAt(w.length - 1);
  return ch >= 0xac00 && ch <= 0xd7a3 && (ch - 0xac00) % 28 !== 0;
};
const q = (id: ContextTagId) => `‘${TAGS[id].label}’`;
const items = (c: CheckIn) => [...c.body, ...c.feelings];

export function findPatterns(all: CheckIn[], today: DateKey, periodStarts: DateKey[]): { patterns: Pattern[]; count: number; enough: boolean } {
  const recent = all.filter((c) => diffDays(c.date, today) < LOOKBACK && c.date <= today);
  if (recent.length < MIN_CHECKINS) return { patterns: [], count: recent.length, enough: false };
  const out: Pattern[] = [];

  // 1. a situation and a body signal / feeling that often came together
  const sits = new Map<ContextTagId, CheckIn[]>();
  for (const c of recent) for (const s of c.situations) sits.set(s, [...(sits.get(s) ?? []), c]);
  for (const [s, group] of sits) {
    if (group.length < MIN_GROUP || s === "ordinary_day") continue;
    const others = recent.filter((c) => !c.situations.includes(s));
    const counts = new Map<ContextTagId, number>();
    for (const c of group) for (const b of new Set(items(c))) counts.set(b, (counts.get(b) ?? 0) + 1);
    for (const [b, k] of counts) {
      if (b === s || k < MIN_TOGETHER || k / group.length < 0.6) continue;
      // clearly more often than on the other check-ins (or there are too few others to compare)
      const kOther = others.filter((c) => items(c).includes(b)).length;
      if (others.length >= MIN_GROUP && kOther / others.length > k / group.length - 0.25) continue;
      out.push({
        kind: "with",
        a: s,
        b,
        n: k,
        of: group.length,
        text: `최근 ${q(s)}${hasJong(TAGS[s].label) ? "을" : "를"} 고른 ${group.length}번 중 ${k}번은 ${q(b)}도 함께 골랐어.`,
      });
    }
  }

  // 2. how it felt after an activity (only the user's own "after" answers)
  const acts = new Map<ActivityId, CheckIn[]>();
  for (const c of recent) if (c.chosen && c.after && c.after !== "skip") acts.set(c.chosen, [...(acts.get(c.chosen) ?? []), c]);
  for (const [a, group] of acts) {
    const k = group.filter((c) => c.after === "lighter").length;
    if (group.length < MIN_GROUP || k < MIN_TOGETHER || k / group.length < 0.6) continue;
    const label = ACTIVITIES[a].label;
    out.push({ kind: "after", activity: a, n: k, of: group.length, text: `${label}${hasJong(label) ? "을" : "를"} 한 뒤 ${group.length}번 중 ${k}번은 ‘조금 가벼워졌어’라고 했어.` });
  }

  // 3. the days before a period (needs ≥ 2 period starts with check-ins before them)
  const starts = periodStarts.filter((d) => d <= today);
  const before = (c: CheckIn) => starts.some((s) => c.date < s && c.date >= addDays(s, -5));
  const covered = starts.filter((s) => recent.some((c) => c.date < s && c.date >= addDays(s, -5)));
  if (covered.length >= 2) {
    const inW = recent.filter(before);
    const outW = recent.filter((c) => !before(c));
    if (inW.length >= MIN_GROUP && outW.length >= 5) {
      const counts = new Map<ContextTagId, number>();
      for (const c of inW) for (const b of new Set(items(c))) counts.set(b, (counts.get(b) ?? 0) + 1);
      for (const [b, k] of counts) {
        const kOut = outW.filter((c) => items(c).includes(b)).length;
        const rIn = k / inW.length;
        const rOut = kOut / outW.length;
        if (k < MIN_TOGETHER || rIn < 0.5 || rIn < rOut * 1.5) continue;
        out.push({
          kind: "cycle",
          b,
          n: k,
          of: inW.length,
          text: `생리 시작 전 5일 동안 남긴 체크인 ${inW.length}번 중 ${k}번에 ${q(b)}${hasJong(TAGS[b].label) ? "이" : "가"} 있었어. 다른 날엔 ${outW.length}번 중 ${kOut}번이었고.`,
        });
      }
    }
  }

  // strongest first, at most three
  out.sort((x, y) => y.n / y.of - x.n / x.of || y.n - x.n);
  return { patterns: out.slice(0, 3), count: recent.length, enough: true };
}

/** first day of each logged period (a day whose previous day isn't a period day) */
export function periodStartsOf(periodDays: DateKey[]): DateKey[] {
  const set = new Set(periodDays);
  return [...set].filter((d) => !set.has(addDays(d, -1))).sort();
}
