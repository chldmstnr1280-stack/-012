"use client";

import { SectionCard } from "@/components/ui/SectionCard";
import { SproutLeafIcon } from "@/components/ui/icons";
import { CONTEXT_TAG_LABEL, QUADRANTS } from "@/data/contextTags";
import type { DayPatterns as P } from "@/lib/dayPatterns";

// pleasant = warm/green, unpleasant = cool; the label is always written too
const TINT = { lively: "#fbe7b6", easy: "#dcebd5", edgy: "#e6dcf5", low: "#d9e5f5" } as const;

/** 상황 · 상태 · 마음 · 바람 over the report range — what showed up together, never why. */
export function DayPatterns({ p }: { p: P }) {
  const max = Math.max(1, ...Object.values(p.quadrants));
  const label = (xs: { id: keyof typeof CONTEXT_TAG_LABEL; days: number }[]) => xs.map((x) => `${CONTEXT_TAG_LABEL[x.id]} ${x.days}일`).join(", ");
  return (
    <SectionCard icon={<SproutLeafIcon />} title="나의 하루 패턴" aside={<span className="text-[11px] text-ink-300">맥락을 남긴 {p.taggedDays}일</span>}>
      <p className="mb-2 text-[12px] text-ink-500">마음의 네 갈래가 나온 날</p>
      <div className="grid grid-cols-2 gap-2">
        {QUADRANTS.map((q) => (
          <div key={q.id} className="rounded-2xl px-3 py-2.5" style={{ background: TINT[q.id] }}>
            <p className="flex items-baseline justify-between">
              <b className="text-[13px] text-ink-700">{q.label}</b>
              <span className="text-[18px] font-bold tabular-nums text-ink-700">
                {p.quadrants[q.id]}
                <span className="ml-0.5 text-[11px] font-normal text-ink-500">일</span>
              </span>
            </p>
            <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-white/70">
              <span className="block h-full rounded-full bg-ink-500/50" style={{ width: `${(p.quadrants[q.id] / max) * 100}%` }} />
            </span>
            {p.withQuadrant[q.id].length > 0 && <p className="mt-1.5 break-keep text-[11px] leading-snug text-ink-500">함께: {label(p.withQuadrant[q.id])}</p>}
          </div>
        ))}
      </div>
      {(p.needs.length > 0 || p.states.length > 0) && (
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 rounded-2xl bg-white/60 px-3.5 py-2.5 text-[12.5px]">
          {p.states.length > 0 && (
            <>
              <dt className="text-ink-500">자주 느낀 몸</dt>
              <dd className="text-ink-700">{label(p.states)}</dd>
            </>
          )}
          {p.needs.length > 0 && (
            <>
              <dt className="text-ink-500">자주 원한 것</dt>
              <dd className="text-ink-700">{label(p.needs)}</dd>
            </>
          )}
        </dl>
      )}
      <p className="mt-2 text-[11px] leading-relaxed text-ink-300">‘함께’는 그 마음과 같은 날 2일 이상 기록된 상황이에요. 함께 기록됐다는 뜻이지, 원인이라는 뜻은 아니에요.</p>
    </SectionCard>
  );
}
