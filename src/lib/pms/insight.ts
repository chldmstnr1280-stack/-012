import { SYMPTOM_LABEL } from "@/data/pmsSymptoms";
import type { PmsPattern } from "./analysis";

/** Korean particle helper: 이야/야, 이/가 … based on the last syllable's final consonant. */
export function hasBatchim(word: string) {
  const c = word.charCodeAt(word.length - 1);
  if (c < 0xac00 || c > 0xd7a3) return false;
  return (c - 0xac00) % 28 !== 0;
}
const iya = (w: string) => `${w}${hasBatchim(w) ? "이야" : "야"}`;
const wagwa = (w: string) => `${w}${hasBatchim(w) ? "과" : "와"}`;

/**
 * Selly's one-line read of the pattern. Purely descriptive — what was recorded,
 * never why, and never a diagnosis.
 */
export function sellyPmsLine(p: PmsPattern, anyRecords: boolean): string {
  if (!anyRecords) return "증상을 기록해 주면, 주기마다 어떤 변화가 있었는지 같이 살펴볼게.";
  if (!p.cycles.length) return "생리 시작 전 2주 동안 3일 이상 기록이 모이면, 그 주기를 정리해 줄게.";
  if (!p.enough) return "한 주기의 기록이 모였어. 한 주기만 더 모이면 주기끼리 비교해 볼 수 있어.";
  const n = p.cycles.length;
  if (p.typicalOnset == null) return `지난 ${n}번의 주기에는 생리 시작 전 증상이 거의 기록되지 않았어.`;
  const onset = Math.round(p.typicalOnset);
  const [a, b] = p.repeated;
  const what = a ? (b ? `${wagwa(SYMPTOM_LABEL[a.id])} ${SYMPTOM_LABEL[b.id]}` : SYMPTOM_LABEL[a.id]) : null;
  const head = `지난 ${n}번의 주기에서 보통 생리 시작 약 ${onset}일 전부터 증상이 기록됐어.`;
  return what ? `${head} 자주 함께한 건 ${iya(what)}.` : head;
}

/**
 * One sentence per repeated symptom, from the user's own records aligned to
 * each logged period start: "지난 N번의 주기 중 K번, 생리 시작 A~B일 전부터
 * {증상}이(가) 기록되었어요." Only analysable cycles count (≥ 2 needed), only
 * recorded days count, and it says when, never why.
 */
export function onsetLines(p: PmsPattern, symptoms: Record<string, { scores: Partial<Record<string, number>>; none?: true }>): string[] {
  if (!p.enough) return [];
  const out: string[] = [];
  for (const r of p.repeated.slice(0, 3)) {
    const firsts: number[] = [];
    for (const c of p.cycles) {
      const offs = c.cells.filter((cell) => cell.offset < 0 && cell.recorded && !symptoms[cell.date]?.none && (symptoms[cell.date]?.scores[r.id] ?? 0) >= 1).map((cell) => -cell.offset);
      if (offs.length) firsts.push(Math.max(...offs));
    }
    if (firsts.length < 2) continue;
    const a = Math.min(...firsts);
    const b = Math.max(...firsts);
    const label = SYMPTOM_LABEL[r.id];
    const when = a === b ? `${a}일 전` : `${a}~${b}일 전`;
    out.push(`지난 ${p.cycles.length}번의 주기 중 ${firsts.length}번, 생리 시작 ${when}부터 ‘${label}’${hasBatchim(label) ? "이" : "가"} 기록되었어요.`);
  }
  return out;
}

export const NOT_ENOUGH = "아직 기록이 충분하지 않아요. 몇 번의 월경주기 동안 변화를 살펴보면 나만의 패턴을 이해하는 데 도움이 될 수 있어요.";
