import { analyzeCycle, groupPeriods } from "@/lib/cycle";
import { diffDays, type DateKey } from "@/lib/date";

/**
 * 오늘 몸속에서는 — where today falls in a textbook cycle, from the last logged
 * period start and the average cycle length (28 days without history).
 *  · ovulation (estimate) = cycle length − 14
 *  · 1–5 생리기 · 6 … ov−2 난포기 · ov−1 … ov+1 배란기 · then 황체기 until
 *    6 days before the expected start · the last 5 days before it: PMS 구간
 * A general picture estimated from dates — not a measurement.
 * ⚠️ 전문가 검토 전.
 */
export type BodyPhase = "period" | "follicular" | "ovulation" | "luteal" | "pms";
export const PHASE_ORDER: BodyPhase[] = ["period", "follicular", "ovulation", "luteal", "pms"];

export interface BodyToday {
  phase: BodyPhase;
  /** day of the cycle (1 = last logged start); can run past the cycle length when a start is late */
  day: number;
  cycleLength: number;
  ovulationDay: number;
  /** the expected next start has passed with no new start logged */
  late: boolean;
  /** the cycle length is the 28-day default (no cycle history yet) */
  defaultLength: boolean;
}

export function phaseOfDay(day: number, cycleLength: number): BodyPhase {
  const ov = cycleLength - 14;
  if (day <= 5) return "period";
  if (day >= ov - 1 && day <= ov + 1) return "ovulation";
  if (day >= cycleLength - 4) return "pms"; // the 5 days before the expected start (day L+1), and any later day
  if (day >= ov + 2) return "luteal";
  return "follicular";
}

/** null = no period logged yet (show the "log a start" hint instead) */
export function bodyToday(periodDays: DateKey[], today: DateKey): BodyToday | null {
  const days = periodDays.filter((d) => d <= today);
  const last = groupPeriods(days).pop();
  if (!last) return null;
  const info = analyzeCycle(days, today);
  const cycleLength = Math.round(info.avgCycle || 28);
  const day = diffDays(last.start, today) + 1;
  return { phase: phaseOfDay(day, cycleLength), day, cycleLength, ovulationDay: cycleLength - 14, late: day > cycleLength, defaultLength: info.cycleLengths.length === 0 };
}

/** the copy, as given (그대로 사용) */
export const PHASE_COPY: Record<BodyPhase, { name: string; headline: string; ovary: string; lining: string; hormone: string; temp: string; mood: string; img: string }> = {
  period: {
    name: "생리기",
    headline: "지난 주기의 내막을 내보내며 새로 시작하고 있어요",
    ovary: "다음 주기를 위한 작은 난포들이 준비를 시작해요",
    lining: "지난 주기에 쌓인 내막이 떨어져 나오는 중이에요",
    hormone: "에스트로겐·프로게스테론 모두 낮은 바닥이에요",
    temp: "낮은 구간이에요",
    mood: "몸이 무겁고 기운이 없을 수 있어요",
    img: "/body/phase-1.png",
  },
  follicular: {
    name: "난포기",
    headline: "난포 하나가 앞서 자라고 있어요",
    ovary: "한쪽 난소에서 우세 난포가 커지는 중이에요",
    lining: "에스트로겐 덕분에 다시 두꺼워지고 있어요",
    hormone: "에스트로겐 ↑ / 프로게스테론은 낮아요",
    temp: "낮은 구간을 유지해요",
    mood: "에너지와 집중력이 돌아오기 쉬운 때예요",
    img: "/body/phase-2.png",
  },
  ovulation: {
    name: "배란기",
    headline: "난자가 나팔관으로 출발해요",
    ovary: "다 자란 난포가 터지며 난자가 나와요",
    lining: "충분히 두꺼워진 상태예요",
    hormone: "에스트로겐 최고점 → LH 급상승",
    temp: "배란 뒤부터 오르기 시작해요",
    mood: "한쪽 아랫배가 살짝 당길 수 있어요",
    img: "/body/phase-3.png",
  },
  luteal: {
    name: "황체기",
    headline: "자궁내막이 폭신하게 영양을 채우고 있어요",
    ovary: "난자가 나온 자리가 황체로 바뀌어 프로게스테론을 만들어요",
    lining: "두께를 유지하며 부드러워지는 중이에요",
    hormone: "프로게스테론 ↑",
    temp: "0.3℃ 안팎 높은 구간이에요",
    mood: "차분해지거나 졸리고, 식욕이 늘 수 있어요",
    img: "/body/phase-4.png",
  },
  pms: {
    name: "PMS 구간",
    headline: "호르몬이 함께 내려가는 시간이에요",
    ovary: "임신이 되지 않으면 황체가 점점 줄어들어요",
    lining: "떨어져 나올 준비를 해요",
    hormone: "에스트로겐 ↓ / 프로게스테론 ↓",
    temp: "생리가 가까워지면 내려가기 시작해요",
    mood: "예민함, 불안, 서러움이 올라올 수 있어요. 의지 문제가 아니라 호르몬이 내려가는 구간이라 그래요",
    img: "/body/phase-5.png",
  },
};

export const BODY_NOTICE =
  "기록한 생리일로 추정한 일반적인 흐름이에요. 실제 몸을 측정한 것이 아니며, 피임이나 임신 계획에 사용할 수 없어요. 주기가 크게 불규칙하거나 통증이 심하면 산부인과 진료를 권해요.";
