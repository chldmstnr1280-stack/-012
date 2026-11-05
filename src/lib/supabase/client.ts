"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase (social features only — wellness records never leave the device).
 * The URL and publishable key are public by design; access is controlled by
 * Row Level Security in supabase/migrations/. Env vars override the defaults.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://cogtaoyufswgyuhmxzqs.supabase.co";
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_ZxGXrnpVpORkmIz-TnfI3A_dJHUSYpL";

let client: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  client ??= createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "pkce", storageKey: "dear-selly:auth" },
  });
  return client;
}
