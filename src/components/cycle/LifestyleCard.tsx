"use client";

import { useMemo } from "react";
import { LATE_SOURCES, LATE_CARDS } from "@/data/lateCycle";
import { useAppData } from "@/lib/data-store";
import { formatMonthDay, type DateKey } from "@/lib/date";
import { FACTOR_LABEL, LIFESTYLE, diffPhrase, lifestyleLink, type LifestyleLink } from "@/lib/pms/lifestyle";

/**
 * 생활과 주기 — "잠이 부족했던 주기에는 평균 4일 늦게 시작했어요". Describes the
 * user's own records side by side; never says why. Needs 3+ described cycles.
 * ⚠️ 전문가 검토 전.
 */
export function LifestyleCard({ today }: { today: DateKey }) {
  const data = useAppData();
  const link = useMemo(() => lifestyleLink(data, today), [data, today]);
  const shown = link.cycles.filter((c) => c.diff != null && c.days >= LIFESTYLE.minRecordedDays).slice(-6).reverse();

  return (
    <section className="glass rounded-[26px] p-4" aria-label="생활과 주기">
      <h2 className="text-[15px] font-bold text-ink-700">생활과 주기</h2>
      <p className="mt-0.5 text-[12px] text-ink-500">수면·스트레스·기분 기록과 생리 시작일을 나란히 놓아 봤어요.</p>

      {!link.enough ? (
        <div className="mt-2 rounded-2xl bg-white/70 px-3.5 py-3">
          <p className="text-[14px] font-bold text-ink-700">기록이 쌓이면 보여드릴게요</p>
          <p className="mt-1 break-keep text-[12.5px] leading-relaxed text-ink-500">
            컨디션(수면·스트레스)이나 기분을 {LIFESTYLE.minRecordedDays}일 이상 기록한 주기가 {LIFESTYLE.minCycles}번 쌓이면 비교해 볼게요. 지금 {link.usable}번이에요.
          </p>
          <div className="mt-2 flex gap-1" aria-hidden>
            {Array.from({ length: LIFESTYLE.minCycles }, (_, i) => (
              <span key={i} className={`h-1.5 flex-1 rounded-full ${i < link.usable ? "bg-sage-500" : "bg-[#e3dacd]"}`} />
            ))}
          </div>
        </div>
      ) : link.comparisons.length === 0 ? (
        <p className="mt-2 break-keep text-[13px] leading-relaxed text-ink-700">지금까지는 수면·스트레스·기분이 주기마다 비슷해서 나눠 비교할 만한 차이가 없었어요.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {link.comparisons.map((c) => (
            <li key={c.factor} className="rounded-2xl bg-white/80 px-3.5 py-3">
              <p className="break-keep text-[14px] leading-relaxed text-ink-700">
                {FACTOR_LABEL[c.factor].flagged}({c.flagged.n}번)에는 <b>{diffPhrase(c.flagged.meanDiff)}</b> 시작했어요.
              </p>
              <p className="mt-0.5 break-keep text-[12.5px] text-ink-500">
                {FACTOR_LABEL[c.factor].other}({c.other.n}번)에는 {diffPhrase(c.other.meanDiff)} 시작했어요.
              </p>
            </li>
          ))}
        </ul>
      )}

      {link.enough && shown.length > 0 && (
        <details className="mt-2 text-[12px] text-ink-500">
          <summary>주기별로 보기</summary>
          <table className="mt-1.5 w-full text-left tabular-nums">
            <thead>
              <tr className="text-[11px] text-ink-300">
                <th className="py-1 font-normal">시작일</th>
                <th className="py-1 font-normal">예상과 차이</th>
                <th className="py-1 font-normal">수면</th>
                <th className="py-1 font-normal">스트레스</th>
                <th className="py-1 font-normal">기분</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((c) => (
                <tr key={c.start} className="border-t border-[#efe6d8] text-ink-700">
                  <td className="py-1">{formatMonthDay(c.start)}</td>
                  <td className="py-1">{c.diff === 0 ? "0일" : `${c.diff! > 0 ? "+" : ""}${c.diff}일`}</td>
                  <td className="py-1">{c.sleep ?? "–"}</td>
                  <td className="py-1">{c.stress ?? "–"}</td>
                  <td className="py-1">{c.mood ?? "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-1 text-[11px] text-ink-300">수면·스트레스·기분은 그 주기에 기록한 날의 평균(1~5)이에요. 기록하지 않은 날은 세지 않았어요.</p>
        </details>
      )}

      <p className="mt-2 text-[11px] leading-relaxed text-ink-300">
        함께 나타난 기록이지, 원인이라고 말할 수는 없어요. 주기는 원래 조금씩 달라지고, 차이가 있다고 몸에 문제가 있다는 뜻은 아니에요. ⚠️ 전문가 검토 전
      </p>
    </section>
  );
}

/** "이번 달은 평소보다 늦어질 수 있어요" — next to the expected date, when this cycle's sleep/stress records were heavy. */
export function MayBeLaterLine({ link }: { link: LifestyleLink }) {
  if (!link.mayBeLater || !link.current) return null;
  const what = link.current.sleepLow && link.current.stressHigh ? "잠이 부족하고 스트레스가 많았던" : link.current.sleepLow ? "잠이 부족했던" : "스트레스가 많았던";
  const own = link.comparisons.find((c) => (c.factor === "sleep" && link.current!.sleepLow) || (c.factor === "stress" && link.current!.stressHigh));
  const card = LATE_CARDS.find((c) => c.id === "reasons");
  const src = LATE_SOURCES["nhs-missed"];
  return (
    <div className="mt-2 rounded-2xl bg-[#fff8e7] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[#7a5a14]">
      <p className="break-keep">
        이번 주기엔 {what} 날이 많았어요. 이번 달은 평소보다 늦어질 수 있어요 <span className="text-[11px]">(예측)</span>
      </p>
      {own && own.flagged.meanDiff > own.other.meanDiff && <p className="mt-0.5 break-keep text-[11.5px]">지난 기록에서도 {FACTOR_LABEL[own.factor].flagged}에는 {diffPhrase(own.flagged.meanDiff)} 시작했어요.</p>}
      <details className="mt-1 text-[10.5px] text-[#9a8250]">
        <summary>출처 · ⚠️ 전문가 검토 전</summary>
        <p className="mt-1">
          NHS는 생리가 늦어지는 흔한 이유 중 하나로 스트레스를 소개해요. {src.org} · {src.title} ({src.url}) · 열람 {src.accessed}
        </p>
        {card && <p className="mt-0.5 italic">{card.sources[0].quote}</p>}
      </details>
    </div>
  );
}
