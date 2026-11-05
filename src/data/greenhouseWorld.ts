/**
 * The greenhouse as a 2.5D world.
 *
 * World units are pixels of the painted background (public/assets/greenhouse/greenhouse-bg.webp,
 * 1086×1301), so every spot lines up with what is painted there on any screen size.
 * x → right, y → toward the viewer (larger y = nearer = bigger). A future 3D scene can
 * map (x, y) to a floor plane (x, z) without changing this data.
 */

export interface WorldPoint {
  x: number;
  y: number;
}

export const WORLD = { width: 1086, height: 1301 } as const;

/** The front edge of the floor we let Selly use; it is aligned just above the home dock. */
export const FLOOR_FRONT_Y = 1000;

/**
 * Walkable floor: a CONVEX polygon (clockwise), so any straight walk between two
 * points inside it stays inside — Selly never cuts through the book stack on the
 * left, the table legs on the right or the foreground flowers.
 */
export const WALKABLE: WorldPoint[] = [
  { x: 335, y: 892 },
  { x: 700, y: 892 },
  { x: 760, y: 945 },
  { x: 765, y: 1000 },
  { x: 370, y: 1000 },
  { x: 320, y: 948 },
];

export type SpotId = "rug" | "window" | "flowers" | "plants" | "lantern" | "door";

export interface Spot {
  id: SpotId;
  name: string;
  /** where Selly stands */
  at: WorldPoint;
  /** which way she faces while there (-1 left, 1 right, 0 toward the viewer) */
  facing: -1 | 0 | 1;
  /** what she is looking at / tending (for effects) */
  focus?: WorldPoint;
}

export const SPOTS: Record<SpotId, Spot> = {
  // the moss rug cut from the painted floor — Selly's resting place
  rug: { id: "rug", name: "꽃 쿠션", at: { x: 585, y: 948 }, facing: 0 },
  // bright patch of stone floor in front of the big window
  window: { id: "window", name: "창가", at: { x: 430, y: 897 }, facing: 0 },
  // pink & white flowers behind the book stack, left
  flowers: { id: "flowers", name: "꽃밭", at: { x: 385, y: 912 }, facing: -1, focus: { x: 300, y: 860 } },
  // flowering plants by the table, right
  plants: { id: "plants", name: "기분 꽃", at: { x: 712, y: 978 }, facing: 1, focus: { x: 792, y: 930 } },
  // in front of the glass door (centre of the big window)
  door: { id: "door", name: "온실 문", at: { x: 575, y: 893 }, facing: 0 },
  // small floor lantern by the window
  lantern: { id: "lantern", name: "작은 랜턴", at: { x: 650, y: 900 }, facing: 1, focus: { x: 665, y: 860 } },
};

/** Depth: how big Selly is at a given y (relative to her base size). */
export function depthScale(y: number) {
  const t = Math.max(0, Math.min(1, (y - 890) / (1000 - 890)));
  return 0.64 + t * (0.84 - 0.64);
}

/** The glass door: the narrow centre pane of the big painted window (world rect). */
export const DOOR_RECT = { x0: 518, y0: 560, x1: 632, y1: 882 };
