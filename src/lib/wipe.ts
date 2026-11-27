import { resetAll } from "@/lib/data-store";
import { resetGame } from "@/lib/game/gameStore";
import { deleteAllPhotos } from "@/lib/walk/photos";

/**
 * 모든 데이터 지우기 — everything this app keeps on the device: records
 * (dear-selly:v1), the game store (walks, sunlight, letters' dates, care
 * suggestions shown), walk photos, and small device settings. The Toss app's
 * own copy follows through the storage mirror (both stores write empty values).
 * Login (친구 기능) is kept; server copies are handled separately (see the dialog).
 */
export const DEVICE_KEYS = ["dear-selly:whine-ai", "dear-selly:pending-invite", "dear-selly:health-sync", "dear-selly:health-sync-at", "dear-selly:health-sync-dirty"] as const;

export async function wipeDevice(): Promise<void> {
  resetAll();
  resetGame();
  for (const k of DEVICE_KEYS) {
    try {
      localStorage.removeItem(k);
    } catch {
      // ignore
    }
  }
  await deleteAllPhotos();
}
