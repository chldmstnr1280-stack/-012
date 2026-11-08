"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X } from "lucide-react";
import { HelpCard } from "@/components/pms/HelpCard";
import { playSfx } from "@/lib/sound/sfx";
import { isCrisis } from "@/lib/whine/safety";
import { KINDS, LINES, STEP_TEXT_MAX, TINIEST, WISH_TEXT_MAX, catOf, ladder, type WishKind } from "@/data/wishes";
import { makeWish, type Wish } from "@/lib/wish/wishes";
import type { DateKey } from "@/lib/date";

const now = () => Date.now();

type Stage = "kind" | "text" | "step" | "fold";

/** Make a wish: kind → words → one tiny step → fold it into a star. */
export function NewWishSheet({ today, onClose, onMade }: { today: DateKey; onClose: () => void; onMade: (w: Wish, said: string) => void }) {
  const reduce = useReducedMotion();
  const [stage, setStage] = useState<Stage>("kind");
  const [kind, setKind] = useState<WishKind>("dream");
  const [text, setText] = useState("");
  const [custom, setCustom] = useState("");
  const [crisis, setCrisis] = useState(false);

  const cat = catOf(text);
  const steps = ladder(cat);
  const choices: { step: string; idx: number }[] = [{ step: TINIEST, idx: -1 }, ...steps.slice(0, 3).map((step, idx) => ({ step, idx }))];

  const toStep = () => {
    if (!text.trim()) return;
    if (isCrisis(text)) return setCrisis(true);
    playSfx("tap");
    setStage("step");
  };

  const make = (step: string, stepIdx: number | null) => {
    if (!step.trim()) return;
    if (isCrisis(step)) return setCrisis(true);
    playSfx("cheer");
    const w = makeWish({ kind, text, cat, step, stepIdx }, today, now());
    setStage("fold");
    setTimeout(() => onMade(w, KINDS[kind].made), reduce ? 300 : 1700);
  };

  return (
    <motion.div className="absolute inset-0 z-50 flex items-end bg-[rgba(15,15,40,0.45)]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.section
        role="dialog"
        aria-modal="true"
        aria-label="소망 빌기"
        initial={{ y: 40 }}
        animate={{ y: 0 }}
        exit={{ y: 40 }}
        className="relative max-h-[88%] w-full overflow-y-auto rounded-t-[28px] bg-[#fdfaf3] px-5 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-5 text-ink-700"
      >
        {stage !== "fold" && (
          <button type="button" aria-label="닫기" onClick={onClose} className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full text-ink-300 active:bg-[#f3ece2]">
            <X size={20} />
          </button>
        )}

        {crisis ? (
          <div className="pt-2">
            <p className="whitespace-pre-line break-keep pr-8 text-[14.5px] leading-relaxed">{LINES.crisis}</p>
            <div className="mt-3">
              <HelpCard />
            </div>
            <button type="button" onClick={() => setCrisis(false)} className="mt-3 w-full rounded-2xl bg-white py-3 text-[13.5px] font-bold shadow-[0_4px_12px_-8px_rgba(110,88,60,0.45)] active:scale-95">
              돌아가기
            </button>
          </div>
        ) : stage === "kind" ? (
          <div>
            <h2 className="pr-8 text-[17px] font-bold">어떤 소망을 빌어 볼까?</h2>
            <div className="mt-4 grid gap-2">
              {(Object.keys(KINDS) as WishKind[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    playSfx("tap");
                    setKind(k);
                    setStage("text");
                  }}
                  className="rounded-2xl bg-white px-4 py-3.5 text-left shadow-[0_4px_12px_-8px_rgba(110,88,60,0.45)] active:scale-[0.98]"
                >
                  <span className="block text-[15px] font-bold">{KINDS[k].label}</span>
                  <span className="text-[12.5px] text-ink-500">{KINDS[k].hint}</span>
                </button>
              ))}
            </div>
          </div>
        ) : stage === "text" ? (
          <div>
            <h2 className="pr-8 text-[17px] font-bold">{KINDS[kind].label}</h2>
            <label htmlFor="wish-text" className="mt-1 block text-[13px] text-ink-500">
              {kind === "dream" ? "이루고 싶은 꿈을 적어 줘." : "요즘 마음속 소망을 적어 줘."}
            </label>
            <textarea
              id="wish-text"
              rows={2}
              value={text}
              maxLength={WISH_TEXT_MAX}
              onChange={(e) => setText(e.target.value)}
              placeholder={KINDS[kind].examples[0]}
              className="mt-2 w-full resize-none rounded-2xl border border-[#eadfce] bg-white px-4 py-3 text-[15px] outline-none focus:border-sage-300"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {KINDS[kind].examples.map((e) => (
                <button key={e} type="button" onClick={() => setText(e)} className="rounded-full bg-white px-3 py-1.5 text-[12.5px] shadow-[0_3px_10px_-7px_rgba(110,88,60,0.5)] active:scale-95">
                  {e}
                </button>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-[auto_1fr] gap-2">
              <button type="button" onClick={() => setStage("kind")} className="h-12 rounded-2xl px-4 text-[13.5px] text-ink-500 active:bg-[#f3ece2]">
                이전
              </button>
              <button type="button" disabled={!text.trim()} onClick={toStep} className="h-12 rounded-2xl bg-sage-500 text-[14.5px] font-bold text-white active:scale-95 disabled:opacity-40">
                다음
              </button>
            </div>
          </div>
        ) : stage === "step" ? (
          <div>
            <p className="whitespace-pre-line break-keep pr-8 text-[15px] font-bold leading-relaxed">{LINES.pickStep}</p>
            <p className="mt-1 text-[12.5px] text-ink-500">셀리가 매일 이 한 걸음만 살짝 물어볼게. 언제든 바꿀 수 있어.</p>
            <div className="mt-3 grid gap-2">
              {choices.map((c) => (
                <button key={c.step} type="button" onClick={() => make(c.step, c.idx)} className="rounded-2xl bg-white px-4 py-3 text-left text-[14px] shadow-[0_4px_12px_-8px_rgba(110,88,60,0.45)] active:scale-[0.98]">
                  🌱 {c.step}
                </button>
              ))}
            </div>
            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                make(custom, null);
              }}
            >
              <label htmlFor="wish-step" className="sr-only">
                한 걸음 직접 쓰기
              </label>
              <input
                id="wish-step"
                value={custom}
                maxLength={STEP_TEXT_MAX}
                onChange={(e) => setCustom(e.target.value)}
                placeholder="직접 쓰기 (예: 노트 펴 두기)"
                className="h-12 min-w-0 flex-1 rounded-2xl border border-[#eadfce] bg-white px-4 text-[14px] outline-none focus:border-sage-300"
              />
              <button type="submit" disabled={!custom.trim()} className="h-12 shrink-0 rounded-2xl bg-sage-500 px-4 text-[13.5px] font-bold text-white active:scale-95 disabled:opacity-40">
                이걸로
              </button>
            </form>
          </div>
        ) : (
          <div className="flex h-[260px] flex-col items-center justify-center" aria-live="polite">
            <AnimatePresence>
              <motion.div
                initial={{ scale: 1, rotate: 0, y: 0 }}
                animate={reduce ? { opacity: 1 } : { scale: [1, 0.6, 0.35], rotate: [0, 180, 360], y: [0, 0, -180], opacity: [1, 1, 0] }}
                transition={{ duration: 1.6, ease: "easeInOut" }}
                className="grid h-24 w-24 place-items-center rounded-[22px] bg-[linear-gradient(135deg,#fff3c4,#ffd6e0)] text-[44px] shadow-[0_0_30px_rgba(255,220,140,0.9)]"
                aria-hidden
              >
                {kind === "dream" ? "🌟" : "⭐"}
              </motion.div>
            </AnimatePresence>
            <p className="mt-4 text-[14px] font-bold">소망을 별로 접어서 하늘에 걸고 있어…</p>
          </div>
        )}
      </motion.section>
    </motion.div>
  );
}
