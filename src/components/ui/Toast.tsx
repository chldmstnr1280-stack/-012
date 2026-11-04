"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useSelly } from "@/lib/selly-store";

export function Toast() {
  const { toast } = useSelly();
  const [visibleId, setVisibleId] = useState<number | null>(null);

  useEffect(() => {
    if (!toast) return;
    const show = setTimeout(() => setVisibleId(toast.id), 0);
    const hide = setTimeout(() => setVisibleId(null), 2200);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, [toast]);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-[calc(env(safe-area-inset-top)+64px)] z-50 flex justify-center px-6">
      <AnimatePresence>
        {toast && visibleId === toast.id && (
          <motion.div
            key={toast.id}
            role="status"
            initial={{ opacity: 0, y: -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            className="glass rounded-full px-5 py-2.5 text-[13.5px] text-ink-700"
          >
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
