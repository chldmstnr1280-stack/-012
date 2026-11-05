/**
 * Feelings and the flowers they plant. Every feeling is welcome and every
 * flower grows the same way — a "sad" flower is as lovely as a "happy" one.
 */
export const EMOTIONS = ["happy", "calm", "sad", "anxious", "tired"] as const;
export type Emotion = (typeof EMOTIONS)[number];

export const EMOTION_INFO: Record<Emotion, { label: string; flower: string; color: string; art: string }> = {
  happy: { label: "행복", flower: "노란 꽃", color: "#f1c94e", art: "happy" },
  calm: { label: "평온", flower: "연두 꽃", color: "#c6e28f", art: "calm" },
  sad: { label: "슬픔", flower: "파란 꽃", color: "#8db3ea", art: "sad" },
  anxious: { label: "불안", flower: "보라 꽃", color: "#b39ae6", art: "anxious" },
  tired: { label: "지침", flower: "하얀 꽃", color: "#f3ece4", art: "white" },
};

export const FLOWER_STAGE_NAMES = ["씨앗", "새싹", "꽃봉오리", "개화"] as const;

/** Art for a flower at a growth stage (seed & sprout look the same for every colour). */
export function flowerArt(emotion: Emotion, stage: number) {
  const s = ["seed", "sprout", "bud", "bloom"][Math.max(0, Math.min(3, stage))];
  const art = stage <= 1 ? "white" : EMOTION_INFO[emotion].art;
  return `/assets/flowers/${art}-${s}.png`;
}

/** Source image aspect (h / w) per stage. */
export const FLOWER_ASPECT = [101 / 260, 230 / 261, 360 / 242, 360 / 220];
