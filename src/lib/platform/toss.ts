"use client";

import { onPersist, PERSISTED_KEYS } from "./index";

/**
 * Toss storage bridge. On start, copy the Toss app's stored copy into
 * localStorage (the stores read localStorage synchronously); afterwards mirror
 * every write back, debounced. Outside the Toss app (no bridge) it does nothing.
 * Nothing here logs record contents.
 */
export async function hydrateFromToss(): Promise<void> {
  try {
    const { Storage } = await import("@apps-in-toss/web-framework");
    for (const key of PERSISTED_KEYS) {
      const native = await Storage.getItem(key);
      if (native != null) localStorage.setItem(key, native);
      else {
        // first run inside Toss after a web session in the same WebView: keep what's there
        const local = localStorage.getItem(key);
        if (local != null) await Storage.setItem(key, local);
      }
    }
  } catch {
    // no Toss bridge: localStorage only
  }
}

export function startTossMirror() {
  const pending = new Map<string, string>();
  let timer: ReturnType<typeof setTimeout> | null = null;
  const flush = async () => {
    timer = null;
    const items = [...pending.entries()];
    pending.clear();
    try {
      const { Storage } = await import("@apps-in-toss/web-framework");
      for (const [k, v] of items) await Storage.setItem(k, v);
    } catch {
      // no bridge, or a transient failure: the next write tries again
    }
  };
  const off = onPersist((k, v) => {
    pending.set(k, v);
    if (!timer) timer = setTimeout(flush, 400);
  });
  // don't lose the last change when the mini-app is backgrounded
  const onHide = () => {
    if (document.visibilityState === "hidden" && pending.size) {
      if (timer) clearTimeout(timer);
      void flush();
    }
  };
  document.addEventListener("visibilitychange", onHide);
  return () => {
    off();
    document.removeEventListener("visibilitychange", onHide);
  };
}
