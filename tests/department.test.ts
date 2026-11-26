// 진료과 안내 (2단계): 기분 증상 중심 / 몸 증상 중심
import { symptomFocus, DEPARTMENT_LINE, FOCUS_LABEL, heavyImpactCycles } from "../src/lib/pms/clinical";
import { IMPACT_NUDGE } from "../src/data/safety";
import type { CycleMemory } from "../src/lib/pms/analysis";

let fail = 0;
const ok = (c: boolean, m: string) => {
  if (!c) {
    fail++;
    console.log("FAIL", m);
  }
};
const cyc = (symptoms: [string, number][], impactMax = 0) => ({ start: "2026-10-01", symptoms: symptoms.map(([id, avg]) => ({ id, days: 3, max: Math.ceil(avg), avg })), impactMax }) as unknown as CycleMemory;

// mood clearly stronger
let f = symptomFocus([cyc([["low_mood", 3], ["cramps", 1]]), cyc([["anxiety", 2.5], ["headache", 1.5]])]);
ok(f.focus === "mood" && f.mood === 2.8 && f.body === 1.3 && f.n === 2, "mood " + JSON.stringify(f));
// body clearly stronger
f = symptomFocus([cyc([["cramps", 3.5], ["irritability", 1]]), cyc([["bloating", 3]])]);
ok(f.focus === "body", "body " + JSON.stringify(f));
// close → both
f = symptomFocus([cyc([["low_mood", 2.5], ["cramps", 2.2]])]);
ok(f.focus === "both", "both " + JSON.stringify(f));
// nothing above 1 → no line
f = symptomFocus([cyc([["low_mood", 0.5], ["cramps", 0.5]])]);
ok(f.focus === null, "weak → null");
// daily-life items (poor_focus etc.) count for neither side
f = symptomFocus([cyc([["poor_focus", 4], ["sleep_problems", 4]])]);
ok(f.focus === null && f.mood === 0 && f.body === 0, "daily items ignored");
ok(symptomFocus([]).focus === null, "no cycles → null");
// wording
ok(DEPARTMENT_LINE.mood.includes("정신건강의학과") && DEPARTMENT_LINE.body.includes("산부인과") && DEPARTMENT_LINE.both.includes("산부인과") && DEPARTMENT_LINE.both.includes("정신건강의학과"), "lines name the departments");
ok(FOCUS_LABEL.mood === "기분 증상 중심" && FOCUS_LABEL.body === "몸 증상 중심", "labels");
const banned = /진단|치료|우울증|불안장애|증상 개선|효과/;
ok(!Object.values(DEPARTMENT_LINE).some((l) => banned.test(l)), "no diagnosis/treatment words");
// the nudge condition itself is unchanged
ok(IMPACT_NUDGE.score === 3 && IMPACT_NUDGE.cycles === 2, "IMPACT_NUDGE unchanged");
ok(heavyImpactCycles({ cycles: [cyc([], 3), cyc([], 4), cyc([], 2)] } as never) === 2, "heavy cycles count unchanged");

console.log(fail ? `${fail} FAILED` : "department: all passed");
