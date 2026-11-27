// 오늘 몸속에서는: phase boundaries as specified, copy kept verbatim, events
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
import { bodyToday, phaseOfDay, PHASE_COPY, BODY_NOTICE } from "../src/lib/body/phase";
import { logEvent, readEvents, REMOTE_EVENTS } from "../src/lib/analytics/events";
import { addDays } from "../src/lib/date";

let fail = 0;
const ok = (c: boolean, m: string) => {
  if (!c) {
    fail++;
    console.log("FAIL", m);
  }
};

// 1. 28-day cycle: ovulation day 14
const want28: [number, string][] = [[1, "period"], [5, "period"], [6, "follicular"], [12, "follicular"], [13, "ovulation"], [14, "ovulation"], [15, "ovulation"], [16, "luteal"], [23, "luteal"], [24, "pms"], [28, "pms"], [31, "pms"]];
for (const [d, p] of want28) ok(phaseOfDay(d, 28) === p, `28-day cycle day ${d} → ${p} (got ${phaseOfDay(d, 28)})`);
// 32-day cycle: ovulation day 18; PMS from day 28 (5 days before day 33)
ok(phaseOfDay(16, 32) === "follicular" && phaseOfDay(17, 32) === "ovulation" && phaseOfDay(20, 32) === "luteal" && phaseOfDay(27, 32) === "luteal" && phaseOfDay(28, 32) === "pms", "32-day cycle");
// short 22-day cycle: ovulation day 8, no follicular days left after day 6
ok(phaseOfDay(6, 22) === "follicular" && phaseOfDay(7, 22) === "ovulation" && phaseOfDay(10, 22) === "luteal" && phaseOfDay(18, 22) === "pms", "22-day cycle");

// 2. from records
ok(bodyToday([], "2026-11-27") === null, "no periods → null (hint shown)");
const starts = ["2026-08-04", "2026-09-01", "2026-09-29", "2026-10-27"];
const days = starts.flatMap((s) => [0, 1, 2, 3, 4].map((i) => addDays(s, i)));
const b = bodyToday(days, "2026-11-09");
ok(!!b && b.day === 14 && b.cycleLength === 28 && b.phase === "ovulation" && !b.defaultLength, "day 14 of a 28-day cycle " + JSON.stringify(b));
const one = bodyToday(["2026-11-20", "2026-11-21"], "2026-11-27");
ok(!!one && one.day === 8 && one.cycleLength === 28 && one.defaultLength && one.phase === "follicular", "one period → 28-day default " + JSON.stringify(one));
const late = bodyToday(days, "2026-11-26");
ok(!!late && late.late && late.phase === "pms", "past the expected start → late, PMS scene");

// 3. copy kept as given
ok(PHASE_COPY.period.headline === "지난 주기의 내막을 내보내며 새로 시작하고 있어요" && PHASE_COPY.pms.name === "PMS 구간" && PHASE_COPY.luteal.temp === "0.3℃ 안팎 높은 구간이에요", "copy verbatim");
ok(BODY_NOTICE.startsWith("기록한 생리일로 추정한 일반적인 흐름이에요.") && BODY_NOTICE.includes("피임이나 임신 계획에 사용할 수 없어요"), "notice verbatim");
ok(Object.values(PHASE_COPY).every((c, i) => c.img === `/body/phase-${i + 1}.png`), "pictures 1–5 in order");

// 4. events: on the device with the date; health-revealing ones never leave it
logEvent("body_card_view", { oncePerDay: true });
logEvent("body_card_view", { oncePerDay: true });
logEvent("body_card_tap");
logEvent("body_card_tap");
const ev = readEvents();
ok(ev.filter((e) => e.name === "body_card_view").length === 1 && ev.filter((e) => e.name === "body_card_tap").length === 2, "view once a day, taps each time");
ok(ev.every((e) => /^\d{4}-\d{2}-\d{2}$/.test(e.date)), "events carry the date");
ok(!REMOTE_EVENTS.body_sheet_after_period_log && !REMOTE_EVENTS.body_link_from_mood && REMOTE_EVENTS.body_card_view, "period/mood events stay on the device");

console.log(fail ? `${fail} FAILED` : "body phase: all passed");
