export type PhaseKind = "inhale" | "hold" | "exhale" | "rest";

export interface BreathPattern {
  id: "calm" | "long" | "478" | "box";
  name: string;
  desc: string;
  phases: { kind: PhaseKind; seconds: number }[];
}

export const PATTERNS: BreathPattern[] = [
  { id: "calm", name: "편안한 호흡", desc: "처음이라면 여기서부터", phases: [{ kind: "inhale", seconds: 4 }, { kind: "exhale", seconds: 4 }] },
  { id: "long", name: "길게 내쉬기", desc: "긴장을 천천히 풀어요", phases: [{ kind: "inhale", seconds: 4 }, { kind: "exhale", seconds: 6 }] },
  { id: "478", name: "4-7-8 호흡", desc: "잠들기 전에 좋아요", phases: [{ kind: "inhale", seconds: 4 }, { kind: "hold", seconds: 7 }, { kind: "exhale", seconds: 8 }] },
  {
    id: "box",
    name: "박스 호흡",
    desc: "마음을 가지런히",
    phases: [
      { kind: "inhale", seconds: 4 },
      { kind: "hold", seconds: 4 },
      { kind: "exhale", seconds: 4 },
      { kind: "rest", seconds: 4 },
    ],
  },
];

export const DURATIONS = [1, 3, 5] as const;
export type DurationMin = (typeof DURATIONS)[number];

export const PHASE_LABEL: Record<PhaseKind, string> = { inhale: "들숨", hold: "멈춤", exhale: "날숨", rest: "멈춤" };
export const PHASE_LINE: Record<PhaseKind, string> = {
  inhale: "천천히 숨을\n들이마셔요",
  hold: "잠시\n머금어요",
  exhale: "부드럽게\n내쉬어요",
  rest: "편안히\n멈춰요",
};

export const patternById = (id: string | undefined) => PATTERNS.find((p) => p.id === id) ?? PATTERNS[0];
export const rhythm = (p: BreathPattern) => p.phases.map((ph) => ph.seconds).join(" · ");
export const cycleMs = (p: BreathPattern) => p.phases.reduce((a, ph) => a + ph.seconds * 1000, 0);

/** Session length rounded up to whole cycles so it never stops mid-breath. */
export const sessionMs = (p: BreathPattern, minutes: number) => Math.ceil((minutes * 60_000) / cycleMs(p)) * cycleMs(p);
