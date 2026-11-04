"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { JournalIcon, LotusIcon, WateringCanIcon } from "@/components/ui/icons";

const sideCls =
  "glass flex h-[88px] w-[94px] flex-col items-center justify-center gap-1.5 rounded-[28px] text-[13.5px] font-bold text-ink-700 transition active:scale-95";

export function ActionDock({ onBreathe, onCare }: { onBreathe: () => void; onCare: () => void }) {
  return (
    <div className="relative flex items-center justify-between px-4">
      <Link href="/record" className={sideCls}>
        <JournalIcon />
        기록하기
      </Link>

      <motion.button
        type="button"
        onClick={onBreathe}
        whileTap={{ scale: 0.95 }}
        className="relative -my-3 grid h-[132px] w-[132px] place-items-center rounded-full"
      >
        {/* soft breathing halo */}
        <motion.span
          aria-hidden
          className="absolute inset-[-8px] rounded-full bg-[radial-gradient(closest-side,rgba(255,240,240,0.9),rgba(255,230,232,0))]"
          animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <span
          aria-hidden
          className="absolute inset-0 rounded-full border-[3px] border-white/85 bg-[radial-gradient(circle_at_50%_35%,#fbe3e4_0%,#f2c4c8_55%,#e9adb3_100%)] shadow-[0_14px_30px_-10px_rgba(196,120,128,0.6),inset_0_2px_10px_rgba(255,255,255,0.75),inset_0_-8px_18px_rgba(214,140,150,0.35)]"
        />
        <span className="relative flex flex-col items-center gap-1.5">
          <LotusIcon />
          <span className="text-[17px] font-bold text-white [text-shadow:0_1px_3px_rgba(180,100,110,0.55)]">호흡하기</span>
        </span>
      </motion.button>

      <button type="button" onClick={onCare} className={sideCls}>
        <WateringCanIcon />
        셀리 돌보기
      </button>
    </div>
  );
}
