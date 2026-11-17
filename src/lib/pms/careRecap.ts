import { groupPeriods } from "@/lib/cycle";
import type { AppData } from "@/lib/data-store";
import { addDays, diffDays, type DateKey } from "@/lib/date";
import { SYMPTOM_LABEL } from "@/data/pmsSymptoms";
import { PRE_DAYS, memoryFor } from "./analysis";
import { CARE_LABEL } from "./careMode";
import { hasBatchim } from "./insight";

/**
 * 월경주기별 돌봄 회고 — once a new period start is logged, a short look back at
 * the cycle that just ended: what was recorded before it started, and which care
 * the user chose and said helped. Only real records; nothing when there are none.
 * "Helped" is the user's own word, never a claim that the care works.
 */
export interface CareRecap {
  start: DateKey; // the new period start
  prevStart: DateKey;
  lines: string[];
  helpedKinds: string[];
}

const eul = (w: string) => `${w}${hasBatchim(w) ? "을" : "를"}`;
const iga = (w: string) => `‘${w}’${hasBatchim(w) ? "이" : "가"}`;

export function careRecap(data: AppData, today: DateKey): CareRecap | null {
  const periods = groupPeriods(data.periodDays).filter((p) => p.start <= today);
  if (periods.length < 2) return null;
  const cur = periods[periods.length - 1];
  const prev = periods[periods.length - 2];
  // only right after a new start (two weeks), and only for a real previous cycle
  if (diffDays(cur.start, today) > 14 || diffDays(prev.start, cur.start) > 60) return null;
  const lines: string[] = [];

  const windowStart = [addDays(cur.start, -PRE_DAYS), addDays(prev.end, 1)].sort().pop()!;
  const m = memoryFor(cur.start, windowStart, data.symptoms, addDays(cur.start, -1));
  const top = [...m.symptoms].sort((a, b) => b.days - a.days || b.avg - a.avg)[0];
  if (m.onset != null && top) lines.push(`지난 주기에는 생리 시작 ${m.onset}일 전부터 ${iga(SYMPTOM_LABEL[top.id])} 기록되었어요.`);
  else if (m.recordedDays > 0) lines.push(`지난 주기 생리 전 ${m.recordedDays}일 동안 기록했고, 증상은 거의 기록되지 않았어요.`);

  const care = (data.careLog ?? []).filter((c) => c.date >= prev.start && c.date < cur.start);
  const helped = [...new Set(care.filter((c) => c.helped === "yes").map((c) => c.kind))];
  if (helped.length) lines.push(`${helped.map((k) => CARE_LABEL[k]).join(", ")}${hasBatchim(CARE_LABEL[helped[helped.length - 1]]) ? "을" : "를"} 선택한 뒤 ‘도움이 되었어요’라고 기록했어요.`);
  else if (care.length) lines.push(`지난 주기에 돌봄을 ${care.length}번 골랐어요.`);

  if (!lines.length) return null;
  return { start: cur.start, prevStart: prev.start, lines, helpedKinds: helped };
}
export { eul };
