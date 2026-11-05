/**
 * Build target. `NEXT_PUBLIC_PLATFORM=toss` builds the Apps in Toss mini-app
 * (static export, Toss SDK, no Kakao login / server sync / share links / PWA).
 * Inlined at build time, so the unused branch is dropped from each bundle.
 */
export const IS_TOSS = process.env.NEXT_PUBLIC_PLATFORM === "toss";

/** Keys mirrored to the Toss app's own storage (the WebView's localStorage may not survive). */
export const PERSISTED_KEYS = ["dear-selly:v1", "dear-selly:game:v1"] as const;

type PersistHook = (key: string, value: string) => void;
const hooks = new Set<PersistHook>();
/** Stores call this after writing localStorage; the Toss bridge mirrors the value. */
export function afterPersist(key: string, value: string) {
  hooks.forEach((h) => h(key, value));
}
export function onPersist(h: PersistHook) {
  hooks.add(h);
  return () => hooks.delete(h);
}

/** Open a link outside the app: Toss → the device browser/dialer; web → new tab. */
export async function openExternal(url: string) {
  if (IS_TOSS) {
    try {
      const { Device } = await import("@apps-in-toss/web-framework");
      await Device.openURL(url);
      return;
    } catch {
      // not inside the Toss app (sandbox/browser): fall through
    }
  }
  if (url.startsWith("tel:")) window.location.href = url;
  else window.open(url, "_blank", "noopener,noreferrer");
}
