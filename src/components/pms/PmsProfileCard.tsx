"use client";

import Link from "next/link";
import { SectionCard } from "@/components/ui/SectionCard";
import { SproutLeafIcon } from "@/components/ui/icons";
import { ONSET_OPTIONS, SYMPTOM_LABEL, type SymptomId } from "@/data/pmsSymptoms";
import { useAppData } from "@/lib/data-store";

/** Cycle analysis tab: the usual PMS pattern the user described, with a way to (re)answer. */
export function PmsProfileCard() {
  const { pmsProfile: p, cycleRecaps } = useAppData();
  const top = p ? (Object.entries(p.symptoms) as [SymptomId, number][]).filter(([, v]) => v >= 1).sort((a, b) => b[1] - a[1]).slice(0, 4) : [];
  const recapCount = Object.keys(cycleRecaps).length;
  return (
    <SectionCard icon={<SproutLeafIcon />} title="평소 PMS 패턴" aside={recapCount ? <span className="text-[11px] text-ink-300">주기별 돌아보기 {recapCount}번</span> : undefined}>
      {p ? (
        <p className="break-keep text-[13px] leading-relaxed text-ink-700">
          {p.onset && p.onset !== "unsure" ? `보통 생리 ${ONSET_OPTIONS.find((o) => o.id === p.onset)!.label}부터` : "시작 시점은 잘 모름"}
          {top.length ? ` · ${top.map(([id, v]) => `${SYMPTOM_LABEL[id]} ${v}`).join(", ")}` : " · 특별한 증상 없음"}
        </p>
      ) : (
        <p className="break-keep text-[13px] leading-relaxed text-ink-500">생리 전에 보통 어떤 변화가 있는지 알려 주면, 다음 주기를 미리 짐작해 볼 수 있어요.</p>
      )}
      <Link href="/pms/profile" className="mt-2.5 block h-10 rounded-full bg-sage-50 text-center text-[13px] font-bold leading-10 text-sage-700">
        {p ? "고치기" : "알려 주기 (1분)"}
      </Link>
    </SectionCard>
  );
}
