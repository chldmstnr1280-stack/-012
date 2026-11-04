"use client";

import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import type { SellyReaction } from "@/lib/selly-store";
import { HandHeartIcon, SunIcon, WateringCanIcon } from "@/components/ui/icons";

const actions: { type: SellyReaction; label: string; icon: React.ReactNode; tint: string }[] = [
  { type: "water", label: "물 주기", icon: <WateringCanIcon size={34} />, tint: "from-[#eef6fa] to-[#dcecf3]" },
  { type: "sun", label: "햇빛 주기", icon: <SunIcon />, tint: "from-[#fff8e6] to-[#fcecc4]" },
  { type: "pat", label: "쓰다듬기", icon: <HandHeartIcon />, tint: "from-[#fff1f2] to-[#fbdde0]" },
];

/** Floating care panel that sits above the dock while Selly stays visible. */
export function CareSheet({ open, onClose, onCare }: { open: boolean; onClose: () => void; onCare: (t: SellyReaction) => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-label="셀리 돌보기"
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="glass absolute inset-x-4 bottom-0 z-20 rounded-[30px] !bg-[rgba(253,250,243,0.95)] px-4 pb-4 pt-3"
        >
          <div className="mb-3 flex items-center justify-between pl-1">
            <p className="text-[15px] font-bold text-ink-700">셀리 돌보기</p>
            <button type="button" onClick={onClose} aria-label="닫기" className="grid h-9 w-9 place-items-center rounded-full bg-white/70 text-ink-500 active:scale-90">
              <X size={18} />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {actions.map((a) => (
              <motion.button
                key={a.type}
                type="button"
                whileTap={{ scale: 0.93 }}
                onClick={() => onCare(a.type)}
                className={`flex h-[86px] flex-col items-center justify-center gap-1.5 rounded-[22px] border border-white bg-gradient-to-b ${a.tint} text-[13px] font-bold text-ink-700 shadow-[0_6px_16px_-8px_rgba(110,88,60,0.35)]`}
              >
                {a.icon}
                {a.label}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
