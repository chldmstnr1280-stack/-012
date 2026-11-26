// 상태 스냅샷 + 호흡 전후 점수 (1단계)
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
import { snapshot } from "../src/lib/jitai/snapshot";
import { saveBreath, breathLog, cleanBreathLog } from "../src/lib/jitai/breathLog";
import { parseBackup } from "../src/lib/backup";
import { addDays } from "../src/lib/date";
import type { AppData } from "../src/lib/data-store";
import type { GameData } from "../src/lib/game/gameStore";

let fail = 0;
const ok = (c: boolean, m: string) => {
  if (!c) {
    fail++;
    console.log("FAIL", m);
  }
};
const base = { version: 1, progress: { level: 1, exp: 0 }, entries: {}, periodDays: [], demo: false, daily: {}, symptoms: {}, cycleContext: {}, dayTags: {}, cycleRecaps: {}, water: {}, supplements: [], suppLog: {}, meals: {}, prefs: { ambience: "auto" } } as unknown as AppData;
const game = { version: 1, lastVisit: null, finds: [], pendingReturn: null, walkIntroSeen: false, lastWalkGrowth: null, deco: {}, careShown: [] } as GameData;
const NOW = new Date(2026, 10, 26, 20, 30); // 2026-11-26 20:30 (저녁)
const T = "2026-11-26";

// 1. nothing recorded: no crash, everything unknown
let s = snapshot(base, game, NOW);
ok(s.mood === null && s.condition === null && s.cycle === null && s.missingDays === null && s.lastBreath === null, "1 empty → nulls " + JSON.stringify(s));
ok(s.timeOfDay === "evening" && s.today === T, "1 time of day");
ok(Object.values(s.recentMissions).every((v) => Array.isArray(v) && v.length === 0), "1 no missions");

// 2. broken data must not throw
const broken = { ...base, entries: { [T]: null }, periodDays: null, checkins: "x", breathLog: 5 } as unknown as AppData;
let threw = false;
try {
  s = snapshot(broken, { ...game, walks: "x" } as unknown as GameData, NOW);
} catch {
  threw = true;
}
ok(!threw, "2 broken data does not throw");

// 3. a real week
const period = (start: string) => [0, 1, 2, 3, 4].map((i) => addDays(start, i));
const data = {
  ...base,
  entries: {
    [addDays(T, -3)]: { mood: 2, condition: { energy: 2, sleep: 1 }, updatedAt: 111 },
    [addDays(T, -5)]: { mood: 4, condition: {}, updatedAt: 99 },
  },
  periodDays: ["2026-08-07", "2026-09-04", "2026-10-02", "2026-10-30"].flatMap(period),
  daily: { [addDays(T, -1)]: { done: { breath: true } }, [addDays(T, -9)]: { done: { breath: true } } },
} as unknown as AppData;
const g2 = { ...game, walks: [{ date: addDays(T, -2), minutes: 10 }], missions: [{ id: "sky", date: addDays(T, -2), found: true }], whineDates: [addDays(T, -1)] } as GameData;
s = snapshot(data, g2, NOW);
ok(s.mood?.score === 2 && s.mood.daysAgo === 3 && s.mood.at === 111, "3 latest mood " + JSON.stringify(s.mood));
ok(s.condition?.values.sleep === 1 && s.condition.daysAgo === 3, "3 latest condition");
ok(s.cycle?.day === 28 && s.cycle.daysToNext === 1 && s.cycle.overdue === 0 && !s.cycle.onPeriod, "3 cycle " + JSON.stringify(s.cycle));
ok(s.recentMissions.breath.join() === addDays(T, -1) && s.recentMissions.sky.length === 1 && s.recentMissions.walk.length === 1 && s.recentMissions.whine.length === 1, "3 7-day missions " + JSON.stringify(s.recentMissions));
// missing: last record (mood) 3 days ago; period days count as records too (last on 11-03)
ok(s.missingDays === 3, "3 missing days " + s.missingDays);

// 4. overdue: no days-to-next, overdue counted
s = snapshot(data, g2, new Date(2026, 11, 5, 9));
ok(s.cycle?.daysToNext === null && (s.cycle?.overdue ?? 0) > 0 && s.timeOfDay === "morning", "4 overdue " + JSON.stringify(s.cycle));

// 5. breath before/after → recoveryDelta
const r1 = saveBreath({ at: NOW.getTime(), minutes: 1, completed: true, before: 3, after: 6 });
ok(r1.recoveryDelta === 3 && r1.date === T, "5 delta " + JSON.stringify(r1));
const r2 = saveBreath({ at: NOW.getTime() + 1000, minutes: 1, completed: true, before: 4 });
ok(r2.recoveryDelta === undefined && r2.after === undefined, "5 skipped after → no delta");
const r3 = saveBreath({ at: NOW.getTime() + 2000, minutes: 1, completed: false, before: 5, after: 9 });
ok(r3.after === undefined && r3.recoveryDelta === undefined, "5 stopped early → after ignored");
const r4 = saveBreath({ at: NOW.getTime() + 3000, minutes: 1, completed: true, before: 11, after: -1 });
ok(r4.before === undefined && r4.after === undefined, "5 out-of-range scores dropped");
ok(breathLog().length === 4, "5 saved");
s = snapshot({ ...data, breathLog: breathLog() } as AppData, g2, NOW);
ok(s.recentMissions.breath.includes(T) && s.lastBreath?.date === T, "5 snapshot sees today's breath");

// 6. backup
const c = cleanBreathLog([{ id: "a", at: 1, date: "2026-11-26", minutes: 1, completed: true, before: 2, after: 7, extra: "x" }, { id: "b", at: 1, date: "bad" }]);
ok(c.length === 1 && c[0].recoveryDelta === 5 && !("extra" in c[0]), "6 clean " + JSON.stringify(c));
const pb = parseBackup(JSON.stringify({ version: 1, breathLog: breathLog() }));
ok(pb.ok && (pb.data.breathLog?.length ?? 0) === 4, "6 breath-only backup accepted");

console.log(fail ? `${fail} FAILED` : "jitai snapshot: all passed");
