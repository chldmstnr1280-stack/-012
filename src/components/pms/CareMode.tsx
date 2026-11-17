"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { SubPage } from "@/components/screens/SubPage";
import { analyzeCycle } from "@/lib/cycle";
import { useAppData } from "@/lib/data-store";
import { addDays, formatMonthDay, useToday } from "@/lib/date";
import { analysePms } from "@/lib/pms/analysis";
import { forecastPms } from "@/lib/pms/forecast";
import { CARE_ITEMS, CARE_LABEL, HELPED_OPTIONS, chooseCare, deleteCare, updateCare, type CareSource } from "@/lib/pms/careMode";
import { playSfx } from "@/lib/sound/sfx";

/**
 * PMS 돌봄 모드 — a short list of ways to look after yourself. Choosing one is
 * optional, not finishing it is fine, and "did it help?" is optional too.
 * Open any time; around the expected pre-period window it says so, gently.
 */
export function CareMode() {
  const router = useRouter();
  const today = useToday();
  const data = useAppData();
  const [from, setFrom] = useState<CareSource>("self");
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("from");
    const t = setTimeout(() => setFrom(q === "pms" || q === "late" ? q : "self"), 0);
    return () => clearTimeout(t);
  }, []);

  const fc = useMemo(() => {
    if (!today) return null;
    const info = analyzeCycle(data.periodDays, today);
    return forecastPms(data, info, analysePms(data.periodDays, data.symptoms, today, info.nextStart));
  }, [data, today]);

  const inWindow = !!today && !!fc?.window.has(today);
  const soon = !!today && !!fc && !inWindow && [1, 2, 3].some((n) => fc.window.has(addDays(today, n)));
  const log = data.careLog ?? [];
  const todays = today ? log.filter((c) => c.date === today) : [];
  // what the user said helped before (their own words only)
  const helpedBefore = [...new Set(log.filter((c) => c.helped === "yes").map((c) => c.kind))];

  const pick = (kind: (typeof CARE_ITEMS)[number]["kind"]) => {
    playSfx("tap");
    chooseCare(kind, from === "self" && (inWindow || soon) ? "pms" : from);
    router.push(CARE_ITEMS.find((c) => c.kind === kind)!.href);
  };

  return (
    <SubPage title="돌봄 모드">
      <section className="glass rounded-[26px] p-5">
        {inWindow || soon ? (
          <>
            <p className="break-keep text-[16px] font-bold leading-relaxed text-ink-700">
              {soon ? "곧 생리 전 기간이 시작될 것으로 예상돼요." : "생리 전 기간으로 예상되는 때예요."}
            </p>
            <p className="mt-1 break-keep text-[14px] leading-relaxed text-ink-700">이번 주에는 나를 조금 더 세심하게 돌봐볼까요?</p>
            <p className="mt-2 text-[11.5px] leading-relaxed text-ink-500">최근 기록을 바탕으로 예상한 기간이에요. 실제 증상 발생 시점은 달라질 수 있어요.</p>
          </>
        ) : from === "late" ? (
          <>
            <p className="break-keep text-[16px] font-bold leading-relaxed text-ink-700">기다리는 동안 마음이 쓰이는 건 자연스러워요.</p>
            <p className="mt-1 text-[14px] leading-relaxed text-ink-700">지금 나에게 필요한 걸 하나만 골라 볼까요?</p>
          </>
        ) : (
          <>
            <p className="break-keep text-[16px] font-bold leading-relaxed text-ink-700">언제든 나를 돌보는 시간을 가져도 좋아요.</p>
            <p className="mt-1 text-[14px] leading-relaxed text-ink-700">지금 끌리는 걸 하나만 골라 봐요.</p>
          </>
        )}
      </section>

      <ul className="mt-3 grid gap-2">
        {CARE_ITEMS.map((c) => (
          <li key={c.kind}>
            <button type="button" onClick={() => pick(c.kind)} className="flex min-h-[60px] w-full items-center gap-3 rounded-[20px] bg-white/85 px-4 py-2.5 text-left shadow-[0_4px_12px_-8px_rgba(110,88,60,0.45)] active:scale-[0.99]">
              <span className="text-[22px]" aria-hidden>
                {c.emoji}
              </span>
              <span className="flex-1">
                <span className="block text-[14.5px] font-bold text-ink-700">{c.label}</span>
                <span className="text-[12px] text-ink-500">{c.hint}</span>
              </span>
              {helpedBefore.includes(c.kind) && <span className="rounded-full bg-sage-50 px-2 py-0.5 text-[10.5px] font-bold text-sage-700">지난번에 도움됐어요</span>}
            </button>
          </li>
        ))}
      </ul>

      {todays.length > 0 && (
        <section className="glass mt-4 rounded-[24px] p-4">
          <h2 className="text-[14px] font-bold text-ink-700">오늘 고른 돌봄</h2>
          <ul className="mt-2 space-y-2">
            {todays.map((e) => (
              <li key={e.id} className="rounded-2xl bg-white/80 px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold text-ink-700">{CARE_LABEL[e.kind]}</span>
                  <button type="button" aria-label="이 기록 지우기" onClick={() => deleteCare(e.id)} className="grid h-8 w-8 place-items-center rounded-full text-ink-300 active:bg-[#f3ece2]">
                    <Trash2 size={14} />
                  </button>
                </div>
                {e.helped && e.helped !== "skip" ? (
                  <p className="text-[12px] text-ink-500">{HELPED_OPTIONS.find((o) => o.id === e.helped)?.label}</p>
                ) : (
                  <>
                    <p className="mt-0.5 text-[12px] text-ink-500">조금 도움이 되었나요? (안 해도 돼요)</p>
                    <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                      {HELPED_OPTIONS.map((o) => (
                        <button key={o.id} type="button" onClick={() => updateCare(e.id, { helped: o.id, done: true })} className="min-h-9 rounded-xl bg-[#f6f1e8] px-1 text-[11.5px] font-bold leading-tight text-ink-700 active:scale-95">
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-4 flex flex-col items-center gap-2">
        <button type="button" onClick={() => router.push("/")} className="h-12 w-full rounded-2xl bg-[#f3ece2] text-[14px] font-bold text-ink-700 active:scale-95">
          오늘은 그냥 둘래요
        </button>
        {fc?.nextStart && (inWindow || soon) && <p className="text-[11px] text-ink-500">다음 생리 예정(예측) {formatMonthDay(fc.nextStart)}</p>}
        <Link href="/report" className="text-[12px] text-ink-500 underline underline-offset-2">
          지난 주기 돌아보기 · 내 패턴
        </Link>
      </div>
      <p className="mt-3 px-2 text-center text-[11px] leading-relaxed text-ink-300">
        하지 못해도 괜찮아요. 고른 것과 ‘도움이 되었나요’ 답은 이 기기와 기록 파일에만 저장돼요. 도움이 되었다고 해도, 그 돌봄이 의학적으로 효과가 있다는 뜻은 아니에요.
      </p>
    </SubPage>
  );
}
