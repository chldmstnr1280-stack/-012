// 진료 신호등 + 홈 "생리 시작했어" 버튼
import { careSignal, URGENT_SIGNS } from "../src/lib/pms/careSignal";
import { showStartPrompt } from "../src/lib/pms/late";
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
const period = (s: string, n = 5) => Array.from({ length: n }, (_, i) => addDays(s, i));
const starts = ["2026-08-16", "2026-09-13", "2026-10-11", "2026-11-08"];
const regular = starts.flatMap((s) => period(s));
const T = "2026-11-26";
const withSymptoms = (sc: Record<string, number>, impact: number) => {
  const symptoms: AppData["symptoms"] = {};
  for (const s of starts.slice(1)) for (const n of [-5, -4, -3, -2]) symptoms[addDays(s, n)] = { scores: sc as never, impact: { work: impact as 3 }, updatedAt: 1 };
  return symptoms;
};

// 1. nothing recorded → watch, little data
let s = careSignal(base, T);
ok(s.level === "watch" && s.reasons.length === 0 && s.basis.periods === 0, "1 empty → watch");

// 2. regular cycles, mild symptoms → watch
s = careSignal({ ...base, periodDays: regular, symptoms: withSymptoms({ bloating: 1 }, 1) } as AppData, T);
ok(s.level === "watch", "2 mild → watch " + JSON.stringify(s.reasons));

// 3. daily life affected in 2+ cycles → consult; mood-heavy → psychiatry named too
s = careSignal({ ...base, periodDays: regular, symptoms: withSymptoms({ low_mood: 3, anxiety: 3 }, 3) } as AppData, T);
ok(s.level === "consult" && s.reasons.some((r) => r.id === "impact" && r.source === "nhs-pms"), "3 impact → consult");
ok(s.departments.includes("psy") && s.departments.includes("gyn") && s.focus === "mood", "3 mood → psy + gyn " + s.departments);

// 4. painful periods affecting daily life → pain reason, gynaecology
s = careSignal({ ...base, periodDays: regular, symptoms: withSymptoms({ cramps: 4 }, 3) } as AppData, T);
ok(s.reasons.some((r) => r.id === "pain") && s.departments.join() === "gyn", "4 pain → gyn " + JSON.stringify(s.reasons.map((r) => r.id)));

// 5. no new period for more than 3 cycles → missed
s = careSignal({ ...base, periodDays: starts.slice(0, 3).flatMap((x) => period(x)) } as AppData, "2027-01-30");
ok(s.reasons.some((r) => r.id === "missed"), "5 missed " + JSON.stringify(s.reasons.map((r) => r.id)));
ok(!careSignal({ ...base, periodDays: regular } as AppData, "2026-12-20").reasons.some((r) => r.id === "missed"), "5 a little late is not 'missed'");

// 6. irregular lengths (3+ recorded) → irregular
const irregular = ["2026-05-01", "2026-05-22", "2026-07-08", "2026-07-30", "2026-09-20"].flatMap((x) => period(x));
s = careSignal({ ...base, periodDays: irregular } as AppData, "2026-10-01");
ok(s.reasons.some((r) => r.id === "irregular" && r.source === "nhs-irregular"), "6 irregular " + JSON.stringify(s.reasons.map((r) => r.id)));

// 7. a period longer than 7 days → long
s = careSignal({ ...base, periodDays: [...starts.slice(0, 3).flatMap((x) => period(x)), ...period("2026-11-08", 9)] } as AppData, T);
ok(s.reasons.some((r) => r.id === "long"), "7 long period");

// 8. urgent signs are listed, never computed
ok(URGENT_SIGNS.length >= 2 && URGENT_SIGNS.every((u) => u.source === "nhs-pain" || u.source === "nhs-ectopic"), "8 urgent signs sourced");
const banned = /진단|치료|우울증|불안장애|질환입니다|병입니다/;
ok(![...URGENT_SIGNS.map((u) => u.text)].some((t) => banned.test(t)), "8 no diagnosis words");

// 9. "생리 시작했어" button
ok(!showStartPrompt([], T), "9 no periods → hidden");
ok(showStartPrompt(regular, "2026-12-04"), "9 two days before the expected start → shown");
ok(!showStartPrompt(regular, "2026-12-01"), "9 a week before → hidden");
ok(showStartPrompt(regular, "2026-12-10"), "9 expected start passed → shown");
ok(!showStartPrompt(regular, "2026-12-10", "2026-12-10"), "9 '아직이야' today → hidden");
ok(showStartPrompt(regular, "2026-12-11", "2026-12-10"), "9 back the next day");
ok(!showStartPrompt([...regular, "2026-12-06"], "2026-12-07"), "9 started yesterday → hidden");

console.log(fail ? `${fail} FAILED` : "care signal: all passed");
