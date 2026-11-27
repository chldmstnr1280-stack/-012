/**
 * 오르골 캐럴 — public-domain carols, arranged here as simple music-box parts:
 *  - "Stille Nacht" / 고요한 밤 거룩한 밤 — Franz Xaver Gruber, 1818
 *  - "Jingle Bells" (chorus) — James Lord Pierpont, 1857
 * Melodies are written out note by note in C (synthesized in the app — no
 * recordings), played an octave up by the music box.
 */
export type Note = [midi: number | null, beats: number];
export type ChordName = "C" | "F" | "G" | "G7" | "D7";

export interface Carol {
  id: string;
  title: string;
  /** seconds per beat */
  beat: number;
  beatsPerBar: number;
  bars: Note[][];
  /** one chord per bar */
  chords: ChordName[];
}

export const CHORD_TONES: Record<ChordName, { root: number; notes: number[] }> = {
  C: { root: 48, notes: [60, 64, 67] },
  F: { root: 41, notes: [60, 65, 69] },
  G: { root: 43, notes: [59, 62, 67] },
  G7: { root: 43, notes: [59, 62, 65] },
  D7: { root: 38, notes: [60, 62, 66] },
};

const GAG: Note[] = [[67, 1.5], [69, 0.5], [67, 1]];
const ACB: Note[] = [[72, 1.5], [71, 0.5], [69, 1]];

export const SILENT_NIGHT: Carol = {
  id: "silent-night",
  title: "고요한 밤 거룩한 밤",
  beat: 0.6,
  beatsPerBar: 3,
  bars: [
    GAG, [[64, 3]], GAG, [[64, 3]],
    [[74, 2], [74, 1]], [[71, 3]], [[72, 2], [72, 1]], [[67, 3]],
    [[69, 2], [69, 1]], ACB, GAG, [[64, 3]],
    [[69, 2], [69, 1]], ACB, GAG, [[64, 3]],
    [[74, 2], [74, 1]], [[77, 1.5], [74, 0.5], [71, 1]], [[72, 3]], [[76, 3]],
    [[72, 1], [67, 1], [64, 1]], [[67, 1.5], [65, 0.5], [62, 1]], [[60, 3]], [[null, 3]],
  ],
  chords: ["C", "C", "C", "C", "G", "G", "C", "C", "F", "F", "C", "C", "F", "F", "C", "C", "G", "G7", "C", "C", "C", "G7", "C", "C"],
};

const EEE: Note[] = [[64, 1], [64, 1], [64, 2]];
const EGCD: Note[] = [[64, 1], [67, 1], [60, 1.5], [62, 0.5]];
const FFFF: Note[] = [[65, 1], [65, 1], [65, 1.5], [65, 0.5]];
const FEEE: Note[] = [[65, 1], [64, 1], [64, 1], [64, 0.5], [64, 0.5]];

export const JINGLE_BELLS: Carol = {
  id: "jingle-bells",
  title: "징글벨",
  beat: 0.45,
  beatsPerBar: 4,
  bars: [
    EEE, EEE, EGCD, [[64, 4]],
    FFFF, FEEE, [[64, 1], [62, 1], [62, 1], [64, 1]], [[62, 2], [67, 2]],
    EEE, EEE, EGCD, [[64, 4]],
    FFFF, FEEE, [[67, 1], [67, 1], [65, 1], [62, 1]], [[60, 4]],
  ],
  chords: ["C", "C", "C", "C", "F", "C", "D7", "G7", "C", "C", "C", "C", "F", "C", "G7", "C"],
};

/** the order they play in, round and round */
export const CAROLS: Carol[] = [SILENT_NIGHT, JINGLE_BELLS];

export interface CarolEvent {
  /** seconds from the start of the song */
  t: number;
  kind: "melody" | "bass" | "comb";
  midi: number;
  /** seconds */
  dur: number;
}

/** Every note of a song as timed events: melody, a soft bass per bar, and a music-box comb on the off-beats. */
export function carolEvents(c: Carol): { events: CarolEvent[]; length: number } {
  const events: CarolEvent[] = [];
  let beat = 0;
  c.bars.forEach((bar, i) => {
    const barStart = beat;
    const chord = CHORD_TONES[c.chords[i]];
    events.push({ t: barStart * c.beat, kind: "bass", midi: chord.root, dur: c.beatsPerBar * c.beat });
    for (let b = 1; b < c.beatsPerBar; b++) events.push({ t: (barStart + b) * c.beat, kind: "comb", midi: chord.notes[(b - 1) % chord.notes.length] + 12, dur: c.beat * 1.5 });
    for (const [m, len] of bar) {
      if (m != null) events.push({ t: beat * c.beat, kind: "melody", midi: m + 12, dur: len * c.beat });
      beat += len;
    }
  });
  return { events: events.sort((a, b) => a.t - b.t), length: beat * c.beat };
}
