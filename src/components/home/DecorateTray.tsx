"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, Lock, Trash2 } from "lucide-react";
import { DECO_ITEMS } from "@/data/gardenItems";

/** Bottom tray in decorate mode: pick an item for the chosen slot. */
export function DecorateTray({
  open,
  slot,
  current,
  onPick,
  onRemove,
  onDone,
}: {
  open: boolean;
  slot: string | null;
  current?: string;
  onPick: (itemId: string) => void;
  onRemove: () => void;
  onDone: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="absolute inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+10px)] z-[66] rounded-[28px] border border-white/80 bg-[rgba(253,250,243,0.96)] p-4 shadow-[0_-10px_40px_-16px_rgba(80,60,40,0.55)]"
          role="dialog"
          aria-label="온실 꾸미기"
        >
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[16px] font-bold text-ink-700">온실 꾸미기</p>
              <p className="text-[12px] text-ink-500">{slot ? "놓을 것을 골라주세요" : "온실의 + 자리를 눌러 골라요"}</p>
            </div>
            <button type="button" onClick={onDone} className="flex h-10 items-center gap-1 rounded-full bg-sage-500 px-4 text-[14px] font-bold text-white active:scale-95">
              <Check size={16} strokeWidth={3} /> 완료
            </button>
          </div>
          <div className={`-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 transition-opacity ${slot ? "" : "pointer-events-none opacity-45"}`} role="listbox" aria-label="꾸미기 아이템">
            {slot && current && (
              <button type="button" onClick={onRemove} className="flex w-[74px] shrink-0 flex-col items-center gap-1 rounded-2xl border border-[#f0cfd3] bg-[#fdf3f4] py-2 text-[11.5px] font-bold text-[#b4505e]">
                <span className="grid h-12 place-items-center">
                  <Trash2 size={20} />
                </span>
                치우기
              </button>
            )}
            {DECO_ITEMS.map((it) => {
              const on = current === it.id;
              return (
                <button
                  key={it.id}
                  type="button"
                  role="option"
                  aria-selected={on}
                  disabled={!it.src}
                  onClick={() => it.src && onPick(it.id)}
                  className={`flex w-[74px] shrink-0 flex-col items-center gap-1 rounded-2xl py-2 text-[11.5px] leading-tight text-ink-700 transition ${
                    on ? "bg-white shadow-[0_0_0_2px_#8faf91]" : "bg-white/70"
                  } disabled:opacity-60`}
                >
                  <span className="grid h-12 w-12 place-items-center">
                    {it.src ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={it.src} alt="" className="max-h-12 max-w-12 object-contain" draggable={false} />
                    ) : (
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-[#efe9de] text-ink-300">
                        <Lock size={15} />
                      </span>
                    )}
                  </span>
                  <span className="px-1 text-center">{it.name}</span>
                  {!it.src && <span className="text-[10px] text-ink-300">준비 중</span>}
                </button>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
