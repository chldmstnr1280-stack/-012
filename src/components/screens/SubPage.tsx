"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { motion } from "motion/react";
import { GreenhouseBackground } from "@/components/greenhouse/GreenhouseBackground";

/** Shared shell for secondary screens: greenhouse light at the top fading into cream. */
export function SubPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="relative h-full overflow-clip bg-cream-50">
      <div className="absolute inset-x-0 top-0 h-[300px] overflow-hidden">
        <GreenhouseBackground anchor="top" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[rgba(253,251,246,0.55)] to-cream-50" />
      </div>
      <div className="relative z-10 flex h-full flex-col pt-[calc(env(safe-area-inset-top)+14px)]">
        <header className="relative flex h-12 items-center justify-center px-4">
          <Link href="/" aria-label="홈으로" className="absolute left-3 grid h-11 w-11 place-items-center rounded-full text-ink-700">
            <ChevronLeft size={26} />
          </Link>
          <h1 className="text-[19px] font-bold text-ink-700">{title}</h1>
        </header>
        <motion.div
          className="min-h-0 flex-1 overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+96px)] pt-4"
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
