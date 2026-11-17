"use client";

import { RhythmView } from "./RhythmView";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { LateCycleCard } from "./LateCycleCard";
import { CareRecapCard } from "./CareRecapCard";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { SubPage } from "@/components/screens/SubPage";
import { SegmentedTabs } from "@/components/ui/SegmentedTabs";
import { analyzeCycle } from "@/lib/cycle";
import { analysePms, hasSymptomRecord } from "@/lib/pms/analysis";
import { forecastPms } from "@/lib/pms/forecast";
import { addDays, fromKey, useToday, type DateKey } from "@/lib/date";
import { useAppData } from "@/lib/data-store";
import { DemoBanner } from "@/components/report/DemoBanner";
import { MonthCalendar, type MonthCursor } from "./MonthCalendar";
import { CurrentCycleCard } from "./CurrentCycleCard";
import { CycleAnalysis } from "./CycleAnalysis";
import { DaySheet } from "./DaySheet";

type Tab = "calendar" | "rhythm" | "analysis";

export function CalendarScreen() {
  const today = useToday();
  const data = useAppData();
  const [tab, setTab] = useState<Tab>("calendar");
  // /calendar?tab=rhythm opens 이번 달 나의 리듬
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("tab");
    if (q !== "rhythm" && q !== "analysis") return;
    const t = setTimeout(() => setTab(q), 0);
    return () => clearTimeout(t);
  }, []);
  const [cursor, setCursor] = useState<MonthCursor | null>(null);
  const [selected, setSelected] = useState<DateKey | null>(null);

  const info = useMemo(() => analyzeCycle(data.periodDays, today), [data.periodDays, today]);
  const periodSet = useMemo(() => new Set(data.periodDays), [data.periodDays]);
  const recorded = useMemo(() => new Set(Object.keys(data.entries)), [data.entries]);
  const symptomMax = useMemo(
    () => new Map(
        Object.entries(data.symptoms)
          .filter(([, d]) => hasSymptomRecord(d))
          .map(([k, d]) => [k, d.none ? 0 : Math.max(0, ...Object.values(d.scores).map((v) => v ?? 0))]),
      ),
    [data.symptoms],
  );
  const pmsWindow = useMemo(
    () => (today ? forecastPms(data, info, analysePms(data.periodDays, data.symptoms, today, info.nextStart)).window : new Set<DateKey>()),
    [data, today, info],
  );
  // PMS 돌봄 모드 is offered from 3 days before the expected window until it ends
  const careNear = !!today && [0, 1, 2, 3].some((n) => pmsWindow.has(addDays(today, n)));

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
              { value: "rhythm", label: "나의 리듬" },
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
                      symptomMax={symptomMax}
                      pmsWindow={pmsWindow}
                      onSelect={setSelected}
                    />
                    <CurrentCycleCard info={info} today={today} />
                    <LateCycleCard info={info} today={today} />
                    <CareRecapCard today={today} />
                    <Link href={careNear ? "/pms/care?from=pms" : "/pms/care"} className="glass flex items-center gap-3 rounded-[22px] px-4 py-3.5">
                      <span className="text-[20px]" aria-hidden>
                        🌷
                      </span>
                      <span className="flex-1">
                        <span className="block text-[14px] font-bold text-ink-700">{careNear ? "이번 주에는 나를 조금 더 세심하게 돌봐볼까요?" : "돌봄 모드"}</span>
                        <span className="text-[11.5px] text-ink-500">{careNear ? "생리 전 기간으로 예상되는 때예요 (예측)" : "언제든 나를 돌보는 방법 하나 고르기"}</span>
                      </span>
                      <ChevronRight size={16} className="text-ink-300" />
                    </Link>
                  </>
                ) : tab === "rhythm" ? (
                  <RhythmView today={today} />
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
