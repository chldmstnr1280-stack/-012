/**
 * Asset slots.
 *
 * Source art lives in /assets-src and is processed by `scripts/extract-assets.py`
 * into /public/assets. Set any slot to `null` to fall back to the vector stand-ins.
 */

/** Where the live vector face sits, in Selly's 240×240 art space. */
export interface FaceLayout {
  cx: number;
  eyeY: number;
  /** half the distance between the eyes */
  eyeDx: number;
  mouthY: number;
  /** stroke/feature scale relative to the vector stand-in */
  scale: number;
  /** draw vector cheeks all the time (false when the art already has blush) */
  cheeks: boolean;
}

export interface SellyArt {
  body: string;
  leafLeft: string;
  leafRight: string;
  /** leaf rotation pivots (leaf base), in 240-space */
  leafPivots: [[number, number], [number, number]];
  face: FaceLayout;
}

export const VECTOR_FACE: FaceLayout = { cx: 120, eyeY: 150, eyeDx: 19, mouthY: 161, scale: 1, cheeks: true };

// Values printed by scripts/extract-assets.py
export const sellyArt: SellyArt | null = {
  body: "/assets/selly/selly-body.png",
  leafLeft: "/assets/selly/selly-leaf-left.png",
  leafRight: "/assets/selly/selly-leaf-right.png",
  leafPivots: [
    [72.2, 91.7],
    [165.8, 89.7],
  ],
  face: { cx: 121.1, eyeY: 119.2, eyeDx: 27.3, mouthY: 128.6, scale: 1.41, cheeks: false },
};

/** Clean greenhouse background (no UI, no character). */
export const greenhouseArt: string | null = "/assets/greenhouse/greenhouse-bg.webp";

/** Grass patch cut from the painted floor; Selly sits on it. */
export const grassIslandArt: string | null = greenhouseArt ? "/assets/greenhouse/grass-island.png" : null;

/** Painted Selly poses used by the greenhouse for walking / sitting / sleeping. */
export const sellyPoses: {
  walk: string;
  sit: string;
  sleep: string;
  /** leafless versions for the seed stage, with where the seedling sits (fractions of the image) */
  bare: { sit: string; sleep: string };
  head: { sit: [number, number]; sleep: [number, number] };
} | null = {
  walk: "/assets/selly/pose-walk.png",
  sit: "/assets/selly/pose-sit.png",
  sleep: "/assets/selly/pose-sleep.png",
  bare: { sit: "/assets/selly/pose-sit-bare.png", sleep: "/assets/selly/pose-sleep-bare.png" },
  head: { sit: [0.52, 0.235], sleep: [0.64, 0.18] },
};
