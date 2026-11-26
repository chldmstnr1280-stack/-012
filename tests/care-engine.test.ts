// 3단계: 상태 스냅샷 연결 + 도움이 됐던 행동 먼저
const store: Record<string, string> = {};
(globalThis as unknown as { window: unknown }).window = globalThis;
(globalThis as unknown as { localStorage: unknown }).localStorage = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => {
    store[k] = v;
  },
  removeItem: (k: string) => {
    delete store[k];
  },
};
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pickSuggestion, MIN_FEEDBACK, type CareContext, type Feedback } from "../src/data/careSuggestions";
import { actionFeedback, LOOKBACK } from "../src/lib/jitai/feedback";
import { suggestionFor } from "../src/lib/game/careEngine";
import type { AppData } from "../src/lib/data-store";

let fail = 0;
const ok = (c: boolean, m: string) => {
  if (!c) {
    fail++;
    console.log("FAIL", m);
  }
};

// 1. the 19 rules pick exactly as before (1,536 situations recorded before the change)
const golden: (string | null)[] = JSON.parse(readFileSync(join(__dirname, "fixtures", "care-golden.json"), "utf8"));
const tods = ["morning", "day", "evening", "night"] as const;
const todays: CareContext["today"][] = [undefined, { mood: 1, condition: {}, updatedAt: 1 }, { mood: 5, emotion: "happy", condition: {}, updatedAt: 1 }, { emotion: "sad", condition: {}, updatedAt: 1 }, { emotion: "tired", condition: { energy: 1 }, updatedAt: 1 }, { condition: { sleep: 1 }, updatedAt: 1 }, { emotion: "anxious", condition: { stress: 5 }, updatedAt: 1 }, { mood: 3, condition: {}, updatedAt: 1 }];
const symptoms: CareContext["symptoms"][] = [undefined, { scores: { low_mood: 4 }, impact: {}, updatedAt: 1 }, { scores: { cramps: 3 }, impact: {}, updatedAt: 1 }, { scores: { irritability: 3 }, impact: {}, updatedAt: 1 }, { scores: { fatigue: 3 }, impact: {}, updatedAt: 1 }, { scores: {}, impact: {}, none: true, updatedAt: 1 }];
const flags: Partial<CareContext>[] = [{}, { period: true }, { periodSoon: true }, { pmsWindow: true, pastSymptom: "cramps", pmsBasis: "records" }, { pmsSoon: true }, { lateUnanswered: true }, { needs: ["want_rest"] }, { breathedToday: true, walkedToday: true }];
const contexts: CareContext[] = [];
for (const tod of tods) for (const today of todays) for (const s of symptoms) for (const f of flags) contexts.push({ tod, today, symptoms: s, period: false, periodSoon: false, breathedToday: false, walkedToday: false, pmsWindow: false, ...f } as CareContext);
ok(contexts.length === golden.length, "1 same situations " + contexts.length);
const few: Feedback = { scores: { walk: { score: 1, n: 4 }, rest: { score: 0, n: 4 } }, total: MIN_FEEDBACK - 1 };
let diffNone = 0;
let diffFew = 0;
contexts.forEach((c, i) => {
  if ((pickSuggestion(c)?.id ?? null) !== golden[i]) diffNone++;
  if ((pickSuggestion(c, few)?.id ?? null) !== golden[i]) diffFew++;
});
ok(diffNone === 0, `1 no feedback → unchanged (${diffNone} differ)`);
ok(diffFew === 0, `1 under ${MIN_FEEDBACK} answers → unchanged (${diffFew} differ)`);

// 2. enough feedback: what helped her comes first
const helpedBreath: Feedback = { scores: { "breathe-short": { score: 1, n: 5 }, rest: { score: 0, n: 3 }, quiet: { score: 0, n: 2 } }, total: 8 };
const tired = { tod: "evening", today: { emotion: "tired", condition: { energy: 1 }, updatedAt: 1 }, period: false, periodSoon: false, breathedToday: false, walkedToday: false, pmsWindow: false } as CareContext;
ok(pickSuggestion(tired)?.id === "tired", "2 usual order → tired");
let p = pickSuggestion(tired, helpedBreath);
ok(p?.id === "no-breath" && p.personalised === true, "2 breathing helped → no-breath first " + JSON.stringify(p));

// 3. pinned rules stay first whatever helped
const heavy = { ...tired, symptoms: { scores: { low_mood: 4 }, impact: {}, updatedAt: 1 } } as CareContext;
ok(pickSuggestion(heavy, helpedBreath)?.id === "pms-low", "3 pms-low pinned");
ok(pickSuggestion({ ...tired, needs: ["want_rest"] } as CareContext, helpedBreath)?.id === "need-want_rest", "3 her own want pinned");
ok(pickSuggestion({ ...tired, lateUnanswered: true } as CareContext, helpedBreath)?.id === "late", "3 late question pinned");

// 4. ties keep the usual order; unknown actions count as neutral
const neutral: Feedback = { scores: { walk: { score: 0.5, n: 5 } }, total: 5 };
ok(pickSuggestion(tired, neutral)?.id === "tired" && !pickSuggestion(tired, neutral)?.personalised, "4 ties → usual order");
// a rule whose actions all didn't help drops below the neutral ones
const noRest: Feedback = { scores: { rest: { score: 0, n: 5 }, quiet: { score: 0, n: 5 } }, total: 10 };
ok(pickSuggestion(tired, noRest)?.id === "no-breath", "4 rest/quiet didn't help → next match");

// 5. buttons reorder too
const night = { tod: "night", period: false, periodSoon: false, breathedToday: true, walkedToday: false, pmsWindow: false, today: { mood: 3, condition: {}, updatedAt: 1 } } as CareContext;
ok(pickSuggestion(night)?.actions.join() === "quiet,breathe-sleep", "5 usual buttons");
p = pickSuggestion(night, { scores: { "breathe-sleep": { score: 1, n: 5 } }, total: 5 });
ok(p?.id === "night" && p.actions.join() === "breathe-sleep,quiet" && !p.personalised, "5 helped button first " + JSON.stringify(p));

// 6. feedback from her own answers
const base = { version: 1, progress: { level: 1, exp: 0 }, entries: {}, periodDays: [], demo: false, daily: {}, symptoms: {}, cycleContext: {}, dayTags: {}, cycleRecaps: {}, water: {}, supplements: [], suppLog: {}, meals: {}, prefs: { ambience: "auto" } } as unknown as AppData;
const care = (kind: string, helped: string | undefined, at: number) => ({ id: `c${at}`, at, date: "2026-11-20", kind, source: "pms", done: true, ...(helped ? { helped } : {}), updatedAt: at });
const breath = (d: number | undefined, at: number) => ({ id: `b${at}`, at, date: "2026-11-20", minutes: 1, completed: true, ...(d != null ? { before: 3, after: 3 + d, recoveryDelta: d } : {}), updatedAt: at });
let fb = actionFeedback({ ...base, careLog: [care("walk", "yes", 1), care("walk", "no", 2), care("sleep", "unsure", 3), care("alone", "skip", 4), care("meal", "yes", 5), care("walk", undefined, 6)], breathLog: [breath(3, 7), breath(-1, 8), breath(0, 9), breath(undefined, 10)] } as unknown as AppData);
ok(fb.total === 6, "6 counted answers " + fb.total);
ok(fb.scores.walk?.score === 0.5 && fb.scores.walk.n === 2 && fb.scores.rest?.score === 0.5 && !fb.scores.quiet, "6 care answers " + JSON.stringify(fb.scores));
ok(fb.scores["breathe-long"]?.score === 0.5 && fb.scores["breathe-long"].n === 3, "6 breath deltas");
fb = actionFeedback({ ...base, careLog: Array.from({ length: 60 }, (_, i) => care("walk", i < 20 ? "no" : "yes", i)) } as unknown as AppData);
ok(fb.total === LOOKBACK && fb.scores.walk?.score === 1, "6 only recent answers count");

// 7. end to end: suggestionFor uses the snapshot and her feedback
const T = "2026-11-26";
const evening = new Date(2026, 10, 26, 19);
const data = { ...base, entries: { [T]: { emotion: "tired", condition: { energy: 1 }, updatedAt: 1 } } } as unknown as AppData;
ok(suggestionFor(data, T, "evening", evening)?.id === "tired", "7 no feedback → tired");
const withFb = { ...data, breathLog: [1, 2, 3, 4, 5].map((i) => breath(2, i)) } as unknown as AppData;
ok(suggestionFor(withFb, T, "evening", evening)?.id === "no-breath", "7 breathing helped 5× → breathing first");
// breathed today (seen through the snapshot) → the breathing rule no longer fits
const breathed = { ...withFb, daily: { [T]: { done: { breath: true } } } } as unknown as AppData;
ok(suggestionFor(breathed, T, "evening", evening)?.id === "tired", "7 snapshot knows today's breath");

console.log(fail ? `${fail} FAILED` : "care engine: all passed");
