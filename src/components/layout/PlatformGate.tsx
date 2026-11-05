"use client";

import { useEffect, useState } from "react";
import { IS_TOSS } from "@/lib/platform";

/**
 * Toss build: render the app only after the stored records are restored from
 * the Toss app's storage, then keep mirroring writes. Web build: pass-through.
 */
export function PlatformGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(!IS_TOSS);
  useEffect(() => {
    if (!IS_TOSS) return;
    let stop: (() => void) | undefined;
    let alive = true;
    import("@/lib/platform/toss").then(async (t) => {
      await t.hydrateFromToss();
      if (!alive) return;
      stop = t.startTossMirror();
      setReady(true);
    });
    return () => {
      alive = false;
      stop?.();
    };
  }, []);
  return ready ? <>{children}</> : <div className="h-full bg-cream-50" aria-busy="true" />;
}
