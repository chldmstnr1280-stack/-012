import { EMOTION_INFO, FLOWER_ASPECT, flowerArt, type Emotion } from "./moodFlowers";

/**
 * Greenhouse decorations (Phase D). Only items with finished artwork are
 * available; the rest are listed so the tray can show what is coming.
 * Placement is free — no costs, no streaks.
 */
export interface DecoItem {
  id: string;
  name: string;
  /** null = artwork not delivered yet (shown as "준비 중") */
  src: string | null;
  /** h / w of the image */
  aspect: number;
  /** width in world px */
  width: number;
}

const flower = (e: Emotion): DecoItem => ({ id: `flower-${e}`, name: `${EMOTION_INFO[e].flower} 모종`, src: flowerArt(e, 3), aspect: FLOWER_ASPECT[3], width: 60 });

export const DECO_ITEMS: DecoItem[] = [
  flower("happy"),
  flower("calm"),
  flower("sad"),
  flower("anxious"),
  flower("tired"),
  { id: "bud", name: "꽃봉오리 모종", src: flowerArt("tired", 2), aspect: FLOWER_ASPECT[2], width: 54 },
  { id: "sprout", name: "새싹 모종", src: flowerArt("tired", 1), aspect: FLOWER_ASPECT[1], width: 64 },
  // artwork on the way
  { id: "pot-flower", name: "꽃 화분", src: null, aspect: 1, width: 70 },
  { id: "pot-vine", name: "덩굴 화분", src: null, aspect: 1, width: 70 },
  { id: "lamp", name: "작은 조명", src: null, aspect: 1.3, width: 50 },
  { id: "cushions", name: "쿠션 세트", src: null, aspect: 0.8, width: 90 },
  { id: "books", name: "장식 책", src: null, aspect: 0.8, width: 70 },
];

export const itemById = (id: string) => DECO_ITEMS.find((i) => i.id === id && i.src);

/**
 * Where decorations can go (world px, bottom-centre). Chosen to stay visible —
 * clear of Selly's cushion (which hides anything behind it), the door and the flower bed.
 */
export const DECO_SLOTS = [
  { id: "s1", x: 350, y: 905 }, // floor, back-left
  { id: "s2", x: 410, y: 897 }, // floor, back-left by the window
  { id: "s3", x: 290, y: 880 }, // on the book stack
  { id: "s4", x: 700, y: 752 }, // table top, beside the calendar
  { id: "s5", x: 396, y: 1003 }, // floor, front-left by the orb
] as const;
export type SlotId = (typeof DECO_SLOTS)[number]["id"];
