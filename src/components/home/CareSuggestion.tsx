"use client";

import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { ACTION_LABEL, type CareAction, type CareRule } from "@/data/careSuggestions";

/** "셀리의 제안" — a gentle, dismissible suggestion card near the top of the greenhouse. */
export function CareSuggestion({ rule, onAction, onDismiss }: { rule: CareRule | null; onAction: (a: CareAction) => void; onDismiss: () => void }) {
  return (
    <AnimatePresence>
      {rule && (
        <motion.section
          key={rule.id}
          role="dialog"
          aria-label="셀리의 제안"
          initial={{ opacity: 0, y: -12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, transition: { duration: 0.18 } }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          className="absolute inset-x-4 top-[calc(env(safe-area-inset-top)+150px)] z-[57] rounded-[26px] border border-white/90 bg-[rgba(255,253,249,0.94)] px-4 pb-4 pt-3 shadow-[0_16px_40px_-18px_rgba(110,88,60,0.55)]"
        >
          <div className="flex items-start justify-between gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#fdf3f3] px-2.5 py-0.5 text-[12px] font-bold text-[#b9727b]">셀리의 제안 ♡</span>
            <button type="button" aria-label="괜찮아, 닫기" onClick={onDismiss} className="-mr-1 -mt-0.5 grid h-8 w-8 place-items-center rounded-full text-ink-300 active:bg-[#f3ece2]">
              <X size={16} />
            </button>
          </div>
          <p className="mt-1.5 whitespace-pre-line break-keep text-[16px] font-bold leading-[1.45] text-ink-700">{rule.line}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {rule.actions.map((a, i) => (
              <button
                key={a}
                type="button"
                onClick={() => onAction(a)}
                className={`h-10 rounded-full px-4 text-[13.5px] font-bold active:scale-95 ${
                  i === 0 ? "bg-gradient-to-b from-[#9cc095] to-[#7ea47a] text-white shadow-[0_8px_18px_-10px_rgba(90,130,85,0.8)]" : "bg-sage-50 text-sage-700"
                }`}
              >
                {ACTION_LABEL[a]}
              </button>
            ))}
            <button type="button" onClick={onDismiss} className="h-10 rounded-full px-3 text-[13px] text-ink-500">
              괜찮아
            </button>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
