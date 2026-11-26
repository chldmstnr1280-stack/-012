"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { LATE_CARDS, LATE_SOURCES } from "@/data/lateCycle";
import type { AppData } from "@/lib/data-store";
import type { DateKey } from "@/lib/date";
import { DEPARTMENT_NAME, URGENT_SIGNS, careSignal } from "@/lib/pms/careSignal";

/**
 * 진료 신호등 — always at the top of the report: "can I keep watching, or is it
 * time to ask a doctor, and where?" Only from the user's records and the
 * sourced "see a doctor if…" lines. ⚠️ 전문가 검토 전.
 */
export function CareSignalCard({ data, today }: { data: AppData; today: DateKey }) {
  const s = useMemo(() => careSignal(data, today), [data, today]);
  const [urgent, setUrgent] = useState(false);
  const consult = s.level === "consult";
  const doctor = LATE_CARDS.find((c) => c.id === "doctor");
  const little = s.basis.pmsCycles < 2 && s.basis.cycleLengths < 2;

  return (
    <section
      aria-label="진료 신호등"
      className={`rounded-[26px] border px-4 py-4 ${consult ? "border-[#f0d9a8] bg-[#fff8e7]" : "border-[#d9e8d3] bg-[#f3f8ef]"}`}
    >
      <div className="flex items-center gap-2">
        <span className="flex gap-1" aria-hidden>
          <span className={`h-3 w-3 rounded-full ${!consult ? "bg-[#6fae6a]" : "bg-[#d8d2c8]"}`} />
          <span className={`h-3 w-3 rounded-full ${consult ? "bg-[#e6b54a]" : "bg-[#d8d2c8]"}`} />
          <span className="h-3 w-3 rounded-full bg-[#d8d2c8]" />
        </span>
        <h2 className="text-[15px] font-bold text-ink-700">{consult ? "상담을 고려해 볼 만한 기록이 있어요" : "지금은 기록하며 지켜봐도 괜찮아요"}</h2>
      </div>

      {consult ? (
        <>
          <ul className="mt-2 space-y-1">
            {s.reasons.map((r) => (
              <li key={r.id} className="break-keep text-[13px] leading-relaxed text-ink-700">
                · {r.text}
              </li>
            ))}
          </ul>
          <p className="mt-2 break-keep text-[13px] text-ink-700">
            상담받을 수 있는 곳: <b>{s.departments.map((d) => DEPARTMENT_NAME[d]).join(" · ")}</b>
            {s.departments.includes("psy") && <span className="block text-[11.5px] text-ink-500">기분 증상이 두드러지게 기록돼서 정신건강의학과도 함께 알려 드려요.</span>}
          </p>
          <Link href="/report/clinical" className="mt-2.5 flex items-center justify-between rounded-2xl bg-white px-3.5 py-2.5 text-[13px] font-bold text-sage-700">
            <span>진료 때 보여 줄 요약 만들기</span>
            <ChevronRight size={16} />
          </Link>
        </>
      ) : (
        <p className="mt-1.5 break-keep text-[12.5px] leading-relaxed text-ink-500">
          {little
            ? "아직 기록이 적어서 판단할 수 있는 게 많지 않아요. 생리일과 증상, ‘일상생활에 영향이 있었는지’를 기록하면 더 정확히 알려 드릴게요."
            : "지금까지의 기록에서는 진료 상담을 권하는 기준(일상생활에 영향을 주는 증상, 불규칙한 주기 등)에 해당하는 게 없었어요."}
        </p>
      )}

      <button type="button" onClick={() => setUrgent((u) => !u)} aria-expanded={urgent} className="mt-2.5 flex w-full items-center gap-2 rounded-2xl bg-[#fdecec] px-3.5 py-2.5 text-left text-[12.5px] font-bold text-[#9c3f4d]">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#d9534f]" aria-hidden />
        <span className="flex-1">이럴 땐 기록과 상관없이 바로 진료를 받아요</span>
        <ChevronRight size={15} className={urgent ? "rotate-90 transition" : "transition"} />
      </button>
      {urgent && (
        <ul className="mt-1.5 space-y-1 px-1">
          {URGENT_SIGNS.map((u) => (
            <li key={u.text} className="break-keep text-[12.5px] leading-relaxed text-ink-700">
              · {u.text}
            </li>
          ))}
          <li className="text-[11.5px] text-ink-500">마음이 너무 힘들 땐 자살예방상담전화 109(24시간)에서 이야기를 들어 줄 수 있어요.</li>
        </ul>
      )}

      <details className="mt-2 text-[10.5px] text-ink-300">
        <summary>기준과 출처 · ⚠️ 전문가 검토 전</summary>
        <p className="mt-1">내 기록을 NHS의 ‘이럴 땐 진료를 받으세요’ 기준과 맞춰 본 거예요. 진단이 아니에요. 기록하지 않은 날은 세지 않았어요.</p>
        {doctor?.sources.map((src) => (
          <p key={src.id + src.quote.slice(0, 10)} className="mt-1">
            {LATE_SOURCES[src.id].title} ({LATE_SOURCES[src.id].url}) — <i>{src.quote}</i>
          </p>
        ))}
        <p className="mt-1">
          {LATE_SOURCES["nhs-ectopic"].title} ({LATE_SOURCES["nhs-ectopic"].url})
        </p>
      </details>
    </section>
  );
}
