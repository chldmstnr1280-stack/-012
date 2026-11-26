// 생활과 주기 (JITAI 다음 작업 1단계): 예측 오차 × 수면·스트레스·기분
import { lifestyleLink, diffPhrase, hoursToScale, LIFESTYLE } from "../src/lib/pms/lifestyle";
import { addDays } from "../src/lib/date";
import type { AppData } from "../src/lib/data-store";

let fail = 0;
const ok = (c: boolean, m: string) => {
  if (!c) {
    fail++;
    console.log("FAIL", m);
  }
};
const base = { version: 1, progress: { level: 1, exp: 0 }, entries: {}, periodDays: [], demo: false, daily: {}, symptoms: {}, cycleContext: {}, dayTags: {}, cycleRecaps: {}, water: {}, supplements: [], suppLog: {}, meals: {}, prefs: {} } as unknown as AppData;
const period = (s: string) => [0, 1, 2, 3, 4].map((i) => addDays(s, i));

// six starts → five cycles
const starts = ["2026-05-01", "2026-05-29", "2026-06-30", "2026-07-28", "2026-08-30", "2026-09-27"];
const diffs = [null, 0, 4, 0, 5, 1]; // per start (the first has no estimate)
const predictionLog = starts.slice(1).map((s, i) => ({ start: s, expected: addDays(s, -(diffs[i + 1] as number)), diff: diffs[i + 1], basis: 2, irregular: false, at: i }));
// records in each cycle: cycles leading to starts[2] and starts[4] had short sleep + stress
const entries: AppData["entries"] = {};
const fill = (from: string, to: string, sleep: number, stress: number, mood: number) => {
  for (let d = addDays(from, 6), n = 0; d <= to && n < 6; d = addDays(d, 4), n++) entries[d] = { mood: mood as 1, condition: { sleep: sleep as 1, stress: stress as 1, energy: 3 }, updatedAt: 1 };
};
fill(starts[0], addDays(starts[1], -1), 4, 2, 4);
fill(starts[1], addDays(starts[2], -1), 2, 4, 2);
fill(starts[2], addDays(starts[3], -1), 4, 2, 4);
fill(starts[3], addDays(starts[4], -1), 1, 5, 2);
fill(starts[4], addDays(starts[5], -1), 4, 2, 3);
const data = { ...base, periodDays: starts.flatMap(period), predictionLog, entries } as AppData;
const TODAY = "2026-10-10";

// 1. comparison
let L = lifestyleLink(data, TODAY);
ok(L.cycles.length === 5 && L.usable === 5 && L.enough, "1 five usable cycles " + JSON.stringify({ n: L.cycles.length, u: L.usable }));
const sleep = L.comparisons.find((c) => c.factor === "sleep");
ok(!!sleep && sleep.flagged.n === 2 && sleep.flagged.meanDiff === 4.5 && sleep.other.n === 3 && sleep.other.meanDiff === 0.3, "1 sleep comparison " + JSON.stringify(sleep));
ok(!!L.comparisons.find((c) => c.factor === "stress") && !!L.comparisons.find((c) => c.factor === "mood"), "1 stress and mood compared too");
ok(L.cycles.every((c) => c.diffSource === "log"), "1 log diffs used");
ok(diffPhrase(4.5) === "예상보다 평균 4.5일 늦게" && diffPhrase(-2) === "예상보다 평균 2일 일찍" && diffPhrase(0.3) === "예상한 날 즈음", "1 phrases");

// 2. fewer than 3 described cycles → no conclusion
const few = { ...data, periodDays: starts.slice(0, 3).flatMap(period) } as AppData;
L = lifestyleLink(few, "2026-07-10");
ok(!L.enough && L.comparisons.length === 0 && L.usable === 2, "2 not enough " + L.usable);

// 3. missing ≠ fine: a cycle with only 2 recorded days is not used
const sparse = { ...data, entries: Object.fromEntries(Object.entries(entries).filter(([d]) => !(d >= starts[3] && d < starts[4]) || d < addDays(starts[3], 12))) } as AppData;
L = lifestyleLink(sparse, TODAY);
ok(L.usable === 4 && L.cycles.find((c) => c.start === starts[4])!.days < LIFESTYLE.minRecordedDays, "3 sparse cycle left out " + L.usable);

// 4. no prediction log → the same estimate is redone from the records
L = lifestyleLink({ ...data, predictionLog: [] } as AppData, TODAY);
ok(L.cycles.filter((c) => c.diff != null).length >= 4 && L.cycles.every((c) => c.diffSource === "records"), "4 computed diffs " + JSON.stringify(L.cycles.map((c) => c.diff)));

// 5. "this month may be later": short sleep this cycle, 3+ recorded days
const now: AppData["entries"] = { ...entries };
for (const d of ["2026-10-01", "2026-10-03", "2026-10-05"]) now[d] = { condition: { sleep: 1 }, updatedAt: 1 };
L = lifestyleLink({ ...data, entries: now } as AppData, TODAY);
ok(L.mayBeLater && !!L.current?.sleepLow && L.current.days === 3, "5 may be later " + JSON.stringify(L.current));
// only 2 days recorded → not yet
const two = { ...now };
delete two["2026-10-05"];
ok(!lifestyleLink({ ...data, entries: two } as AppData, TODAY).mayBeLater, "5 needs 3 recorded days");
// good sleep → no line
const good = { ...entries, "2026-10-01": { condition: { sleep: 5, stress: 1 }, updatedAt: 1 }, "2026-10-03": { condition: { sleep: 4 }, updatedAt: 1 }, "2026-10-05": { condition: { sleep: 4 }, updatedAt: 1 } } as AppData["entries"];
ok(!lifestyleLink({ ...data, entries: good } as AppData, TODAY).mayBeLater, "5 good sleep → no line");
// expected date passed → the late-period card handles it, not this line
ok(!lifestyleLink({ ...data, entries: now } as AppData, "2026-11-20").mayBeLater, "5 overdue → no line");
// on a period day → no current cycle line
ok(lifestyleLink({ ...data, entries: now } as AppData, "2026-09-28").current === null, "5 period day → none");

// 6. hours slept count when there is no sleep rating
ok(hoursToScale(4) === 1 && hoursToScale(5.5) === 2 && hoursToScale(7) === 4 && hoursToScale(9) === 5, "6 hours scale");
const hrs = { ...data, entries: { ...entries }, symptoms: { "2026-10-01": { scores: {}, impact: {}, sleepHours: 4, updatedAt: 1 }, "2026-10-02": { scores: {}, impact: {}, sleepHours: 4.5, updatedAt: 1 }, "2026-10-04": { scores: {}, impact: {}, sleepHours: 3, updatedAt: 1 } } } as unknown as AppData;
ok(lifestyleLink(hrs, TODAY).mayBeLater, "6 sleepHours used");

// 7. empty / broken data does not throw
let threw = false;
try {
  lifestyleLink(base, TODAY);
  lifestyleLink({ ...base, periodDays: ["2026-10-01"] } as AppData, TODAY);
} catch {
  threw = true;
}
ok(!threw, "7 no crash on little data");

console.log(fail ? `${fail} FAILED` : "lifestyle: all passed");
