import { FLOOR_FRONT_Y, WALKABLE, WORLD, type WorldPoint } from "@/data/greenhouseWorld";

/**
 * How the world (painted background) is placed on screen.
 * The image always covers the screen, and the floor's front edge sits just above
 * the home dock so Selly is never hidden behind the buttons.
 */
export interface WorldLayout {
  s: number; // world px → screen px
  ox: number;
  oy: number;
  w: number; // screen size
  h: number;
}

export function computeLayout(w: number, h: number, floorScreenY: number): WorldLayout {
  const s = Math.max(w / WORLD.width, floorScreenY / FLOOR_FRONT_Y, (h - floorScreenY) / (WORLD.height - FLOOR_FRONT_Y));
  return { s, ox: (w - WORLD.width * s) / 2, oy: floorScreenY - FLOOR_FRONT_Y * s, w, h };
}

export const toScreen = (L: WorldLayout, p: WorldPoint) => ({ x: L.ox + p.x * L.s, y: L.oy + p.y * L.s });
export const toWorld = (L: WorldLayout, x: number, y: number): WorldPoint => ({ x: (x - L.ox) / L.s, y: (y - L.oy) / L.s });

/** x range of the world that is actually visible, minus a margin (world units). */
export function visibleX(L: WorldLayout, marginPx: number) {
  return { min: (marginPx - L.ox) / L.s, max: (L.w - marginPx - L.ox) / L.s };
}

function insidePoly(p: WorldPoint, poly: WorldPoint[]) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

function closestOnSegment(p: WorldPoint, a: WorldPoint, b: WorldPoint) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)));
  return { x: a.x + t * dx, y: a.y + t * dy };
}

/** Keep a point on the walkable floor (and on screen). */
export function clampToFloor(p: WorldPoint, L?: WorldLayout, marginPx = 70): WorldPoint {
  let q = p;
  if (L) {
    const v = visibleX(L, marginPx);
    q = { x: Math.max(v.min, Math.min(v.max, q.x)), y: q.y };
  }
  if (insidePoly(q, WALKABLE)) return q;
  let best = WALKABLE[0];
  let bestD = Infinity;
  for (let i = 0; i < WALKABLE.length; i++) {
    const c = closestOnSegment(q, WALKABLE[i], WALKABLE[(i + 1) % WALKABLE.length]);
    const d = (c.x - q.x) ** 2 + (c.y - q.y) ** 2;
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  // nudge slightly inside
  const cx = WALKABLE.reduce((a, b) => a + b.x, 0) / WALKABLE.length;
  const cy = WALKABLE.reduce((a, b) => a + b.y, 0) / WALKABLE.length;
  return { x: best.x + (cx - best.x) * 0.03, y: best.y + (cy - best.y) * 0.03 };
}

export function randomFloorPoint(L?: WorldLayout): WorldPoint {
  const xs = WALKABLE.map((p) => p.x);
  const ys = WALKABLE.map((p) => p.y);
  for (let i = 0; i < 30; i++) {
    const p = { x: Math.min(...xs) + Math.random() * (Math.max(...xs) - Math.min(...xs)), y: Math.min(...ys) + Math.random() * (Math.max(...ys) - Math.min(...ys)) };
    if (insidePoly(p, WALKABLE)) return clampToFloor(p, L);
  }
  return clampToFloor({ x: 530, y: 960 }, L);
}
