"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useSelly } from "@/lib/selly-store";
import { SubPage } from "./SubPage";

const MOODS = [
  { id: 1, label: "힘들어요", mouth: "M-6 5 Q0 -1 6 5" },
  { id: 2, label: "그저 그래요", mouth: "M-6 3 Q0 1 6 3" },
  { id: 3, label: "괜찮아요", mouth: "M-6 2 Q0 5 6 2" },
  { id: 4, label: "좋아요", mouth: "M-7 1 Q0 8 7 1" },
  { id: 5, label: "최고예요", mouth: "M-7 0 Q0 10 7 0 Z" },
];

function MoodFace({ mouth, active }: { mouth: string; active: boolean }) {
  return (
    <svg viewBox="-20 -20 40 40" className="h-11 w-11" aria-hidden>
      <circle r={18} fill={active ? "#ffe1a6" : "#f4ede1"} stroke={active ? "#f0b964" : "#ddd2c1"} strokeWidth={1.5} />
      <circle cx={-6} cy={-4} r={2} fill="#6b5a4c" />
      <circle cx={6} cy={-4} r={2} fill="#6b5a4c" />
      <path d={mouth} transform="translate(0 5)" stroke="#6b5a4c" strokeWidth={1.8} fill={mouth.endsWith("Z") ? "#c9706e" : "none"} strokeLinecap="round" />
      {active && (
        <>
          <ellipse cx={-11} cy={3} rx={3.5} ry={2} fill="#f6b0b0" opacity={0.7} />
          <ellipse cx={11} cy={3} rx={3.5} ry={2} fill="#f6b0b0" opacity={0.7} />
        </>
      )}
    </svg>
  );
}

/**
 * Temporary journal UI (Phase 1). Nothing is persisted or sent anywhere —
 * storage arrives with the data layer in a later phase.
 */
export function RecordScreen() {
  const [mood, setMood] = useState<number | null>(null);
  const [memo, setMemo] = useState("");
  const { showToast, addExp, react } = useSelly();
  const router = useRouter();
  const [today, setToday] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setToday(new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: "short" }).format(new Date())), 0);
    return () => clearTimeout(t);
  }, []);

  const save = () => {
    if (!mood) {
      showToast("오늘의 기분을 먼저 골라주세요");
      return;
    }
    addExp(15);
    showToast("오늘의 기록을 담았어요 · 성장 +15");
    react("cheer");
    router.push("/");
  };

  return (
    <SubPage title="오늘의 기록">
      <div className="mx-auto mb-4 w-fit rounded-full border border-white bg-white/70 px-5 py-2 text-[14px] text-ink-700 shadow-sm">{today || "오늘"}</div>

      <section className="glass rounded-[26px] p-4">
        <h2 className="mb-3 text-[15px] font-bold text-ink-700">기분</h2>
        <div className="flex justify-between">
          {MOODS.map((m) => (
            <motion.button
              key={m.id}
              type="button"
              whileTap={{ scale: 0.9 }}
              animate={{ scale: mood === m.id ? 1.1 : 1 }}
              aria-label={m.label}
              aria-pressed={mood === m.id}
              onClick={() => setMood(m.id)}
              className="grid h-12 w-12 place-items-center rounded-full"
            >
              <MoodFace mouth={m.mouth} active={mood === m.id} />
            </motion.button>
          ))}
        </div>
        <p className="mt-2 h-5 text-center text-[13px] text-ink-500">{mood ? MOODS[mood - 1].label : ""}</p>
      </section>

      <section className="glass mt-3 rounded-[26px] p-4">
        <h2 className="mb-3 text-[15px] font-bold text-ink-700">메모</h2>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          maxLength={200}
          rows={4}
          placeholder="오늘의 나를 한 줄로 남겨보세요..."
          className="w-full resize-none rounded-2xl border border-[#ece4d6] bg-white/70 p-3 text-[14px] text-ink-700 outline-none placeholder:text-ink-300 focus:border-sage-300"
        />
      </section>

      <p className="mt-3 px-2 text-center text-[12px] text-ink-300">컨디션 · 활동 기록은 다음 단계에서 만나요</p>

      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        onClick={save}
        className="mt-4 h-14 w-full rounded-full bg-gradient-to-b from-[#9cc095] to-[#7ea47a] text-[16px] font-bold text-white shadow-[0_10px_24px_-10px_rgba(90,130,85,0.8),inset_0_1px_0_rgba(255,255,255,0.4)]"
      >
        저장하기
      </motion.button>
    </SubPage>
  );
}
