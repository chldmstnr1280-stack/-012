import type { CycleInfo } from "@/lib/cycle";
import { diffDays, formatMonthDay, type DateKey } from "@/lib/date";
import { CYCLE_COLORS as C } from "./colors";
import { CycleContextCard } from "./CycleContextCard";
import { PmsProfileCard } from "@/components/pms/PmsProfileCard";

function StatTile({ label, value, unit, note }: { label: string; value: string; unit?: string; note?: string }) {
  return (
    <div className="glass flex flex-col rounded-[22px] px-3 py-3.5">
      <span className="text-[12px] text-ink-500">{label}</span>
      <span className="mt-1 text-[24px] font-bold leading-none tabular-nums text-ink-700">
        {value}
        {unit && <span className="ml-0.5 text-[13px] font-normal text-ink-500">{unit}</span>}
      </span>
      {note && <span className="mt-1.5 text-[11px] text-ink-300">{note}</span>}
    </div>
  );
}

export function CycleAnalysis({ info, today }: { info: CycleInfo; today: DateKey }) {
  const recent = info.cycleLengths.slice(-6).reverse();
  const max = Math.max(40, ...recent.map((c) => c.length));
  const estimated = info.cycleLengths.length === 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2">
        <StatTile label="평균 주기" value={String(info.avgCycle)} unit="일" note={estimated ? "기본값" : `최근 ${Math.min(6, info.cycleLengths.length)}회`} />
        <StatTile label="평균 생리 기간" value={String(info.avgPeriod)} unit="일" note={info.periods.length ? undefined : "기본값"} />
        <StatTile
          label="다음 예정일"
          value={info.nextStart ? formatMonthDay(info.nextStart) : "–"}
          note={info.nextStart ? `D-${Math.max(0, diffDays(today, info.nextStart))}` : "기록 필요"}
        />
      </div>

      {info.irregular && (
        <p className="rounded-2xl border border-[#efd9a8] bg-[#fff8e7] px-4 py-3 text-[12.5px] leading-relaxed text-[#8a6a2c]">
          최근 주기 길이의 차이가 커서 예정일 예측이 평소보다 덜 정확할 수 있어요. 예측은 참고로만 봐 주세요.
        </p>
      )}

      <section className="glass rounded-[26px] p-4">
        <h2 className="text-[15.5px] font-bold text-ink-700">최근 주기 길이</h2>
        <p className="mb-3 text-[12px] text-ink-500">생리 시작일부터 다음 시작일까지</p>
        {recent.length === 0 ? (
          <p className="rounded-2xl bg-white/60 px-4 py-6 text-center text-[13px] leading-relaxed text-ink-500">
            생리일을 두 번 이상 기록하면
            <br />
            나의 주기 흐름을 볼 수 있어요.
          </p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {recent.map((c) => {
              const off = c.length - info.avgCycle;
              return (
                <li key={c.start} className="grid grid-cols-[44px_1fr_52px] items-center gap-2">
                  <span className="text-[12px] tabular-nums text-ink-500">{formatMonthDay(c.start)}</span>
                  <span className="h-3 overflow-hidden rounded-full bg-[#efe9de]">
                    <span className="block h-full rounded-full bg-sage-500" style={{ width: `${(c.length / max) * 100}%` }} />
                  </span>
                  <span className="text-right text-[13px] tabular-nums text-ink-700">
                    {c.length}일
                    {off !== 0 && <span className="ml-0.5 text-[10.5px] text-ink-300">{off > 0 ? `+${off}` : off}</span>}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="glass rounded-[26px] p-4">
        <h2 className="mb-3 text-[15.5px] font-bold text-ink-700">생리 기록</h2>
        {info.periods.length === 0 ? (
          <p className="text-center text-[13px] text-ink-300">아직 기록된 생리가 없어요</p>
        ) : (
          <ul className="flex flex-col divide-y divide-[#efe7da]">
            {info.periods
              .slice(-6)
              .reverse()
              .map((p) => (
                <li key={p.start} className="flex items-center justify-between py-2.5 text-[13.5px]">
                  <span className="flex items-center gap-2 text-ink-700">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: C.period }} />
                    {formatMonthDay(p.start)} – {formatMonthDay(p.end)}
                  </span>
                  <span className="tabular-nums text-ink-500">{p.length}일</span>
                </li>
              ))}
          </ul>
        )}
      </section>

      <PmsProfileCard />
      <CycleContextCard />

      <p className="px-2 text-center text-[11.5px] leading-relaxed text-ink-300">
        예측은 기록한 날짜를 바탕으로 한 참고용이에요. 피임이나 의료적 판단에 사용하지 말고,
        <br />
        몸이 걱정될 때는 전문의와 상담해 주세요. 기록은 이 기기에만 저장돼요.
      </p>
    </div>
  );
}
