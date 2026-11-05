"use client";

import { SectionCard } from "@/components/ui/SectionCard";
import { SproutLeafIcon } from "@/components/ui/icons";
import { WATER_CUP_ML } from "@/data/nutrition";
import type { MealPatterns as P } from "@/lib/mealPatterns";

/** 먹은 것 — what was recorded, side by side with mood. No scores, no "should". */
export function MealPatterns({ p }: { p: P }) {
  return (
    <SectionCard icon={<SproutLeafIcon />} title="먹은 것" aside={<span className="text-[11px] text-ink-300">식사를 기록한 {p.mealDays}일</span>}>
      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label="채소·과일 있던 날" value={`${p.vegFruitDays}일`} />
        <Stat label="물 (기록한 날 평균)" value={p.water ? `${p.water.avg}컵` : "–"} sub={p.water ? `약 ${Math.round(p.water.avg * WATER_CUP_ML)} ml` : undefined} />
        <Stat label="걸른 끼니" value={`${p.skipped}번`} />
      </div>
      {p.top.length > 0 && (
        <p className="mt-3 break-keep text-[12.5px] leading-relaxed text-ink-700">
          <span className="text-ink-500">자주 먹은 것 </span>
          {p.top.map((t) => `${t.label} ${t.days}일`).join(" · ")}
        </p>
      )}
      {p.mood.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1.5">
          {p.mood.map((m) => (
            <li key={m.id} className="rounded-2xl bg-white/60 px-3.5 py-2 text-[12.5px] text-ink-700">
              <b>{m.label}</b> 먹은 날 기분 평균 <b className="tabular-nums">{m.withAvg}</b>
              <span className="text-ink-500">
                {" "}
                · 다른 날 <span className="tabular-nums">{m.withoutAvg}</span> ({m.withDays}일 / {m.withoutDays}일, 5점 만점)
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-2 text-[11px] leading-relaxed text-ink-300">기록한 날만 셌어요. 함께 기록됐다는 뜻이지, 그 음식 때문이라는 뜻은 아니에요.</p>
    </SectionCard>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl bg-white/70 px-1 py-2.5">
      <p className="text-[10.5px] text-ink-500">{label}</p>
      <p className="text-[18px] font-bold tabular-nums text-ink-700">{value}</p>
      {sub && <p className="text-[10px] text-ink-300">{sub}</p>}
    </div>
  );
}
