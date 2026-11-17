"use client";

import { useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { useAppData } from "@/lib/data-store";
import type { DateKey } from "@/lib/date";
import { careRecap } from "@/lib/pms/careRecap";
import { readGame, updateGame } from "@/lib/game/gameStore";

/** 지난 주기 돌아보기 — optional, closable, and only built from real records. */
export function CareRecapCard({ today }: { today: DateKey }) {
  const data = useAppData();
  const r = careRecap(data, today);
  const [closed, setClosed] = useState<string[]>(() => (typeof window === "undefined" ? [] : readGame().recapClosed ?? []));
  if (!r || closed.includes(r.start)) return null;
  return (
    <section className="glass relative rounded-[26px] p-5" aria-label="지난 주기 돌아보기">
      <button
        type="button"
        aria-label="닫기"
        onClick={() => {
          const next = [...closed, r.start].slice(-12);
          updateGame(() => ({ recapClosed: next }));
          setClosed(next);
        }}
        className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full text-ink-300"
      >
        <X size={16} />
      </button>
      <p className="text-[13px] text-ink-500">지난 주기 돌아보기</p>
      <ul className="mt-1.5 space-y-1 pr-6">
        {r.lines.map((l) => (
          <li key={l} className="break-keep text-[14px] leading-relaxed text-ink-700">
            {l}
          </li>
        ))}
      </ul>
      {r.helpedKinds.length > 0 && <p className="mt-2 text-[13px] text-ink-700">다음 주기에도 비슷한 돌봄을 선택해 볼까요?</p>}
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Link href="/pms/care" className="rounded-full bg-sage-50 px-3.5 py-2 text-[12.5px] font-bold text-sage-700">
          돌봄 모드 열기
        </Link>
        <Link href={`/pms/recap?start=${r.start}`} className="rounded-full bg-white/80 px-3.5 py-2 text-[12.5px] text-ink-500">
          생리 전엔 어땠는지 남기기
        </Link>
      </div>
      <p className="mt-2 text-[10.5px] text-ink-300">내가 남긴 기록만 모았어요. ‘도움이 되었어요’는 내 느낌이고, 그 돌봄의 의학적 효과를 뜻하지는 않아요.</p>
    </section>
  );
}
