"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { SubPage } from "@/components/screens/SubPage";
import { SegmentedTabs } from "@/components/ui/SegmentedTabs";
import { analyzeCycle } from "@/lib/cycle";
import { fromKey, useToday, type DateKey } from "@/lib/date";
import { useAppData } from "@/lib/data-store";
import { DemoBanner } from "@/components/report/DemoBanner";
import { MonthCalendar, type MonthCursor } from "./MonthCalendar";
import { CurrentCycleCard } from "./CurrentCycleCard";
import { CycleAnalysis } from "./CycleAnalysis";
import { DaySheet } from "./DaySheet";

type Tab = "calendar" | "analysis";

export function CalendarScreen() {
  const today = useToday();
  const data = useAppData();
  const [tab, setTab] = useState<Tab>("calendar");
  const [cursor, setCursor] = useState<MonthCursor | null>(null);
  const [selected, setSelected] = useState<DateKey | null>(null);

  const info = useMemo(() => analyzeCycle(data.periodDays, today), [data.periodDays, today]);
  const periodSet = useMemo(() => new Set(data.periodDays), [data.periodDays]);
  const recorded = useMemo(() => new Set(Object.keys(data.entries)), [data.entries]);

  const month: MonthCursor | null = cursor ?? (today ? { year: fromKey(today).getFullYear(), month: fromKey(today).getMonth() } : null);

  return (
    <>
      <SubPage title="생리주기">
        <div className="flex flex-col gap-3">
          <SegmentedTabs
            label="생리주기 보기"
            value={tab}
            onChange={setTab}
            options={[
              { value: "calendar", label: "캘린더" },
              { value: "analysis", label: "주기 분석" },
            ]}
          />
          {data.demo && <DemoBanner />}
          {today && month ? (
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-3"
              >
                {tab === "calendar" ? (
                  <>
                    <MonthCalendar
                      cursor={month}
                      onCursor={setCursor}
                      today={today}
                      info={info}
                      periodDays={periodSet}
                      recorded={recorded}
                      onSelect={setSelected}
                    />
                    <CurrentCycleCard info={info} today={today} />
                  </>
                ) : (
                  <CycleAnalysis info={info} today={today} />
                )}
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="h-[420px]" />
          )}
        </div>
      </SubPage>
      {today && (
        <DaySheet
          date={selected}
          today={today}
          info={info}
          periodDays={periodSet}
          entry={selected ? data.entries[selected] : undefined}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
