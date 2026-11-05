"use client";

import { SectionCard } from "@/components/ui/SectionCard";
import { SunIcon, SleepIcon } from "@/components/ui/icons";
import { setPrefs, useAppData, type Prefs } from "@/lib/data-store";
import { useAmbience } from "@/lib/game/ambience";

const OPTIONS: { value: Prefs["ambience"]; label: string; hint: string }[] = [
  { value: "auto", label: "자동", hint: "기기 시간에 맞춰 바뀌어요" },
  { value: "morning", label: "아침", hint: "창가로 부드러운 햇살" },
  { value: "day", label: "낮", hint: "따뜻한 자연광" },
  { value: "evening", label: "저녁", hint: "노을빛과 켜진 랜턴" },
  { value: "night", label: "밤", hint: "달빛과 랜턴, 반딧불이" },
];

const NOW: Record<string, string> = { morning: "아침", day: "낮", evening: "저녁", night: "밤" };

export function AmbienceCard() {
  const { prefs } = useAppData();
  const current = useAmbience();
  const sel = prefs.ambience ?? "auto";
  return (
    <SectionCard icon={sel === "night" || current === "night" ? <SleepIcon size={22} /> : <SunIcon size={22} />} title="온실 분위기">
      <div className="grid grid-cols-5 gap-1" role="radiogroup" aria-label="온실 분위기">
        {OPTIONS.map((o) => {
          const on = sel === o.value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setPrefs({ ambience: o.value })}
              className={`h-10 rounded-full text-[13px] font-bold transition ${on ? "bg-sage-500 text-white" : "bg-white/70 text-ink-500"}`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[12px] text-ink-500">
        {OPTIONS.find((o) => o.value === sel)?.hint}
        {sel === "auto" && ` · 지금은 ${NOW[current]}`}
      </p>
      <p className="mt-1 text-[11.5px] text-ink-300">셀리의 하루도 분위기를 따라가요. 밤에는 쿠션에서 꾸벅꾸벅 졸기도 해요.</p>
    </SectionCard>
  );
}
