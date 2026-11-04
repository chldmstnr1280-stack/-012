import { currentPhase, type CycleInfo } from "@/lib/cycle";
import { formatMonthDay, type DateKey } from "@/lib/date";
import { DropIcon } from "@/components/ui/icons";
import { Flower } from "@/components/greenhouse/svg-kit";

export function CurrentCycleCard({ info, today }: { info: CycleInfo; today: DateKey }) {
  const p = currentPhase(info, today);
  let headline = "";
  let message = "";
  let sub = "";
  if (p.kind === "none") {
    headline = "아직 기록이 없어요";
    message = "달력에서 날짜를 눌러 생리일을 표시해 보세요.";
  } else if (p.kind === "period") {
    headline = `생리 ${p.day}일차`;
    message = "조금 더 따뜻하게, 천천히 쉬어가요. ♡";
  } else {
    headline = `주기 ${p.day}일차`;
    if (p.daysToNext != null && p.daysToNext < 0) {
      sub = `예정일이 ${-p.daysToNext}일 지났어요`;
      message = "주기는 조금씩 달라질 수 있어요. 시작하면 달력에 표시해 주세요.";
    } else if (p.daysToNext != null && p.daysToNext <= 3) {
      sub = p.daysToNext === 0 ? "오늘 생리 예정이에요" : `생리 예정 D-${p.daysToNext}`;
      message = "따뜻한 차 한 잔과 함께 몸을 챙겨줘요.";
    } else {
      sub = info.nextStart ? `다음 생리 예정 · ${formatMonthDay(info.nextStart)} (D-${p.daysToNext})` : "";
      message = p.ovulation || p.fertile ? "가임기로 예측되는 기간이에요. 몸의 신호에 귀 기울여 주세요." : "나에게 맞는 속도로 하루를 보내요. ♡";
    }
  }

  return (
    <section className="glass relative overflow-hidden rounded-[26px] p-5">
      <svg aria-hidden viewBox="0 0 120 70" className="absolute -right-2 -top-1 w-[120px] opacity-80">
        <Flower x={90} y={22} r={7} color="#ffffff" />
        <Flower x={106} y={40} r={5} color="#f6d4dc" />
        <Flower x={74} y={12} r={4} color="#fff7d6" />
        <path d="M70 60 Q 88 40 104 30" stroke="#b7d4b0" strokeWidth={1.4} fill="none" />
      </svg>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#fdeef0]">
          <DropIcon />
        </span>
        <div>
          <p className="text-[13px] text-ink-500">현재 주기</p>
          <p className="mt-0.5 text-[21px] font-bold text-ink-700">{headline}</p>
          {sub && <p className="mt-0.5 text-[13px] font-bold text-[#c45d6b]">{sub}</p>}
        </div>
      </div>
      <p className="mt-3 text-[13.5px] leading-relaxed text-ink-500">{message}</p>
    </section>
  );
}
