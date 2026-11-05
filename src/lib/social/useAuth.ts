"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

/** Current Supabase session (null = signed out, undefined = still checking). */
export function useSession(): Session | null | undefined {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  useEffect(() => {
    const sb = supabase();
    let alive = true;
    sb.auth.getSession().then(({ data }) => alive && setSession(data.session));
    const { data } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, []);
  return session;
}

export function signInWithKakao(next = "/friends") {
  return supabase().auth.signInWithOAuth({
    provider: "kakao",
    options: { redirectTo: `${window.location.origin}${next}` },
  });
}

export function signOut() {
  return supabase().auth.signOut();
}
