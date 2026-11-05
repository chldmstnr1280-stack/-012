import type { WorldPoint } from "./greenhouseWorld";

/**
 * Interactive objects placed in the greenhouse (world = painted-background pixels).
 * `anchor` is the bottom-centre of the object on the floor/table; `width` is in world px.
 * Objects are depth-sorted with Selly by their anchor y.
 */
export type ObjectId = "cushion" | "orb" | "calendar" | "moodFlower";

export interface GreenhouseObject {
  id: ObjectId;
  label: string;
  /** what tapping does, for screen readers */
  hint: string;
  src: string;
  /** optional layer drawn in front of Selly (e.g. the cushion's front rim) */
  frontSrc?: string;
  anchor: WorldPoint;
  width: number;
  /** image aspect (h / w) */
  aspect: number;
  glow?: boolean;
}

export const OBJECTS: GreenhouseObject[] = [
  {
    id: "cushion",
    label: "꽃 쿠션",
    hint: "셀리와 함께 쉬기",
    src: "/assets/objects/cushion.png",
    frontSrc: "/assets/objects/cushion-front.png",
    anchor: { x: 585, y: 1006 },
    width: 290,
    aspect: 392 / 560,
  },
  {
    id: "orb",
    label: "빛나는 구슬",
    hint: "호흡하기",
    src: "/assets/objects/orb.png",
    anchor: { x: 322, y: 1000 },
    width: 124,
    aspect: 404 / 480,
    glow: true,
  },
  {
    id: "calendar",
    label: "온실 캘린더",
    hint: "생리주기 보기",
    src: "/assets/objects/calendar.png",
    anchor: { x: 772, y: 752 },
    width: 112,
    aspect: 420 / 374,
  },
  {
    id: "moodFlower",
    label: "기분 꽃",
    hint: "오늘의 기분 기록하기",
    src: "/assets/flowers/white-bloom.png", // replaced by the growth stage at runtime
    anchor: { x: 792, y: 996 },
    width: 92,
    aspect: 360 / 220,
  },
];

/** Where Selly sits inside the cushion (feet), and her size there. */
export const CUSHION_SEAT: WorldPoint = { x: 585, y: 948 };

/** Depth order: Selly sits between the cushion's back (below) and its front rim (above). */
export const CUSHION_BACK_Z = 905;
export const CUSHION_FRONT_Z = 962;

/** Mood-flower growth from how many days the user has recorded a mood. It never wilts. */
export const FLOWER_STAGES = [
  { min: 0, src: "/assets/flowers/white-seed.png", aspect: 101 / 260, width: 96, name: "씨앗" },
  { min: 1, src: "/assets/flowers/white-sprout.png", aspect: 230 / 261, width: 96, name: "새싹" },
  { min: 3, src: "/assets/flowers/white-bud.png", aspect: 360 / 242, width: 92, name: "꽃봉오리" },
  { min: 7, src: "/assets/flowers/white-bloom.png", aspect: 360 / 220, width: 92, name: "개화" },
] as const;

export function flowerStage(moodDays: number) {
  return [...FLOWER_STAGES].reverse().find((s) => moodDays >= s.min) ?? FLOWER_STAGES[0];
}
