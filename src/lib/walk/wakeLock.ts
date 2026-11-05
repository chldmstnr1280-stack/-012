"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/**
 * Keep the screen on during a walk where the Screen Wake Lock API exists.
 * Without it nothing breaks: the walk timer runs on wall-clock time anyway.
 */
export function useWakeLock() {
  const lock = useRef<WakeLockSentinel | null>(null);
  const wanted = useRef(false);
  const [active, setActive] = useState(false);
  // read on the client only, so server and client markup match
  const supported = useSyncExternalStore(
    () => () => {},
    () => "wakeLock" in navigator,
    () => true,
  );

  const acquire = useCallback(async () => {
    wanted.current = true;
    if (!("wakeLock" in navigator)) return false;
    try {
      lock.current = await navigator.wakeLock.request("screen");
      setActive(true);
      lock.current.addEventListener("release", () => setActive(false));
      return true;
    } catch {
      return false;
    }
  }, []);

  const release = useCallback(() => {
    wanted.current = false;
    lock.current?.release().catch(() => {});
    lock.current = null;
    setActive(false);
  }, []);

  // the lock drops when the page is hidden; take it again when the walker comes back
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible" && wanted.current && (!lock.current || lock.current.released)) acquire();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      lock.current?.release().catch(() => {});
    };
  }, [acquire]);

  return { supported, active, acquire, release };
}
