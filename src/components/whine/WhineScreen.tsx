"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, SendHorizontal } from "lucide-react";
import { WhineSelly } from "./WhineSelly";
import { HelpCard } from "@/components/pms/HelpCard";
import { useSelly } from "@/lib/selly-store";
import { playSfx } from "@/lib/sound/sfx";
import { IS_TOSS } from "@/lib/platform";
import { askSelly, readAIChoice, saveAIChoice, type AIChoice } from "@/lib/whine/client";
import { isCrisis } from "@/lib/whine/safety";
import { MAX_INPUT, type WhineAction, type WhineAnimation, type WhineMode } from "@/lib/whine/types";

const QUICK = ["😫 집 가고 싶어!", "😤 아 진짜 짜증 나!", "😭 너무 힘들어!", "🥺 나 좀 위로해 줘!", "😴 아무것도 하기 싫어!"];

const MODE_INFO: Record<WhineMode, { label: string; hello: string; switched: string; anim: WhineAnimation }> = {
  together: {
    label: "같이 징징대기 😫",
    hello: "징징대러 왔구나!! 다 말해, 셀리가 같이 투덜대 줄게!",
    switched: "좋아!! 이제부터 같이 징징대자!!",
    anim: "WHINING",
  },
  listen: {
    label: "그냥 들어줘 🥺",
    hello: "응, 나 여기 있어. 하고 싶은 말 천천히 해 줘.",
    switched: "응, 이제 조용히 들을게.",
    anim: "LISTENING",
  },
};

const ACTION_INFO: Record<Exclude<WhineAction, "help">, { label: string; href: string }> = {
  breathe: { label: "🫁 같이 숨 고르기", href: "/?do=breathe" },
  walk: { label: "🌿 셀리와 산책하기", href: "/walk" },
  rest: { label: "☁️ 잠깐 쉬어가기", href: "/?do=rest" },
};

const ENDINGS = [
  { label: "🌷 정원으로 돌아가기", href: "/" },
  { label: "🌿 셀리와 산책하기", href: "/walk" },
  { label: "☁️ 잠깐 쉬어가기", href: "/?do=rest" },
];

interface Msg {
  id: number;
  role: "user" | "selly";
  text: string;
  action?: WhineAction | null;
}

/**
 * 셀리에게 징징대기 — vent to Selly. The conversation lives only in this
 * component's memory: it is not saved, not added to mood records, and is gone
 * when the screen closes. Replies come from /api/whine (web, if the user
 * allowed AI) or from built-in lines on the device.
 */
export function WhineScreen() {
  const router = useRouter();
  const { setImmersive } = useSelly();
  const [mode, setMode] = useState<WhineMode>("together");
  const [msgs, setMsgs] = useState<Msg[]>(() => [{ id: 0, role: "selly", text: MODE_INFO.together.hello }]);
  const [anim, setAnim] = useState<WhineAnimation>("HAPPY");
  const [beat, setBeat] = useState(0);
  const [busy, setBusy] = useState(false);
  const [ended, setEnded] = useState(false);
  const [input, setInput] = useState("");
  // AI choice: read after mount (localStorage), null = not asked yet
  const [ai, setAI] = useState<AIChoice | "loading">(IS_TOSS ? "off" : "loading");
  const [noticeOpen, setNoticeOpen] = useState(false);
  const nextId = useRef(1);
  const listRef = useRef<HTMLDivElement>(null);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    setImmersive(true);
    return () => {
      alive.current = false;
      setImmersive(false);
    };
  }, [setImmersive]);

  useEffect(() => {
    if (IS_TOSS) return;
    const c = readAIChoice();
    // one-time read of a per-device setting after mount
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAI(c);
    if (c === null) setNoticeOpen(true);
  }, []);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [msgs, ended]);

  const show = (a: WhineAnimation) => {
    setAnim(a);
    setBeat((b) => b + 1);
  };

  const sellySays = (text: string, a: WhineAnimation, action: WhineAction | null = null) => {
    setMsgs((m) => [...m, { id: nextId.current++, role: "selly", text, action }]);
    show(a);
  };

  const send = async (raw: string) => {
    const text = raw.trim().slice(0, MAX_INPUT);
    if (!text || busy) return;
    playSfx("tap");
    setInput("");
    setEnded(false);
    const crisis = isCrisis(text);
    // after a crisis expression Selly stays calm for the rest of the visit
    const useMode: WhineMode = crisis ? "listen" : mode;
    if (crisis) setMode("listen");
    const history = [...msgs.slice(1), { id: nextId.current++, role: "user" as const, text }];
    setMsgs((m) => [...m, history[history.length - 1]]);
    show("LISTENING");
    setBusy(true);
    const { reply } = await askSelly(
      useMode,
      history.map(({ role, text }) => ({ role, text })),
      ai === "on",
    );
    if (!alive.current) return;
    setBusy(false);
    sellySays(reply.message, reply.animation, reply.suggestedAction);
  };

  const switchMode = () => {
    const next: WhineMode = mode === "together" ? "listen" : "together";
    playSfx("tap");
    setMode(next);
    sellySays(MODE_INFO[next].switched, MODE_INFO[next].anim);
  };

  const finish = () => {
    playSfx("tap");
    setEnded(true);
    sellySays("오늘도 나한테 이야기해 줘서 고마워!", "HAPPY");
  };

  const chooseAI = (v: "on" | "off") => {
    saveAIChoice(v);
    setAI(v);
    setNoticeOpen(false);
  };

  const lastSelly = [...msgs].reverse().find((m) => m.role === "selly");
  const showHelp = msgs.some((m) => m.action === "help");

  return (
    <main className="relative flex h-full w-full flex-col overflow-clip bg-[linear-gradient(180deg,#f3f7ee_0%,#fbf6ec_55%,#f8efe4_100%)]">
      {/* top */}
      <header className="flex shrink-0 items-center gap-2 px-3 pb-1 pt-[calc(env(safe-area-inset-top)+10px)]">
        <button type="button" aria-label="정원으로 돌아가기" onClick={() => router.push("/")} className="glass grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink-500 active:scale-90">
          <ChevronLeft size={22} />
        </button>
        <h1 className="min-w-0 flex-1 truncate text-center text-[16px] font-bold text-ink-700">셀리에게 징징대기</h1>
        <button
          type="button"
          onClick={switchMode}
          aria-label={`지금은 ${MODE_INFO[mode].label} 모드, 눌러서 바꾸기`}
          className="glass h-11 shrink-0 rounded-full px-3 text-[12px] font-bold text-ink-700 active:scale-95"
        >
          {MODE_INFO[mode].label}
        </button>
      </header>

      {/* Selly */}
      <div className="shrink-0 pt-1">
        <WhineSelly animation={busy ? "LISTENING" : anim} beat={beat} />
        <p className="sr-only" aria-live="polite">
          {busy ? "셀리가 듣고 있어요" : lastSelly?.text}
        </p>
      </div>

      {/* conversation (memory only) */}
      <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto px-4 pb-2 pt-1">
        <ul className="flex flex-col gap-2">
          {msgs.map((m) => (
            <li key={m.id} className={m.role === "user" ? "flex justify-end" : "flex flex-col items-start"}>
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={
                  m.role === "user"
                    ? "max-w-[80%] whitespace-pre-line break-keep rounded-[18px] rounded-br-md bg-sage-500 px-3.5 py-2 text-[14px] leading-relaxed text-white"
                    : "max-w-[85%] whitespace-pre-line break-keep rounded-[18px] rounded-bl-md border border-white/90 bg-[rgba(255,253,249,0.95)] px-3.5 py-2 text-[14px] leading-relaxed text-ink-700 shadow-[0_6px_18px_-12px_rgba(110,88,60,0.5)]"
                }
              >
                {m.text}
              </motion.p>
              {m.role === "selly" && m.action && m.action !== "help" && m === lastSelly && (
                <button type="button" onClick={() => router.push(ACTION_INFO[m.action as Exclude<WhineAction, "help">].href)} className="mt-1.5 rounded-full bg-sage-50 px-3 py-1.5 text-[12.5px] font-bold text-sage-700 active:scale-95">
                  {ACTION_INFO[m.action as Exclude<WhineAction, "help">].label}
                </button>
              )}
            </li>
          ))}
          {busy && (
            <li className="flex" aria-hidden>
              <span className="rounded-[18px] rounded-bl-md bg-white/80 px-3.5 py-2 text-[14px] tracking-widest text-ink-300">···</span>
            </li>
          )}
        </ul>
        {showHelp && (
          <div className="mt-3">
            <HelpCard lead="혼자 견디기 어려운 마음이면, 지금 바로 이야기를 들어 줄 사람이 있어요." />
          </div>
        )}
        {ended && !busy && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {ENDINGS.map((e) => (
              <button key={e.href} type="button" onClick={() => router.push(e.href)} className="rounded-2xl bg-white/90 px-2 py-3 text-[13px] font-bold text-ink-700 shadow-[0_4px_12px_-8px_rgba(110,88,60,0.45)] active:scale-95">
                {e.label}
              </button>
            ))}
            <button type="button" onClick={() => setEnded(false)} className="rounded-2xl bg-white/90 px-2 py-3 text-[13px] font-bold text-ink-700 shadow-[0_4px_12px_-8px_rgba(110,88,60,0.45)] active:scale-95">
              💬 조금 더 징징대기
            </button>
          </div>
        )}
      </div>

      {/* bottom */}
      <div className="shrink-0 border-t border-white/70 bg-[rgba(253,250,243,0.9)] px-3 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2">
        <div className="-mx-3 flex gap-1.5 overflow-x-auto px-3 pb-2 [scrollbar-width:none]">
          {QUICK.map((q) => (
            <button key={q} type="button" disabled={busy} onClick={() => void send(q)} className="shrink-0 rounded-full bg-white px-3 py-1.5 text-[12.5px] text-ink-700 shadow-[0_3px_10px_-7px_rgba(110,88,60,0.5)] active:scale-95 disabled:opacity-50">
              {q}
            </button>
          ))}
        </div>
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
        >
          <label className="sr-only" htmlFor="whine-input">
            셀리에게 할 말
          </label>
          <textarea
            id="whine-input"
            rows={1}
            value={input}
            maxLength={MAX_INPUT}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                void send(input);
              }
            }}
            placeholder="오늘 있었던 일, 다 말해 봐"
            className="max-h-24 min-h-11 flex-1 resize-none rounded-[20px] border border-[#eadfce] bg-white px-4 py-2.5 text-[15px] leading-snug text-ink-700 outline-none placeholder:text-ink-300 focus:border-sage-300"
          />
          <button type="submit" aria-label="보내기" disabled={busy || !input.trim()} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-sage-500 text-white active:scale-90 disabled:opacity-40">
            <SendHorizontal size={19} />
          </button>
        </form>
        <div className="mt-1.5 flex items-center justify-between gap-2 text-[10.5px] text-ink-300">
          <button type="button" onClick={() => !IS_TOSS && setNoticeOpen(true)} className="min-w-0 truncate text-left underline-offset-2 active:underline">
            {ai === "on" ? "🔒 AI 답변 · 저장 안 함 · 자세히" : "🔒 기기 안 기본 답변 · 저장 안 함" + (IS_TOSS ? "" : " · 바꾸기")}
          </button>
          <button type="button" onClick={finish} disabled={busy || ended} className="shrink-0 rounded-full bg-blush-100 px-3 py-1 text-[11.5px] font-bold text-ink-700 active:scale-95 disabled:opacity-50">
            다 말했어 🌷
          </button>
        </div>
      </div>

      {/* what is sent where — asked once on the web */}
      <AnimatePresence>
        {noticeOpen && (
          <motion.div className="absolute inset-0 z-50 flex items-end bg-[rgba(60,45,30,0.28)]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-labelledby="whine-ai-title"
              initial={{ y: 40 }}
              animate={{ y: 0 }}
              exit={{ y: 40 }}
              className="w-full rounded-t-[28px] bg-[#fdfaf3] px-5 pb-[calc(env(safe-area-inset-bottom)+18px)] pt-5"
            >
              <h2 id="whine-ai-title" className="text-[16px] font-bold text-ink-700">
                셀리 답변, 어떻게 할까?
              </h2>
              <ul className="mt-2.5 list-disc space-y-1.5 pl-4 break-keep text-[13px] leading-relaxed text-ink-500">
                <li>
                  <b className="text-ink-700">AI 답변</b>을 쓰면, 이 화면에서 쓴 최근 대화(최대 8개)가 답변을 만들기 위해 AI 제공자(Anthropic, Claude)에게 전송돼요. 이름·기록·건강 데이터는 보내지 않아요.
                </li>
                <li>대화는 어디에도 저장되지 않고, 화면을 나가면 사라져요. 기분 기록에도 들어가지 않아요.</li>
                <li>
                  <b className="text-ink-700">AI 없이</b> 하면 기기 안의 기본 답변으로 대답해요. 아무것도 전송되지 않아요.
                </li>
                <li>셀리는 상담사나 의료인이 아니에요. 힘든 마음이 크면 109·119가 언제든 열려 있어요.</li>
              </ul>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => chooseAI("off")} className="h-12 rounded-2xl bg-white text-[14px] font-bold text-ink-700 shadow-[0_4px_12px_-8px_rgba(110,88,60,0.45)] active:scale-95">
                  AI 없이 할래
                </button>
                <button type="button" onClick={() => chooseAI("on")} className="h-12 rounded-2xl bg-sage-500 text-[14px] font-bold text-white active:scale-95">
                  AI 답변 쓰기
                </button>
              </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
