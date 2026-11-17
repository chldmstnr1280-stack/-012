"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useAppData } from "@/lib/data-store";
import { ACTIVITIES, awaitingAfter, updateCheckIn, type After } from "@/lib/checkin/checkin";
import { CARE_LABEL, HELPED_OPTIONS, careAwaiting, updateCare, type Helped } from "@/lib/pms/careMode";
import { playSfx } from "@/lib/sound/sfx";

const OPTIONS: { id: After; label: string }[] = [
  { id: "lighter", label: "조금 가벼워졌어" },
  { id: "same", label: "비슷해" },
  { id: "unsure", label: "잘 모르겠어" },
];

/**
 * After an activity picked from the check-in, Selly asks once — softly, optional —
 * how it feels now. The answer only feeds the user's own "작은 패턴".
 */
export function AfterCheck() {
  const { checkins, careLog } = useAppData();
  const [now, setNow] = useState(0);
  const [thanks, setThanks] = useState(false);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const t = setInterval(tick, 30_000);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, []);
  const ci = now ? awaitingAfter(checkins ?? [], now) : null;
  const care = now ? careAwaiting(careLog ?? [], now) : null;
  // one question at a time: the more recent choice
  const c = ci && (!care || (ci.chosenAt ?? 0) >= care.at) ? ci : null;
  const e = c ? null : care;

  const answerCare = (h: Helped) => {
    if (!e) return;
    playSfx("tap");
    updateCare(e.id, { helped: h });
    if (h !== "skip") {
      setThanks(true);
      setTimeout(() => setThanks(false), 2200);
    }
  };

  const answer = (a: After) => {
    if (!c) return;
    playSfx("tap");
    updateCheckIn(c.id, { after: a });
    if (a !== "skip") {
      setThanks(true);
      setTimeout(() => setThanks(false), 2200);
    }
  };

  return (
    <AnimatePresence>
      {(c || e || thanks) && (
        <motion.div
          key={thanks ? "thanks" : (c ?? e)!.id}
          role="dialog"
          aria-label="지금은 어때?"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          className="glass absolute inset-x-4 bottom-[calc(100%+8px)] z-20 rounded-[22px] !bg-[rgba(253,250,243,0.95)] px-3.5 py-2.5"
        >
          {thanks ? (
            <p className="py-1 text-center text-[13.5px] font-bold text-ink-700">알려 줘서 고마워 ♡</p>
          ) : e ? (
            <>
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-bold text-ink-700">
                  {CARE_LABEL[e.kind]}, 조금 도움이 되었나요? <span className="font-normal text-ink-500">(안 해도 돼)</span>
                </p>
                <button type="button" aria-label="닫기" onClick={() => answerCare("skip")} className="grid h-8 w-8 place-items-center rounded-full text-ink-300">
                  <X size={16} />
                </button>
              </div>
              <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                {HELPED_OPTIONS.map((o) => (
                  <button key={o.id} type="button" onClick={() => answerCare(o.id)} className="min-h-10 rounded-xl bg-white px-1 text-[11.5px] font-bold leading-tight text-ink-700 shadow-[0_3px_10px_-7px_rgba(110,88,60,0.5)] active:scale-95">
                    {o.label}
                  </button>
                ))}
              </div>
            </>
          ) : (
            c && (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-bold text-ink-700">
                    아까 {ACTIVITIES[c.chosen!].label}, 지금은 어때? <span className="font-normal text-ink-500">(안 해도 돼)</span>
                  </p>
                  <button type="button" aria-label="닫기" onClick={() => answer("skip")} className="grid h-8 w-8 place-items-center rounded-full text-ink-300">
                    <X size={16} />
                  </button>
                </div>
                <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                  {OPTIONS.map((o) => (
                    <button key={o.id} type="button" onClick={() => answer(o.id)} className="h-10 rounded-xl bg-white text-[12px] font-bold text-ink-700 shadow-[0_3px_10px_-7px_rgba(110,88,60,0.5)] active:scale-95">
                      {o.label}
                    </button>
                  ))}
                </div>
              </>
            )
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
