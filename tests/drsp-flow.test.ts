// 표준 기록지 구조(DRSP 영역) + 생리 양(NHS 기준)
import { DRSP_AREAS, DRSP_ORDER, OUTSIDE_DRSP } from "../src/data/drspAreas";
import { IMPACT_IDS, SYMPTOM_IDS } from "../src/data/pmsSymptoms";
import { cleanFlow, cleanSymptomDay, parseBackup } from "../src/lib/backup";
import { mergeRemoteDay } from "../src/lib/health/sync";
import { careSignal } from "../src/lib/pms/careSignal";
import { buildClinical, symptomFocus } from "../src/lib/pms/clinical";
import { addDays } from "../src/lib/date";
import type { AppData } from "../src/lib/data-store";
import type { CycleMemory } from "../src/lib/pms/analysis";

let fail = 0;
const ok = (c: boolean, m: string) => {
  if (!c) {
    fail++;
    console.log("FAIL", m);
  }
};

// 1. all 24 DRSP items are covered once, in order; every app item has a place
const nums = DRSP_AREAS.flatMap((a) => a.items.map((i) => i.n));
ok(nums.length === 24 && nums.every((n, i) => n === i + 1), "1 DRSP items 1–24 once, in order " + nums.join());
ok(SYMPTOM_IDS.every((id) => DRSP_ORDER.includes(id)) && new Set(DRSP_ORDER).size === DRSP_ORDER.length, "1 every symptom placed once");
ok(OUTSIDE_DRSP.join() === "cramps", "1 only cramps outside the DRSP areas");
ok(IMPACT_IDS.every((id) => DRSP_AREAS.some((a) => a.impact?.includes(id))), "1 every life-impact item placed");
ok(SYMPTOM_IDS.length === 24 && IMPACT_IDS.length === 4, `1 item counts ${SYMPTOM_IDS.length}/${IMPACT_IDS.length}`);

// 2. 생리 양: cleaning, backup, sync merge
ok(JSON.stringify(cleanFlow({ amount: "heavy", signs: ["hourly", "x", "hourly", "leak"] })) === '{"amount":"heavy","signs":["hourly","leak"]}', "2 clean flow");
ok(cleanFlow({ amount: "lots" }) === undefined && cleanFlow(null) === undefined, "2 junk flow dropped");
const day = cleanSymptomDay({ scores: {}, impact: {}, flow: { signs: ["clots"] }, updatedAt: 3 });
ok(!!day && day.flow?.signs?.join() === "clots", "2 a day with only flow is kept");
const pb = parseBackup(JSON.stringify({ version: 1, symptoms: { "2026-11-08": { scores: { hopeless: 3, joint_pain: 2 }, impact: { hobbies: 3 }, flow: { amount: "heavy", signs: ["leak"] }, updatedAt: 1 } } }));
ok(pb.ok && pb.data.symptoms["2026-11-08"].scores.hopeless === 3 && pb.data.symptoms["2026-11-08"].impact.hobbies === 3 && pb.data.symptoms["2026-11-08"].flow?.amount === "heavy", "2 backup keeps new items and flow");
const merged = mergeRemoteDay({ scores: {}, impact: {}, flow: { signs: ["hourly"] }, updatedAt: 1 }, { scores: { cramps: 2 }, impact: {}, updatedAt: 2 });
ok(merged.flow?.signs?.[0] === "hourly" && merged.scores.cramps === 2, "2 server merge keeps the device-only flow");

// 3. heavy-period signs in 2 of the last 3 periods → 진료 신호등 reason (gynaecology)
const base = { version: 1, progress: { level: 1, exp: 0 }, entries: {}, periodDays: [], demo: false, daily: {}, symptoms: {}, cycleContext: {}, dayTags: {}, cycleRecaps: {}, water: {}, supplements: [], suppLog: {}, meals: {}, prefs: {} } as unknown as AppData;
const starts = ["2026-08-16", "2026-09-13", "2026-10-11", "2026-11-08"];
const periodDays = starts.flatMap((s) => [0, 1, 2, 3, 4].map((i) => addDays(s, i)));
const flowOn = (dates: string[]) => Object.fromEntries(dates.map((d) => [d, { scores: {}, impact: {}, flow: { amount: "heavy", signs: ["hourly"] }, updatedAt: 1 }]));
let s = careSignal({ ...base, periodDays, symptoms: flowOn([addDays(starts[2], 1), addDays(starts[3], 0)]) } as AppData, "2026-11-26");
const heavy = s.reasons.find((r) => r.id === "heavy");
ok(!!heavy && heavy.source === "nhs-heavy" && s.departments.join() === "gyn", "3 heavy → gyn " + JSON.stringify(s.reasons));
s = careSignal({ ...base, periodDays, symptoms: flowOn([addDays(starts[3], 0)]) } as AppData, "2026-11-26");
ok(!s.reasons.some((r) => r.id === "heavy"), "3 once is not enough");
s = careSignal({ ...base, periodDays, symptoms: Object.fromEntries([addDays(starts[2], 1), starts[3]].map((d) => [d, { scores: {}, impact: {}, flow: { amount: "heavy" }, updatedAt: 1 }])) } as AppData, "2026-11-26");
ok(!s.reasons.some((r) => r.id === "heavy"), "3 'heavy' feeling alone is not an NHS sign");

// 4. clinical summary rows follow the DRSP areas
const symptoms: AppData["symptoms"] = {};
for (const st of starts.slice(1)) for (const n of [-5, -4, -3]) symptoms[addDays(st, n)] = { scores: { cramps: 2, headache: 2, low_mood: 3, irritability: 2, oversleep: 1 }, impact: {}, updatedAt: 1 };
const c = buildClinical({ ...base, periodDays, symptoms } as AppData, "2026-11-26", 3);
ok(c.rows.join() === "low_mood,irritability,oversleep,headache,cramps", "4 DRSP order " + c.rows.join());

// 5. new items count toward mood / body focus
const cyc = (sc: [string, number][]) => ({ symptoms: sc.map(([id, avg]) => ({ id, days: 3, max: avg, avg })) }) as unknown as CycleMemory;
ok(symptomFocus([cyc([["hopeless", 3], ["joint_pain", 1]])]).focus === "mood", "5 hopeless is a mood item");
ok(symptomFocus([cyc([["joint_pain", 3]])]).focus === "body", "5 joint pain is a body item");

console.log(fail ? `${fail} FAILED` : "drsp areas + flow: all passed");
