"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, toKey, WEEKDAY_LABELS, type DateKey } from "@/lib/date";
import type { CycleInfo } from "@/lib/cycle";
import { CYCLE_COLORS as C } from "./colors";
import { INTENSITY_EDGE, INTENSITY_FILL, PMS_WINDOW, PMS_WINDOW_EDGE } from "@/components/pms/colors";

export interface MonthCursor {
  year: number;
  month: number; // 0-11
}

export function MonthCalendar({
  cursor,
  onCursor,
  today,
  info,
  periodDays,
  recorded,
  symptomMax,
  pmsWindow,
  onSelect,
}: {
  cursor: MonthCursor;
  onCursor: (c: MonthCursor) => void;
  today: DateKey;
  info: CycleInfo;
  periodDays: Set<DateKey>;
  recorded: Set<DateKey>;
  /** highest symptom score per recorded symptom day (0 = recorded "none") */
  symptomMax: Map<DateKey, number>;
  /** reference-only expected pre-period window (needs ≥ 2 analysed cycles) */
  pmsWindow: Set<DateKey>;
  onSelect: (d: DateKey) => void;
}) {
  const first = new Date(cursor.year, cursor.month, 1);
  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
  const lead = first.getDay();
  const cells: (DateKey | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => toKey(new Date(cursor.year, cursor.month, i + 1))),
  ];
  while (cells.length % 7) cells.push(null);

  const shift = (n: number) => {
    const d = new Date(cursor.year, cursor.month + n, 1);
    onCursor({ year: d.getFullYear(), month: d.getMonth() });
  };

  return (
    <section className="glass rounded-[26px] px-3 pb-4 pt-3" aria-label={`${cursor.year}년 ${cursor.month + 1}월 달력`}>
      <div className="mb-2 flex items-center justify-between px-1">
        <button type="button" aria-label="이전 달" onClick={() => shift(-1)} className="grid h-10 w-10 place-items-center rounded-full text-ink-500 active:bg-sage-50">
          <ChevronLeft size={20} />
        </button>
        <p className="text-[17px] font-bold tabular-nums text-ink-700">
          {cursor.year}년 {cursor.month + 1}월
        </p>
        <button type="button" aria-label="다음 달" onClick={() => shift(1)} className="grid h-10 w-10 place-items-center rounded-full text-ink-500 active:bg-sage-50">
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="grid grid-cols-7 text-center text-[12.5px] text-ink-500">
        {WEEKDAY_LABELS.map((w) => (
          <span key={w} className="py-1.5">
            {w}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((k, i) => {
          if (!k) return <span key={`b${i}`} className="h-[46px]" />;
          const col = i % 7;
          const isPeriod = periodDays.has(k);
          const prevP = col > 0 && periodDays.has(addDays(k, -1));
          const nextP = col < 6 && periodDays.has(addDays(k, 1));
          const predicted = info.predictedPeriodDays.has(k);
          const fertile = info.fertileDays.has(k);
          const ovulation = info.ovulationDays.has(k);
          const isToday = k === today;
          const sym = symptomMax.get(k);
          const pms = pmsWindow.has(k) && !isPeriod && !predicted;
          const day = Number(k.slice(8));
          const status = [
            isPeriod && "생리일",
            predicted && "생리 예정일",
            ovulation && "배란 예정일",
            pms && "PMS 예상 기간(참고)",
            sym != null && (sym ? `증상 최고 ${sym}점` : "증상 없음 기록"),
            !ovulation && fertile && "가임기",
            recorded.has(k) && "기록 있음",
            isToday && "오늘",
          ]
            .filter(Boolean)
            .join(", ");

          return (
            <button
              key={k}
              type="button"
              onClick={() => onSelect(k)}
              aria-label={`${cursor.month + 1}월 ${day}일${status ? `, ${status}` : ""}`}
              className="relative grid h-[46px] place-items-center"
            >
              {pms && <span className="absolute inset-x-[3px] bottom-[3px] top-[3px] rounded-[12px]" style={{ background: PMS_WINDOW }} aria-hidden />}
              {/* connect consecutive period days into a soft band */}
              {isPeriod && prevP && <span className="absolute left-0 top-1/2 h-[34px] w-1/2 -translate-y-1/2" style={{ background: C.periodBand }} />}
              {isPeriod && nextP && <span className="absolute right-0 top-1/2 h-[34px] w-1/2 -translate-y-1/2" style={{ background: C.periodBand }} />}
              <span
                className="relative grid h-[34px] w-[34px] place-items-center rounded-full text-[14px] tabular-nums"
                style={{
                  background: isToday && !isPeriod ? C.today : isPeriod ? C.periodFill : fertile ? C.fertileFill : undefined,
                  border: predicted ? `1.6px dashed ${C.period}` : undefined,
                  boxShadow: [
                    ovulation ? `inset 0 0 0 2px ${C.ovulation}` : "",
                    isToday && isPeriod ? `0 0 0 2px #fff, 0 0 0 3.5px ${C.today}` : "",
                  ]
                    .filter(Boolean)
                    .join(", ") || undefined,
                  color: isToday && !isPeriod ? "#fff" : "#4a3f36",
                  fontWeight: isToday ? 700 : 400,
                }}
              >
                {day}
              </span>
              {sym != null && (
                <span
                  aria-hidden
                  className="absolute right-[3px] top-[2px] h-[8px] w-[8px] rounded-full"
                  style={{ background: INTENSITY_FILL[sym], boxShadow: `inset 0 0 0 1px ${INTENSITY_EDGE[sym]}` }}
                />
              )}
              {recorded.has(k) && <span className="absolute bottom-0 h-[5px] w-[5px] rounded-full bg-sage-500" aria-hidden />}
            </button>
          );
        })}
      </div>

      <ul className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1.5 text-[11.5px] text-ink-500">
        <Legend swatch={<span className="h-3 w-3 rounded-full" style={{ background: C.periodFill, boxShadow: `inset 0 0 0 1.5px ${C.period}` }} />} label="생리일" />
        <Legend swatch={<span className="h-3 w-3 rounded-full" style={{ background: C.fertileFill, boxShadow: `inset 0 0 0 1.5px ${C.fertile}` }} />} label="가임기" />
        <Legend swatch={<span className="h-3 w-3 rounded-full" style={{ boxShadow: `inset 0 0 0 2px ${C.ovulation}` }} />} label="배란일" />
        <Legend swatch={<span className="h-3 w-3 rounded-full" style={{ border: `1.5px dashed ${C.period}` }} />} label="예정일" />
        <Legend swatch={<span className="h-[5px] w-[5px] rounded-full bg-sage-500" />} label="기록" />
        <Legend
          swatch={<span className="h-2 w-2 rounded-full" style={{ background: INTENSITY_FILL[3], boxShadow: `inset 0 0 0 1px ${INTENSITY_EDGE[3]}` }} />}
          label="증상"
        />
        {pmsWindow.size > 0 && (
          <Legend swatch={<span className="h-3 w-3 rounded-[4px]" style={{ background: PMS_WINDOW, boxShadow: `inset 0 0 0 1px ${PMS_WINDOW_EDGE}` }} />} label="PMS 예상(참고)" />
        )}
      </ul>
    </section>
  );
}

function Legend({ swatch, label }: { swatch: React.ReactNode; label: string }) {
  return (
    <li className="flex items-center gap-1.5">
      <span className="grid h-3 w-3 place-items-center">{swatch}</span>
      {label}
    </li>
  );
}
