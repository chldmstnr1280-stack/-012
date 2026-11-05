"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { addDays, diffDays, formatMonthDay, formatShort, type DateKey } from "@/lib/date";
import { useSelly } from "@/lib/selly-store";
import type { CycleInfo } from "@/lib/cycle";
import { setPeriodDays, type DailyEntry } from "@/lib/data-store";
import { MoodFace, MOODS } from "@/components/ui/MoodFace";
import { CYCLE_COLORS as C } from "./colors";

export function DaySheet({
  date,
  today,
  info,
  periodDays,
  entry,
  onClose,
}: {
  date: DateKey | null;
  today: DateKey;
  info: CycleInfo;
  periodDays: Set<DateKey>;
  entry?: DailyEntry;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {date && (
        <motion.div className="absolute inset-0 z-50 flex items-end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button type="button" aria-label="닫기" onClick={onClose} className="absolute inset-0 bg-[rgba(60,48,36,0.28)]" />
          <motion.div
            role="dialog"
            aria-label={formatShort(date)}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="relative w-full rounded-t-[30px] bg-cream-50 px-5 pb-[calc(env(safe-area-inset-bottom)+22px)] pt-3 shadow-[0_-12px_40px_-16px_rgba(80,60,40,0.5)]"
          >
            <span className="mx-auto mb-3 block h-1.5 w-10 rounded-full bg-[#e3dacb]" />
            <Body date={date} today={today} info={info} periodDays={periodDays} entry={entry} onClose={onClose} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Body({ date, today, info, periodDays, entry, onClose }: { date: DateKey; today: DateKey; info: CycleInfo; periodDays: Set<DateKey>; entry?: DailyEntry; onClose: () => void }) {
  const isPeriod = periodDays.has(date);
  const future = date > today;
  const { showToast } = useSelly();
  const tags = [
    isPeriod && { label: "생리일", color: C.period },
    info.predictedPeriodDays.has(date) && { label: "생리 예정일 · 예측", color: C.period },
    info.ovulationDays.has(date) && { label: "배란 예정일 · 예측", color: C.ovulation },
    !info.ovulationDays.has(date) && info.fertileDays.has(date) && { label: "가임기 · 예측", color: C.fertile },
  ].filter(Boolean) as { label: string; color: string }[];

  // range marking: a logged period day within 10 days before → this day can close the range
  let prev: DateKey | null = null;
  for (let n = 1; n <= 10; n++) {
    const k = addDays(date, -n);
    if (periodDays.has(k)) {
      prev = k;
      break;
    }
  }
  let runStart = prev;
  while (runStart && periodDays.has(addDays(runStart, -1))) runStart = addDays(runStart, -1);
  const gap = prev ? diffDays(prev, date) : 0;
  const fillTo = (from: DateKey, to: DateKey) => {
    const out: DateKey[] = [];
    for (let k = from; k <= to; k = addDays(k, 1)) out.push(k);
    return out;
  };
  // days marked right after this one (to end the period here)
  const after: DateKey[] = [];
  for (let k = addDays(date, 1); periodDays.has(k); k = addDays(k, 1)) after.push(k);
  // "end here" only when the whole period would stay within 10 days; otherwise it's more likely a new start
  const offerEnd = !isPeriod && !!prev && !!runStart && gap >= 2 && diffDays(runStart, date) <= 9;
  const offerStart = !isPeriod && !offerEnd && gap !== 1;
  const avgFill = Array.from({ length: info.avgPeriod }, (_, i) => addDays(date, i)).filter((k) => k <= today);

  return (
    <div>
      <div className="mb-3 flex items-start justify-between">
        <div>
          <p className="text-[18px] font-bold text-ink-700">{formatShort(date)}</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {tags.length ? (
              tags.map((t) => (
                <span key={t.label} className="flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[12px] text-ink-700 shadow-sm">
                  <span className="h-2 w-2 rounded-full" style={{ background: t.color }} />
                  {t.label}
                </span>
              ))
            ) : (
              <span className="text-[12.5px] text-ink-300">표시된 일정이 없어요</span>
            )}
          </div>
        </div>
        <button type="button" onClick={onClose} aria-label="닫기" className="grid h-9 w-9 place-items-center rounded-full bg-white text-ink-500 shadow-sm">
          <X size={18} />
        </button>
      </div>

      {future ? (
        <p className="rounded-2xl bg-white/70 px-4 py-3 text-[13px] text-ink-500">아직 오지 않은 날이에요. 생리일은 지난 날짜와 오늘만 표시할 수 있어요.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {offerEnd && prev && runStart && (
            <button
              type="button"
              onClick={() => {
                setPeriodDays(fillTo(addDays(prev!, 1), date), true);
                showToast(`${formatMonthDay(runStart!)}~${formatMonthDay(date)} 생리 기간으로 표시했어요`);
              }}
              className="flex flex-col items-center justify-center rounded-2xl bg-[#e3707e] px-4 py-3 text-white shadow-[0_8px_18px_-10px_rgba(200,90,100,0.8)]"
            >
              <span className="text-[15px] font-bold">생리 끝난 날로 표시</span>
              <span className="text-[12px] opacity-90">
                {formatMonthDay(runStart)} ~ {formatMonthDay(date)} · 사이 {gap - 1}일 자동으로 채워요
              </span>
            </button>
          )}
          {offerStart && (
            <button
              type="button"
              onClick={() => {
                setPeriodDays([date], true);
                showToast("시작일을 표시했어요. 끝난 날을 누르면 그 사이가 채워져요");
              }}
              className="flex flex-col items-center justify-center rounded-2xl bg-[#e3707e] px-4 py-3 text-white shadow-[0_8px_18px_-10px_rgba(200,90,100,0.8)]"
            >
              <span className="text-[15px] font-bold">생리 시작일로 표시</span>
              <span className="text-[12px] opacity-90">끝난 날을 누르면 그 사이가 자동으로 채워져요</span>
            </button>
          )}
          {isPeriod && after.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setPeriodDays(after, false);
                showToast(`${formatMonthDay(date)}에 끝난 것으로 고쳤어요`);
              }}
              className="h-12 rounded-2xl border border-[#f2c3c9] bg-[#fdf1f2] text-[13.5px] font-bold text-[#b4505e]"
            >
              이날 생리가 끝났어요 · 뒤 {after.length}일 지우기
            </button>
          )}
          <button
            type="button"
            role="switch"
            aria-checked={isPeriod}
            onClick={() => setPeriodDays([date], !isPeriod)}
            className="flex h-12 items-center justify-between rounded-2xl bg-white px-4 shadow-[0_4px_12px_-8px_rgba(110,88,60,0.4)]"
          >
            <span className="text-[14px] text-ink-700">이날만 생리 중으로 표시</span>
            <span className={`relative h-7 w-12 rounded-full transition-colors ${isPeriod ? "bg-[#e3707e]" : "bg-[#e5ded2]"}`}>
              <motion.span layout className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow ${isPeriod ? "right-1" : "left-1"}`} />
            </span>
          </button>
          {offerStart && avgFill.length > 1 && (
            <button type="button" onClick={() => setPeriodDays(avgFill, true)} className="h-10 text-[12.5px] text-[#b4505e] underline underline-offset-4">
              평균 {avgFill.length}일로 한 번에 표시하기
            </button>
          )}
        </div>
      )}

      <div className="mt-4 rounded-2xl bg-white/70 p-4">
        {entry ? (
          <div className="flex items-center gap-3">
            {entry.mood ? <MoodFace value={entry.mood} active size={44} /> : <span className="h-11 w-11 rounded-full bg-[#efebf0]" />}
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-bold text-ink-700">{entry.mood ? MOODS[entry.mood - 1].label : "기분 기록 없음"}</p>
              <p className="truncate text-[12.5px] text-ink-500">
                {entry.steps != null ? `${entry.steps.toLocaleString("ko-KR")}걸음` : ""}
                {entry.steps != null && entry.memo ? " · " : ""}
                {entry.memo ?? ""}
              </p>
            </div>
            <Link href={`/record?date=${date}`} className="shrink-0 rounded-full bg-sage-50 px-3 py-2 text-[12.5px] font-bold text-sage-700">
              수정
            </Link>
          </div>
        ) : future ? (
          <p className="text-center text-[13px] text-ink-300">
            {diffDays(today, date)}일 뒤의 하루예요
          </p>
        ) : (
          <Link href={`/record?date=${date}`} className="block text-center text-[14px] font-bold text-sage-700">
            이날의 기록 남기기 →
          </Link>
        )}
      </div>
    </div>
  );
}
