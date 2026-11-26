const store: Record<string, string> = {};
(globalThis as any).window = globalThis;
(globalThis as any).localStorage = { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => { store[k] = v; }, removeItem: (k: string) => { delete store[k]; } };
import { addDays } from "../src/lib/date";
import { rhythmOf, dayKind, overlaps, restIn, setPlan, cleanPlan, planOf } from "../src/lib/rhythm";
import { parseBackup } from "../src/lib/backup";
let fail = 0; const ok = (c: boolean, m: string) => { if (!c) { fail++; console.log("FAIL", m); } };
const period = (s: string, n = 5) => Array.from({ length: n }, (_, i) => addDays(s, i));
const base: any = { version: 1, progress: { level: 1, exp: 0 }, entries: {}, periodDays: [], demo: false, daily: {}, symptoms: {}, cycleContext: {}, dayTags: {}, cycleRecaps: {}, water: {}, supplements: [], suppLog: {}, meals: {}, prefs: { ambience: "day" } };
const data = (o: any) => ({ ...base, ...o });
const starts = ["2026-08-01", "2026-08-29", "2026-09-26", "2026-10-24"];
const pd = starts.flatMap((s) => period(s));

// 1. no onset known → no window, but predicted period shown
let r = rhythmOf(data({ periodDays: pd }), "2026-11-10");
ok(r.windows.length === 0 && r.pms.size === 0, "1 no window without onset");
ok(dayKind(r, new Set(pd), "2026-11-21") === "period-predicted", "1 predicted period");
ok(dayKind(r, new Set(pd), "2026-10-25") === "period", "1 logged period");
// 2. profile onset 3~5일 → 5-day window before 11-21, 3 cycles
const d2 = data({ periodDays: pd, pmsProfile: { symptoms: { bloating: 2 }, onset: "d3_5", updatedAt: 1 } });
r = rhythmOf(d2, "2026-11-10");
ok(r.windows.length === 3 && r.windows[0].from === "2026-11-16" && r.windows[0].to === "2026-11-20", "2 window " + JSON.stringify(r.windows[0]));
ok(r.windows[1].start === "2026-12-19" && r.pms.size === 15, "2 next cycles " + r.windows[1].start + " " + r.pms.size);
ok(dayKind(r, new Set(pd), "2026-11-18") === "pms" && dayKind(r, new Set(pd), "2026-11-15") === null, "2 dayKind pms");
ok(r.fc.onsetSource === "profile", "2 source labelled");
// 3. overlaps: important in window (future) only
const plan: any = { "2026-11-18": { important: true, updatedAt: 1 }, "2026-11-12": { important: true, updatedAt: 1 }, "2026-11-05": { important: true, updatedAt: 1 }, "2026-11-17": { rest: true, updatedAt: 1 } };
ok(JSON.stringify(overlaps(plan, r, "2026-11-10")) === '["2026-11-18"]', "3 overlaps " + overlaps(plan, r, "2026-11-10"));
ok(restIn(plan, "2026-11-16", "2026-11-20") === 1, "3 restIn");
// 4. overdue → paused, no window, no predicted period
r = rhythmOf(d2, "2026-12-03");
ok(r.fc.paused && r.windows.length === 0 && dayKind(r, new Set(pd), "2026-11-22") === null, "4 paused hides predictions");
// 5. setPlan cleans + trims + removes empty
setPlan("2026-11-18", { important: true, label: "  아주아주아주긴발표회의준비와친구생일파티겸송년회  " });
const p = planOf()["2026-11-18"];
ok(!!p?.important && p.label!.length === 20 && !p.label!.startsWith(" "), "5 label trimmed " + p?.label);
setPlan("2026-11-18", { important: undefined, label: "" });
ok(!("2026-11-18" in planOf()), "5 empty entry removed");
// 6. backup clean
const c = cleanPlan({ "2026-11-18": { important: true, rest: "yes", label: 5, updatedAt: 3 }, bad: { rest: true }, "2026-11-19": { updatedAt: 1 } });
ok(JSON.stringify(c) === '{"2026-11-18":{"updatedAt":3,"important":true}}', "6 cleanPlan " + JSON.stringify(c));
const pb: any = parseBackup(JSON.stringify({ version: 1, plan: { "2026-11-20": { rest: true, updatedAt: 2 } } }));
ok(pb.ok && pb.data.plan?.["2026-11-20"]?.rest === true, "6 plan-only backup accepted " + JSON.stringify(pb)?.slice(0, 120));
console.log(fail ? `${fail} FAILED` : "rhythm-unit: all passed");
