// 모든 데이터 지우기: every device store, not only the records
const store: Record<string, string> = {};
(globalThis as unknown as { window: unknown }).window = globalThis;
(globalThis as unknown as { localStorage: unknown }).localStorage = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => {
    store[k] = v;
  },
  removeItem: (k: string) => {
    delete store[k];
  },
};
let deletedDb = "";
(globalThis as unknown as { indexedDB: unknown }).indexedDB = {
  deleteDatabase: (name: string) => {
    deletedDb = name;
    const req: Record<string, unknown> = {};
    setTimeout(() => (req.onsuccess as () => void)?.(), 0);
    return req;
  },
};
import { getData, setData } from "../src/lib/data-store";
import { readGame, updateGame } from "../src/lib/game/gameStore";
import { wipeDevice, DEVICE_KEYS } from "../src/lib/wipe";
import { onPersist } from "../src/lib/platform";

let fail = 0;
const ok = (c: boolean, m: string) => {
  if (!c) {
    fail++;
    console.log("FAIL", m);
  }
};

(async () => {
  setData((d) => ({ ...d, entries: { "2026-11-27": { mood: 2, condition: {}, updatedAt: 1 } }, periodDays: ["2026-11-20"], kindLog: [] }));
  updateGame(() => ({ sun: { total: 33, today: { date: "2026-11-27", n: 3 } }, walks: [{ date: "2026-11-27", minutes: 10 }], careShown: ["x"], whineDates: ["2026-11-27"] }));
  for (const k of DEVICE_KEYS) store[k] = "on";
  const mirrored: string[] = [];
  const off = onPersist((k) => mirrored.push(k));

  await wipeDevice();
  off();

  const d = getData();
  ok(Object.keys(d.entries).length === 0 && d.periodDays.length === 0 && d.progress.level === 1, "records wiped");
  const g = readGame();
  ok(!g.sun && !g.walks?.length && g.careShown.length === 0 && !g.whineDates?.length && g.finds.length === 0, "game store wiped " + JSON.stringify(g));
  ok(DEVICE_KEYS.every((k) => !(k in store)), "device settings removed");
  ok(deletedDb === "dear-selly-photos", "walk photos store deleted");
  ok(mirrored.includes("dear-selly:v1") && mirrored.includes("dear-selly:game:v1"), "Toss copy follows (both stores written)");
  console.log(fail ? `${fail} FAILED` : "wipe: all passed");
})();
