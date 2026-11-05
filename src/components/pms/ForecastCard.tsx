"use client";

import Link from "next/link";
import { CalendarHeart, ChevronRight } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { SYMPTOM_LABEL } from "@/data/pmsSymptoms";
import { addDays, diffDays, formatMonthDay, type DateKey } from "@/lib/date";
import { SOURCE_LABEL, type PmsForecast } from "@/lib/pms/forecast";
import { INTENSITY_FILL, INTENSITY_INK } from "./colors";

/** "다음 주기 미리 보기" — the user's own pattern played forward, with its source always named. */
export function ForecastCard({ f, today, hasProfile, recapDue }: { f: PmsForecast; today: DateKey; hasProfile: boolean; recapDue: DateKey | null }) {
  const from = f.nextStart && f.onset ? addDays(f.nextStart, -f.onset) : null;
  const empty = !f.onset && !f.symptoms.length;
  return (
    <SectionCard icon={<CalendarHeart size={20} className="text-[#c9707a]" />} title="다음 주기 미리 보기" aside={<span className="text-[11px] text-ink-300">참고</span>}>
      {empty ? (
        <p className="break-keep text-[13px] leading-relaxed text-ink-500">
          평소 PMS가 어떤지 알려 주면, 매일 기록이 쌓이기 전에도 다음 주기를 미리 짐작해 볼 수 있어요.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5 text-[13px] text-ink-700">
          {f.nextStart && (
            <p>
              다음 생리 예정 <b className="tabular-nums">{formatMonthDay(f.nextStart)}</b>
              <span className="text-ink-500"> (예측{f.nextStart > today ? ` · D-${diffDays(today, f.nextStart)}` : ""})</span>
            </p>
          )}
          {f.onset != null && (
            <p className="break-keep">
              증상은 보통 <b>약 {f.onset}일 전</b>부터{from && <span className="tabular-nums"> — {formatMonthDay(from)}쯤부터</span>}
              {f.onsetSource && <Source s={SOURCE_LABEL[f.onsetSource]} />}
            </p>
          )}
          {f.symptoms.length > 0 && (
            <div>
              <p className="mb-1.5">
                함께 올 수 있는 증상{f.symptomSource && <Source s={SOURCE_LABEL[f.symptomSource]} />}
              </p>
              <ul className="flex flex-wrap gap-1.5">
                {f.symptoms.map((s) => (
                  <li key={s.id} className="rounded-full px-3 py-1 text-[12.5px] font-bold" style={{ background: INTENSITY_FILL[s.score], color: INTENSITY_INK[s.score] }}>
                    {SYMPTOM_LABEL[s.id]} {s.score}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!f.nextStart && <p className="text-[12px] text-ink-500">생리 시작일을 기록하면 날짜도 함께 보여 줄게요.</p>}
          {f.irregular && <p className="text-[12px] text-[#7a5a14]">주기 길이 차이가 커서 날짜가 덜 정확할 수 있어요.</p>}
        </div>
      )}

      <div className="mt-3 flex flex-col gap-1.5">
        {recapDue && (
          <Link href={`/pms/recap?start=${recapDue}`} className="flex items-center gap-2 rounded-2xl bg-[#fdf3f4] px-3.5 py-2.5 text-[13px] font-bold text-[#9c3f4d]">
            <span className="flex-1">{formatMonthDay(recapDue)}에 시작한 주기, 생리 전엔 어땠어?</span>
            <ChevronRight size={16} />
          </Link>
        )}
        <Link
          href="/pms/profile"
          className={`flex items-center gap-2 rounded-2xl px-3.5 py-2.5 text-[13px] font-bold ${hasProfile ? "bg-white/60 text-ink-500" : "bg-sage-50 text-sage-700"}`}
        >
          <span className="flex-1">{hasProfile ? "평소 PMS 패턴 고치기" : "평소 PMS 패턴 알려 주기 (1분)"}</span>
          <ChevronRight size={16} />
        </Link>
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-ink-300">
        내 기록을 앞으로 이어 본 참고용이에요. 기록이 쌓일수록 ‘평소 패턴’보다 ‘주기별 돌아보기’, 그다음 ‘지난 주기 기록’을 우선해요. 진단이 아니에요.
      </p>
    </SectionCard>
  );
}

function Source({ s }: { s: string }) {
  return <span className="ml-1.5 inline-block rounded-full bg-[#f1ece3] px-2 py-0.5 align-middle text-[10.5px] font-normal text-ink-500">{s} 기준</span>;
}
