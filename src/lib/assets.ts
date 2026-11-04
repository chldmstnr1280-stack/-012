/**
 * Asset slots.
 *
 * Phase 1 ships with vector stand-ins (SVG Selly + layered SVG greenhouse) so
 * every interaction works today. When the final art arrives, drop the files
 * into /public/assets and set the paths below — the components switch over
 * automatically without any other code change.
 *
 *  - sellyBody:  transparent PNG/WebP of Selly WITHOUT a face (eyes/mouth/cheeks),
 *                square canvas, character centred, feet touching the bottom ~12%.
 *                The face stays a live vector layer so blinking & expressions keep working.
 *  - greenhouse: clean greenhouse background (no UI, no character), 1170×2532 or larger.
 */
export const assets: { sellyBody: string | null; greenhouse: string | null } = {
  sellyBody: null, // e.g. "/assets/selly/selly-body.png"
  greenhouse: null, // e.g. "/assets/greenhouse/greenhouse-bg.webp"
};
