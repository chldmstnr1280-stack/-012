import { analyzeCycle } from "../src/lib/cycle";
import { addDays } from "../src/lib/date";
import { analysePms } from "../src/lib/pms/analysis";
import { forecastPms } from "../src/lib/pms/forecast";
import { answerFor, logNewStart, daysSinceLastStart, estimateAccuracy } from "../src/lib/pms/late";
import { onsetLines, NOT_ENOUGH } from "../src/lib/pms/insight";
import { careRecap } from "../src/lib/pms/careRecap";
import { careAwaiting } from "../src/lib/pms/careMode";
import { suggestionFor } from "../src/lib/game/careEngine";
import { parseBackup } from "../src/lib/backup";
let fail = 0; const ok = (c: boolean, m: string) => { if (!c) { fail++; console.log("FAIL", m); } };
const period = (start: string, n = 5) => Array.from({ length: n }, (_, i) => addDays(start, i));
const base: any = { version: 1, progress: { level: 1, exp: 0 }, entries: {}, periodDays: [], demo: false, daily: {}, symptoms: {}, cycleContext: {}, dayTags: {}, cycleRecaps: {}, water: {}, supplements: [], suppLog: {}, meals: {}, prefs: { ambience: "day" } };
const data = (o: any) => ({ ...base, ...o });
const fc = (d: any, today: string) => { const info = analyzeCycle(d.periodDays, today); return { info, f: forecastPms(d, info, analysePms(d.periodDays, d.symptoms, today, info.nextStart)) }; };

// 1. regular (28-day) user
const starts = ["2026-08-01", "2026-08-29", "2026-09-26", "2026-10-24"];
let d = data({ periodDays: starts.flatMap((s) => period(s)) });
let { info, f } = fc(d, "2026-11-10");
ok(info.overdue === 0 && info.basis === 3 && !info.irregular && info.nextStart === "2026-11-21" && !f.paused, "1 regular " + JSON.stringify({ o: info.overdue, n: info.nextStart, b: info.basis }));
// 2. irregular user
d = data({ periodDays: ["2026-06-01", "2026-06-25", "2026-08-02", "2026-09-01"].flatMap((s) => period(s)) });
({ info } = fc(d, "2026-09-10"));
ok(info.irregular, "2 irregular flagged");
// 3. expected date passed, start not logged (by 12 days, beyond avgPeriod → old code jumped silently)
d = data({ periodDays: starts.flatMap((s) => period(s)) });
({ info, f } = fc(d, "2026-12-03"));
ok(info.expectedStart === "2026-11-21" && info.overdue === 12, "3 overdue kept visible " + info.overdue);
ok(f.paused && f.window.size === 0 && f.nextStart === null, "3 no PMS window while overdue");
const sug = suggestionFor({ ...d, symptoms: {} }, "2026-12-03", "day");
ok(sug?.id === "late", "3 home suggestion asks (not concludes): " + sug?.id);
// 4. user answered "not yet" → no repeated asking; "later" lasts only today
ok(answerFor([{ expected: "2026-11-21", answer: "not_yet", at: Date.parse("2026-12-03T10:00") }], "2026-11-21", "2026-12-04") === "not_yet", "4 not_yet kept");
ok(answerFor([{ expected: "2026-11-21", answer: "later", at: Date.parse("2026-12-03T10:00") }], "2026-11-21", "2026-12-04") === null, "4 later expires next day");
ok(suggestionFor({ ...d, lateChecks: [{ expected: "2026-11-21", answer: "not_yet", at: 1 }] }, "2026-12-03", "day")?.id !== "late", "4 no late nudge after answer");
// 4b. late period then logged: prediction error saved
const log = logNewStart(d.periodDays, [...d.periodDays, ...period("2026-12-05", 2)], []);
ok(!!log && log[0].start === "2026-12-05" && log[0].expected === "2026-11-21" && log[0].diff === 14, "4b prediction error logged " + JSON.stringify(log));
ok(logNewStart(d.periodDays, [...d.periodDays, "2026-10-29"], []) === null, "4b extending an old period is not a new start");
ok(estimateAccuracy(log!).meanAbs === 14, "4b accuracy");
// 5. no cycle records
({ info, f } = fc(data({}), "2026-11-10"));
ok(info.expectedStart === null && info.overdue === 0 && !f.paused && careRecap(data({}), "2026-11-10") === null && daysSinceLastStart([], "2026-11-10") === null, "5 no records");
// 6. no symptom records → no pattern, honest message
const p0 = analysePms(d.periodDays, {}, "2026-11-10", null);
ok(onsetLines(p0, {}).length === 0 && NOT_ENOUGH.startsWith("아직 기록이 충분하지 않아요"), "6 not enough");
// pattern with 2 cycles: fatigue 3–5 days before
const sym: any = {};
for (const s of ["2026-09-26", "2026-10-24"]) for (let k = 1; k <= 7; k++) sym[addDays(s, -k)] = { scores: k === 3 || k === 5 ? { fatigue: 2 } : {}, impact: {}, none: k === 3 || k === 5 ? undefined : true, updatedAt: 1 };
const p2 = analysePms(d.periodDays, sym, "2026-11-10", null);
const lines = onsetLines(p2, sym);
ok(p2.enough && lines.some((l) => l.includes("생리 시작 5일 전부터 ‘피로’가 기록되었어요")), "pattern line: " + JSON.stringify(lines));
// one cycle only → none
const sym1: any = Object.fromEntries(Object.entries(sym).filter(([k]) => k > "2026-10-01"));
ok(onsetLines(analysePms(d.periodDays, sym1, "2026-11-10", null), sym1).length === 0, "one cycle → no pattern");
// 7. edit/delete: a day with only sleep hours is kept, junk dropped; old records still valid
const bk = parseBackup(JSON.stringify({ version: 1, symptoms: { "2026-11-01": { scores: {}, impact: {}, sleepHours: 6.3, updatedAt: 1 }, "2026-11-02": { scores: { fatigue: 2, nope: 3 }, impact: {}, note: "  힘든 날  ", updatedAt: 1 }, "2026-11-03": { scores: {}, impact: {} } } }));
ok(bk.ok && bk.data.symptoms["2026-11-01"]?.sleepHours === 6.5 && bk.data.symptoms["2026-11-02"]?.note === "힘든 날" && !bk.data.symptoms["2026-11-03"], "7 backup clean " + JSON.stringify(bk.ok && bk.data.symptoms));
// 8. skipping care: not done → no question; skipped stays skipped
ok(careAwaiting([{ id: "a", at: Date.now() - 600000, date: "x", kind: "walk", source: "pms", updatedAt: 0 }], Date.now()) === null, "8 not done → no question");
ok(careAwaiting([{ id: "a", at: Date.now() - 600000, date: "x", kind: "alone", source: "pms", done: true, helped: "skip", updatedAt: 0 }], Date.now()) === null, "8 skipped stays quiet");
// recap: new start with care helped
const d2 = data({ periodDays: [...starts, "2026-11-21"].flatMap((s) => period(s)), symptoms: sym, careLog: [{ id: "c1", at: 1, date: "2026-11-15", kind: "walk", source: "pms", done: true, helped: "yes", updatedAt: 1 }] });
const rc = careRecap(d2, "2026-11-23");
ok(!!rc && rc.lines.some((l) => l.includes("가벼운 산책을 선택한 뒤 ‘도움이 되었어요’")), "recap " + JSON.stringify(rc?.lines));
console.log(fail ? fail + " failures" : "pms unit ok");
