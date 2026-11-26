import { respond } from "../src/lib/checkin/checkin";
import { findPatterns, periodStartsOf } from "../src/lib/checkin/patterns";
let fail = 0; const ok = (c: boolean, m: string) => { if (!c) { fail++; console.log("FAIL", m); } };
const r = (o: any) => respond({ body: [], feelings: [], situations: [], ...o });
let x = r({ body: ["stiff_shoulders"], feelings: ["weary"], situations: ["short_sleep"] });
ok(x.offered[0] === "stretch" && x.lines[1].includes("어깨"), "A");
x = r({ body: ["chest_tight"], feelings: ["wronged"], situations: ["conflict"] });
ok(x.offered[0] === "whine" && x.bodySafety, "B + safety");
x = r({ feelings: ["lethargic", "weary"] }); ok(x.lanes[0] === "REST" && x.offered.includes("walk"), "C");
x = r({ body: ["body_at_ease"], feelings: ["at_ease", "joyful"] }); ok(x.offered[0] === "garden", "D");
x = r({}); ok(x.lines[0].includes("잘 모르겠는"), "unknown");
x = r({ feelings: ["sorrow"], intensity: 5 }); ok(x.heavy, "heavy");
x = r({ feelings: ["sorrow"], intensity: 3 }); ok(!x.heavy, "not heavy");
// no response line names a feeling that wasn't chosen
for (const f of ["joyful","uneasy","tense","angry","lonely"]) { const y = r({ feelings: [f] }); ok(!/(슬프|우울|불안해|화났)/.test(y.lines.join(" ")), "no invented feeling " + f); }
// patterns
const mk = (i: number, o: any) => ({ id: "c" + i, at: i, date: o.date ?? `2026-10-${String(10 + i).padStart(2, "0")}`, body: [], feelings: [], situations: [], unsure: {}, offered: [], added: [], updatedAt: 0, ...o });
let list: any[] = [mk(1, { situations: ["short_sleep"], body: ["stiff_shoulders"] }), mk(2, { situations: ["short_sleep"], body: ["stiff_shoulders"] }), mk(3, {})];
ok(!findPatterns(list, "2026-11-09", []).enough, "too few");
list = [...list, mk(4, { situations: ["short_sleep"], body: ["stiff_shoulders"] }), mk(5, { body: ["heavy_head"] }), mk(6, {}), mk(7, {})];
let p = findPatterns(list, "2026-11-09", []);
ok(p.enough && p.patterns.length === 1 && p.patterns[0].text.includes("3번 중 3번"), "with-pattern: " + JSON.stringify(p.patterns));
// remove one → pattern disappears (live)
p = findPatterns(list.filter((c) => c.id !== "c4"), "2026-11-09", []); ok(p.patterns.length === 0, "delete updates");
// common everywhere → no pattern
const all = list.map((c) => ({ ...c, body: ["stiff_shoulders"] }));
ok(findPatterns(all, "2026-11-09", []).patterns.length === 0, "not distinctive");
// after-activity
const af = [1,2,3,4,5].map((i) => mk(i, { chosen: "breathe", after: i < 5 ? "lighter" : "same" }));
p = findPatterns(af, "2026-11-09", []); ok(p.patterns.some((q) => q.kind === "after" && q.text.includes("1분 호흡을 한 뒤 5번 중 4번")), "after " + JSON.stringify(p.patterns));
// cycle needs two starts
const starts = periodStartsOf(["2026-09-20","2026-09-21","2026-10-18","2026-10-19"]);
ok(starts.join() === "2026-09-20,2026-10-18", "starts");
const cyc = [mk(1,{date:"2026-09-17",feelings:["weary"]}), mk(2,{date:"2026-09-18",feelings:["weary"]}), mk(3,{date:"2026-10-15",feelings:["weary"]}), mk(4,{date:"2026-10-16"}),
  mk(5,{date:"2026-10-01"}), mk(6,{date:"2026-10-03"}), mk(7,{date:"2026-10-05"}), mk(8,{date:"2026-10-07",feelings:["weary"]}), mk(9,{date:"2026-10-25"}), mk(10,{date:"2026-10-28"})];
p = findPatterns(cyc, "2026-11-09", starts); ok(p.patterns.some((q) => q.kind === "cycle"), "cycle " + JSON.stringify(p.patterns));
p = findPatterns(cyc.filter((c) => c.date > "2026-10-01"), "2026-11-09", starts); ok(!p.patterns.some((q) => q.kind === "cycle"), "one cycle only → none");
console.log(fail ? fail + " failures" : "checkin unit ok");
