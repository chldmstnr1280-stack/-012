import { parseBackup } from "../src/lib/backup";
const c = { id: "x1", at: 1, date: "2026-11-09", body: ["chest_tight", "nope"], feelings: ["wronged", "chest_tight"], intensity: 9, situations: ["conflict"], unsure: { body: true }, weather: "windy", offered: ["whine", "bad"], chosen: "whine", chosenAt: 2, done: true, after: "lighter", added: ["chest_tight"], updatedAt: 5 };
const r = parseBackup(JSON.stringify({ version: 1, checkins: [c, { junk: 1 }] }));
if (!r.ok) throw new Error(r.reason);
const k = r.data.checkins![0];
console.log(JSON.stringify(k));
console.log(k.body.join() === "chest_tight" && k.feelings.join() === "wronged" && k.intensity === undefined && k.offered.join() === "whine" ? "backup clean ok" : "BACKUP FAIL");
