"use client";

import Link from "next/link";
import { SectionCard } from "@/components/ui/SectionCard";
import { SproutLeafIcon } from "@/components/ui/icons";
import { CONTEXT_TAG_LABEL } from "@/data/contextTags";
import { MIN_DAYS, type TagSummary } from "@/lib/pms/tags";

const DIR = { higher: "더 높았어요", similar: "비슷했어요", lower: "더 낮았어요" } as const;

/** Symptoms on days with a context tag, next to other recorded days. Descriptive only. */
export function TagReport({ s }: { s: TagSummary }) {
  if (!s.anyTags)
    return (
      <SectionCard icon={<SproutLeafIcon />} title="상황과 함께 본 증상">
        <p className="break-keep text-[12.5px] leading-relaxed text-ink-500">
          증상을 기록할 때 ‘오늘의 상황’(야근, 카페인, 운동 등)도 눌러 두면, 그런 날과 다른 날의 증상을 나란히 보여 줄게요.
        </p>
        <Link href="/record?tab=pms" className="mt-2.5 block h-10 rounded-full bg-sage-50 text-center text-[13px] font-bold leading-10 text-sage-700">
          오늘의 상황 기록하기
        </Link>
      </SectionCard>
    );

  const scale = (v: number) => `${(v / 4) * 100}%`;
  return (
    <SectionCard icon={<SproutLeafIcon />} title="상황과 함께 본 증상" aside={<span className="text-[11px] text-ink-300">최근 6개월</span>}>
      {s.rows.length ? (
        <ul className="flex flex-col gap-2.5">
          {s.rows.map((r) => (
            <li key={r.id} className="rounded-2xl bg-white/60 px-3.5 py-2.5">
              <p className="flex items-baseline justify-between gap-2 text-[13px]">
                <b className="text-ink-700">{CONTEXT_TAG_LABEL[r.id]}</b>
                <span className="text-[11.5px] text-ink-500">이런 날 증상이 {DIR[r.direction]}</span>
              </p>
              <Bar label={`있던 날 ${r.taggedDays}일`} value={r.taggedAvg} width={scale(r.taggedAvg)} strong />
              <Bar label={`다른 날 ${r.otherDays}일`} value={r.otherAvg} width={scale(r.otherAvg)} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[12.5px] text-ink-500">아직 비교할 만큼 모이지 않았어요.</p>
      )}
      {s.pending.length > 0 && (
        <p className="mt-2 text-[11.5px] leading-relaxed text-ink-500">
          조금 더 모이면 볼 수 있어요: {s.pending.map((p) => `${CONTEXT_TAG_LABEL[p.id]} ${p.taggedDays}일`).join(", ")} (각각 {MIN_DAYS}일 이상 필요)
        </p>
      )}
      <p className="mt-2 text-[11px] leading-relaxed text-ink-300">
        숫자는 그날 가장 높았던 증상 점수(0–4)의 평균이고, 증상을 기록한 날만 비교해요. 함께 기록됐다는 뜻이지, 그 상황이 증상의 원인이라는 뜻은 아니에요. 생리 주기 시기에 따라서도 달라질 수 있어요.
      </p>
    </SectionCard>
  );
}

function Bar({ label, value, width, strong }: { label: string; value: number; width: string; strong?: boolean }) {
  return (
    <div className="mt-1.5 flex items-center gap-2 text-[11.5px]">
      <span className="w-[70px] shrink-0 tabular-nums text-ink-500">{label}</span>
      <span className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-[#efe9df]">
        <span className="absolute inset-y-0 left-0 rounded-full" style={{ width, background: strong ? "#e9a092" : "#cdbfae" }} />
      </span>
      <span className="w-7 shrink-0 text-right font-bold tabular-nums text-ink-700">{value}</span>
    </div>
  );
}
