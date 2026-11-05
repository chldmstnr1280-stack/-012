"use client";

import { DECO_SLOTS, itemById } from "@/data/gardenItems";
import { flowerArt } from "@/data/moodFlowers";
import { CUSHION_SEAT } from "@/data/greenhouseObjects";
import { SHARE_MESSAGES } from "@/data/shareMessages";
import { greenhouseArt } from "@/lib/assets";
import { STAGE_SIZE, stageFor } from "@/lib/growth";
import type { GreenhouseSnapshot } from "./snapshot";

/**
 * Draws a 1080×1350 postcard of the greenhouse from a snapshot (canvas, all on device).
 * The scene uses the same world coordinates as the live greenhouse.
 */
const W = 1080;
const H = 1350;
// world window shown on the card (painted background px)
const VIEW = { x: 232, y: 330, w: 640 };
const K = W / VIEW.w;
const toX = (x: number) => (x - VIEW.x) * K;
const toY = (y: number) => (y - VIEW.y) * K;

const cache = new Map<string, Promise<HTMLImageElement>>();
function load(src: string) {
  if (!cache.has(src))
    cache.set(
      src,
      new Promise((res, rej) => {
        const img = new Image();
        img.onload = () => res(img);
        img.onerror = rej;
        img.src = src;
      }),
    );
  return cache.get(src)!;
}

/** Bottom-centre anchored image at a world point, `width` in world px. */
async function place(ctx: CanvasRenderingContext2D, src: string, x: number, y: number, width: number) {
  const img = await load(src);
  const w = width * K;
  const h = (w * img.naturalHeight) / img.naturalWidth;
  ctx.drawImage(img, toX(x) - w / 2, toY(y) - h, w, h);
}

const BED = [
  { x: 724, y: 990 },
  { x: 732, y: 948 },
  { x: 770, y: 952 },
  { x: 806, y: 946 },
  { x: 744, y: 906 },
  { x: 780, y: 902 },
  { x: 814, y: 908 },
];

export async function drawPostcard(snap: GreenhouseSnapshot): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  await Promise.all([document.fonts.load('52px "Gowun Dodum"'), document.fonts.load('96px "Parisienne"')]).catch(() => {});

  // background
  if (greenhouseArt) {
    const bg = await load(greenhouseArt);
    ctx.drawImage(bg, VIEW.x, VIEW.y, VIEW.w, VIEW.w * (H / W), 0, 0, W, H);
  } else {
    ctx.fillStyle = "#efe6d4";
    ctx.fillRect(0, 0, W, H);
  }

  // things on the floor, back to front
  const items: { y: number; draw: () => Promise<void> }[] = [];
  for (const slot of DECO_SLOTS) {
    const it = snap.deco[slot.id] ? itemById(snap.deco[slot.id]) : undefined;
    if (it?.src) items.push({ y: slot.y, draw: () => place(ctx, it.src!, slot.x, slot.y, it.width) });
  }
  [...snap.flowers].reverse().forEach((f, i) => {
    const slot = BED[i];
    if (slot) items.push({ y: slot.y, draw: () => place(ctx, flowerArt(f.e, f.s), slot.x, slot.y, [64, 62, 56, 62][f.s]) });
  });
  const stage = stageFor(snap.level);
  const pose = stage.id === "seed" ? "/assets/selly/pose-sit-bare.png" : "/assets/selly/pose-sit.png";
  items.push({ y: 905, draw: () => place(ctx, "/assets/objects/cushion.png", 585, 1006, 290) });
  items.push({ y: 948, draw: () => place(ctx, pose, CUSHION_SEAT.x, CUSHION_SEAT.y, 262 * STAGE_SIZE[stage.id]) });
  items.push({ y: 962, draw: () => place(ctx, "/assets/objects/cushion-front.png", 585, 1006, 290) });
  items.sort((a, b) => a.y - b.y);
  for (const it of items) await it.draw().catch(() => {});

  // evening / night wash
  if (snap.tod !== "day") {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    if (snap.tod === "night") {
      g.addColorStop(0, "rgba(16,20,56,0.55)");
      g.addColorStop(1, "rgba(16,20,56,0.35)");
    } else if (snap.tod === "evening") {
      g.addColorStop(0, "rgba(130,80,150,0.22)");
      g.addColorStop(1, "rgba(255,140,90,0.18)");
    } else {
      g.addColorStop(0, "rgba(255,214,200,0.25)");
      g.addColorStop(1, "rgba(196,218,244,0.12)");
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  // soft fade for the text panel
  const fade = ctx.createLinearGradient(0, H - 420, 0, H);
  fade.addColorStop(0, "rgba(253,250,243,0)");
  fade.addColorStop(0.45, "rgba(253,250,243,0.9)");
  fade.addColorStop(1, "rgba(253,250,243,1)");
  ctx.fillStyle = fade;
  ctx.fillRect(0, H - 420, W, 420);

  // logo
  ctx.save();
  ctx.font = '96px "Parisienne", cursive';
  ctx.fillStyle = "#fff";
  ctx.shadowColor = "rgba(90,70,50,0.45)";
  ctx.shadowBlur = 14;
  ctx.fillText("Dear Selly ♡", 64, 140);
  ctx.restore();

  // message + footer
  ctx.textAlign = "center";
  ctx.fillStyle = "#4a3f36";
  ctx.font = '58px "Gowun Dodum", sans-serif';
  ctx.fillText(SHARE_MESSAGES[snap.msg], W / 2, H - 170);
  ctx.fillStyle = "#8a7e71";
  ctx.font = '34px "Gowun Dodum", sans-serif';
  const d = new Date();
  ctx.fillText(`${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()} · Lv. ${snap.level} ${stage.name} 셀리`, W / 2, H - 100);
  return canvas;
}

export function canvasToFile(canvas: HTMLCanvasElement): Promise<File> {
  return new Promise((res, rej) =>
    canvas.toBlob((b) => (b ? res(new File([b], "dear-selly-postcard.png", { type: "image/png" })) : rej(new Error("toBlob"))), "image/png"),
  );
}
