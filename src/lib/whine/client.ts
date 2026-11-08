import { IS_TOSS } from "@/lib/platform";
import { fallbackReply } from "./fallback";
import { CRISIS_REPLY, isCrisis } from "./safety";
import { MAX_TURNS, parseReply, type WhineMode, type WhineReply, type WhineTurn } from "./types";

/**
 * Asks Selly for a reply. Order: crisis check on the device → the server
 * (web build, AI allowed) → built-in replies. Never throws.
 * The conversation lives only in the screen's memory; this sends the last few
 * turns to /api/whine and keeps nothing.
 */
export async function askSelly(mode: WhineMode, turns: WhineTurn[], useAI: boolean): Promise<{ reply: WhineReply; ai: boolean }> {
  // the user may send several lines in a row: read them together
  let i = turns.length;
  while (i > 0 && turns[i - 1].role === "user") i--;
  const run = turns.slice(i);
  if (run.some((t) => isCrisis(t.text))) return { reply: CRISIS_REPLY, ai: false };
  const last = run.map((t) => t.text).join(" ");
  const avoid = [...turns].reverse().find((t) => t.role === "selly")?.text;
  const rounds = turns.filter((t) => t.role === "selly").length;
  const local = () => ({ reply: fallbackReply(last, mode, avoid, Math.random, rounds), ai: false });
  if (IS_TOSS || !useAI) return local();

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20_000);
  try {
    const res = await fetch("/api/whine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, turns: turns.slice(-MAX_TURNS) }),
      signal: ctrl.signal,
    });
    if (!res.ok) return local();
    const data: unknown = await res.json();
    const reply = parseReply((data as { reply?: unknown } | null)?.reply);
    return reply ? { reply, ai: true } : local();
  } catch {
    return local();
  } finally {
    clearTimeout(timer);
  }
}

/** The per-device choice about AI replies — only the choice is stored, never words. */
const AI_KEY = "dear-selly:whine-ai";
export type AIChoice = "on" | "off" | null;
export function readAIChoice(): AIChoice {
  try {
    const v = localStorage.getItem(AI_KEY);
    return v === "on" || v === "off" ? v : null;
  } catch {
    return null;
  }
}
export function saveAIChoice(v: "on" | "off") {
  try {
    localStorage.setItem(AI_KEY, v);
  } catch {}
}
