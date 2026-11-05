export type StageId = "seed" | "sprout" | "leaf" | "bloom";

export interface Stage {
  id: StageId;
  name: string;
  minLevel: number;
  line: string;
  /** "으로" / "로" — the particle that follows the name */
  ro: string;
}

/** Selly's growth stages (matches the "셀리의 성장" reference). */
export const STAGES: Stage[] = [
  { id: "seed", name: "씨앗", ro: "으로", minLevel: 1, line: "작은 씨앗 안에서 꿈을 꾸고 있어요" },
  { id: "sprout", name: "새싹", ro: "으로", minLevel: 3, line: "조그만 잎이 빼꼼 고개를 내밀었어요" },
  { id: "leaf", name: "잎새", ro: "로", minLevel: 5, line: "두 잎이 활짝, 매일이 조금씩 단단해져요" },
  { id: "bloom", name: "꽃피움", ro: "으로", minLevel: 10, line: "함께 가꾼 시간이 꽃으로 피어났어요" },
];

export function stageFor(level: number): Stage {
  return [...STAGES].reverse().find((s) => level >= s.minLevel) ?? STAGES[0];
}

export function nextStage(level: number): Stage | null {
  return STAGES.find((s) => s.minLevel > level) ?? null;
}

export const EXP_PER_LEVEL = 500;

/** Daily growth rewards. */
export const REWARDS = {
  record: 15,
  breath: 20,
  water: 10,
  sun: 10,
  pat: 5,
  bonus: 20,
} as const;

/** Younger stages are a little smaller (applies to every Selly drawing). */
export const STAGE_SIZE: Record<StageId, number> = { seed: 0.78, sprout: 0.88, leaf: 1, bloom: 1 };
