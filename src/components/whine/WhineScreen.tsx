"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronLeft, SendHorizontal } from "lucide-react";
import { WhineSelly } from "./WhineSelly";
import { PopBubbles } from "./PopBubbles";
import { HelpCard } from "@/components/pms/HelpCard";
import { useSelly } from "@/lib/selly-store";
import { playSfx } from "@/lib/sound/sfx";
import { IS_TOSS } from "@/lib/platform";
import { useTossBack } from "@/lib/platform/back";
import { askSelly, readAIChoice, saveAIChoice, type AIChoice } from "@/lib/whine/client";
import { isCrisis } from "@/lib/whine/safety";
import { noteActivityDone } from "@/lib/checkin/checkin";
import { MAX_INPUT, type WhineAction, type WhineAnimation, type WhineMode } from "@/lib/whine/types";

const QUICK = ["😫 집 가고 싶어!", "😤 아 진짜 짜증 나!", "😭 너무 힘들어!", "🥺 나 좀 위로해 줘!", "😴 아무것도 하기 싫어!"];

const MODE_INFO: Record<WhineMode, { label: string; hello: string; switched: string; anim: WhineAnimation }> = {
  together: {
    label: "같이 징징대기 😫",
    hello: "징징대러 왔구나!! 다 말해, 셀리가 같이 투덜대 줄게!\n여러 줄로 막 보내도 돼. 다 듣고 대답할게!",
    switched: "좋아!! 이제부터 같이 징징대자!!",
    anim: "WHINING",
  },
  listen: {
    label: "그냥 들어줘 🥺",
    hello: "응, 나 여기 있어. 하고 싶은 말 천천히 해 줘.\n다 말할 때까지 기다릴게.",
    switched: "응, 이제 조용히 들을게.",
    anim: "LISTENING",
  },
};

/** little reactions while the user is still talking (not chat messages) */
const NODS: Record<WhineMode, [string, WhineAnimation][]> = {
  together: [
    ["헐!!", "ANGRY_CUTE"],
    ["에엥?!", "ANGRY_CUTE"],
    ["뭐야 뭐야", "WHINING"],
    ["응응!!", "LISTENING"],
    ["으으…", "WHINING"],
    ["진짜?!", "ANGRY_CUTE"],
    ["말도 안 돼!!", "ANGRY_CUTE"],
    ["쿵쾅쿵쾅!", "ANGRY_CUTE"],
  ],
  listen: [
    ["응…", "LISTENING"],
    ["끄덕끄덕", "LISTENING"],
    ["그랬구나…", "COMFORTING"],
    ["응응", "LISTENING"],
  ],
};

const TAP_LINES = ["헤헤 간지러워!", "토닥토닥 받았다!", "말랑말랑~", "나 여기 있어!"];

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

/** how long Selly waits for more lines before answering */
const WAIT_TYPED = 2200;
const WAIT_QUICK = 1500;
/** a full gauge = this many lines */
const GAUGE_FULL = 4;

/** module-level so event handlers don't look impure to the hooks linter */
const roll = () => Math.random();
const now = () => Date.now();
const anyOf = <T,>(xs: readonly T[]) => xs[Math.floor(roll() * xs.length)];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
/** "typing" time for a bubble, so Selly doesn't answer instantly */
const typingMs = (s: string) => Math.min(2600, Math.max(900, 600 + s.length * 45));
/** a reply in one or two bubbles: line breaks first, then the first sentence */
function splitReply(text: string): string[] {
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  if (lines.length > 1) return [lines[0], lines.slice(1).join(" ")];
  if (text.length < 30) return [text];
  const parts = text.match(/[^.!?~…♡]+[.!?~…♡]*\s*/g) ?? [text];
  if (parts.length < 2) return [text];
  return [parts[0].trim(), parts.slice(1).join("").trim()].filter(Boolean);
}

interface Msg {
  id: number;
  role: "user" | "selly";
  text: string;
  action?: WhineAction | null;
  /** an invitation to pop the whine balloons */
  pop?: boolean;
}

/**
 * 셀리에게 징징대기 — vent to Selly. The conversation lives only in this
 * component's memory: not saved, not added to mood records, gone when the
 * screen closes. Selly waits until the user has finished (several lines are
 * fine), "types" for a moment, and at the end the whines become balloons to
 * pop. Replies come from /api/whine (web, if the user allowed AI) or from
 * built-in lines on the device.
 */
export function WhineScreen() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const { setImmersive } = useSelly();
  const [mode, setMode] = useState<WhineMode>("together");
  const [msgs, setMsgs] = useState<Msg[]>(() => [{ id: 0, role: "selly", text: MODE_INFO.together.hello }]);
  const [anim, setAnim] = useState<WhineAnimation>("HAPPY");
  const [beat, setBeat] = useState(0);
  const [typing, setTyping] = useState(false);
  const [nod, setNod] = useState<{ id: number; text: string } | null>(null);
  const [ended, setEnded] = useState(false);
  const [popping, setPopping] = useState(false);
  const [input, setInput] = useState("");
  const [ai, setAI] = useState<AIChoice | "loading">(IS_TOSS ? "off" : "loading");
  const [noticeOpen, setNoticeOpen] = useState(false);

  const nextId = useRef(1);
  const listRef = useRef<HTMLDivElement>(null);
  const alive = useRef(true);
  const msgsRef = useRef(msgs);
  const modeRef = useRef(mode);
  const aiRef = useRef(ai);
  const inputRef = useRef(input);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nodTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const answering = useRef(false);
  const unanswered = useRef(0);
  const gaugeAnnounced = useRef(false);
  useEffect(() => {
    msgsRef.current = msgs;
    modeRef.current = mode;
    aiRef.current = ai;
    inputRef.current = input;
  }, [msgs, mode, ai, input]);

  useEffect(() => {
    alive.current = true;
    setImmersive(true);
    return () => {
      alive.current = false;
      setImmersive(false);
      if (timer.current) clearTimeout(timer.current);
      if (nodTimer.current) clearTimeout(nodTimer.current);
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
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }, [msgs, ended, typing, reduce]);

  const userLines = msgs.filter((m) => m.role === "user");
  const gauge = Math.min(1, userLines.length / GAUGE_FULL);

  const show = (a: WhineAnimation) => {
    setAnim(a);
    setBeat((b) => b + 1);
  };
  const push = (m: Omit<Msg, "id">) => {
    const msg = { ...m, id: nextId.current++ };
    msgsRef.current = [...msgsRef.current, msg];
    setMsgs(msgsRef.current);
  };
  const sellySays = (text: string, a: WhineAnimation, extra: Partial<Msg> = {}) => {
    push({ role: "selly", text, ...extra });
    show(a);
  };
  const popNod = (text: string, a: WhineAnimation) => {
    if (nodTimer.current) clearTimeout(nodTimer.current);
    setNod({ id: now(), text });
    show(a);
    nodTimer.current = setTimeout(() => setNod(null), 1500);
  };

  const schedule = (ms: number) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      // still typing something? wait a little more
      if (inputRef.current.trim()) return schedule(1600);
      void respond();
    }, ms);
  };

  const respond = async () => {
    if (answering.current) return;
    answering.current = true;
    unanswered.current = 0;
    setTyping(true);
    show("LISTENING");
    const started = now();
    const turns = msgsRef.current.slice(1).filter((m) => !m.pop).map(({ role, text }) => ({ role, text }));
    const { reply } = await askSelly(modeRef.current, turns, aiRef.current === "on");
    if (!alive.current) return;
    const parts = splitReply(reply.message);
    await sleep(Math.max(0, typingMs(parts[0]) - (now() - started)));
    for (let i = 0; i < parts.length; i++) {
      if (!alive.current) return;
      if (i > 0) {
        setTyping(true);
        await sleep(typingMs(parts[i]) * 0.7);
        if (!alive.current) return;
      }
      setTyping(false);
      const last = i === parts.length - 1;
      sellySays(parts[i], reply.animation, last ? { action: reply.suggestedAction } : {});
      if (!last) await sleep(250);
    }
    playSfx("touch");
    // the gauge filled up: offer the balloons once
    const lines = msgsRef.current.filter((m) => m.role === "user").length;
    if (!gaugeAnnounced.current && lines >= GAUGE_FULL && reply.suggestedAction !== "help") {
      gaugeAnnounced.current = true;
      await sleep(1300);
      if (!alive.current) return;
      setTyping(true);
      await sleep(900);
      if (!alive.current) return;
      setTyping(false);
      sellySays(
        modeRef.current === "together" ? "앗!! 징징 게이지 꽉 찼다!! 🫧\n오늘 징징, 풍선에 담아서 같이 터뜨려 버릴까?" : "많이 꺼내 놓았네.\n오늘 마음들, 풍선에 담아 날려 볼까?",
        "HAPPY",
        { pop: true },
      );
    }
    answering.current = false;
    // more lines arrived while Selly was answering
    if (unanswered.current > 0) schedule(WAIT_QUICK);
  };

  const send = (raw: string, quick = false) => {
    const text = raw.trim().slice(0, MAX_INPUT);
    if (!text) return;
    playSfx("tap");
    if (!quick) setInput("");
    inputRef.current = quick ? inputRef.current : "";
    setEnded(false);
    push({ role: "user", text });
    unanswered.current += 1;
    if (isCrisis(text)) {
      // no waiting and no jokes: answer now, calmly, for the rest of the visit
      setMode("listen");
      modeRef.current = "listen";
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      if (!answering.current) void respond();
      return;
    }
    // Selly nods along while you're still talking
    const pool = NODS[modeRef.current];
    if (roll() < 0.75) {
      const [t, a] = anyOf(pool);
      setTimeout(() => alive.current && popNod(t, a), 350);
    } else show("LISTENING");
    if (!answering.current) schedule(quick ? WAIT_QUICK : WAIT_TYPED);
  };

  const switchMode = () => {
    const next: WhineMode = mode === "together" ? "listen" : "together";
    playSfx("tap");
    setMode(next);
    modeRef.current = next;
    sellySays(MODE_INFO[next].switched, MODE_INFO[next].anim);
  };

  const tapSelly = () => {
    playSfx("pat");
    popNod(anyOf(TAP_LINES), "HAPPY");
  };

  const goodbye = async () => {
    setTyping(true);
    await sleep(900);
    if (!alive.current) return;
    setTyping(false);
    sellySays("오늘도 나한테 이야기해 줘서 고마워!", "HAPPY");
    setEnded(true);
    noteActivityDone("whine");
  };

  const finish = () => {
    playSfx("tap");
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (userLines.length && !msgs.some((m) => m.action === "help")) setPopping(true);
    else void goodbye();
  };

  const poppedAll = async (count: number) => {
    setPopping(false);
    if (count === 0) return void goodbye();
    await sleep(400);
    if (!alive.current) return;
    sellySays(
      modeRef.current === "together" ? `펑펑펑!! 징징 ${count}개 다 터뜨렸다!! ✨\n후련하지? 나쁜 기분은 저 멀리 날아갔어!` : `${count}개 마음을 하나씩 날려 보냈어.\n조금은 가벼워졌으면 좋겠다.`,
      "HAPPY",
    );
    await sleep(1600);
    if (alive.current) void goodbye();
  };

  const chooseAI = (v: "on" | "off") => {
    saveAIChoice(v);
    setAI(v);
    setNoticeOpen(false);
  };

  // Toss back closes what's open on this screen first
  useTossBack(noticeOpen || popping, () => {
    if (noticeOpen) setNoticeOpen(false);
    else if (popping) setPopping(false);
  });

  const lastSelly = [...msgs].reverse().find((m) => m.role === "selly");
  const showHelp = msgs.some((m) => m.action === "help");
  const busy = typing;

  return (
    <main className="relative flex h-full w-full flex-col overflow-clip bg-[linear-gradient(180deg,#f3f7ee_0%,#fbf6ec_55%,#f8efe4_100%)]">
      {/* top */}
      <header className="flex shrink-0 items-center gap-2 px-3 pb-1 pt-[calc(env(safe-area-inset-top)+10px)]">
        {/* Toss build: the Toss navigation bar has the back button */}
        {IS_TOSS ? (
          <span className="w-11 shrink-0" aria-hidden />
        ) : (
          <button type="button" aria-label="정원으로 돌아가기" onClick={() => router.push("/")} className="glass grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink-500 active:scale-90">
            <ChevronLeft size={22} />
          </button>
        )}
        <h1 className="min-w-0 flex-1 truncate text-center text-[16px] font-bold text-ink-700">셀리에게 징징대기</h1>
        <button type="button" onClick={switchMode} aria-label={`지금은 ${MODE_INFO[mode].label} 모드, 눌러서 바꾸기`} className="glass h-11 shrink-0 rounded-full px-3 text-[12px] font-bold text-ink-700 active:scale-95">
          {MODE_INFO[mode].label}
        </button>
      </header>

      {/* Selly + whine gauge */}
      <div className="relative shrink-0 pt-1">
        <button type="button" onClick={tapSelly} aria-label="셀리 쓰다듬기" className="block w-full">
          <WhineSelly animation={anim} beat={beat} />
        </button>
        <AnimatePresence>
          {nod && (
            <motion.span
              key={nod.id}
              aria-hidden
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.7 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              className="pointer-events-none absolute left-[calc(50%+56px)] top-3 whitespace-nowrap rounded-full bg-white px-3 py-1 text-[13px] font-bold text-ink-700 shadow-[0_6px_16px_-10px_rgba(110,88,60,0.6)]"
            >
              {nod.text}
            </motion.span>
          )}
        </AnimatePresence>
        <div className="mx-auto mt-1 flex w-[200px] items-center gap-2" aria-label={`징징 게이지 ${Math.round(gauge * 100)}%`} role="img">
          <span className="text-[10.5px] font-bold text-ink-500">징징 게이지</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/80">
            <motion.div className="h-full rounded-full bg-[linear-gradient(90deg,#f7c6cf,#e99aab)]" animate={{ width: `${gauge * 100}%` }} transition={{ type: "spring", stiffness: 120, damping: 18 }} />
          </div>
          <span aria-hidden className="text-[12px]">
            {gauge >= 1 ? "🫧" : ""}
          </span>
        </div>
        <p className="sr-only" aria-live="polite">
          {typing ? "셀리가 답장을 쓰고 있어요" : lastSelly?.text}
        </p>
      </div>

      {/* conversation (memory only) */}
      <div ref={listRef} className="relative min-h-0 flex-1 overflow-y-auto px-4 pb-2 pt-1">
        <ul className="flex flex-col gap-2">
          {msgs.map((m) => (
            <li key={m.id} className={m.role === "user" ? "flex justify-end" : "flex flex-col items-start"}>
              <motion.p
                initial={reduce ? false : { opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={
                  m.role === "user"
                    ? "max-w-[80%] whitespace-pre-line break-keep rounded-[18px] rounded-br-md bg-sage-500 px-3.5 py-2 text-[14px] leading-relaxed text-white"
                    : "max-w-[85%] whitespace-pre-line break-keep rounded-[18px] rounded-bl-md border border-white/90 bg-[rgba(255,253,249,0.95)] px-3.5 py-2 text-[14px] leading-relaxed text-ink-700 shadow-[0_6px_18px_-12px_rgba(110,88,60,0.5)]"
                }
              >
                {m.text}
              </motion.p>
              {m.pop && m === lastSelly && !ended && (
                <button type="button" onClick={finish} className="mt-1.5 rounded-full bg-blush-100 px-3.5 py-2 text-[13px] font-bold text-ink-700 active:scale-95">
                  🫧 징징 풍선 터뜨리기
                </button>
              )}
              {m.role === "selly" && m.action && m.action !== "help" && m === lastSelly && (
                <button type="button" onClick={() => router.push(ACTION_INFO[m.action as Exclude<WhineAction, "help">].href)} className="mt-1.5 rounded-full bg-sage-50 px-3 py-1.5 text-[12.5px] font-bold text-sage-700 active:scale-95">
                  {ACTION_INFO[m.action as Exclude<WhineAction, "help">].label}
                </button>
              )}
            </li>
          ))}
          {typing && (
            <li className="flex" aria-hidden>
              <span className="flex items-center gap-1 rounded-[18px] rounded-bl-md bg-white/85 px-3.5 py-3">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-ink-300"
                    animate={reduce ? undefined : { y: [0, -4, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </span>
            </li>
          )}
        </ul>
        {showHelp && (
          <div className="mt-3">
            <HelpCard lead="혼자 견디기 어려운 마음이면, 지금 바로 이야기를 들어 줄 사람이 있어요." />
          </div>
        )}
        {ended && !typing && (
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
            <button key={q} type="button" onClick={() => send(q, true)} className="shrink-0 rounded-full bg-white px-3 py-1.5 text-[12.5px] text-ink-700 shadow-[0_3px_10px_-7px_rgba(110,88,60,0.5)] active:scale-95">
              {q}
            </button>
          ))}
        </div>
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
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
                send(input);
              }
            }}
            placeholder="오늘 있었던 일, 여러 줄로 막 보내도 돼"
            className="max-h-24 min-h-11 flex-1 resize-none rounded-[20px] border border-[#eadfce] bg-white px-4 py-2.5 text-[15px] leading-snug text-ink-700 outline-none placeholder:text-ink-300 focus:border-sage-300"
          />
          <button type="submit" aria-label="보내기" disabled={!input.trim()} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-sage-500 text-white active:scale-90 disabled:opacity-40">
            <SendHorizontal size={19} />
          </button>
        </form>
        <div className="mt-1.5 flex items-center justify-between gap-2 text-[10.5px] text-ink-300">
          <button type="button" onClick={() => !IS_TOSS && setNoticeOpen(true)} className="min-w-0 truncate text-left underline-offset-2 active:underline">
            {ai === "on" ? "🔒 AI 답변 · 저장 안 함 · 자세히" : "🔒 기기 안 기본 답변 · 저장 안 함" + (IS_TOSS ? "" : " · 바꾸기")}
          </button>
          <button type="button" onClick={finish} disabled={busy || ended || popping} className="shrink-0 rounded-full bg-blush-100 px-3 py-1 text-[11.5px] font-bold text-ink-700 active:scale-95 disabled:opacity-50">
            다 말했어 🌷
          </button>
        </div>
      </div>

      {/* end ritual: today's whines become balloons to pop */}
      <AnimatePresence>
        {popping && (
          <PopBubbles
            words={userLines.slice(-8).map((m) => m.text)}
            calm={mode === "listen"}
            onPop={() => {
              playSfx("touch");
              show("HAPPY");
            }}
            onDone={(n) => void poppedAll(n)}
          />
        )}
      </AnimatePresence>

      {/* what is sent where — asked once on the web */}
      <AnimatePresence>
        {noticeOpen && (
          <motion.div className="absolute inset-0 z-50 flex items-end bg-[rgba(60,45,30,0.28)]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.section role="dialog" aria-modal="true" aria-labelledby="whine-ai-title" initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }} className="w-full rounded-t-[28px] bg-[#fdfaf3] px-5 pb-[calc(env(safe-area-inset-bottom)+18px)] pt-5">
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
