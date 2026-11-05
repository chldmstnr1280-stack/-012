"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { SproutLeafIcon } from "@/components/ui/icons";
import { DIMENSIONS, type ContextTagId, type Dimension } from "@/data/contextTags";
import { setDayTags, useAppData } from "@/lib/data-store";
import type { DateKey } from "@/lib/date";

/** One ontology dimension as grouped one-tap chips (controlled). */
export function TagChips({
  dimension,
  groups,
  value,
  onToggle,
}: {
  dimension: Dimension;
  /** limit to these group ids (default: all) */
  groups?: readonly string[];
  value: ReadonlySet<ContextTagId>;
  onToggle: (id: ContextTagId) => void;
}) {
  const dim = DIMENSIONS.find((d) => d.id === dimension)!;
  return (
    <div className="flex flex-col gap-2.5">
      {dim.groups
        .filter((g) => !groups || groups.includes(g.id))
        .map((g) => (
          <div key={g.id}>
            <p className="mb-1.5 text-[11.5px] text-ink-500">{g.label}</p>
            <ul className="flex flex-wrap gap-1.5" aria-label={g.label}>
              {g.items.map((it) => {
                const pressed = value.has(it.id);
                return (
                  <li key={it.id}>
                    <button
                      type="button"
                      aria-pressed={pressed}
                      onClick={() => onToggle(it.id)}
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
  );
}

/** A dimension as a card that folds away when empty, so the daily record stays quick. */
export function DimensionCard({
  dimension,
  value,
  onToggle,
  hint,
}: {
  dimension: Dimension;
  value: ReadonlySet<ContextTagId>;
  onToggle: (id: ContextTagId) => void;
  hint?: string;
}) {
  const dim = DIMENSIONS.find((d) => d.id === dimension)!;
  const ids = new Set<string>(dim.groups.flatMap((g) => g.items.map((i) => i.id)));
  const count = [...value].filter((id) => ids.has(id)).length;
  const [open, setOpen] = useState(count > 0);
  return (
    <section className="glass rounded-[26px] p-4">
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-2 text-left">
        <span className="grid h-7 w-7 place-items-center">
          <SproutLeafIcon />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15.5px] font-bold text-ink-700">
            {dim.label}
            {count > 0 && <span className="ml-1.5 rounded-full bg-sage-50 px-2 py-0.5 text-[11px] font-bold text-sage-700">{count}</span>}
          </span>
          <span className="block text-[12px] text-ink-500">{dim.question}</span>
        </span>
        <ChevronDown size={18} className={`shrink-0 text-ink-300 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="mt-3">
          <TagChips dimension={dimension} value={value} onToggle={onToggle} />
          {hint && <p className="mt-2.5 text-[11px] leading-relaxed text-ink-300">{hint}</p>}
        </div>
      )}
    </section>
  );
}

/** PMS tab: "오늘의 상황" (what happened · habits), saved on every tap. Same data as the daily record. */
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
      <TagChips dimension="situation" groups={["event", "habit"]} value={on} onToggle={toggle} />
      <p className="mt-2.5 text-[11px] leading-relaxed text-ink-300">
        ‘하루 기록’의 상황과 같은 기록이에요. 리포트에서 상황이 있던 날과 없던 날의 증상을 나란히 보여 줘요. 이 기기와 백업 파일에만 저장되고, 서버로 보내지 않아요.
      </p>
    </SectionCard>
  );
}
