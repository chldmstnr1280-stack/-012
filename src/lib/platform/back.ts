"use client";

import { useEffect, useRef } from "react";
import { IS_TOSS } from "./index";

/**
 * Toss build: the Toss navigation bar has the only back button (the app shows
 * none of its own there). While something inside a screen is open — a breathing
 * session, a check-in step, a sheet — the system back should close that first,
 * so we listen to the Toss back event only while it is open. When nothing is
 * open, nothing is subscribed and Toss's own back behaviour applies.
 * Web build: does nothing (the in-app buttons stay).
 */
export function useTossBack(active: boolean, onBack: () => void) {
  const handler = useRef(onBack);
  useEffect(() => {
    handler.current = onBack;
  });
  useEffect(() => {
    if (!IS_TOSS || !active) return;
    let off: (() => void) | undefined;
    let alive = true;
    import("@apps-in-toss/web-framework")
      .then(({ graniteEvent }) => {
        if (!alive) return;
        off = graniteEvent.addEventListener("backEvent", { onEvent: () => handler.current(), onError: () => {} });
      })
      .catch(() => {});
    return () => {
      alive = false;
      off?.();
    };
  }, [active]);
}
