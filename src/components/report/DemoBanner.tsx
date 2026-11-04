"use client";

import { replaceAll } from "@/lib/data-store";
import { useSelly } from "@/lib/selly-store";

export function DemoBanner() {
  const { showToast } = useSelly();
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#efd9a8] bg-[#fff8e7] px-4 py-2.5">
      <p className="flex-1 text-[12.5px] leading-snug text-[#8a6a2c]">지금은 예시 데이터예요</p>
      <button
        type="button"
        onClick={() => {
          replaceAll({ entries: {}, periodDays: [], demo: false });
          showToast("예시 데이터를 지웠어요");
        }}
        className="shrink-0 rounded-full bg-white px-3 py-1.5 text-[12.5px] font-bold text-[#8a6a2c] shadow-sm"
      >
        지우기
      </button>
    </div>
  );
}
