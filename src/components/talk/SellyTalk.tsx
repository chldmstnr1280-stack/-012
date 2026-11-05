"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { TALK, TALK_START, type TalkAction, type TalkChoice } from "@/data/sellyConversations";
import { playSfx } from "@/lib/sound/sfx";
import { TalkIconView } from "./TalkIcons";

const TYPE_MS = 42;
const LINE_PAUSE_MS = 900;

/**
 * "이야기하기" conversation layer (Phase B), following the dialogue UI reference:
 * a named speech bubble top-left and up to four icon choices stacked on the right.
 * Selly herself stays in the greenhouse; `onAction` moves her / opens other screens.
 */
export function SellyTalk({ open, onAction, onClose }: { open: boolean; onAction: (a: TalkAction) => void; onClose: () => void }) {
  return <AnimatePresence>{open && <Conversation onAction={onAction} onClose={onClose} />}</AnimatePresence>;
}

function Conversation({ onAction, onClose }: { onAction: (a: TalkAction) => void; onClose: () => void }) {
  const [nodeId, setNodeId] = useState(TALK_START);
  const [lineIdx, setLineIdx] = useState(0);
  const [typed, setTyped] = useState(0);
  const node = TALK[nodeId];
  const line = node.say[lineIdx] ?? "";
  const lineDone = typed >= line.length;
  const lastLine = lineIdx >= node.say.length - 1;
  const showChoices = lineDone && lastLine;
  const actionRef = useRef(onAction);
  useEffect(() => {
    actionRef.current = onAction;
  }, [onAction]);

  // a new node: Selly reacts / moves
  useEffect(() => {
    if (node.action) actionRef.current(node.action);
    playSfx("greet");
  }, [nodeId, node.action]);

  // typewriter, then the next line
  useEffect(() => {
    if (!lineDone) {
      const t = setTimeout(() => setTyped((n) => n + 1), TYPE_MS);
      return () => clearTimeout(t);
    }
    if (!lastLine) {
      const t = setTimeout(() => {
        setLineIdx((i) => i + 1);
        setTyped(0);
      }, LINE_PAUSE_MS);
      return () => clearTimeout(t);
    }
  }, [typed, lineDone, lastLine]);

  const skip = () => setTyped(line.length);

  const pick = (c: TalkChoice) => {
    playSfx("tap");
    if (c.action) onAction(c.action);
    if (c.action === "breathe" || c.action === "record") return; // these leave the conversation
    if (c.next) {
      setNodeId(c.next);
      setLineIdx(0);
      setTyped(0);
    }
  };

  const choices: TalkChoice[] = node.choices ?? [];

  return (
    <motion.div className="absolute inset-0 z-[65]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-label="셀리와 이야기하기">
      {/* soft wash for legibility, the greenhouse stays visible */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[rgba(253,248,238,0.55)] via-[rgba(253,248,238,0.12)] to-transparent" />

      <button
        type="button"
        aria-label="대화 끝내기"
        onClick={onClose}
        className="glass absolute right-4 top-[calc(env(safe-area-inset-top)+18px)] grid h-10 w-10 place-items-center rounded-full text-ink-500 active:scale-90"
      >
        <X size={18} />
      </button>

      {/* Selly's bubble */}
      <div className="absolute left-4 right-16 top-[calc(env(safe-area-inset-top)+74px)]">
        <span className="relative z-10 ml-5 inline-flex items-center gap-1 rounded-full border border-white/90 bg-[#fdf3f3] px-3 py-1 text-[13px] font-bold text-[#b9727b] shadow-[0_4px_12px_-6px_rgba(150,90,90,0.5)]">
          셀리
          <svg viewBox="0 0 24 22" className="h-3 w-3.5" aria-hidden>
            <path d="M12 19.5 C 5.5 14.5 2 11.2 2 7.4 C 2 4.6 4.2 2.5 6.9 2.5 C 8.9 2.5 10.9 3.7 12 5.6 C 13.1 3.7 15.1 2.5 17.1 2.5 C 19.8 2.5 22 4.6 22 7.4 C 22 11.2 18.5 14.5 12 19.5Z" fill="#f2a9b3" />
          </svg>
        </span>
        <button
          type="button"
          onClick={skip}
          className="relative -mt-2 block w-full max-w-[300px] rounded-[30px] border border-white/90 bg-[rgba(255,253,249,0.95)] px-6 pb-5 pt-6 text-left shadow-[0_16px_40px_-16px_rgba(110,88,60,0.45)]"
        >
          <span className="sr-only">{node.say.join(" ")}</span>
          <AnimatePresence mode="wait">
            <motion.p
              key={`${nodeId}-${lineIdx}`}
              aria-hidden
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.12 } }}
              className="min-h-[2.8em] whitespace-pre-line break-keep text-[19px] font-bold leading-[1.45] text-ink-700"
            >
              {line.slice(0, typed)}
              {!lineDone && <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] animate-pulse bg-ink-300" />}
            </motion.p>
          </AnimatePresence>
          {/* tail toward Selly (lower left) */}
          <svg className="absolute -bottom-[14px] left-[54px]" width="26" height="16" viewBox="0 0 26 16" aria-hidden>
            <path d="M2 0 C 6 6 4 12 0 16 C 10 14 18 8 24 0 Z" fill="rgba(255,253,249,0.95)" />
          </svg>
        </button>
      </div>

      {/* choices, stacked on the right */}
      <div className="absolute right-4 top-[calc(env(safe-area-inset-top)+218px)] flex w-[min(250px,66vw)] flex-col gap-2.5">
        <AnimatePresence mode="popLayout">
          {showChoices &&
            (choices.length
              ? choices.map((c, i) => (
                  <motion.button
                    key={`${nodeId}-${c.label}`}
                    type="button"
                    onClick={() => pick(c)}
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0, transition: { delay: i * 0.08, type: "spring", stiffness: 260, damping: 24 } }}
                    exit={{ opacity: 0, x: 12, transition: { duration: 0.12 } }}
                    whileTap={{ scale: 0.97 }}
                    className="flex h-[54px] items-center gap-3 rounded-full border border-white/90 bg-[rgba(255,253,249,0.94)] pl-3 pr-5 text-left text-[15px] font-bold break-keep text-ink-700 shadow-[0_10px_24px_-14px_rgba(110,88,60,0.55)]"
                  >
                    {c.icon && (
                      <span className="grid h-9 w-9 shrink-0 place-items-center">
                        <TalkIconView icon={c.icon} />
                      </span>
                    )}
                    {c.label}
                  </motion.button>
                ))
              : (
                  <motion.button
                    key={`${nodeId}-close`}
                    type="button"
                    onClick={onClose}
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex h-[54px] items-center justify-center rounded-full bg-gradient-to-b from-[#9cc095] to-[#7ea47a] text-[15px] font-bold text-white shadow-[0_10px_24px_-12px_rgba(90,130,85,0.8)]"
                  >
                    {node.closeLabel ?? "고마워 ♡"}
                  </motion.button>
                ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
