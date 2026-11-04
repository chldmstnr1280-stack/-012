"use client";

import { AnimatePresence, motion } from "motion/react";
import { Selly } from "@/components/selly/Selly";
import { useSelly } from "@/lib/selly-store";

const SPARKS = Array.from({ length: 12 }, (_, i) => ({
  a: (i / 12) * Math.PI * 2,
  d: 120 + (i % 3) * 26,
  s: 10 + (i % 3) * 5,
  c: ["#fff3c4", "#ffd7de", "#e3f2d3"][i % 3],
}));

export function LevelUpOverlay() {
  const { levelUp, dismissLevelUp } = useSelly();
  return (
    <AnimatePresence>
      {levelUp && (
        <motion.div
          key={levelUp.id}
          role="dialog"
          aria-label={`레벨 ${levelUp.level} 달성`}
          className="absolute inset-0 z-[60] grid place-items-center px-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button type="button" aria-label="닫기" onClick={dismissLevelUp} className="absolute inset-0 bg-[rgba(52,44,32,0.45)] backdrop-blur-[2px]" />
          <motion.div
            initial={{ scale: 0.85, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 240, damping: 20 }}
            className="relative w-full overflow-hidden rounded-[32px] bg-[radial-gradient(circle_at_50%_30%,#fffaf0,#f8efdc)] px-6 pb-6 pt-5 text-center shadow-[0_30px_60px_-20px_rgba(60,40,20,0.6)]"
          >
            <div className="relative mx-auto h-[170px] w-[170px]">
              <motion.div
                aria-hidden
                className="absolute inset-[-20%] rounded-full bg-[radial-gradient(closest-side,rgba(255,236,170,0.9),rgba(255,236,170,0))]"
                animate={{ scale: [0.9, 1.1, 0.9] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
              {SPARKS.map((p, i) => (
                <motion.span
                  key={i}
                  aria-hidden
                  className="absolute left-1/2 top-1/2"
                  style={{ width: p.s, height: p.s, marginLeft: -p.s / 2, marginTop: -p.s / 2 }}
                  initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                  animate={{ x: Math.cos(p.a) * p.d * 0.6, y: Math.sin(p.a) * p.d * 0.6, opacity: [0, 1, 0], scale: [0, 1, 0.5], rotate: 90 }}
                  transition={{ duration: 1.6, delay: 0.25 + (i % 4) * 0.08, ease: "easeOut" }}
                >
                  <svg viewBox="0 0 24 24" className="h-full w-full">
                    <path d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0Z" fill={p.c} />
                  </svg>
                </motion.span>
              ))}
              <Selly stage={levelUp.stage.id} pose="happy" className="relative w-full" />
            </div>
            <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-1 font-script text-[30px] leading-none text-sage-700">
              Level up
            </motion.p>
            <p className="mt-1 text-[22px] font-bold text-ink-700">Lv. {levelUp.level}</p>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-500">
              {levelUp.stageChanged ? (
                <>
                  셀리가 <b className="text-ink-700">{levelUp.stage.name}</b>
                  {levelUp.stage.ro} 자랐어요!
                  <br />
                  {levelUp.stage.line}
                </>
              ) : (
                <>
                  매일의 돌봄 덕분에
                  <br />
                  셀리가 한 뼘 더 자랐어요 ♡
                </>
              )}
            </p>
            <button
              type="button"
              onClick={dismissLevelUp}
              className="mt-5 h-12 w-full rounded-full bg-gradient-to-b from-[#9cc095] to-[#7ea47a] text-[15px] font-bold text-white shadow-[0_10px_24px_-10px_rgba(90,130,85,0.8)]"
            >
              고마워 ♡
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
