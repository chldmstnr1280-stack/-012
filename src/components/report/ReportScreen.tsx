"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { SubPage } from "@/components/screens/SubPage";
import { SegmentedTabs } from "@/components/ui/SegmentedTabs";
import { SectionCard } from "@/components/ui/SectionCard";
import { Selly } from "@/components/selly/Selly";
import { Flower } from "@/components/greenhouse/svg-kit";
import { SmileIcon, SneakerIcon, SproutLeafIcon } from "@/components/ui/icons";
import { useToday } from "@/lib/date";
import { replaceAll, useAppData } from "@/lib/data-store";
import { buildDemoData } from "@/lib/demo-data";
import { buildReport, type RangeKind } from "@/lib/report";
import { greenhouseArt } from "@/lib/assets";
import { useSelly } from "@/lib/selly-store";
import { BalanceRadar } from "./BalanceRadar";
import { MoodFlow, rangeLabel } from "./MoodFlow";
import { DemoBanner } from "./DemoBanner";
import { PmsReport } from "@/components/pms/PmsReport";
import { DayPatterns } from "./DayPatterns";
import { dayPatterns } from "@/lib/dayPatterns";

export function ReportScreen() {
  const today = useToday();
  const data = useAppData();
  const [kind, setKind] = useState<RangeKind | "pms">("week");
  const report = useMemo(() => (today && kind !== "pms" ? buildReport(kind, today, data) : null), [kind, today, data]);
  const hasAnyData = Object.keys(data.entries).length > 0;
  const patterns = useMemo(() => (report ? dayPatterns(data, report.current.days) : null), [report, data]);

  return (
    <SubPage title="나의 웰니스 리포트">
      <div className="flex flex-col gap-3">
        <SegmentedTabs
          label="리포트 기간"
          value={kind}
          onChange={setKind}
          options={[
            { value: "week", label: "주간" },
            { value: "month", label: "월간" },
            { value: "all", label: "전체" },
            { value: "pms", label: "PMS" },
          ]}
        />
        {data.demo && <DemoBanner />}

        {kind === "pms" && today ? (
          <motion.div key="pms" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            <PmsReport data={data} today={today} />
          </motion.div>
        ) : report && today ? (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={kind} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="flex flex-col gap-3">
              <Hero title={report.title} summary={report.summary} period={rangeLabel(report.current.days)} empty={!report.current.recordedDays} />

              {report.current.recordedDays ? (
                <>
                  <SectionCard icon={<SproutLeafIcon />} title="주요 밸런스" aside={<span className="text-[11.5px] text-ink-300">평균 · 5점 만점</span>}>
                    <BalanceRadar values={report.current.axes} />
                  </SectionCard>

                  <SectionCard icon={<SmileIcon />} title="기분 흐름" aside={kind === "all" && report.current.days.length > 60 ? <span className="text-[11.5px] text-ink-300">주별 평균</span> : undefined}>
                    <MoodFlow kind={kind as RangeKind} days={report.current.days} data={data} />
                  </SectionCard>

                  {patterns && <DayPatterns p={patterns} />}

                  <div className="grid grid-cols-2 gap-2">
                    <Tile label="기록한 날" value={`${report.current.recordedDays}`} unit={kind === "all" ? "일" : `/ ${report.current.days.length}일`} />
                    <Tile
                      label="평균 걸음 수"
                      icon={<SneakerIcon size={18} />}
                      value={report.current.avgSteps != null ? report.current.avgSteps.toLocaleString("ko-KR") : "–"}
                      unit={report.current.avgSteps != null ? "걸음" : undefined}
                      delta={report.previous?.avgSteps != null && report.current.avgSteps != null ? report.current.avgSteps - report.previous.avgSteps : undefined}
                    />
                  </div>
                </>
              ) : (
                <EmptyState showDemo={!hasAnyData} today={today} />
              )}
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="h-[420px]" />
        )}
      </div>
    </SubPage>
  );
}

function Hero({ title, summary, period, empty }: { title: string; summary: string[]; period: string; empty: boolean }) {
  return (
    <section className="glass overflow-hidden rounded-[28px]">
      <div className="relative h-[176px] overflow-hidden">
        {greenhouseArt && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={greenhouseArt} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-125 object-cover" style={{ objectPosition: "50% 82%" }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(255,250,240,0.15)] via-transparent to-[rgba(253,250,243,0.95)]" />
        <svg aria-hidden viewBox="0 0 320 176" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMax slice">
          <Flower x={70} y={120} r={13} color="#f6c8d3" />
          <Flower x={46} y={96} r={9} color="#ffffff" />
          <Flower x={252} y={112} r={12} color="#f9d4dd" />
          <Flower x={276} y={86} r={8} color="#e5d6f4" />
          <Flower x={232} y={78} r={6} color="#ffffff" />
        </svg>
        <div className="absolute bottom-0 left-1/2 w-[150px] -translate-x-1/2 translate-y-[10%]">
          <Selly pose="relaxed" className="w-full" />
        </div>
      </div>
      <div className="px-5 pb-5 pt-1 text-center">
        <p className="text-[18px] font-bold text-ink-700">{title}</p>
        {period && <p className="text-[11.5px] tabular-nums text-ink-300">{period}</p>}
        <div className="mt-2 text-[13.5px] leading-relaxed text-ink-500">
          {empty ? <p>이 기간에는 아직 기록이 없어요.</p> : summary.map((s) => <p key={s}>{s}</p>)}
        </div>
      </div>
    </section>
  );
}

function Tile({ label, value, unit, icon, delta }: { label: string; value: string; unit?: string; icon?: React.ReactNode; delta?: number }) {
  return (
    <div className="glass rounded-[22px] px-4 py-3.5">
      <p className="flex items-center gap-1 text-[12px] text-ink-500">
        {icon}
        {label}
      </p>
      <p className="mt-1 text-[22px] font-bold tabular-nums text-ink-700">
        {value}
        {unit && <span className="ml-1 text-[12.5px] font-normal text-ink-500">{unit}</span>}
      </p>
      {delta != null && Math.abs(delta) >= 100 && (
        <p className="mt-0.5 text-[11.5px] tabular-nums text-ink-500">
          지난 기간보다 {delta > 0 ? "▲" : "▼"} {Math.abs(delta).toLocaleString("ko-KR")}
        </p>
      )}
    </div>
  );
}

function EmptyState({ showDemo, today }: { showDemo: boolean; today: string }) {
  const { showToast } = useSelly();
  return (
    <div className="glass flex flex-col items-center gap-3 rounded-[26px] px-6 py-6 text-center">
      <p className="text-[14px] leading-relaxed text-ink-500">
        기분과 컨디션을 기록하면
        <br />
        셀리가 나의 흐름을 정리해 줄게요.
      </p>
      <Link href="/record" className="h-12 w-full rounded-full bg-gradient-to-b from-[#9cc095] to-[#7ea47a] text-[15px] font-bold leading-[48px] text-white shadow-[0_10px_24px_-10px_rgba(90,130,85,0.8)]">
        오늘 기록하러 가기
      </Link>
      {showDemo && (
        <button
          type="button"
          onClick={() => {
            replaceAll({ ...buildDemoData(today), demo: true });
            showToast("예시 데이터를 불러왔어요");
          }}
          className="text-[13px] text-sage-700 underline underline-offset-4"
        >
          예시 데이터로 둘러보기
        </button>
      )}
    </div>
  );
}
