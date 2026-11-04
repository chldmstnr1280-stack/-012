import { addDays, type DateKey } from "./date";
import type { DailyEntry, Level5 } from "./data-store";
import { mulberry32 } from "@/components/greenhouse/svg-kit";

const clamp5 = (n: number) => Math.max(1, Math.min(5, Math.round(n))) as Level5;

/**
 * About 10 weeks of plausible sample data so the calendar and report can be
 * explored before any real records exist. The latest period started 2 days ago.
 */
export function buildDemoData(today: DateKey) {
  const rnd = mulberry32(731);
  const entries: Record<DateKey, DailyEntry> = {};
  const periodDays: DateKey[] = [];

  const starts: DateKey[] = [addDays(today, -2)];
  for (const len of [29, 27, 30]) starts.unshift(addDays(starts[0], -len));
  starts.forEach((s, i) => {
    const len = i === starts.length - 1 ? 3 : 5 + (i % 2);
    for (let d = 0; d < len; d++) periodDays.push(addDays(s, d));
  });
  const periodSet = new Set(periodDays);

  let mood = 3.4;
  for (let i = 72; i >= 0; i--) {
    const k = addDays(today, -i);
    if (rnd() < 0.18 && i > 0) continue; // some days without a record
    const inPeriod = periodSet.has(k);
    mood = Math.max(1.6, Math.min(4.8, mood + (rnd() - 0.5) * 1.1 + (inPeriod ? -0.25 : 0.05) + (i < 10 ? 0.06 : 0)));
    const sleep = mood + (rnd() - 0.4) + (i < 10 ? 0.4 : 0);
    entries[k] = {
      mood: clamp5(mood),
      condition: {
        energy: clamp5(mood - (inPeriod ? 1 : 0) + (rnd() - 0.5)),
        sleep: clamp5(sleep),
        focus: clamp5(mood + (rnd() - 0.6)),
        stress: clamp5(5.6 - mood + (rnd() - 0.5)),
      },
      steps: Math.round((3800 + rnd() * 6200 + (i < 10 ? 1500 : 0)) / 10) * 10,
      memo: rnd() < 0.25 ? ["햇살이 좋아서 오래 걸었어요", "따뜻한 차 마시고 일찍 잤어요", "조금 지쳤지만 잘 버텼어요", "셀리랑 호흡하기 3번!"][Math.floor(rnd() * 4)] : undefined,
      updatedAt: 0,
    };
  }
  return { entries, periodDays: [...new Set(periodDays)].sort() };
}
