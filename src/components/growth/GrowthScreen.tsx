"use client";

import Link from "next/link";
import { Check, Lock } from "lucide-react";
import { motion } from "motion/react";
import { SubPage } from "@/components/screens/SubPage";
import { SectionCard } from "@/components/ui/SectionCard";
import { Selly } from "@/components/selly/Selly";
import { HandHeartIcon, JournalIcon, LotusIcon, SproutLeafIcon, SunIcon, WateringCanIcon } from "@/components/ui/icons";
import { useSelly } from "@/lib/selly-store";
import { useAppData, DAILY_TASKS, type DailyTask } from "@/lib/data-store";
import { useToday } from "@/lib/date";
import { EXP_PER_LEVEL, REWARDS, STAGES, nextStage } from "@/lib/growth";
import { greenhouseArt, grassIslandArt } from "@/lib/assets";
import { EMOTIONS, EMOTION_INFO, flowerArt } from "@/data/moodFlowers";
import { plantedFlowers } from "@/lib/garden";
import { IS_TOSS } from "@/lib/platform";

const TASKS: Record<DailyTask, { label: string; icon: React.ReactNode; tint: string; href: string }> = {
  record: { label: "오늘의 기록 남기기", icon: <JournalIcon size={24} />, tint: "#f6ecdc", href: "/record" },
  breath: { label: "1분 호흡하기", icon: <LotusIcon size={28} />, tint: "#f2c4c8", href: "/?do=breathe" },
  water: { label: "물 주기", icon: <WateringCanIcon size={24} />, tint: "#e3f0f5", href: "/?do=care" },
  sun: { label: "햇빛 주기", icon: <SunIcon size={24} />, tint: "#fff3d2", href: "/?do=care" },
  pat: { label: "쓰다듬기", icon: <HandHeartIcon size={22} />, tint: "#fde7ea", href: "/?do=care" },
};

export function GrowthScreen() {
  const { level, exp, stage } = useSelly();
  const appData = useAppData();
  const { daily } = appData;
  const today = useToday();
  const log = today ? daily[today] : undefined;
  const next = nextStage(level);
  const remaining = next ? (next.minLevel - level) * EXP_PER_LEVEL - exp : 0;
  const doneCount = DAILY_TASKS.filter((t) => log?.done[t]).length;
  const flowers = today ? plantedFlowers(appData, today) : [];

  return (
    <SubPage title="셀리의 성장">
      <div className="flex flex-col gap-3">
        {/* current stage */}
        <section className="glass overflow-hidden rounded-[28px]">
          <div className="relative h-[230px] overflow-hidden">
            {greenhouseArt && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={greenhouseArt} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover" style={{ objectPosition: "50% 70%" }} />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[rgba(253,250,243,0.9)]" />
            <div className="absolute bottom-[-4px] left-1/2 w-[190px] -translate-x-1/2">
              {grassIslandArt && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={grassIslandArt} alt="" aria-hidden className="absolute left-1/2 top-[90%] w-[160%] max-w-none -translate-x-1/2 -translate-y-1/2" />
              )}
              <Selly className="w-full" />
            </div>
          </div>
          <div className="px-5 pb-5 pt-2 text-center">
            <p className="text-[12.5px] text-ink-500">지금 셀리는</p>
            <p className="text-[21px] font-bold text-ink-700">
              {stage.name} <span className="text-[14px] font-normal text-ink-500">· Lv. {level}</span>
            </p>
            <p className="mt-1 text-[13.5px] text-ink-500">{stage.line}</p>
          </div>
        </section>

        {!IS_TOSS && (
        <Link
          href="/share"
          className="glass flex items-center justify-between rounded-[22px] px-4 py-3 text-[14px] font-bold text-ink-700 active:scale-[0.99]"
        >
          <span>💌 친구에게 셀리 보여주기</span>
          <span className="text-[12px] font-normal text-ink-500">엽서 · 온실 링크 →</span>
        </Link>
        )}

        {/* stage track */}
        <section className="glass rounded-[26px] px-3 pb-4 pt-4" aria-label="성장 단계">
          <ol className="relative grid grid-cols-4">
            <span aria-hidden className="absolute left-[12.5%] right-[12.5%] top-[86px] h-[2px] bg-[#e6dccb]" />
            <span
              aria-hidden
              className="absolute left-[12.5%] top-[86px] h-[2px] bg-sage-500"
              style={{ width: `${(STAGES.findIndex((s) => s.id === stage.id) / (STAGES.length - 1)) * 75}%` }}
            />
            {STAGES.map((s) => {
              const reached = level >= s.minLevel;
              const current = s.id === stage.id;
              return (
                <li key={s.id} className="relative flex flex-col items-center" aria-current={current ? "step" : undefined}>
                  <div className={`relative h-[78px] w-[78px] ${reached ? "" : "opacity-45 grayscale-[60%]"}`}>
                    <Selly stage={s.id} pose={reached ? undefined : "relaxed"} className="w-full" />
                    {!reached && (
                      <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-white text-ink-300 shadow-sm">
                        <Lock size={11} />
                      </span>
                    )}
                  </div>
                  <span
                    className={`relative z-10 mt-1 h-3 w-3 rounded-full border-2 ${current ? "border-white bg-sage-600 shadow-[0_0_0_2px_#8faf91]" : reached ? "border-white bg-sage-500" : "border-white bg-[#e2d8c7]"}`}
                  />
                  <span className={`mt-1.5 text-[13px] ${current ? "font-bold text-ink-700" : "text-ink-500"}`}>{s.name}</span>
                  <span className="text-[11px] text-ink-300">Lv.{s.minLevel}</span>
                </li>
              );
            })}
          </ol>
        </section>

        {/* progress */}
        <section className="glass rounded-[26px] p-4">
          <div className="flex items-baseline justify-between">
            <p className="text-[15px] font-bold text-ink-700">Lv. {level}</p>
            <p className="text-[12px] tabular-nums text-ink-500">
              {exp} / {EXP_PER_LEVEL}
            </p>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#ebe4d6]">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[#a8cb97] to-[#79a674]"
              initial={{ width: 0 }}
              animate={{ width: `${(exp / EXP_PER_LEVEL) * 100}%` }}
              transition={{ type: "spring", stiffness: 90, damping: 20 }}
            />
          </div>
          <p className="mt-2.5 text-[13px] text-ink-500">
            {next ? (
              <>
                <b className="text-ink-700">{next.name}</b>까지 {next.minLevel - level}레벨 · 성장{" "}
                <b className="tabular-nums text-ink-700">{remaining.toLocaleString("ko-KR")}</b> 남았어요
              </>
            ) : (
              "셀리가 활짝 피었어요. 앞으로도 함께 가꿔가요 ♡"
            )}
          </p>
        </section>

        {/* mood garden */}
        <SectionCard icon={<SproutLeafIcon />} title="기분 정원" aside={<span className="text-[12px] tabular-nums text-ink-500">꽃 {flowers.length}송이</span>}>
          {flowers.length ? (
            <>
              <ul className="grid grid-cols-5 gap-1 text-center">
                {EMOTIONS.map((e) => {
                  const n = flowers.filter((f) => f.emotion === e).length;
                  return (
                    <li key={e} className={`flex flex-col items-center rounded-2xl py-1.5 ${n ? "" : "opacity-40"}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={flowerArt(e, 3)} alt="" className="h-11 w-auto" />
                      <span className="text-[11.5px] text-ink-700">{EMOTION_INFO[e].label}</span>
                      <span className="text-[12px] font-bold tabular-nums text-ink-700">{n}</span>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 text-center text-[12px] text-ink-500">
                {(() => {
                  const growing = flowers.filter((f) => f.stage < 3);
                  return growing.length
                    ? `${growing.length}송이가 자라는 중이에요 · 물을 주면 조금 더 빨리 자라요`
                    : "모두 활짝 피었어요 ♡";
                })()}
              </p>
            </>
          ) : (
            <p className="py-2 text-center text-[13px] leading-relaxed text-ink-500">
              기록할 때 <b className="text-ink-700">마음의 색</b>을 고르면
              <br />
              온실에 그 색의 꽃이 피어나요.
            </p>
          )}
          <p className="mt-1 text-center text-[11px] text-ink-300">어떤 마음이든 똑같이 예쁜 꽃이에요. 쉬는 날이 있어도 꽃은 시들지 않아요.</p>
        </SectionCard>

        {/* today's care */}
        <SectionCard
          icon={<SproutLeafIcon />}
          title="오늘의 돌봄"
          aside={
            <span className="text-[12px] tabular-nums text-ink-500">
              {doneCount} / {DAILY_TASKS.length}
            </span>
          }
        >
          <ul className="flex flex-col gap-2">
            {DAILY_TASKS.map((t) => {
              const done = !!log?.done[t];
              const task = TASKS[t];
              return (
                <li key={t} className="flex items-center gap-3 rounded-2xl bg-white/65 px-3 py-2.5">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full" style={{ background: task.tint }}>
                    {task.icon}
                  </span>
                  <span className={`flex-1 text-[14px] ${done ? "text-ink-300 line-through decoration-[#cfc5b5]" : "text-ink-700"}`}>{task.label}</span>
                  {done ? (
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-sage-500 text-white" aria-label="완료">
                      <Check size={15} strokeWidth={3} />
                    </span>
                  ) : (
                    <Link href={task.href} className="rounded-full bg-sage-50 px-3 py-1.5 text-[12px] font-bold text-sage-700">
                      +{REWARDS[t]} 하러 가기
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
          <p className={`mt-3 rounded-2xl px-3 py-2 text-center text-[12.5px] ${log?.bonus ? "bg-[#fff6e0] text-[#8a6a2c]" : "text-ink-500"}`}>
            {log?.bonus ? `오늘의 돌봄 완료! 보너스 +${REWARDS.bonus}를 받았어요 ✦` : `모두 마치면 보너스 성장 +${REWARDS.bonus}`}
          </p>
          <p className="mt-1 text-center text-[11px] text-ink-300">돌봄은 하루에 한 번씩 성장으로 이어져요. 셀리를 쓰다듬는 건 언제든 좋아요.</p>
        </SectionCard>
      </div>
    </SubPage>
  );
}
