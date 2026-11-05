"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { motion } from "motion/react";
import { GreenhouseBackground } from "@/components/greenhouse/GreenhouseBackground";
import { useAmbience } from "@/lib/game/ambience";

/** Shared shell for secondary screens: greenhouse roof at the top fading into cream, large centred title. */
export function SubPage({ title, children }: { title: string; children: React.ReactNode }) {
  const tod = useAmbience();
  return (
    <main className="relative h-full overflow-clip bg-cream-50">
      <div className="absolute inset-x-0 top-0 h-[300px] overflow-hidden">
        <GreenhouseBackground anchor="top" tint={tod} />
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(253,251,246,0.1)] via-[rgba(253,251,246,0.6)] to-cream-50" />
      </div>
      <div className="relative z-10 flex h-full flex-col pt-[calc(env(safe-area-inset-top)+10px)]">
        <header className="relative flex h-[88px] shrink-0 items-end justify-center px-4 pb-2">
          <Link href="/" aria-label="홈으로" className="absolute left-2 top-0 grid h-11 w-11 place-items-center rounded-full text-white drop-shadow-[0_1px_3px_rgba(80,60,40,0.5)]">
            <ChevronLeft size={28} />
          </Link>
          <h1 className="text-[23px] font-bold tracking-tight text-ink-700 [text-shadow:0_1px_10px_rgba(255,250,240,0.9)]">{title}</h1>
        </header>
        <motion.div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(env(safe-area-inset-bottom)+96px)] pt-3"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </div>
    </main>
  );
}
