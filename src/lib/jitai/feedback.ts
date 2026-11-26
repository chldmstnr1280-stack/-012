import type { CareAction, Feedback } from "@/data/careSuggestions";
import type { AppData } from "@/lib/data-store";
import type { CareKind } from "@/lib/pms/careMode";

/**
 * What helped *her* — from her own answers only:
 *  - 돌봄 모드 ‘도움이 되었나요’: 도움이 됐어요 = 1 · 잘 모르겠어요 = 0.5 · 아니요 = 0 (건너뛰기는 세지 않음)
 *  - 호흡 전후 마음 점수: 올라감 = 1 · 그대로 = 0.5 · 내려감 = 0
 * Only the most recent answers count (LOOKBACK), so an old "no" can change.
 */
export const LOOKBACK = 40;

/** which suggestion buttons a 돌봄 모드 choice speaks for */
export const CARE_TO_ACTIONS: Record<CareKind, CareAction[]> = {
  sleep: ["rest"],
  walk: ["walk"],
  breathe: ["breathe-short", "breathe-long", "breathe-sleep"],
  record: ["record"],
  alone: ["quiet"],
  meal: [],
};
const BREATH_ACTIONS: CareAction[] = ["breathe-short", "breathe-long", "breathe-sleep"];
const HELPED_SCORE = { yes: 1, unsure: 0.5, no: 0 } as const;

export function actionFeedback(data: AppData): Feedback {
  const answers: { at: number; actions: CareAction[]; v: number }[] = [];
  for (const e of data.careLog ?? []) {
    if (!e.helped || e.helped === "skip") continue;
    const acts = CARE_TO_ACTIONS[e.kind] ?? [];
    if (acts.length) answers.push({ at: e.at, actions: acts, v: HELPED_SCORE[e.helped] });
  }
  for (const b of data.breathLog ?? []) {
    if (b.recoveryDelta == null) continue;
    answers.push({ at: b.at, actions: BREATH_ACTIONS, v: b.recoveryDelta > 0 ? 1 : b.recoveryDelta === 0 ? 0.5 : 0 });
  }
  const recent = answers.sort((a, b) => a.at - b.at).slice(-LOOKBACK);
  const sums: Partial<Record<CareAction, { sum: number; n: number }>> = {};
  for (const a of recent)
    for (const act of a.actions) {
      const s = (sums[act] ??= { sum: 0, n: 0 });
      s.sum += a.v;
      s.n++;
    }
  const scores: Feedback["scores"] = {};
  for (const [act, s] of Object.entries(sums) as [CareAction, { sum: number; n: number }][]) scores[act] = { score: Math.round((s.sum / s.n) * 100) / 100, n: s.n };
  return { scores, total: recent.length };
}
