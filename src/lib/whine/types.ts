/**
 * 셀리에게 징징대기 — shared types and the reply schema.
 * Replies from the server (or the local fallback) are validated with
 * `parseReply` before anything is rendered.
 */
export type WhineMode = "together" | "listen";

export const ANIMATIONS = ["IDLE", "LISTENING", "WHINING", "ANGRY_CUTE", "LYING_DOWN", "COMFORTING", "HAPPY", "SLEEPY"] as const;
export type WhineAnimation = (typeof ANIMATIONS)[number];

export const EMOTIONS = ["whining", "listening", "comforting", "happy", "sleepy", "angry_cute"] as const;
export type WhineEmotion = (typeof EMOTIONS)[number];

/** "help" = show the 109/119 card; the others link to an existing feature */
export const ACTIONS = ["breathe", "walk", "rest", "help"] as const;
export type WhineAction = (typeof ACTIONS)[number];

export interface WhineReply {
  message: string;
  emotion: WhineEmotion;
  animation: WhineAnimation;
  suggestedAction: WhineAction | null;
}

export interface WhineTurn {
  role: "user" | "selly";
  text: string;
}

export const MAX_INPUT = 300;
export const MAX_TURNS = 8;
export const MAX_REPLY = 240;

/** JSON schema for structured output (kept in sync with `parseReply`). */
export const REPLY_SCHEMA = {
  type: "object",
  properties: {
    message: { type: "string" },
    emotion: { type: "string", enum: [...EMOTIONS] },
    animation: { type: "string", enum: [...ANIMATIONS] },
    suggestedAction: { anyOf: [{ type: "string", enum: [...ACTIONS] }, { type: "null" }] },
  },
  required: ["message", "emotion", "animation", "suggestedAction"],
  additionalProperties: false,
} as const;

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/** Validates an untrusted reply; null if anything is off. */
export function parseReply(v: unknown): WhineReply | null {
  if (!isObj(v)) return null;
  const message = typeof v.message === "string" ? v.message.trim() : "";
  if (!message || message.length > MAX_REPLY * 2) return null;
  if (!EMOTIONS.includes(v.emotion as WhineEmotion)) return null;
  if (!ANIMATIONS.includes(v.animation as WhineAnimation)) return null;
  const a = v.suggestedAction;
  if (a !== null && a !== undefined && !ACTIONS.includes(a as WhineAction)) return null;
  return { message: message.slice(0, MAX_REPLY), emotion: v.emotion as WhineEmotion, animation: v.animation as WhineAnimation, suggestedAction: (a ?? null) as WhineAction | null };
}

/** Validates an untrusted request body for the API route. */
export function parseRequest(v: unknown): { mode: WhineMode; turns: WhineTurn[] } | null {
  if (!isObj(v) || (v.mode !== "together" && v.mode !== "listen") || !Array.isArray(v.turns)) return null;
  const turns: WhineTurn[] = [];
  for (const t of v.turns.slice(-MAX_TURNS)) {
    if (!isObj(t) || (t.role !== "user" && t.role !== "selly") || typeof t.text !== "string") return null;
    const text = t.text.trim().slice(0, MAX_INPUT);
    if (text) turns.push({ role: t.role, text });
  }
  if (!turns.length || turns[turns.length - 1].role !== "user") return null;
  return { mode: v.mode, turns };
}

export const SAFE_DEFAULT: WhineReply = { message: "응응, 듣고 있어. 계속 말해도 돼.", emotion: "listening", animation: "LISTENING", suggestedAction: null };
