import type { SpotId } from "@/data/greenhouseWorld";

/** Selly's main states — exactly one is active at a time. */
export type SellyState =
  | "idle"
  | "walking"
  | "looking_at_flower"
  | "watering"
  | "sunbathing"
  | "sitting"
  | "sleeping"
  | "greeting"
  | "interacting"
  | "breathing"
  /** by the window, watching the weather */
  | "watching"
  /** on the cushion under a blanket */
  | "cozy"
  /** delighted (the rainbow!) */
  | "cheering";

export type TimeOfDay = "morning" | "day" | "evening" | "night";

export function timeOfDay(d = new Date()): TimeOfDay {
  const h = d.getHours();
  if (h >= 5 && h < 11) return "morning";
  if (h >= 11 && h < 17) return "day";
  if (h >= 17 && h < 21) return "evening";
  return "night";
}

/** An autonomous activity: optionally walk somewhere, then hold a state for a while. */
export type ActivityKind =
  | "stroll"
  | "sunbathe"
  | "visit_flowers"
  | "tend_plants"
  | "visit_lantern"
  | "sit"
  | "nap"
  | "look_at_user"
  | "watch_window"
  | "blanket"
  | "rainbow_joy";

/** the weather outside (see src/lib/garden/weather.ts) */
export type WeatherKind = "clear" | "cloudy" | "rain" | "snow" | "rainbow";

export interface Activity {
  kind: ActivityKind;
  /** spot to walk to first; "random" = a random floor point; undefined = stay */
  goTo?: SpotId | "random";
  state: SellyState;
  durationMs: number;
  /** key into AMBIENT lines */
  lineKey?: string;
}

const between = (a: number, b: number) => a + Math.random() * (b - a);

const MAKE: Record<ActivityKind, () => Activity> = {
  stroll: () => ({ kind: "stroll", goTo: "random", state: "idle", durationMs: between(2200, 4200) }),
  sunbathe: () => ({ kind: "sunbathe", goTo: "window", state: "sunbathing", durationMs: between(9000, 14000), lineKey: "sunbathing" }),
  visit_flowers: () => ({ kind: "visit_flowers", goTo: "flowers", state: "looking_at_flower", durationMs: between(6000, 9000), lineKey: "looking_at_flower" }),
  tend_plants: () => ({ kind: "tend_plants", goTo: "plants", state: "watering", durationMs: between(6000, 8000), lineKey: "watering" }),
  visit_lantern: () => ({ kind: "visit_lantern", goTo: "lantern", state: "looking_at_flower", durationMs: between(5000, 7000), lineKey: "lantern" }),
  sit: () => ({ kind: "sit", goTo: "rug", state: "sitting", durationMs: between(10000, 16000), lineKey: "sitting" }),
  nap: () => ({ kind: "nap", goTo: "rug", state: "sleeping", durationMs: between(18000, 30000) }),
  look_at_user: () => ({ kind: "look_at_user", state: "idle", durationMs: between(4000, 7000), lineKey: "looking_at_user" }),
  watch_window: () => ({ kind: "watch_window", goTo: "window", state: "watching", durationMs: between(10000, 16000), lineKey: "watching" }),
  blanket: () => ({ kind: "blanket", goTo: "rug", state: "cozy", durationMs: between(14000, 22000), lineKey: "cozy" }),
  rainbow_joy: () => ({ kind: "rainbow_joy", goTo: "window", state: "cheering", durationMs: between(5000, 8000), lineKey: "rainbow" }),
};

/** How the weather shifts what Selly feels like doing (multiplies the time-of-day weights). */
const WEATHER_WEIGHTS: Record<WeatherKind, Partial<Record<ActivityKind, number>>> = {
  clear: { sunbathe: 1.6, stroll: 1.2, visit_flowers: 1.2, watch_window: 0.4, blanket: 0 },
  cloudy: { watch_window: 3, sit: 1.6, blanket: 1.5, sunbathe: 0.2, nap: 1.2 },
  rain: { watch_window: 4, blanket: 2.5, sit: 1.5, sunbathe: 0, stroll: 0.5, tend_plants: 0.5 },
  snow: { watch_window: 4, blanket: 3.5, sit: 1.2, sunbathe: 0, stroll: 0.4, tend_plants: 0.4 },
  rainbow: { rainbow_joy: 4, stroll: 2, visit_flowers: 1.5, watch_window: 1.5, blanket: 0 },
};
/** new activities' base weights (they only appear when the weather calls for them) */
const BASE_EXTRA: Partial<Record<ActivityKind, number>> = { watch_window: 1, blanket: 1, rainbow_joy: 1 };

/** How likely each activity is, by time of day. */
const WEIGHTS: Record<TimeOfDay, Partial<Record<ActivityKind, number>>> = {
  morning: { sunbathe: 4, stroll: 2, visit_flowers: 2, tend_plants: 2, look_at_user: 2, sit: 1, visit_lantern: 0.5 },
  day: { stroll: 3, visit_flowers: 3, tend_plants: 2, sunbathe: 1, look_at_user: 2, sit: 1, visit_lantern: 0.5, nap: 0.3 },
  evening: { sit: 3, look_at_user: 2, visit_lantern: 2, visit_flowers: 1, stroll: 1, tend_plants: 0.5, nap: 1 },
  night: { nap: 5, sit: 2, look_at_user: 1, visit_lantern: 0.7, stroll: 0.3 },
};

/**
 * Pick the next activity: weighted by time of day, never the same as the last
 * one and rarely the one before it, so behaviour never feels repetitive.
 */
export function chooseActivity(history: ActivityKind[], tod: TimeOfDay, opts: { canMove: boolean }, weather: WeatherKind = "clear"): Activity {
  const w: Partial<Record<ActivityKind, number>> = { ...BASE_EXTRA, ...WEIGHTS[tod] };
  for (const [k, m] of Object.entries(WEATHER_WEIGHTS[weather]) as [ActivityKind, number][]) w[k] = (w[k] ?? 0) * m;
  // only when there is a rainbow, and only in daylight
  if (weather !== "rainbow" || tod === "night") w.rainbow_joy = 0;
  if (!opts.canMove) {
    // reduced motion: stay on the rug
    for (const k of Object.keys(w) as ActivityKind[]) if (!["sit", "nap", "look_at_user", "blanket"].includes(k)) delete w[k];
  }
  const last = history[history.length - 1];
  const prev = history[history.length - 2];
  if (last) delete w[last];
  if (prev && w[prev]) w[prev] = w[prev]! * 0.35;
  const entries = Object.entries(w).filter(([, v]) => (v ?? 0) > 0) as [ActivityKind, number][];
  const total = entries.reduce((a, [, v]) => a + v, 0);
  let r = Math.random() * total;
  for (const [k, v] of entries) {
    r -= v;
    if (r <= 0) return MAKE[k]();
  }
  return MAKE.look_at_user();
}
