"use client";

import { supabase } from "@/lib/supabase/client";
import { applyData, getData, onHealthChange, type SymptomDay } from "@/lib/data-store";
import { cleanSymptomDay } from "@/lib/backup";
import type { DateKey } from "@/lib/date";

/**
 * Optional server copy of health records (period days + PMS symptom days).
 * Runs ONLY for a signed-in user who gave separate consent (health_consents).
 * The device stays the source of truth: failures never touch local records,
 * and a "dirty" flag makes the next start re-upload everything.
 * Nothing here logs health data.
 */
export const CONSENT_VERSION = "2026-11-05";
const FLAG = "dear-selly:health-sync";
const DIRTY = "dear-selly:health-sync-dirty";

const ls = {
  get: (k: string) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k: string, v: string | null) => {
    try {
      if (v == null) localStorage.removeItem(k);
      else localStorage.setItem(k, v);
    } catch {
      // ignore
    }
  },
};

export const syncWanted = () => ls.get(FLAG) === "on";
export const lastSynced = () => ls.get(`${FLAG}-at`);

export type ConsentState = "yes" | "no" | "unavailable";

/** Does the server hold this user's consent? "unavailable" = tables not set up / offline. */
export async function consentState(uid: string): Promise<ConsentState> {
  const { data, error } = await supabase().from("health_consents").select("version").eq("user_id", uid).maybeSingle();
  if (error) return "unavailable";
  return data ? "yes" : "no";
}

const row = (uid: string, day: DateKey, d: SymptomDay) => ({
  user_id: uid,
  day,
  scores: d.scores,
  impact: d.impact,
  none: !!d.none,
  updated_at: new Date(d.updatedAt || Date.now()).toISOString(),
});

async function uploadAll(uid: string) {
  const { symptoms, periodDays } = getData();
  const sb = supabase();
  const s = Object.entries(symptoms).map(([k, d]) => row(uid, k, d));
  for (let i = 0; i < s.length; i += 200) {
    const { error } = await sb.from("pms_symptom_days").upsert(s.slice(i, i + 200));
    if (error) throw error;
  }
  const p = periodDays.map((day) => ({ user_id: uid, day }));
  for (let i = 0; i < p.length; i += 500) {
    const { error } = await sb.from("period_days").upsert(p.slice(i, i + 500), { ignoreDuplicates: true });
    if (error) throw error;
  }
}

/** Merge server records into the device: newer symptom day wins; period days are united. */
async function pullMerge(uid: string) {
  const sb = supabase();
  const [{ data: srows, error: e1 }, { data: prows, error: e2 }] = await Promise.all([
    sb.from("pms_symptom_days").select("day, scores, impact, none, updated_at").eq("user_id", uid),
    sb.from("period_days").select("day").eq("user_id", uid),
  ]);
  if (e1 || e2) throw e1 ?? e2;
  const cur = getData();
  const symptoms = { ...cur.symptoms };
  let changed = false;
  for (const r of srows ?? []) {
    const remote = cleanSymptomDay({ scores: r.scores, impact: r.impact, none: r.none || undefined, updatedAt: Date.parse(r.updated_at) });
    if (!remote) continue;
    const local = symptoms[r.day];
    if (!local || remote.updatedAt > local.updatedAt) {
      symptoms[r.day] = remote;
      changed = true;
    }
  }
  const period = new Set(cur.periodDays);
  for (const r of prows ?? []) if (!period.has(r.day)) {
    period.add(r.day);
    changed = true;
  }
  if (changed) applyData({ ...cur, symptoms, periodDays: [...period].sort() });
}

let stop: (() => void) | null = null;

/** Start following local changes (and merge once). Safe to call repeatedly. */
export async function startSync(uid: string) {
  if (stop) return;
  stop = onHealthChange(async (c) => {
    try {
      const sb = supabase();
      if (c.kind === "symptoms") {
        const r = c.day ? await sb.from("pms_symptom_days").upsert(row(uid, c.date, c.day)) : await sb.from("pms_symptom_days").delete().eq("user_id", uid).eq("day", c.date);
        if (r.error) throw r.error;
      } else if (c.on) {
        const r = await sb.from("period_days").upsert(c.days.map((day) => ({ user_id: uid, day })), { ignoreDuplicates: true });
        if (r.error) throw r.error;
      } else {
        const r = await sb.from("period_days").delete().eq("user_id", uid).in("day", c.days);
        if (r.error) throw r.error;
      }
      ls.set(`${FLAG}-at`, new Date().toISOString());
    } catch {
      ls.set(DIRTY, "1");
    }
  });
  try {
    await pullMerge(uid);
    await uploadAll(uid);
    ls.set(DIRTY, null);
    ls.set(`${FLAG}-at`, new Date().toISOString());
  } catch {
    ls.set(DIRTY, "1");
  }
}

export function stopSync() {
  stop?.();
  stop = null;
}

/** Explicit, separate consent → server copy starts. */
export async function giveConsent(uid: string): Promise<boolean> {
  const { error } = await supabase().from("health_consents").upsert({ user_id: uid, version: CONSENT_VERSION });
  if (error) return false;
  ls.set(FLAG, "on");
  await startSync(uid);
  return true;
}

/** Withdraw consent: every server-side health record is deleted; the device keeps its copy. */
export async function withdrawConsent(): Promise<boolean> {
  stopSync();
  ls.set(FLAG, null);
  ls.set(`${FLAG}-at`, null);
  const { error } = await supabase().rpc("withdraw_health_consent");
  return !error;
}
