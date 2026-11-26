import { mergeRemoteDay } from "../src/lib/health/sync";
const local: any = { scores: { fatigue: 1 }, impact: {}, sleepHours: 7, note: "메모", updatedAt: 1 };
const remote: any = { scores: { fatigue: 3 }, impact: {}, updatedAt: 2 };
const m = mergeRemoteDay(local, remote);
console.log(m.scores.fatigue === 3 && m.sleepHours === 7 && m.note === "메모" ? "9 multi-device merge ok" : "FAIL " + JSON.stringify(m));
