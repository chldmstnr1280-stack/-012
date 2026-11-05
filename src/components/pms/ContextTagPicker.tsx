"use client";

import { Check } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { SproutLeafIcon } from "@/components/ui/icons";
import { CONTEXT_TAG_GROUPS, type ContextTagId } from "@/data/contextTags";
import { setDayTags, useAppData } from "@/lib/data-store";
import type { DateKey } from "@/lib/date";

/** "오늘의 상황" — one tap per tag, saved immediately. Optional; nothing is inferred from it. */
export function ContextTagPicker({ date }: { date: DateKey }) {
  const data = useAppData();
  const on = new Set(data.dayTags[date]?.tags ?? []);
  const toggle = (id: ContextTagId) => {
    const next = new Set(on);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setDayTags(date, [...next]);
  };

  return (
    <SectionCard icon={<SproutLeafIcon />} title="오늘의 상황" aside={<span className="text-[11px] text-ink-300">선택 · 여러 개 가능</span>}>
      <div className="flex flex-col gap-2.5">
        {CONTEXT_TAG_GROUPS.map((g) => (
          <div key={g.id}>
            <p className="mb-1.5 text-[11.5px] text-ink-500">{g.label}</p>
            <ul className="flex flex-wrap gap-1.5">
              {g.items.map((it) => {
                const pressed = on.has(it.id);
                return (
                  <li key={it.id}>
                    <button
                      type="button"
                      aria-pressed={pressed}
                      onClick={() => toggle(it.id)}
                      className={`flex h-9 items-center gap-1 rounded-full px-3.5 text-[13px] transition active:scale-95 ${
                        pressed ? "bg-sage-500 font-bold text-white" : "bg-white/80 text-ink-700 shadow-[0_3px_10px_-8px_rgba(110,88,60,0.5)]"
                      }`}
                    >
                      {pressed && <Check size={13} strokeWidth={3} />}
                      {it.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-2.5 text-[11px] leading-relaxed text-ink-300">
        리포트에서 상황이 있던 날과 없던 날의 증상을 나란히 보여 줘요. 상황 기록은 이 기기와 백업 파일에만 저장되고, 서버로 보내지 않아요.
      </p>
    </SectionCard>
  );
}
