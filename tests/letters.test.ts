import { deliver } from "../src/lib/letters/engine";
import { addDays } from "../src/lib/date";
import { LETTER_BY_ID, LETTERS, SCIENCE } from "../src/data/letters";
import { parseBackup } from "../src/lib/backup";
let fail = 0; const ok = (c: boolean, m: string) => { if (!c) { fail++; console.log("FAIL", m); } };
const base: any = { version: 1, progress: { level: 1, exp: 0 }, entries: {}, periodDays: [], demo: false, daily: {}, symptoms: {}, cycleContext: {}, dayTags: {}, cycleRecaps: {}, water: {}, supplements: [], suppLog: {}, meals: {}, prefs: { ambience: "day" } };
const env = (today: string, o: any = {}) => ({ today, hour: 20, now: Date.parse(today + "T20:00"), weather: "cloudy", season: "autumn", stage: "seed", game: { version: 1, lastVisit: null, finds: [], pendingReturn: null, walkIntroSeen: false, lastWalkGrowth: null, deco: {}, careShown: [] }, ...o });
// simulate 60 days of daily visits for a quiet user
const run = (freq: string, days = 60, extra: (d: any, day: string) => any = (d) => d) => {
  let d: any = { ...base, prefs: { ...base.prefs, letters: { freq } } };
  const got: any[] = [];
  for (let i = 0; i < days; i++) {
    const day = addDays("2026-09-01", i);
    d = extra(d, day);
    const r = deliver(d, env(day));
    d = { ...d, letterBox: r.box };
    if (r.letter) got.push(r.letter);
  }
  return { d, got };
};
const n = run("normal").got;
const perWeek = n.length / (60 / 7);
ok(perWeek >= 2.5 && perWeek <= 4.8, "normal ~3–4/week: " + perWeek.toFixed(1));
ok(new Set(n.map((l) => l.date)).size === n.length, "max one a day");
const often = run("often").got.length / (60 / 7), rare = run("rare").got.length / (60 / 7);
ok(often > perWeek + 0.5 && rare < perWeek && rare <= 2.3, `often ${often.toFixed(1)} / rare ${rare.toFixed(1)}`);
ok(run("off").got.length === 0, "off → none");
// no same template within 60 days
const byTpl: Record<string, string[]> = {};
for (const l of n) (byTpl[l.tpl] ??= []).push(l.date);
ok(Object.entries(byTpl).every(([t, ds]) => ds.every((x, i) => i === 0 || (Date.parse(x) - Date.parse(ds[i - 1])) / 864e5 >= (t.startsWith("A") ? 30 : 60))), "no repeat within 30/60 days");
// cards: every 2nd or 3rd letter, science card not repeated in 90 days
let run3 = 0, maxRun = 0;
for (const l of n) { if (l.card || l.pattern) run3 = 0; else maxRun = Math.max(maxRun, ++run3); }
ok(maxRun <= 2, "card at least every third letter (max run without card " + maxRun + ")");
const cards = n.filter((l) => l.card).map((l) => l.card);
ok(new Set(cards).size === cards.length, "science card not repeated");
// before the chosen hour: nothing
ok(deliver({ ...base }, env("2026-09-01", { hour: 9 })).letter === null, "before hour → none");
// coming back after 10 days → F2 (important, ignores the roll)
const d: any = { ...base, letterBox: { items: [], lastSeen: "2026-09-01" } };
let r = deliver(d, env("2026-09-11"));
ok(r.letter?.tpl === "F2", "return after 10 days → F2: " + r.letter?.tpl);
// expected start passed → L1 once, never 'late'; answered → no L1
const starts = ["2026-07-01", "2026-07-29", "2026-08-26"];
const pdays = starts.flatMap((s) => [0, 1, 2, 3].map((i) => addDays(s, i)));
r = deliver({ ...base, periodDays: pdays, letterBox: { items: [], lastSeen: "2026-09-29" } }, env("2026-09-30"));
ok(r.letter?.tpl === "L1", "expected passed → L1: " + r.letter?.tpl);
ok(!LETTER_BY_ID.L1.lines.join("").includes("늦"), "L1 never says late");
r = deliver({ ...base, periodDays: pdays, lateChecks: [{ expected: "2026-09-23", answer: "not_yet", at: 1 }], letterBox: { items: [], lastSeen: "2026-09-29" } }, env("2026-09-30"));
ok(r.letter?.tpl !== "L1", "answered → no L1");
// cycle letters off → none of C/L
r = deliver({ ...base, periodDays: pdays, prefs: { ...base.prefs, letters: { cycle: false } }, letterBox: { items: [], lastSeen: "2026-09-29" } }, env("2026-09-30"));
ok(!["C", "L"].includes(LETTER_BY_ID[r.letter?.tpl ?? "A1"].group), "cycle off");
// heavy letter at most once a week
const low = (d: any, day: string) => ({ ...d, entries: { ...d.entries, [day]: { mood: 1, condition: {}, updatedAt: 1 } } });
const lowRun = run("often", 21, low).got;
const heavyDates = lowRun.filter((l) => LETTER_BY_ID[l.tpl].heavy).map((l) => l.date);
ok(heavyDates.length >= 1 && heavyDates.every((x, i) => i === 0 || (Date.parse(x) - Date.parse(heavyDates[i - 1])) / 864e5 >= 7), "heavy ≤ 1/week: " + heavyDates.join(","));
// never three record-answering letters in a row
const groups = lowRun.map((l) => LETTER_BY_ID[l.tpl].group);
ok(!groups.some((g, i) => i >= 2 && ["C", "L", "D", "E"].includes(g) && ["C", "L", "D", "E"].includes(groups[i - 1]) && ["C", "L", "D", "E"].includes(groups[i - 2])), "no 3 triggered in a row: " + groups.join(""));
// long-time user: no '100일' out of nowhere
r = deliver({ ...base, entries: { "2026-01-01": { condition: {}, updatedAt: 1 } }, letterBox: { items: [], lastSeen: "2026-09-29" } }, env("2026-09-30"));
ok(r.letter?.tpl !== "G3" && r.letter?.tpl !== "G2", "no stray anniversary: " + r.letter?.tpl);
// every letter + card is well-formed; science cards all have a source quote
ok(LETTERS.every((l) => l.lines.length === 2) && SCIENCE.every((s) => s.quote.length > 20), "content well-formed (" + LETTERS.length + " letters, " + SCIENCE.length + " cards)");
// backup round-trip keeps letters, drops junk
const bk = parseBackup(JSON.stringify({ version: 1, letterBox: { items: [{ id: "l1", tpl: "A1", date: "2026-09-01", at: 1, card: "breath", fav: true }, { id: "x", tpl: "ZZ", date: "2026-09-01", at: 1 }] } }));
ok(bk.ok && bk.data.letterBox?.items.length === 1 && bk.data.letterBox.items[0].card === "breath", "backup letters");
console.log(`rates per week: often ${often.toFixed(1)}, normal ${perWeek.toFixed(1)}, rare ${rare.toFixed(1)}`);
console.log(fail ? fail + " failures" : "letters unit ok");
