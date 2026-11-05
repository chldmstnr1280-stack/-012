"use client";

import { useEffect } from "react";
import { useSession } from "@/lib/social/useAuth";
import { consentState, startSync, stopSync, syncWanted } from "@/lib/health/sync";

/** Resumes the optional health-record sync for a signed-in user who consented. */
export function HealthSync() {
  const session = useSession();
  const uid = session?.user.id;
  useEffect(() => {
    if (!uid || !syncWanted()) return;
    let alive = true;
    consentState(uid).then((s) => {
      if (alive && s === "yes") startSync(uid);
    });
    return () => {
      alive = false;
      stopSync();
    };
  }, [uid]);
  return null;
}
