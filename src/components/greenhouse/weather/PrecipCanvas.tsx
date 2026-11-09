"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import { toScreen, type WorldLayout } from "@/lib/game/world";
import { GLASS_BOX, glassPath } from "./geometry";

export type PrecipKind = "rain" | "snow" | "leaves" | "petals" | "wind";

/** a rough guess at a low-power phone: fewer particles there */
function lowPower() {
  if (typeof navigator === "undefined") return false;
  const n = navigator as Navigator & { deviceMemory?: number };
  return (n.hardwareConcurrency ?? 8) <= 4 || (n.deviceMemory ?? 8) <= 3;
}

const COUNT: Record<PrecipKind, number> = { rain: 80, snow: 70, leaves: 9, petals: 12, wind: 16 };

interface P {
  x: number;
  y: number;
  v: number;
  r: number;
  ph: number;
  c: number;
}

/**
 * Rain, snow, falling leaves or blossom outside the window — one canvas, clipped
 * to the glass. One requestAnimationFrame loop that stops while the tab is hidden,
 * thins itself out if frames get slow, and draws a single still frame when the
 * user prefers reduced motion.
 */
export function PrecipCanvas({ kind, layout, strength = 1 }: { kind: PrecipKind; layout: WorldLayout; strength?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const cv = ref.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;
    const L = layout;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    cv.width = Math.round(L.w * dpr);
    cv.height = Math.round(L.h * dpr);
    const clip = new Path2D(glassPath(L));
    const a = toScreen(L, { x: GLASS_BOX.x0, y: GLASS_BOX.y0 });
    const b = toScreen(L, { x: GLASS_BOX.x1, y: GLASS_BOX.y1 });
    const W = b.x - a.x;
    const H = b.y - a.y;
    const s = L.s;
    let n = Math.round(COUNT[kind] * strength * (lowPower() ? 0.5 : 1));
    const make = (top: boolean): P => ({
      x: kind === "wind" && top ? a.x - 20 - Math.random() * 40 : a.x + Math.random() * W,
      y: kind === "wind" ? a.y + Math.random() * H : top ? a.y - Math.random() * 40 : a.y + Math.random() * H,
      v: kind === "rain" ? (700 + Math.random() * 400) * s : kind === "snow" ? (28 + Math.random() * 40) * s : (40 + Math.random() * 30) * s,
      r: kind === "rain" ? (26 + Math.random() * 22) * s : kind === "snow" ? (2 + Math.random() * 3) * Math.max(0.8, s) : (5 + Math.random() * 4) * Math.max(0.7, s),
      ph: Math.random() * Math.PI * 2,
      c: Math.random(),
    });
    let ps = Array.from({ length: n }, () => make(false));
    const LEAF = ["#e8893f", "#d9603b", "#f0b44c", "#c9772f"];
    const PETAL = ["#ffd3e0", "#ffc2d4", "#fbe2ea"];

    const draw = (t: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, L.w, L.h);
      ctx.save();
      ctx.clip(clip);
      if (kind === "rain") {
        ctx.strokeStyle = "rgba(232,240,255,0.72)";
        ctx.lineWidth = Math.max(1.2, 1.3 * s);
        ctx.lineCap = "round";
        ctx.beginPath();
        for (const p of ps) {
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.r * 0.12, p.y + p.r);
        }
        ctx.stroke();
      } else if (kind === "snow") {
        ctx.fillStyle = "rgba(255,255,255,0.92)";
        ctx.beginPath();
        for (const p of ps) {
          const x = p.x + Math.sin(t / 1400 + p.ph) * 10 * s;
          ctx.moveTo(x + p.r, p.y);
          ctx.arc(x, p.y, p.r, 0, Math.PI * 2);
        }
        ctx.fill();
      } else {
        const cols = kind === "leaves" ? LEAF : kind === "wind" ? [...PETAL, "#cfe3b0", "#e6f0c8"] : PETAL;
        for (const p of ps) {
          const x = p.x + Math.sin(t / 1100 + p.ph) * 22 * s;
          ctx.save();
          ctx.translate(x, p.y);
          ctx.rotate(Math.sin(t / 900 + p.ph) * 1.2);
          ctx.fillStyle = cols[Math.floor(p.c * cols.length)];
          ctx.globalAlpha = 0.85;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.r, p.r * 0.55, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
      ctx.restore();
    };

    if (reduce) {
      draw(0);
      return;
    }

    let raf = 0;
    let last = 0;
    let slow = 0;
    let frames = 0;
    const tick = (t: number) => {
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 0.016;
      // thin out once if the phone struggles
      if (last) {
        frames++;
        if (t - last > 30) slow++;
        if (frames === 90) {
          if (slow > 45 && n > 10) {
            n = Math.round(n / 2);
            ps = ps.slice(0, n);
          }
          frames = slow = 0;
        }
      }
      last = t;
      for (const p of ps) {
        p.y += p.v * dt;
        if (kind === "rain") p.x -= p.v * dt * 0.12;
        if (kind === "wind") {
          // carried sideways by the wind, bobbing up and down
          p.y -= p.v * dt;
          p.x += p.v * dt * 4.5;
          p.y += Math.sin(t / 500 + p.ph) * 0.6;
          if (p.x > b.x + 20) Object.assign(p, make(true));
          continue;
        }
        if (p.y > b.y + 10) Object.assign(p, make(true));
      }
      draw(t);
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!raf) {
        last = 0;
        raf = requestAnimationFrame(tick);
      }
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVis);
    if (!document.hidden) start();
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [kind, layout, strength, reduce]);

  return <canvas ref={ref} aria-hidden className="pointer-events-none absolute left-0 top-0" style={{ width: layout.w, height: layout.h }} />;
}
