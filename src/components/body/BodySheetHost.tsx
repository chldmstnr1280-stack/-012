"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { BodyScene } from "./BodyScene";
import { logEvent } from "@/lib/analytics/events";
import { bodyToday, PHASE_COPY, type BodyToday } from "@/lib/body/phase";
import { getData, onHealthChange } from "@/lib/data-store";
import { toKey } from "@/lib/date";
import { useTossBack } from "@/lib/platform/back";

/**
 * "지금 몸속은 이래요" — right after a period day is recorded (anywhere in the
 * app), a bottom sheet shows today's scene. At most once a day; a run of days
 * marked together counts as one.
 */
let shownOn: string | null = null;

export function BodySheetHost() {
  const router = useRouter();
  const [body, setBody] = useState<BodyToday | null>(null);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | null = null;
    const off = onHealthChange((e) => {
      if (e.kind !== "period" || !e.on) return;
      const today = toKey(new Date());
      if (!e.days.some((d) => d <= today) || shownOn === today) return;
      if (t) clearTimeout(t);
      // let the record and any toast settle first
      t = setTimeout(() => {
        const b = bodyToday(getData().periodDays, today);
        if (!b) return;
        shownOn = today;
        setBody(b);
        logEvent("body_sheet_after_period_log");
      }, 900);
    });
    return () => {
      off();
      if (t) clearTimeout(t);
    };
  }, []);

  const close = () => setBody(null);
  useTossBack(!!body, close);
  const c = body ? PHASE_COPY[body.phase] : null;

  return (
    <AnimatePresence>
      {body && c && (
        <motion.div className="absolute inset-0 z-[85] flex items-end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button type="button" aria-label="닫기" onClick={close} className="absolute inset-0 bg-[rgba(52,40,32,0.35)]" />
          <motion.section
            role="dialog"
            aria-label="지금 몸속은 이래요"
            initial={{ y: 60 }}
            animate={{ y: 0 }}
            exit={{ y: 60 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative w-full rounded-t-[30px] bg-cream-50 px-5 pb-[calc(env(safe-area-inset-bottom)+18px)] pt-4 shadow-[0_-14px_40px_-16px_rgba(80,60,40,0.5)]"
          >
            <button type="button" aria-label="닫기" onClick={close} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full text-ink-300">
              <X size={18} />
            </button>
            <p className="text-center text-[15px] font-bold text-ink-700">지금 몸속은 이래요</p>
            <BodyScene phase={body.phase} className="mx-auto mt-1 w-[min(62vw,240px)]" />
            <p className="text-center text-[12px] font-bold text-[#b9727b]">
              주기 {body.day}일차 · {c.name} · 추정
            </p>
            <p className="mt-1 break-keep text-center text-[14.5px] font-bold text-ink-700">{c.headline}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" onClick={close} className="h-11 rounded-2xl bg-white text-[13.5px] font-bold text-ink-500 shadow-sm">
                닫기
              </button>
              <button
                type="button"
                onClick={() => {
                  close();
                  router.push("/body");
                }}
                className="h-11 rounded-2xl bg-gradient-to-b from-[#f0a9b8] to-[#de8a9d] text-[13.5px] font-bold text-white"
              >
                자세히 보기
              </button>
            </div>
            <p className="mt-2 text-center text-[10px] text-ink-300">기록한 생리일로 추정한 일반적인 흐름이에요. 측정한 값이 아니에요.</p>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
