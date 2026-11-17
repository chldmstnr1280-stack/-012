"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Heart, X } from "lucide-react";
import { HEAVY_NOTE, LETTER_BY_ID, SCIENCE_ACCESSED, SCIENCE_BY_ID, SCIENCE_SOURCES, SIGNATURE } from "@/data/letters";
import type { LetterRec } from "@/lib/letters/engine";
import { markLetter } from "@/lib/letters/client";
import { formatShort } from "@/lib/date";
import { playSfx } from "@/lib/sound/sfx";

/**
 * A letter from Selly: first a sealed envelope (tap the flower seal), then the
 * card. Reading it is enough — the button, if any, is optional.
 */
export function LetterView({ letter, sealed, onClose }: { letter: LetterRec; sealed?: boolean; onClose: () => void }) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(!sealed);
  const tpl = LETTER_BY_ID[letter.tpl];
  const card = letter.card ? SCIENCE_BY_ID[letter.card] : null;
  if (!tpl) return null;

  const unseal = () => {
    playSfx("cheer");
    setOpen(true);
    if (!letter.read) markLetter(letter.id, { read: true });
  };

  return (
    <motion.div className="fixed inset-0 z-[90] flex items-center justify-center bg-[rgba(60,45,30,0.4)] px-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <AnimatePresence mode="wait">
        {!open ? (
          <motion.button
            key="env"
            type="button"
            aria-label="편지 열기"
            onClick={(e) => {
              e.stopPropagation();
              unseal();
            }}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.8, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.05, y: -10 }}
            className="relative h-[200px] w-[min(86vw,320px)] rounded-[18px] bg-[linear-gradient(160deg,#fffaf2,#f6ead9)] shadow-[0_24px_50px_-20px_rgba(60,40,20,0.6)]"
          >
            {/* envelope flap */}
            <svg viewBox="0 0 320 120" className="absolute inset-x-0 top-0 w-full" aria-hidden>
              <path d="M0 0 L160 100 L320 0 Z" fill="#f1dfc8" />
            </svg>
            {/* flower seal */}
            <motion.span
              className="absolute left-1/2 top-[86px] grid h-14 w-14 -translate-x-1/2 place-items-center rounded-full bg-[radial-gradient(circle_at_40%_35%,#f6b8c4,#d9788d)] text-[24px] shadow-[0_4px_12px_-4px_rgba(150,60,80,0.7)]"
              animate={reduce ? undefined : { scale: [1, 1.08, 1] }}
              transition={{ duration: 1.6, repeat: Infinity }}
              aria-hidden
            >
              🌸
            </motion.span>
            <span className="absolute inset-x-0 bottom-5 text-center text-[13px] text-[#8a6f60]">셀리가 보낸 편지 · 꽃을 눌러 열어 봐</span>
          </motion.button>
        ) : (
          <motion.article
            key="card"
            role="dialog"
            aria-label="셀리의 편지"
            onClick={(e) => e.stopPropagation()}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, rotate: -1.5 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            exit={{ opacity: 0 }}
            className="relative max-h-[86dvh] w-[min(90vw,360px)] overflow-y-auto rounded-[22px] bg-[#fffdf8] px-6 pb-5 pt-6 shadow-[0_24px_50px_-20px_rgba(60,40,20,0.6)] [background-image:repeating-linear-gradient(transparent,transparent_31px,#f3e9da_32px)]"
          >
            <button type="button" aria-label="닫기" onClick={onClose} className="absolute right-2.5 top-2.5 grid h-9 w-9 place-items-center rounded-full text-ink-300">
              <X size={18} />
            </button>
            <p className="text-[11.5px] text-ink-300">{formatShort(letter.date)}</p>
            <div className="mt-2 space-y-1">
              {tpl.lines.map((l) => (
                <p key={l} className="break-keep text-[16px] leading-8 text-ink-700">
                  {l}
                </p>
              ))}
            </div>
            <p className="mt-3 text-right text-[13.5px] text-[#8a6f60]">{SIGNATURE}</p>
            {tpl.heavy && <p className="mt-2 text-[11.5px] leading-relaxed text-ink-500">{HEAVY_NOTE}</p>}

            {letter.pattern && (
              <section className="mt-4 rounded-2xl bg-[#f4f1fa] px-4 py-3" aria-label="나의 패턴 카드">
                <p className="text-[12px] font-bold text-[#6d5a92]">📊 네 기록에서 찾은 것</p>
                <p className="mt-1 break-keep text-[13.5px] leading-relaxed text-ink-700">{letter.pattern}</p>
                <p className="mt-1 text-[11px] text-ink-500">함께 나타난 것이지, 원인이라고 말할 수는 없어.</p>
              </section>
            )}
            {card && (
              <section className="mt-4 rounded-2xl bg-[#eef5e9] px-4 py-3" aria-label="셀리의 과학 카드">
                <p className="text-[12px] font-bold text-sage-700">🔬 알고 있었어? · {card.title}</p>
                <p className="mt-1 break-keep text-[13.5px] leading-relaxed text-ink-700">{card.fact}</p>
                {card.why && <p className="mt-1 break-keep text-[12.5px] leading-relaxed text-ink-500">{card.why}</p>}
                <p className="mt-1.5 text-[12.5px] text-ink-700">
                  <b>작게 해 보기</b> · {card.tryIt}
                </p>
                {card.action && (
                  <Link href={card.action.href} onClick={onClose} className="mt-2 inline-block rounded-full bg-white px-3 py-1.5 text-[12px] font-bold text-sage-700">
                    {card.action.label}
                  </Link>
                )}
                <details className="mt-2 text-[10.5px] text-ink-300">
                  <summary>출처 · ⚠️ 전문가 검토 전</summary>
                  <p className="mt-1">
                    {SCIENCE_SOURCES[card.source].title} ({SCIENCE_SOURCES[card.source].url}) · 검토 {SCIENCE_SOURCES[card.source].reviewed} · 열람 {SCIENCE_ACCESSED}
                  </p>
                  <p className="mt-0.5 italic">{card.quote}</p>
                </details>
              </section>
            )}

            <div className="mt-4 flex items-center gap-2">
              {tpl.action && (
                <Link href={tpl.action.href} onClick={onClose} className="flex-1 rounded-2xl bg-sage-500 py-3 text-center text-[13.5px] font-bold text-white">
                  {tpl.action.label}
                </Link>
              )}
              <button
                type="button"
                aria-pressed={!!letter.fav}
                aria-label={letter.fav ? "마음에 든 편지 해제" : "마음에 든 편지로 표시"}
                onClick={() => markLetter(letter.id, { fav: !letter.fav })}
                className="grid h-11 w-11 place-items-center rounded-2xl bg-[#fbeef1] text-[#d9788d]"
              >
                <Heart size={18} fill={letter.fav ? "#d9788d" : "none"} />
              </button>
              <button type="button" onClick={onClose} className={`${tpl.action ? "" : "flex-1 "}rounded-2xl bg-[#f3ece2] px-4 py-3 text-[13.5px] font-bold text-ink-700`}>
                편지함에 넣기
              </button>
            </div>
          </motion.article>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
