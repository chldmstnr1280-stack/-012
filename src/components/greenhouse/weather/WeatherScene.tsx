"use client";

import { AnimatePresence, motion } from "motion/react";
import type { TimeOfDay } from "@/lib/game/behaviorEngine";
import { toScreen, type WorldLayout } from "@/lib/game/world";
import type { Season, Weather } from "@/lib/garden/weather";
import { mulberry32 } from "../svg-kit";
import { FLOWER_SPOTS, GLASS_BOX, GROUND_Y, LANTERNS, glassPath } from "./geometry";
import { PrecipCanvas, type PrecipKind } from "./PrecipCanvas";

/**
 * The living greenhouse: weather and season painted in light over the
 * existing artwork (no new bitmaps). Three layers, so the room keeps its own
 * warm light:
 *   WeatherOutside  (just above the painting)  sky colour, clouds, rainbow, snow on the ground
 *   WeatherGlass    (above the time-of-day light) rain / snow / drops on the glass / night sky
 *   WeatherGrade    (below the time-of-day light) the room's light: grey, cool, warm, golden
 * Everything is pointer-events: none and lives inside the world, under the UI.
 */

interface SceneProps {
  weather: Weather;
  season: Season;
  tod: TimeOfDay;
  layout: WorldLayout;
}

const FADE = { duration: 1.4, ease: "easeInOut" } as const;

/** sky over the window, by weather (top → bottom colour, strength) */
const SKY: Record<Weather, [string, string, number] | null> = {
  clear: null,
  cloudy: ["#c3c8d2", "#e1e3e6", 0.5],
  rain: ["#8b96a9", "#b6bfcb", 0.58],
  snow: ["#d5dbe6", "#f1f3f7", 0.48],
  rainbow: ["#bcd6ef", "#f6efe2", 0.22],
};

/** a little season in the trees seen through the glass */
const SEASON_TREES: Record<Season, { blobs: string[]; tint: string | null }> = {
  spring: { blobs: ["#ffc9d8", "#ffd9e4", "#fbe4ec"], tint: null },
  summer: { blobs: [], tint: "rgba(70,150,80,0.14)" },
  autumn: { blobs: ["#e9893c", "#d65f36", "#f1b54a", "#c2742d"], tint: "rgba(230,150,60,0.12)" },
  winter: { blobs: [], tint: "rgba(235,240,248,0.28)" },
};

const rnd = mulberry32(2611);
const BLOBS = Array.from({ length: 16 }, () => ({ x: 390 + rnd() * 340, y: 260 + rnd() * 470, r: 22 + rnd() * 30, c: rnd() }));
const BEADS = Array.from({ length: 30 }, () => ({ x: 385 + rnd() * 345, y: 110 + rnd() * 720, r: 2.5 + rnd() * 3.5 }));
const DRIPS = Array.from({ length: 7 }, (_, i) => ({ x: 400 + rnd() * 320, y: 160 + rnd() * 300, dist: 160 + rnd() * 260, dur: 7 + rnd() * 6, delay: -i * 1.7 }));
const STARS = Array.from({ length: 14 }, () => ({ x: 420 + rnd() * 290, y: 80 + rnd() * 200, r: 1.2 + rnd() * 1.6, d: rnd() * 4 }));
const CLOUDS = [
  { x: 470, y: 120, w: 150, dur: 80 },
  { x: 640, y: 170, w: 190, dur: 95 },
  { x: 540, y: 245, w: 130, dur: 70 },
];

function GlassClip({ id, layout }: { id: string; layout: WorldLayout }) {
  return (
    <clipPath id={id}>
      <path d={glassPath(layout)} />
    </clipPath>
  );
}

/** the glass with feathered edges — colour washes fade out instead of ending in a hard line */
function GlassMask({ id, layout }: { id: string; layout: WorldLayout }) {
  return (
    <>
      <filter id={`${id}-f`} x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation={14 * layout.s} />
      </filter>
      <mask id={id} maskUnits="userSpaceOnUse" x={0} y={0} width={layout.w} height={layout.h}>
        <path d={glassPath(layout)} fill="#fff" filter={`url(#${id}-f)`} />
      </mask>
    </>
  );
}

export function WeatherOutside({ weather, season, tod, layout: L }: SceneProps) {
  const sky = SKY[weather];
  const box0 = toScreen(L, { x: GLASS_BOX.x0, y: GLASS_BOX.y0 });
  const box1 = toScreen(L, { x: GLASS_BOX.x1, y: GLASS_BOX.y1 });
  const trees = SEASON_TREES[season];
  const cloudy = weather === "cloudy" || weather === "rain" || weather === "snow";
  return (
    <div className="pointer-events-none absolute inset-0" style={{ zIndex: 1 }} aria-hidden>
      <svg className="absolute inset-0" width={L.w} height={L.h}>
        <defs>
          <GlassMask id="ds-glass-out" layout={L} />
          <filter id="ds-soft" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={10 * L.s} />
          </filter>
        </defs>
        <g mask="url(#ds-glass-out)">
          {/* season in the trees outside */}
          {trees.tint && <rect x={box0.x} y={box0.y} width={box1.x - box0.x} height={box1.y - box0.y} fill={trees.tint} />}
          {trees.blobs.length > 0 && (
            <g filter="url(#ds-soft)" opacity={weather === "rain" || weather === "snow" ? 0.35 : 0.6}>
              {BLOBS.map((b, i) => {
                const p = toScreen(L, b);
                return <circle key={i} cx={p.x} cy={p.y} r={b.r * L.s} fill={trees.blobs[Math.floor(b.c * trees.blobs.length)]} />;
              })}
            </g>
          )}
        </g>
      </svg>

      <AnimatePresence>
        <motion.div key={weather} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={FADE}>
          <svg className="absolute inset-0" width={L.w} height={L.h}>
            <defs>
              <GlassMask id={`ds-glass-${weather}`} layout={L} />
              {sky && (
                <linearGradient id={`ds-sky-${weather}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor={sky[0]} />
                  <stop offset="0.6" stopColor={sky[1]} stopOpacity="0.8" />
                  <stop offset="1" stopColor={sky[1]} stopOpacity="0.25" />
                </linearGradient>
              )}
              <filter id={`ds-cloud-${weather}`} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation={14 * L.s} />
              </filter>
              <linearGradient id="ds-fog" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0.45" stopColor="#fff" stopOpacity="0" />
                <stop offset="1" stopColor="#fff" stopOpacity="0.5" />
              </linearGradient>
            </defs>
            <g mask={`url(#ds-glass-${weather})`}>
              {sky && <rect x={box0.x} y={box0.y} width={box1.x - box0.x} height={box1.y - box0.y} fill={`url(#ds-sky-${weather})`} opacity={sky[2]} />}
              {/* slow clouds in the arch */}
              {weather !== "snow" && (
                <g filter={`url(#ds-cloud-${weather})`} opacity={cloudy ? 0.85 : 0.55}>
                  {CLOUDS.map((c, i) => {
                    const p = toScreen(L, c);
                    const w = c.w * L.s;
                    const col = weather === "rain" ? "#9aa3b2" : cloudy ? "#e4e6ea" : "#ffffff";
                    return (
                      <g key={i} className="ds-drift" style={{ ["--dur" as string]: `${c.dur}s` }}>
                        <ellipse cx={p.x} cy={p.y} rx={w * 0.55} ry={w * 0.2} fill={col} />
                        <ellipse cx={p.x + w * 0.2} cy={p.y - w * 0.1} rx={w * 0.3} ry={w * 0.18} fill={col} />
                      </g>
                    );
                  })}
                </g>
              )}
              {/* soft mist low in the garden */}
              {(cloudy || weather === "rainbow") && <rect x={box0.x} y={box0.y} width={box1.x - box0.x} height={box1.y - box0.y} fill="url(#ds-fog)" opacity={weather === "rainbow" ? 0.4 : 0.8} />}
              {weather === "snow" && <SnowGround layout={L} />}
              {weather === "rain" && <Puddles layout={L} />}
            </g>
          </svg>
          {weather === "rainbow" && tod !== "night" && <Rainbow layout={L} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/** snow lying on the garden outside, and a little snowman looking in */
function SnowGround({ layout: L }: { layout: WorldLayout }) {
  const g = (x: number, y: number) => toScreen(L, { x, y });
  const a = g(495, GROUND_Y);
  const pts = [
    [495, GROUND_Y + 5],
    [540, GROUND_Y - 12],
    [590, GROUND_Y - 4],
    [640, GROUND_Y - 16],
    [690, GROUND_Y - 6],
    [690, 870],
    [495, 870],
  ].map(([x, y]) => g(x, y));
  const d = `M${a.x} ${a.y} ` + pts.map((p) => `L${p.x} ${p.y}`).join(" ") + " Z";
  const sm = g(445, 776);
  const u = 9 * L.s;
  return (
    <g>
      <path d={d} fill="#fbfcff" opacity={0.95} />
      {/* left and right drifts along the bottom panes */}
      <ellipse cx={g(432, 784).x} cy={g(432, 784).y} rx={66 * L.s} ry={12 * L.s} fill="#fbfcff" opacity={0.95} />
      <ellipse cx={g(712, 545).x} cy={g(712, 545).y} rx={24 * L.s} ry={4 * L.s} fill="#fbfcff" opacity={0.85} />
      {/* snowman */}
      <g>
        <circle cx={sm.x} cy={sm.y - u * 1.6} r={u * 2.1} fill="#fff" />
        <circle cx={sm.x} cy={sm.y - u * 4.9} r={u * 1.45} fill="#fff" />
        <circle cx={sm.x - u * 0.5} cy={sm.y - u * 5.1} r={u * 0.18} fill="#5a3a2c" />
        <circle cx={sm.x + u * 0.5} cy={sm.y - u * 5.1} r={u * 0.18} fill="#5a3a2c" />
        <path d={`M${sm.x} ${sm.y - u * 4.8} l${u * 0.9} ${u * 0.2} l${-u * 0.9} ${u * 0.2}Z`} fill="#f08a3c" />
        <path d={`M${sm.x - u * 1.3} ${sm.y - u * 3.6} q${u * 1.3} ${u * 0.7} ${u * 2.6} 0`} stroke="#e46f86" strokeWidth={u * 0.5} fill="none" strokeLinecap="round" />
      </g>
    </g>
  );
}

/** little puddles outside with rings from the rain */
function Puddles({ layout: L }: { layout: WorldLayout }) {
  const spots = [
    { x: 545, y: 850, rx: 32 },
    { x: 640, y: 856, rx: 26 },
  ];
  return (
    <g>
      {spots.map((s, i) => {
        const p = toScreen(L, s);
        return (
          <g key={i}>
            <ellipse cx={p.x} cy={p.y} rx={s.rx * L.s} ry={s.rx * 0.22 * L.s} fill="#c9d6e6" opacity={0.75} />
            {[0, 0.8, 1.6].map((d) => (
              <ellipse key={d} className="ds-ripple" style={{ ["--delay" as string]: `${-d - i}s` }} cx={p.x + (d - 0.8) * 9 * L.s} cy={p.y} rx={9 * L.s} ry={2.2 * L.s} fill="none" stroke="#fff" strokeWidth={1} />
            ))}
          </g>
        );
      })}
    </g>
  );
}

/** the rainbow fades in slowly after the rain */
function Rainbow({ layout: L }: { layout: WorldLayout }) {
  const c = toScreen(L, { x: 560, y: 760 });
  const r = 250 * L.s;
  const bands = ["#ff9aa2", "#ffc58f", "#fff09a", "#b5e8a0", "#a0d4f0", "#c3b0f0"];
  return (
    <motion.svg className="absolute inset-0" width={L.w} height={L.h} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 3.5, delay: 0.8, ease: "easeOut" }}>
      <defs>
        <GlassClip id="ds-glass-rb" layout={L} />
        <filter id="ds-rb-blur">
          <feGaussianBlur stdDeviation={3 * L.s} />
        </filter>
        <linearGradient id="ds-rb-fade" gradientUnits="userSpaceOnUse" x1="0" y1={c.y - r} x2="0" y2={c.y}>
          <stop offset="0.25" stopColor="#fff" stopOpacity="1" />
          <stop offset="0.95" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id="ds-rb-mask">
          <rect x={0} y={0} width={L.w} height={L.h} fill="url(#ds-rb-fade)" />
        </mask>
      </defs>
      <g clipPath="url(#ds-glass-rb)" mask="url(#ds-rb-mask)" filter="url(#ds-rb-blur)" opacity={0.7}>
        {bands.map((col, i) => (
          <path key={col} d={`M${c.x - (r - i * 9 * L.s)} ${c.y} A ${r - i * 9 * L.s} ${r - i * 9 * L.s} 0 0 1 ${c.x + (r - i * 9 * L.s)} ${c.y}`} stroke={col} strokeWidth={9 * L.s} fill="none" />
        ))}
      </g>
    </motion.svg>
  );
}

/** What falls outside and the drops on the glass — behind Selly and everything in the room. */
export function WeatherGlass({ weather, season, tod, layout: L }: SceneProps) {
  const night = tod === "night";
  const precip: PrecipKind | null =
    weather === "rain" ? "rain" : weather === "snow" ? "snow" : season === "autumn" && weather !== "rainbow" ? "leaves" : season === "spring" && weather === "clear" ? "petals" : null;
  return (
    <div className="pointer-events-none absolute inset-0" style={{ zIndex: 2 }} aria-hidden>
      <AnimatePresence>
        {precip && (
          <motion.div key={precip} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: night ? 0.7 : 1 }} exit={{ opacity: 0 }} transition={FADE}>
            <PrecipCanvas kind={precip} layout={L} />
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {(weather === "rain" || weather === "rainbow" || weather === "snow") && (
          <motion.div key={weather} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={FADE}>
            <svg className="absolute inset-0" width={L.w} height={L.h}>
              <defs>
                <GlassClip id={`ds-glass-top-${weather}`} layout={L} />
                <radialGradient id="ds-bead">
                  <stop offset="0" stopColor="#fff" stopOpacity="0.95" />
                  <stop offset="0.45" stopColor="#e8f0ff" stopOpacity="0.5" />
                  <stop offset="1" stopColor="#c8d6ee" stopOpacity="0.15" />
                </radialGradient>
                <radialGradient id="ds-frost" cx="50%" cy="45%" r="70%">
                  <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
                  <stop offset="1" stopColor="#fff" stopOpacity="0.75" />
                </radialGradient>
              </defs>
              <g clipPath={`url(#ds-glass-top-${weather})`}>
                {weather === "snow" ? (
                  // frost creeping in from the edges of the glass
                  <rect x={toScreen(L, { x: GLASS_BOX.x0, y: 0 }).x} y={toScreen(L, { x: 0, y: GLASS_BOX.y0 }).y} width={(GLASS_BOX.x1 - GLASS_BOX.x0) * L.s} height={(GLASS_BOX.y1 - GLASS_BOX.y0) * L.s} fill="url(#ds-frost)" opacity={0.7} />
                ) : (
                  <>
                    {BEADS.slice(0, weather === "rainbow" ? 14 : 30).map((b, i) => {
                      const p = toScreen(L, b);
                      return <circle key={i} cx={p.x} cy={p.y} r={b.r * L.s} fill="url(#ds-bead)" />;
                    })}
                    {weather === "rain" &&
                      DRIPS.map((d, i) => {
                        const p = toScreen(L, d);
                        return (
                          <g key={i} className="ds-drip" style={{ ["--dist" as string]: `${d.dist * L.s}px`, ["--dur" as string]: `${d.dur}s`, ["--delay" as string]: `${d.delay}s` }}>
                            <line x1={p.x} y1={p.y - 26 * L.s} x2={p.x} y2={p.y} stroke="#eaf1ff" strokeOpacity={0.45} strokeWidth={2 * L.s} strokeLinecap="round" />
                            <circle cx={p.x} cy={p.y} r={4 * L.s} fill="url(#ds-bead)" />
                          </g>
                        );
                      })}
                  </>
                )}
              </g>
            </svg>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Moon and stars in the window at night, above the night darkness (only the high arch, never over Selly). */
export function WeatherNight({ weather, tod, layout: L }: SceneProps) {
  const skyOpen = weather === "clear" || weather === "rainbow" || weather === "cloudy";
  return (
    <div className="pointer-events-none absolute inset-0" style={{ zIndex: 4600 }} aria-hidden>
      <AnimatePresence>{tod === "night" && skyOpen && <NightSky key="night" layout={L} few={weather === "cloudy"} />}</AnimatePresence>
    </div>
  );
}

function NightSky({ layout: L, few }: { layout: WorldLayout; few: boolean }) {
  const moon = toScreen(L, { x: 655, y: 125 });
  const r = 20 * L.s;
  return (
    <motion.svg className="absolute inset-0" width={L.w} height={L.h} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={FADE}>
      <defs>
        <GlassClip id="ds-glass-night" layout={L} />
        <mask id="ds-moon">
          <circle cx={moon.x} cy={moon.y} r={r} fill="#fff" />
          <circle cx={moon.x + r * 0.45} cy={moon.y - r * 0.2} r={r * 0.85} fill="#000" />
        </mask>
      </defs>
      <g clipPath="url(#ds-glass-night)">
        <circle cx={moon.x} cy={moon.y} r={r * 2.4} fill="#fff6d8" opacity={0.12} />
        <circle cx={moon.x} cy={moon.y} r={r} fill="#fff4cf" mask="url(#ds-moon)" />
        {STARS.slice(0, few ? 5 : 14).map((s, i) => {
          const p = toScreen(L, s);
          return <circle key={i} className="ds-twinkle" style={{ ["--delay" as string]: `${-s.d}s`, transformOrigin: `${p.x}px ${p.y}px` }} cx={p.x} cy={p.y} r={s.r * Math.max(0.8, L.s)} fill="#fffbe6" />;
        })}
      </g>
    </motion.svg>
  );
}

/** The room's light (below the time-of-day light). Warm inside, whatever is outside. */
const GRADE: Record<Weather, string | null> = {
  clear: "rgba(255,236,200,0.08)",
  cloudy: "rgba(112,122,142,0.16)",
  rain: "rgba(72,92,132,0.2)",
  snow: "rgba(128,146,194,0.13)",
  rainbow: "rgba(255,240,222,0.1)",
};
const SEASON_GRADE: Record<Season, string> = {
  spring: "rgba(255,200,216,0.06)",
  summer: "rgba(150,220,140,0.05)",
  autumn: "rgba(255,170,80,0.09)",
  winter: "rgba(176,196,236,0.07)",
};

export function WeatherGrade({ weather, season, tod, layout: L }: SceneProps) {
  const sunny = (weather === "clear" || weather === "rainbow") && (tod === "day" || tod === "morning");
  const lanterns = weather === "rain" || weather === "snow" || weather === "cloudy";
  return (
    <div className="pointer-events-none absolute inset-0" style={{ zIndex: 4400 }} aria-hidden>
      <div className="absolute inset-0 transition-colors duration-[1400ms]" style={{ background: SEASON_GRADE[season] }} />
      <AnimatePresence>
        <motion.div key={weather} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={FADE}>
          {GRADE[weather] && <div className="absolute inset-0" style={{ background: GRADE[weather]! }} />}
          {/* on grey days the lanterns feel warmer */}
          {lanterns && tod !== "night" && tod !== "evening" && (
            <div className="absolute inset-0" style={{ mixBlendMode: "screen" }}>
              {LANTERNS.map((l, i) => {
                const p = toScreen(L, l);
                const r = l.r * L.s;
                return <div key={i} className="absolute rounded-full" style={{ left: p.x - r, top: p.y - r, width: r * 2, height: r * 2, background: "radial-gradient(closest-side, rgba(255,206,140,0.38), rgba(255,190,110,0.12) 50%, rgba(255,180,100,0))" }} />;
              })}
            </div>
          )}
          {sunny && tod === "day" && (
            // soft sunbeams through the glass (the morning has its own)
            <>
              {[
                { left: "44%", w: 90, delay: 0 },
                { left: "66%", w: 70, delay: -4 },
              ].map((b, i) => (
                <div key={i} className="ds-beam absolute -top-[8%] h-[90%] origin-top rotate-[22deg] bg-gradient-to-b from-[rgba(255,248,226,0.4)] to-transparent blur-md" style={{ left: b.left, width: b.w, ["--delay" as string]: `${b.delay}s` }} />
              ))}
            </>
          )}
          {sunny && <Sparkles layout={L} dew={weather === "rainbow"} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/** petals glinting in the sun / dewdrops on the flowers after rain */
function Sparkles({ layout: L, dew }: { layout: WorldLayout; dew: boolean }) {
  return (
    <>
      {FLOWER_SPOTS.slice(0, dew ? 8 : 5).map((f, i) => {
        const p = toScreen(L, f);
        if (p.x < -10 || p.x > L.w + 10) return null;
        return (
          <span
            key={i}
            className="ds-twinkle absolute rounded-full"
            style={{
              left: p.x,
              top: p.y,
              width: dew ? 5 : 4,
              height: dew ? 5 : 4,
              background: dew ? "#f2fbff" : "#fffbe6",
              boxShadow: dew ? "0 0 8px 3px rgba(200,235,255,0.8)" : "0 0 8px 3px rgba(255,240,190,0.75)",
              ["--delay" as string]: `${-i * 0.7}s`,
            }}
          />
        );
      })}
    </>
  );
}
