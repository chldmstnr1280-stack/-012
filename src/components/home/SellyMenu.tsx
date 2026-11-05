"use client";

import { AnimatePresence, motion } from "motion/react";
import { Footprints, Hand, HeartHandshake, MessageCircleHeart, Sofa, Wind } from "lucide-react";

export type SellyMenuAction = "talk" | "kindness" | "pet" | "rest" | "breathe" | "walk";

const ITEMS: { id: SellyMenuAction; label: string; icon: React.ReactNode }[] = [
  { id: "talk", label: "이야기하기", icon: <MessageCircleHeart size={18} /> },
  { id: "kindness", label: "마음 전하기", icon: <HeartHandshake size={18} /> },
  { id: "pet", label: "쓰다듬기", icon: <Hand size={18} /> },
  { id: "rest", label: "함께 쉬기", icon: <Sofa size={18} /> },
  { id: "breathe", label: "호흡하기", icon: <Wind size={18} /> },
  { id: "walk", label: "산책하기", icon: <Footprints size={18} /> },
];

/** Small menu that opens when Selly is touched. */
export function SellyMenu({ open, onPick, onClose }: { open: boolean; onPick: (a: SellyMenuAction) => void; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <button type="button" aria-label="메뉴 닫기" className="absolute inset-0 z-[55] cursor-default" onClick={onClose} />
          <motion.div
            role="menu"
            aria-label="셀리와 무엇을 할까?"
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
            className="glass absolute inset-x-5 top-[calc(env(safe-area-inset-top)+150px)] z-[56] grid grid-cols-3 gap-0.5 rounded-[24px] p-2"
          >
            {ITEMS.map((it) => (
              <button
                key={it.id}
                type="button"
                role="menuitem"
                onClick={() => onPick(it.id)}
                className="flex flex-col items-center gap-1 whitespace-nowrap rounded-2xl py-2 text-[11px] font-bold text-ink-700 active:bg-sage-50"
              >
                <span className="grid h-9 w-9 place-items-center rounded-full bg-sage-50 text-sage-700">{it.icon}</span>
                {it.label}
              </button>
            ))}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
