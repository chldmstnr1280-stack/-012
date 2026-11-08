"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { X } from "lucide-react";
import { playSfx } from "@/lib/sound/sfx";
import { isCrisis } from "@/lib/whine/safety";
import { KINDS, LIGHTS_PER_LEVEL, LINES, STEP_TEXT_MAX } from "@/data/wishes";
import { bigger, canBigger, canSmaller, checkedOn, levelOf, smaller, type Wish } from "@/lib/wish/wishes";
import { putWish, removeWish } from "@/lib/data-store";
import { formatMonthDay, type DateKey } from "@/lib/date";

const now = () => Date.now();

/** One wish: its step (smaller / bigger / my own), lights, and came true / rest / remove. */
export function WishDetail({
  wish,
  today,
  onClose,
  onAsk,
  onSay,
  onDone,
}: {
  wish: Wish;
  today: DateKey;
  onClose: () => void;
  onAsk: () => void;
  onSay: (line: string) => void;
  onDone: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [own, setOwn] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const level = levelOf(wish);
  const did = wish.checks.filter((c) => c.a === "did").length;

  const save = (w: Wish, line: string) => {
    playSfx("tap");
    putWish(w);
    onSay(line);
  };
  const close = (w: Wish, line: string) => {
    save(w, line);
    onClose();
  };

  return (
    <motion.div className="absolute inset-0 z-50 flex items-end bg-[rgba(15,15,40,0.45)]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.section
        role="dialog"
        aria-modal="true"
        aria-label={wish.text}
        initial={{ y: 40 }}
        animate={{ y: 0 }}
        exit={{ y: 40 }}
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[88%] w-full overflow-y-auto rounded-t-[28px] bg-[#fdfaf3] px-5 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-5 text-ink-700"
      >
        <button type="button" aria-label="닫기" onClick={onClose} className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full text-ink-300 active:bg-[#f3ece2]">
          <X size={20} />
        </button>
        <p className="text-[12px] text-ink-500">
          {KINDS[wish.kind].label} · {formatMonthDay(wish.createdAt)}부터
        </p>
        <h2 className="mt-0.5 break-keep pr-8 text-[18px] font-bold">{wish.text}</h2>
        <p className="mt-2 text-[13px] text-ink-500">
          빛 {wish.light}개 · 별 {level + 1}단계 · 해 본 날 {did}일
        </p>
        <div aria-hidden className="mt-1.5 flex gap-1">
          {Array.from({ length: LIGHTS_PER_LEVEL }, (_, i) => (
            <span key={i} className={`h-2 w-2 rounded-full ${i < wish.light % LIGHTS_PER_LEVEL ? "bg-[#f2c94c]" : "bg-[#eadfce]"}`} />
          ))}
        </div>

        <div className="mt-4 rounded-2xl bg-white p-4 shadow-[0_4px_12px_-8px_rgba(110,88,60,0.45)]">
          <p className="text-[12px] text-ink-500">지금의 한 걸음</p>
          <p className="mt-0.5 text-[15px] font-bold">🌱 {wish.step}</p>
          {wish.status === "active" && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {canSmaller(wish) && (
                <button type="button" onClick={() => save(smaller(wish, now()), `${LINES.smaller}\n→ “${smaller(wish, now()).step}”`)} className="rounded-full bg-sage-50 px-3 py-1.5 text-[12.5px] font-bold text-sage-700 active:scale-95">
                  더 작게
                </button>
              )}
              {canBigger(wish) && (
                <button type="button" onClick={() => save(bigger(wish, now()), `${LINES.bigger}\n→ “${bigger(wish, now()).step}”`)} className="rounded-full bg-sage-50 px-3 py-1.5 text-[12.5px] font-bold text-sage-700 active:scale-95">
                  조금 더 해 볼래
                </button>
              )}
              <button type="button" onClick={() => setEditing((v) => !v)} className="rounded-full bg-sage-50 px-3 py-1.5 text-[12.5px] font-bold text-sage-700 active:scale-95">
                직접 바꾸기
              </button>
            </div>
          )}
          {editing && (
            <form
              className="mt-2 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const step = own.trim();
                if (!step || isCrisis(step)) return;
                setEditing(false);
                setOwn("");
                save({ ...wish, step: step.slice(0, STEP_TEXT_MAX), stepIdx: null, updatedAt: now() }, `좋아, 이제 “${step}”로 같이 가 보자.`);
              }}
            >
              <label htmlFor="own-step" className="sr-only">
                새 한 걸음
              </label>
              <input id="own-step" value={own} maxLength={STEP_TEXT_MAX} onChange={(e) => setOwn(e.target.value)} placeholder="새 한 걸음" className="h-11 min-w-0 flex-1 rounded-xl border border-[#eadfce] px-3 text-[14px] outline-none focus:border-sage-300" />
              <button type="submit" disabled={!own.trim()} className="h-11 rounded-xl bg-sage-500 px-3 text-[13px] font-bold text-white disabled:opacity-40">
                저장
              </button>
            </form>
          )}
        </div>

        <div className="mt-4 grid gap-2">
          {wish.status === "active" && !checkedOn(wish, today) && (
            <button type="button" onClick={onAsk} className="h-12 rounded-2xl bg-white text-[14px] font-bold shadow-[0_4px_12px_-8px_rgba(110,88,60,0.45)] active:scale-95">
              💬 오늘 안부 나누기
            </button>
          )}
          {wish.status !== "done" && (
            <button
              type="button"
              onClick={() => {
                playSfx("levelup");
                onDone();
                close({ ...wish, status: "done", doneAt: today, updatedAt: now() }, LINES.done);
              }}
              className="h-12 rounded-2xl bg-[linear-gradient(90deg,#ffe9a8,#ffd1dc)] text-[14px] font-bold text-[#5a3a2c] active:scale-95"
            >
              🎉 이뤘어!
            </button>
          )}
          {wish.status === "active" && (
            <button type="button" onClick={() => close({ ...wish, status: "resting", updatedAt: now() }, LINES.rest)} className="h-12 rounded-2xl bg-white text-[14px] font-bold shadow-[0_4px_12px_-8px_rgba(110,88,60,0.45)] active:scale-95">
              💤 잠깐 쉬어 둘래
            </button>
          )}
          {wish.status === "resting" && (
            <button type="button" onClick={() => close({ ...wish, status: "active", updatedAt: now() }, LINES.wake)} className="h-12 rounded-2xl bg-white text-[14px] font-bold shadow-[0_4px_12px_-8px_rgba(110,88,60,0.45)] active:scale-95">
              ☀️ 다시 깨우기
            </button>
          )}
          {confirmDelete ? (
            <div className="flex items-center justify-center gap-2 text-[13px]">
              <span className="text-ink-500">이 별을 지울까?</span>
              <button
                type="button"
                onClick={() => {
                  removeWish(wish.id);
                  onSay("응, 별을 내려 두었어. 언제든 새로 빌 수 있어.");
                  onClose();
                }}
                className="rounded-full bg-[#f6e3e3] px-3 py-1.5 font-bold text-[#9c3f4d]"
              >
                지우기
              </button>
              <button type="button" onClick={() => setConfirmDelete(false)} className="rounded-full px-3 py-1.5 text-ink-500">
                아니
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmDelete(true)} className="py-2 text-[12.5px] text-ink-300">
              별 지우기
            </button>
          )}
        </div>
      </motion.section>
    </motion.div>
  );
}
