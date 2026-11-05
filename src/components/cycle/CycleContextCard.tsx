"use client";

import { setCycleContext, useAppData, type CycleContext } from "@/lib/data-store";

const OPTIONS: { value: NonNullable<CycleContext["hormonalContraception"]>; label: string }[] = [
  { value: "no", label: "아니요" },
  { value: "yes", label: "예" },
  { value: "unsure", label: "잘 모르겠어요" },
];

/** Optional context for reading cycles. Never required; can be cleared any time. */
export function CycleContextCard() {
  const { cycleContext } = useAppData();
  const v = cycleContext?.hormonalContraception;
  return (
    <section className="glass rounded-[26px] p-4">
      <h2 className="text-[15.5px] font-bold text-ink-700">주기 해석에 도움이 되는 정보</h2>
      <p className="mb-3 text-[12px] text-ink-500">선택 사항이에요. 언제든 비워둘 수 있어요.</p>
      <p className="mb-2 text-[13.5px] text-ink-700">호르몬 피임법(피임약, 호르몬 루프 등)을 사용하고 있나요?</p>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="호르몬 피임법 사용">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={v === o.value}
            onClick={() => setCycleContext({ hormonalContraception: v === o.value ? undefined : o.value })}
            className={`h-10 rounded-full px-4 text-[13px] font-bold transition ${v === o.value ? "bg-sage-500 text-white" : "bg-white/70 text-ink-500"}`}
          >
            {o.label}
          </button>
        ))}
      </div>
      {v === "yes" && (
        <p className="mt-2 text-[11.5px] leading-relaxed text-ink-500">호르몬 피임법을 쓰는 동안에는 출혈 패턴이 자연 주기와 다를 수 있어 예측이 맞지 않을 수 있어요.</p>
      )}
    </section>
  );
}
