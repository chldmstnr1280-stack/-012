import { DECO_SLOTS, itemById } from "@/data/gardenItems";
import { EMOTIONS, type Emotion } from "@/data/moodFlowers";
import { SHARE_MESSAGES } from "@/data/shareMessages";
import type { TimeOfDay } from "@/lib/game/behaviorEngine";

/**
 * What a shared greenhouse contains. Deliberately small: Selly's growth, the
 * decorations and — only if the user opts in — the mood-garden flowers.
 * Never steps, moods, cycle data or memos.
 */
export interface GreenhouseSnapshot {
  level: number;
  deco: Record<string, string>;
  flowers: { e: Emotion; s: number }[];
  tod: TimeOfDay;
  msg: number;
}

const TODS: TimeOfDay[] = ["morning", "day", "evening", "night"];

function b64urlEncode(s: string) {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlDecode(s: string) {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

export function encodeSnapshot(s: GreenhouseSnapshot): string {
  // compact keys keep links short
  return b64urlEncode(JSON.stringify({ v: 1, l: s.level, d: s.deco, f: s.flowers.map((f) => `${f.e[0]}${f.e[1]}${f.s}`), t: TODS.indexOf(s.tod), m: s.msg }));
}

const EMO_BY_PREFIX = Object.fromEntries(EMOTIONS.map((e) => [e.slice(0, 2), e])) as Record<string, Emotion>;

/** Parse an untrusted link: every field is checked; anything unexpected is dropped. */
export function decodeSnapshot(raw: string): GreenhouseSnapshot | null {
  if (!raw || raw.length > 2000) return null;
  let o: Record<string, unknown>;
  try {
    o = JSON.parse(b64urlDecode(raw));
  } catch {
    return null;
  }
  if (!o || typeof o !== "object" || o.v !== 1) return null;
  const level = Number.isInteger(o.l) && (o.l as number) >= 1 && (o.l as number) <= 999 ? (o.l as number) : 1;
  const deco: Record<string, string> = {};
  if (o.d && typeof o.d === "object") {
    for (const slot of DECO_SLOTS) {
      const id = (o.d as Record<string, unknown>)[slot.id];
      if (typeof id === "string" && itemById(id)) deco[slot.id] = id;
    }
  }
  const flowers: GreenhouseSnapshot["flowers"] = [];
  if (Array.isArray(o.f)) {
    for (const f of o.f.slice(0, 7)) {
      if (typeof f !== "string" || f.length !== 3) continue;
      const e = EMO_BY_PREFIX[f.slice(0, 2)];
      const st = Number(f[2]);
      if (e && Number.isInteger(st) && st >= 0 && st <= 3) flowers.push({ e, s: st });
    }
  }
  const tod = TODS[Number.isInteger(o.t) ? (o.t as number) : 1] ?? "day";
  const msg = Number.isInteger(o.m) && (o.m as number) >= 0 && (o.m as number) < SHARE_MESSAGES.length ? (o.m as number) : 0;
  return { level, deco, flowers, tod, msg };
}
