import type { WorldPoint } from "@/data/greenhouseWorld";
import { toScreen, type WorldLayout } from "@/lib/game/world";

/**
 * Where the outside shows through the glass in the painting (world px).
 * Rain and snow fall only inside this shape, so it never rains in the
 * greenhouse. It follows the big arched window and steps around what is
 * painted in front of it (the lantern, the table flowers, the floor flowers).
 */
export const GLASS: WorldPoint[] = [
  { x: 372, y: 780 },
  { x: 372, y: 300 },
  { x: 385, y: 215 },
  { x: 420, y: 145 },
  { x: 470, y: 95 },
  { x: 530, y: 60 },
  { x: 585, y: 45 },
  { x: 640, y: 60 },
  { x: 695, y: 100 },
  { x: 735, y: 160 },
  { x: 742, y: 300 },
  { x: 735, y: 540 },
  { x: 688, y: 545 },
  { x: 688, y: 860 },
  { x: 495, y: 860 },
  { x: 495, y: 780 },
];

/** the outside ground line seen through the bottom of the window */
export const GROUND_Y = 835;
export const GLASS_BOX = { x0: 372, x1: 742, y0: 45, y1: 860 };

/** painted lanterns (shared with TimeLighting) */
export const LANTERNS = [
  { x: 790, y: 455, r: 150 },
  { x: 900, y: 335, r: 150 },
  { x: 245, y: 700, r: 160 },
  { x: 662, y: 868, r: 90 },
];

/** painted flowers where dewdrops sparkle on a rainbow day */
export const FLOWER_SPOTS: WorldPoint[] = [
  { x: 120, y: 930 },
  { x: 60, y: 1030 },
  { x: 990, y: 940 },
  { x: 1040, y: 1060 },
  { x: 760, y: 600 },
  { x: 720, y: 640 },
  { x: 340, y: 820 },
  { x: 960, y: 800 },
];

/** SVG path of the glass in screen px */
export function glassPath(L: WorldLayout) {
  return GLASS.map((p, i) => {
    const s = toScreen(L, p);
    return `${i ? "L" : "M"}${s.x.toFixed(1)} ${s.y.toFixed(1)}`;
  }).join(" ") + " Z";
}
