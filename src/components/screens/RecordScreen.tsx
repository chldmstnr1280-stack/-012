"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSelly } from "@/lib/selly-store";
import { addDays, formatShort, useToday, type DateKey } from "@/lib/date";
import { CONDITION_KEYS, saveEntry, setDayTags, useAppData, type ConditionKey, type DailyEntry, type Level5 } from "@/lib/data-store";
import { SectionCard } from "@/components/ui/SectionCard";
import { EnergyIcon, FocusIcon, NoteIcon, SleepIcon, SmileIcon, SneakerIcon, SproutLeafIcon, StressIcon } from "@/components/ui/icons";
import { MoodFace, MOODS } from "@/components/ui/MoodFace";
import { SubPage } from "./SubPage";
import { SymptomForm } from "@/components/pms/SymptomForm";
import { NutritionForm } from "@/components/nutrition/NutritionForm";
import { SegmentedTabs } from "@/components/ui/SegmentedTabs";
import { EMOTIONS, EMOTION_INFO, flowerArt, type Emotion } from "@/data/moodFlowers";
import { DimensionCard } from "@/components/pms/ContextTagPicker";
import type { ContextTagId } from "@/data/contextTags";

const CONDITIONS: Record<ConditionKey, { label: string; icon: React.ReactNode; tint: string; levels: string[] }> = {
  energy: { label: "에너지", icon: <EnergyIcon />, tint: "#fff3d2", levels: ["지쳤어요", "조금 피곤해요", "보통이에요", "괜찮아요", "활기차요"] },
  sleep: { label: "수면", icon: <SleepIcon />, tint: "#ece8fb", levels: ["거의 못 잤어요", "뒤척였어요", "보통이에요", "잘 잤어요", "푹 잤어요"] },
  focus: { label: "집중", icon: <FocusIcon />, tint: "#fdeaec", levels: ["산만해요", "흐릿해요", "보통이에요", "잘 돼요", "몰입했어요"] },
  stress: { label: "스트레스", icon: <StressIcon />, tint: "#fdecea", levels: ["거의 없어요", "조금 있어요", "보통이에요", "많아요", "아주 많아요"] },
};

export function RecordScreen() {
  const today = useToday();
  const [date, setDate] = useState<DateKey | null>(null);
  const [tab, setTab] = useState<"day" | "pms" | "care">("day");

  // initial date: ?date=YYYY-MM-DD (from the calendar) or today
  useEffect(() => {
    if (!today || date) return;
    const q = new URLSearchParams(window.location.search).get("date");
    const valid = q && /^\d{4}-\d{2}-\d{2}$/.test(q) && q <= today ? q : today;
    const wantTab = new URLSearchParams(window.location.search).get("tab");
    const t = setTimeout(() => {
      setDate(valid);
      if (wantTab === "pms" || wantTab === "care") setTab(wantTab);
    }, 0);
    return () => clearTimeout(t);
  }, [today, date]);

  return (
    <SubPage title={tab === "pms" ? "증상 기록" : "오늘의 기록"}>
      {date && today ? (
        <>
          <div className="mx-auto mb-4 flex w-fit items-center gap-1 rounded-full border border-white bg-white/75 p-1 shadow-[0_4px_14px_-8px_rgba(110,88,60,0.4)]">
            <button type="button" aria-label="이전 날" onClick={() => setDate(addDays(date, -1))} className="grid h-9 w-9 place-items-center rounded-full text-ink-500 active:bg-sage-50">
              <ChevronLeft size={20} />
            </button>
            <span className="min-w-[118px] text-center text-[15px] font-bold tabular-nums text-ink-700">{formatShort(date)}</span>
            <button
              type="button"
              aria-label="다음 날"
              disabled={date >= today}
              onClick={() => setDate(addDays(date, 1))}
              className="grid h-9 w-9 place-items-center rounded-full text-ink-500 active:bg-sage-50 disabled:opacity-30"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          {date !== today && (
            <button type="button" onClick={() => setDate(today)} className="mx-auto -mt-2 mb-3 block text-[12.5px] text-sage-700 underline underline-offset-4">
              오늘로 돌아가기
            </button>
          )}
          <div className="mb-3">
            <SegmentedTabs
              label="기록 종류"
              value={tab}
              onChange={setTab}
              options={[
                { value: "day", label: "하루 기록" },
                { value: "pms", label: "PMS 증상" },
                { value: "care", label: "먹은 것" },
              ]}
            />
          </div>
          {tab === "day" ? (
            <RecordForm key={date} date={date} isToday={date === today} />
          ) : tab === "pms" ? (
            <SymptomForm key={date} date={date} isFuture={date > today} />
          ) : (
            <NutritionForm key={date} date={date} isFuture={date > today} />
          )}
        </>
      ) : (
        <div className="h-[420px]" />
      )}
    </SubPage>
  );
}

function RecordForm({ date, isToday }: { date: DateKey; isToday: boolean }) {
  const data = useAppData();
  const existing: DailyEntry | undefined = data.entries[date];
  const [mood, setMood] = useState<Level5 | undefined>(existing?.mood);
  const [condition, setCondition] = useState<DailyEntry["condition"]>(existing?.condition ?? {});
  const [activeCond, setActiveCond] = useState<ConditionKey>("energy");
  const [steps, setSteps] = useState<string>(existing?.steps != null ? String(existing.steps) : "");
  const [memo, setMemo] = useState(existing?.memo ?? "");
  const [emotion, setEmotion] = useState<Emotion | undefined>(existing?.emotion);
  // day ontology (상황 · 상태 · 마음 · 바람) — saved with the rest of the record
  const [tags, setTags] = useState<Set<ContextTagId>>(() => new Set(data.dayTags[date]?.tags ?? []));
  const toggleTag = (id: ContextTagId) =>
    setTags((t) => {
      const next = new Set(t);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const { showToast, completeTask, react } = useSelly();
  const router = useRouter();

  const hasAny = mood != null || emotion != null || Object.keys(condition).length > 0 || steps !== "" || memo.trim() !== "" || tags.size > 0;

  const save = () => {
    if (!hasAny) {
      showToast("하나만 골라도 괜찮아요");
      return;
    }
    const planted = emotion && !existing?.emotion;
    saveEntry(date, {
      mood,
      emotion,
      condition,
      steps: steps === "" ? undefined : Math.min(200_000, Number(steps)),
      memo: memo.trim() || undefined,
    });
    setDayTags(date, [...tags]);
    const exp = isToday ? completeTask("record").exp : 0;
    if (exp) {
      showToast(planted ? `정원에 ${EMOTION_INFO[emotion].flower} 씨앗을 심었어요 🌱 · 성장 +${exp}` : `오늘의 기록을 담았어요 · 성장 +${exp}`);
      react("cheer");
      router.push("/");
    } else {
      showToast(planted ? `정원에 ${EMOTION_INFO[emotion].flower} 씨앗을 심었어요 🌱` : existing ? "기록을 수정했어요" : `${formatShort(date)} 기록을 담았어요`);
    }
  };

  const cond = CONDITIONS[activeCond];
  const condValue = condition[activeCond];

  return (
    <div className="flex flex-col gap-3">
      <SectionCard icon={<SmileIcon />} title="기분">
        <div className="flex justify-between px-1">
          {MOODS.map((m) => (
            <motion.button
              key={m.value}
              type="button"
              whileTap={{ scale: 0.9 }}
              animate={{ scale: mood === m.value ? 1.12 : 1 }}
              aria-label={m.label}
              aria-pressed={mood === m.value}
              onClick={() => setMood(mood === m.value ? undefined : m.value)}
              className="grid h-[52px] w-[52px] place-items-center rounded-full"
            >
              <MoodFace value={m.value} active={mood === m.value} size={46} />
            </motion.button>
          ))}
        </div>
        <p className="mt-1.5 h-5 text-center text-[13px] text-ink-500">{mood ? MOODS[mood - 1].label : "오늘 마음은 어땠나요?"}</p>
      </SectionCard>

      <SectionCard icon={<SproutLeafIcon />} title="마음의 색" aside={<span className="text-[11.5px] text-ink-300">고르면 정원에 꽃이 피어요</span>}>
        <div className="grid grid-cols-5 gap-1" role="radiogroup" aria-label="마음의 색">
          {EMOTIONS.map((e) => {
            const on = emotion === e;
            const info = EMOTION_INFO[e];
            return (
              <motion.button
                key={e}
                type="button"
                role="radio"
                aria-checked={on}
                aria-label={`${info.label} — ${info.flower}`}
                whileTap={{ scale: 0.92 }}
                onClick={() => setEmotion(on ? undefined : e)}
                className={`flex flex-col items-center gap-1 rounded-2xl pb-1.5 pt-1 transition ${on ? "bg-white shadow-[0_0_0_2px_#b7d4b0,0_6px_14px_-8px_rgba(90,130,85,0.6)]" : ""}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={flowerArt(e, 3)} alt="" className={`h-12 w-auto transition ${on ? "" : "opacity-80"}`} draggable={false} />
                <span className="text-[12px] text-ink-700">{info.label}</span>
              </motion.button>
            );
          })}
        </div>
        <p className="mt-2 text-center text-[11.5px] text-ink-500">어떤 마음이든 똑같이 예쁜 꽃으로 자라요</p>
      </SectionCard>

      <DimensionCard dimension="feeling" value={tags} onToggle={toggleTag} hint="마음을 활기찬 · 편안한 · 날선 · 가라앉은, 네 갈래로 나눴어요. 여러 개 골라도 돼요." />

      <SectionCard icon={<SproutLeafIcon />} title="컨디션">
        <div className="grid grid-cols-4 gap-1">
          {CONDITION_KEYS.map((k) => {
            const c = CONDITIONS[k];
            const active = k === activeCond;
            const v = condition[k];
            return (
              <button
                key={k}
                type="button"
                aria-pressed={active}
                onClick={() => setActiveCond(k)}
                className={`flex flex-col items-center gap-1 rounded-2xl py-2 transition ${active ? "bg-white/80 shadow-[0_4px_12px_-6px_rgba(110,88,60,0.4)]" : ""}`}
              >
                <span className="grid h-11 w-11 place-items-center rounded-full" style={{ background: c.tint, boxShadow: active ? "0 0 0 2px #fff, 0 0 0 3.5px #b7d4b0" : undefined }}>
                  {c.icon}
                </span>
                <span className="text-[12.5px] text-ink-700">{c.label}</span>
                <span className="flex gap-[3px]" aria-label={v ? `${v}단계` : "미입력"}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <span key={i} className={`h-[5px] w-[5px] rounded-full ${v && i <= v ? "bg-sage-600" : "bg-[#e6dfd2]"}`} />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
        <div className="mt-3 rounded-2xl bg-white/60 p-3">
          <p className="mb-2 text-center text-[13px] text-ink-500">
            <span className="font-bold text-ink-700">{cond.label}</span> · {condValue ? cond.levels[condValue - 1] : "얼마나 되나요?"}
          </p>
          <div className="flex gap-1.5" role="radiogroup" aria-label={`${cond.label} 단계`}>
            {([1, 2, 3, 4, 5] as Level5[]).map((i) => {
              const on = condValue != null && i <= condValue;
              return (
                <button
                  key={i}
                  type="button"
                  role="radio"
                  aria-checked={condValue === i}
                  aria-label={cond.levels[i - 1]}
                  onClick={() =>
                    setCondition((c) => {
                      const next = { ...c };
                      if (c[activeCond] === i) delete next[activeCond];
                      else next[activeCond] = i;
                      return next;
                    })
                  }
                  className={`h-9 flex-1 rounded-xl text-[12px] tabular-nums transition ${on ? "bg-gradient-to-b from-[#b4d3aa] to-[#8fb98a] text-white" : "bg-[#efe9de] text-ink-300"}`}
                >
                  {i}
                </button>
              );
            })}
          </div>
        </div>
      </SectionCard>

      <DimensionCard dimension="state" value={tags} onToggle={toggleTag} />
      <DimensionCard dimension="situation" value={tags} onToggle={toggleTag} />
      <DimensionCard
        dimension="need"
        value={tags}
        onToggle={toggleTag}
        hint="원하는 걸 골라 두면, 셀리가 그에 맞춰 함께해 줄게요. 상황·상태·마음·바람은 이 기기에 저장되고, 건강 기록 백업에 동의했을 때만 내 계정에 보관돼요."
      />

      <SectionCard icon={<SneakerIcon />} title="활동">
        <label className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[14px] text-ink-500">
            <span className="h-3.5 w-3.5 rounded-full border-2 border-sage-300 bg-sage-50" />
            걸음 수
          </span>
          <input
            inputMode="numeric"
            enterKeyHint="done"
            aria-label="걸음 수"
            placeholder="0"
            value={steps === "" ? "" : Number(steps).toLocaleString("ko-KR")}
            onChange={(e) => setSteps(e.target.value.replace(/[^\d]/g, "").slice(0, 6))}
            className="min-w-0 flex-1 bg-transparent text-right text-[28px] font-bold tabular-nums text-ink-700 outline-none placeholder:text-ink-300"
          />
          <span className="text-[14px] text-ink-500">걸음</span>
        </label>
        <p className="mt-1 text-[11.5px] text-ink-300">휴대폰 걸음 수 자동 연동은 앱 버전에서 지원할 예정이에요</p>
      </SectionCard>

      <SectionCard icon={<NoteIcon />} title="메모">
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          maxLength={300}
          rows={3}
          placeholder="오늘의 나를 한 줄로 남겨보세요..."
          className="w-full resize-none rounded-2xl border border-[#ece4d6] bg-white/70 p-3 text-[14px] leading-relaxed text-ink-700 outline-none placeholder:text-ink-300 focus:border-sage-300"
        />
      </SectionCard>

      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        onClick={save}
        className={`mt-1 h-14 w-full rounded-full bg-gradient-to-b from-[#9cc095] to-[#7ea47a] text-[16px] font-bold text-white shadow-[0_10px_24px_-10px_rgba(90,130,85,0.8),inset_0_1px_0_rgba(255,255,255,0.4)] transition-opacity ${hasAny ? "" : "opacity-60"}`}
      >
        {existing ? "수정하기" : "저장하기"}
      </motion.button>
      <p className="text-center text-[11.5px] text-ink-300">기록은 이 기기에만 저장돼요</p>
    </div>
  );
}
