"use client";

import { AnimatePresence, motion } from "motion/react";

const OPTIONS: { label: string; hint: string; value: string }[] = [
  { label: "1,000걸음", hint: "약 10분", value: "1000" },
  { label: "2,000걸음", hint: "약 20분", value: "2000" },
  { label: "3,000걸음", hint: "약 30분", value: "3000" },
  { label: "자유 산책", hint: "원하는 만큼", value: "free" },
];

/** "셀리와 산책할까?" — opened from the greenhouse door or Selly's menu. */
export function WalkInvite({ open, onPick, onClose }: { open: boolean; onPick: (m: string) => void; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="absolute inset-0 z-[70] flex items-end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button type="button" aria-label="닫기" onClick={onClose} className="absolute inset-0 bg-[rgba(52,44,32,0.3)]" />
          <motion.div
            role="dialog"
            aria-label="셀리와 산책할까?"
            initial={{ y: 40 }}
            animate={{ y: 0 }}
            exit={{ y: 40 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative mx-3 mb-[calc(env(safe-area-inset-bottom)+12px)] w-full rounded-[28px] bg-cream-50 p-5 shadow-[0_-12px_40px_-16px_rgba(80,60,40,0.5)]"
          >
            <p className="text-center text-[18px] font-bold text-ink-700">셀리와 산책할까?</p>
            <p className="mt-1 text-center text-[12.5px] text-ink-500">100걸음마다 햇빛 조각 하나 ☀️ 같이 모으러 가자</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => onPick(o.value)}
                  className="flex h-14 flex-col items-center justify-center rounded-2xl bg-white text-[15px] font-bold text-sage-700 shadow-[0_4px_12px_-8px_rgba(110,88,60,0.45)] active:scale-95"
                >
                  {o.label}
                  <span className="text-[11px] font-normal text-ink-500">{o.hint}</span>
                </button>
              ))}
            </div>
            <button type="button" onClick={onClose} className="mt-2 h-11 w-full text-[14px] text-ink-500">
              다음에
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
