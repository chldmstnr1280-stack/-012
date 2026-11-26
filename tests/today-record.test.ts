// 오늘 기록 (30초): writes into the existing records, never erases the rest of the day
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
import { getData, setData, type AppData } from "../src/lib/data-store";
import { CORE_SYMPTOMS, cycleSymptom, fullSymptomSet, recordedToday, setCondition, setDailyImpact, setFlow, setMood, setNoSymptoms, setOnPeriod, symptomsToShow } from "../src/lib/today/quickRecord";
import { DRSP_ORDER } from "../src/data/drspAreas";
import { addDays } from "../src/lib/date";

let fail = 0;
const ok = (c: boolean, m: string) => {
  if (!c) {
    fail++;
    console.log("FAIL", m);
  }
};
const T = "2026-11-26";

// 1. which items show
const starts = ["2026-09-01", "2026-09-29", "2026-10-27"]; // next expected ≈ 11-24 → overdue on 11-26
const periods = starts.flatMap((s) => [0, 1, 2, 3, 4].map((i) => addDays(s, i)));
const d0 = getData();
ok(!fullSymptomSet(d0, T) && symptomsToShow(d0, T).join() === DRSP_ORDER.filter((id) => CORE_SYMPTOMS.includes(id)).join(), "1 no periods → core 8");
ok(fullSymptomSet({ ...d0, periodDays: periods } as AppData, "2026-11-15"), "1 within 14 days of the expected start → full");
ok(!fullSymptomSet({ ...d0, periodDays: periods } as AppData, "2026-11-05"), "1 mid-cycle → core");
ok(fullSymptomSet({ ...d0, periodDays: periods } as AppData, T), "1 expected start passed → full");
ok(fullSymptomSet({ ...d0, periodDays: [...periods, "2026-11-25"] } as AppData, T), "1 period yesterday → full");
ok(symptomsToShow(d0, T, true).length === 24, "1 full = all 24");
ok(symptomsToShow({ ...d0, symptoms: { [T]: { scores: { joint_pain: 3 }, impact: {}, updatedAt: 1 } } } as AppData, T).includes("joint_pain"), "1 an item rated today always shows");

// 2. writes keep the rest of the day
setData((d) => ({ ...d, entries: { [T]: { emotion: "calm", condition: { focus: 4 }, steps: 3000, memo: "메모", updatedAt: 1 } }, symptoms: { [T]: { scores: { headache: 1 }, impact: { work: 2 }, sleepHours: 6, note: "노트", updatedAt: 1 } } }));
setMood(T, 2);
setCondition(T, "sleep", 1);
setCondition(T, "stress", 4);
let e = getData().entries[T];
ok(e.mood === 2 && e.emotion === "calm" && e.steps === 3000 && e.memo === "메모" && e.condition.focus === 4 && e.condition.sleep === 1 && e.condition.stress === 4, "2 entry merged " + JSON.stringify(e));
setCondition(T, "sleep", 1);
ok(getData().entries[T].condition.sleep === undefined, "2 same value again clears");

// 3. symptom taps: 보통 → 심함 → 매우 심함 → 지우기
ok(cycleSymptom(T, "low_mood") === 2 && cycleSymptom(T, "low_mood") === 3 && cycleSymptom(T, "low_mood") === 4 && cycleSymptom(T, "low_mood") === undefined, "3 cycle");
ok(cycleSymptom(T, "headache") === 2, "3 a light (1) rating steps to 보통");
let s = getData().symptoms[T];
ok(s.sleepHours === 6 && s.note === "노트" && s.impact.work === 2, "3 the rest of the symptom day kept");
setDailyImpact(T, 3);
ok(getData().symptoms[T].impact.daily === 3 && getData().symptoms[T].impact.work === 2, "3 daily impact set, work kept");

// 4. no symptoms ↔ ratings
setNoSymptoms(T, true);
s = getData().symptoms[T];
ok(!!s.none && !Object.keys(s.scores).length && s.note === "노트", "4 none clears ratings, keeps note");
cycleSymptom(T, "cramps");
ok(!getData().symptoms[T].none && getData().symptoms[T].scores.cramps === 2, "4 a rating drops none");

// 5. period + flow
setOnPeriod(T, true);
ok(getData().periodDays.includes(T), "5 period day marked");
setFlow(T, { amount: "heavy" });
setFlow(T, { sign: "clots" });
ok(getData().symptoms[T].flow?.amount === "heavy" && getData().symptoms[T].flow?.signs?.join() === "clots" && getData().symptoms[T].scores.cramps === 2, "5 flow saved with the day");
setFlow(T, { sign: "clots" });
setFlow(T, { amount: "heavy" });
ok(!getData().symptoms[T].flow, "5 flow cleared");
setOnPeriod(T, false);
ok(!getData().periodDays.includes(T), "5 period day unmarked");

// 6. recorded?
ok(recordedToday(getData(), T), "6 recorded");
ok(!recordedToday(getData(), "2026-11-27"), "6 other day not recorded");

console.log(fail ? `${fail} FAILED` : "today record: all passed");
