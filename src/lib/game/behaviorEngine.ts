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
  | "breathing";

export type TimeOfDay = "morning" | "day" | "evening" | "night";

export function timeOfDay(d = new Date()): TimeOfDay {
  const h = d.getHours();
  if (h >= 5 && h < 11) return "morning";
  if (h >= 11 && h < 17) return "day";
  if (h >= 17 && h < 21) return "evening";
  return "night";
}

/** An autonomous activity: optionally walk somewhere, then hold a state for a while. */
export type ActivityKind = "stroll" | "sunbathe" | "visit_flowers" | "tend_plants" | "visit_lantern" | "sit" | "nap" | "look_at_user";

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
};

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
export function chooseActivity(history: ActivityKind[], tod: TimeOfDay, opts: { canMove: boolean }): Activity {
  const w = { ...WEIGHTS[tod] };
  if (!opts.canMove) {
    // reduced motion: stay on the rug
    for (const k of Object.keys(w) as ActivityKind[]) if (!["sit", "nap", "look_at_user"].includes(k)) delete w[k];
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
