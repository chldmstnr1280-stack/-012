// 크리스마스 온실: carols are well-formed, the season switches on and off
import { CAROLS, CHORD_TONES, carolEvents } from "../src/lib/sound/carols";
import { christmasOn, inChristmasSeason, TREE_LINES } from "../src/lib/garden/christmas";

let fail = 0;
const ok = (c: boolean, m: string) => {
  if (!c) {
    fail++;
    console.log("FAIL", m);
  }
};

for (const c of CAROLS) {
  c.bars.forEach((bar, i) => {
    const beats = bar.reduce((a, [, b]) => a + b, 0);
    ok(Math.abs(beats - c.beatsPerBar) < 1e-9, `${c.id} bar ${i + 1} has ${beats} beats`);
  });
  ok(c.chords.length === c.bars.length && c.chords.every((ch) => ch in CHORD_TONES), `${c.id} one known chord per bar`);
  const { events, length } = carolEvents(c);
  ok(events.every((e, i) => i === 0 || e.t >= events[i - 1].t), `${c.id} events in time order`);
  ok(Math.abs(length - c.bars.length * c.beatsPerBar * c.beat) < 1e-9, `${c.id} length`);
  const mel = events.filter((e) => e.kind === "melody");
  ok(mel.every((e) => e.midi >= 72 && e.midi <= 90), `${c.id} melody in the music-box range`);
}
// Silent Night opens G-A-G-E (sol-la-sol-mi) and ends on C
const sn = carolEvents(CAROLS[0]).events.filter((e) => e.kind === "melody").map((e) => e.midi - 12);
ok(sn.slice(0, 4).join() === "67,69,67,64" && sn[sn.length - 1] === 60, "silent night shape " + sn.slice(0, 4));
// Jingle Bells opens E E E, E E E, E G C D E
const jb = carolEvents(CAROLS[1]).events.filter((e) => e.kind === "melody").map((e) => e.midi - 12);
ok(jb.slice(0, 11).join() === "64,64,64,64,64,64,64,67,60,62,64", "jingle bells shape " + jb.slice(0, 11));

ok(inChristmasSeason(new Date(2026, 10, 27)) && inChristmasSeason(new Date(2026, 11, 31)), "season: late Nov and December");
ok(!inChristmasSeason(new Date(2026, 10, 19)) && !inChristmasSeason(new Date(2027, 0, 1)), "season ends with the year");
ok(christmasOn({}, "2026-12-24") && !christmasOn({ christmas: "off" }, "2026-12-24") && christmasOn({ christmas: "on" }, "2026-07-01") && !christmasOn({ christmas: "on" }, null), "pref auto/on/off; nothing while prerendering");
ok(TREE_LINES.length >= 3, "tree lines");

console.log(fail ? `${fail} FAILED` : "christmas: all passed");
