"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Mic, MicOff, X } from "lucide-react";
import {
  BREAK_STEPS,
  FRIEND_WORDS,
  KIND_WORDS,
  PRACTICES,
  SC_ACCESSED,
  SC_REVIEW,
  SC_SOURCES,
  TOUCH_ALTERNATIVES,
  type PracticeId,
} from "@/data/selfCompassion";
import { HelpCard } from "@/components/pms/HelpCard";
import { openExternal } from "@/lib/platform";
import { playSfx } from "@/lib/sound/sfx";
import { useVoiceLevel } from "@/lib/voice/useVoiceLevel";

export type KindnessReaction = "cheer" | "pat" | "close";

type Step =
  | { k: "choose" }
  | { k: "w-pick" }
  | { k: "w-reply"; word: number }
  | { k: "w-return"; word: number }
  | { k: "b-intro" }
  | { k: "b-step"; i: number }
  | { k: "b-touch" }
  | { k: "f-pick" }
  | { k: "f-turn"; word: number }
  | { k: "say"; phrase: string; then: Step; prompt: string; selly: string }
  | { k: "done"; practice: PracticeId };

/**
 * "마음 전하기" — self-compassion practice with Selly (see src/data/selfCompassion.ts).
 * Selly stays in the greenhouse and reacts through `onReact`; this layer shows
 * her words (top) and the practice (bottom). Nothing typed or said is stored —
 * only that a practice was completed (a count, for growth).
 */
export function KindnessPractice({
  open,
  recommend,
  onReact,
  onDone,
  onClose,
}: {
  open: boolean;
  recommend?: PracticeId;
  onReact: (r: KindnessReaction) => void;
  onDone: (p: PracticeId) => void;
  onClose: () => void;
}) {
  return <AnimatePresence>{open && <Practice recommend={recommend} onReact={onReact} onDone={onDone} onClose={onClose} />}</AnimatePresence>;
}

function Practice({ recommend, onReact, onDone, onClose }: { recommend?: PracticeId; onReact: (r: KindnessReaction) => void; onDone: (p: PracticeId) => void; onClose: () => void }) {
  const [step, setStep] = useState<Step>({ k: "choose" });
  const [voiceWanted, setVoiceOn] = useState(false);
  const [help, setHelp] = useState(false);
  const voice = useVoiceLevel();
  // no microphone (denied/unsupported) → quietly back to tapping
  const voiceOn = voiceWanted && voice.state !== "denied";
  const reactRef = useRef(onReact);
  useEffect(() => {
    reactRef.current = onReact;
  }, [onReact]);

  const go = (s: Step) => {
    playSfx("tap");
    setStep(s);
  };
  /** a phrase to say (aloud if the mic is on, otherwise in my heart), then continue */
  const sayThen = (phrase: string, then: Step, prompt: string, selly: string) => go({ k: "say", phrase, then, prompt, selly });

  const finish = (p: PracticeId) => {
    setStep({ k: "done", practice: p });
    onDone(p);
  };
  /** every way forward goes through here, so finishing is always counted */
  const advance = (n: Step) => (n.k === "done" ? finish(n.practice) : setStep(n));
  const advanceRef = useRef(advance);
  useEffect(() => {
    advanceRef.current = advance;
  });

  // Selly's reactions per step
  useEffect(() => {
    if (step.k === "choose") reactRef.current("close");
    if (step.k === "w-reply") {
      const w = KIND_WORDS[step.word];
      reactRef.current(w.reaction);
      const t = setTimeout(() => setStep({ k: "w-return", word: step.word }), 2600);
      return () => clearTimeout(t);
    }
    if (step.k === "done") reactRef.current("cheer");
  }, [step]);

  // listening while a phrase is to be said, with the mic on
  const { start, stop } = voice;
  useEffect(() => {
    if (step.k === "say" && voiceOn) void start();
    else stop();
  }, [step, voiceOn, start, stop]);
  useEffect(() => {
    if (step.k === "say" && voice.spoke) {
      stop();
      playSfx("pat");
      reactRef.current("pat");
      const next = step.then;
      const t = setTimeout(() => advanceRef.current(next), 700);
      return () => clearTimeout(t);
    }
  }, [voice.spoke, step, stop]);


  // ---- what Selly says, and the panel below ----
  let selly = "";
  let panel: React.ReactNode = null;

  if (step.k === "choose") {
    selly = "오늘은 어떤 마음\n연습을 해 볼까?";
    panel = (
      <div className="flex flex-col gap-2">
        {PRACTICES.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => go(p.id === "words" ? { k: "w-pick" } : p.id === "break" ? { k: "b-intro" } : { k: "f-pick" })}
            className="flex items-center gap-3 rounded-2xl bg-white/80 px-4 py-3 text-left shadow-[0_4px_14px_-10px_rgba(110,88,60,0.5)] active:scale-[0.98]"
          >
            <span className="text-[24px]" aria-hidden>
              {p.icon}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 text-[15px] font-bold text-ink-700">
                {p.title}
                {recommend === p.id && <span className="rounded-full bg-[#fdf3f3] px-2 py-0.5 text-[10.5px] text-[#b9727b]">오늘 추천</span>}
              </span>
              <span className="block break-keep text-[12px] text-ink-500">{p.desc}</span>
            </span>
          </button>
        ))}
      </div>
    );
  } else if (step.k === "w-pick") {
    selly = "나한테 해 주고 싶은 말\n있어? 들려줘 ♡";
    panel = (
      <Phrases
        title="셀리에게 마음 전하기"
        options={KIND_WORDS.map((w) => w.say)}
        big
        onPick={(i) =>
          voiceOn
            ? sayThen(KIND_WORDS[i].say, { k: "w-reply", word: i }, `‘${KIND_WORDS[i].say}’라고 셀리에게 말해 줘`, "두근두근…\n듣고 있어!")
            : go({ k: "w-reply", word: i })
        }
      />
    );
  } else if (step.k === "w-reply") {
    selly = KIND_WORDS[step.word].reply;
    panel = <Hint>셀리가 마음을 받았어요</Hint>;
  } else if (step.k === "w-return") {
    const w = KIND_WORDS[step.word];
    selly = "이번엔 내가 돌려줄게.\n같은 말을 너 자신에게도\n해 볼까?";
    panel = (
      <div className="flex flex-col gap-3">
        <Hint>손을 가슴에 살짝 얹고, 천천히 말해 봐요.</Hint>
        <Big>“{w.toSelf}”</Big>
        <SayButtons voiceOn={voiceOn} onSaid={() => sayThen(w.toSelf, { k: "done", practice: "words" }, `‘${w.toSelf}’`, "천천히, 나에게…")} skipLabel="마음속으로 말했어" onSkip={() => finish("words")} />
      </div>
    );
  } else if (step.k === "b-intro") {
    selly = "요즘 마음에 걸리는 일이\n있다면, 하나만 떠올려 볼까?";
    panel = (
      <div className="flex flex-col gap-3">
        <Hint>아주 힘든 일보다, 조금 신경 쓰이는 일부터 시작해도 좋아요. 몸 어디가 무겁게 느껴지는지 살펴봐요.</Hint>
        <Primary onClick={() => go({ k: "b-step", i: 0 })}>떠올렸어</Primary>
      </div>
    );
  } else if (step.k === "b-step") {
    const s = BREAK_STEPS[step.i];
    selly = s.selly;
    const next: Step = step.i === 0 ? { k: "b-step", i: 1 } : step.i === 1 ? { k: "b-touch" } : { k: "done", practice: "break" };
    panel = (
      <Phrases
        title={s.label}
        hint="마음에 닿는 말을 골라, 나에게 말해 줘요."
        options={[...s.options]}
        onPick={(i) => {
          if (voiceOn) sayThen(s.options[i], next.k === "done" ? { k: "done", practice: "break" } : next, `‘${s.options[i]}’`, "천천히 말해 봐.\n듣고 있을게.");
          else if (next.k === "done") finish("break");
          else go(next);
        }}
      />
    );
  } else if (step.k === "b-touch") {
    selly = "두 손을 가슴에 살짝\n얹어 볼까? 따뜻함을\n느껴 봐.";
    panel = <TouchStep onNext={() => go({ k: "b-step", i: 2 })} />;
  } else if (step.k === "f-pick") {
    selly = "힘들어하는 친한 친구가\n있다면, 뭐라고 말해 줄\n것 같아?";
    panel = <Phrases title="친구에게 하듯" options={FRIEND_WORDS.map((w) => w.toFriend)} onPick={(i) => go({ k: "f-turn", word: i })} />;
  } else if (step.k === "f-turn") {
    const w = FRIEND_WORDS[step.word];
    selly = "정말 다정하다.\n그 말, 너 자신에게도\n해 줄래?";
    panel = (
      <div className="flex flex-col gap-3">
        <Hint>친구에게 하는 그 목소리 그대로요.</Hint>
        <Big>“{w.toSelf}”</Big>
        <SayButtons voiceOn={voiceOn} onSaid={() => sayThen(w.toSelf, { k: "done", practice: "friend" }, `‘${w.toSelf}’`, "그 목소리 그대로…")} skipLabel="마음속으로 말했어" onSkip={() => finish("friend")} />
      </div>
    );
  } else if (step.k === "say") {
    selly = step.selly;
    panel = (
      <div className="flex flex-col items-center gap-3">
        <Hint>{voice.state === "asking" ? "마이크 사용을 허락해 주세요" : "소리 내어 말해 줘요"}</Hint>
        <Big>{step.prompt}</Big>
        <Meter level={voice.level} />
        <button
          type="button"
          onClick={() => {
            stop();
            playSfx("tap");
            advance(step.then);
          }}
          className="text-[12.5px] text-ink-500 underline underline-offset-4"
        >
          말했어
        </button>
      </div>
    );
  } else if (step.k === "done") {
    selly = step.practice === "words" ? "잘했어. 다정한 말은\n할수록 익숙해져 ♡" : step.practice === "break" ? "잘했어. 힘든 마음 곁에\n다정하게 있어 줬구나." : "그 다정함, 너에게도\n어울려. 잘했어 ♡";
    panel = (
      <div className="flex flex-col gap-2.5">
        <Hint>나에게 다정한 건, 기분을 바꾸려는 게 아니라 힘든 마음 곁에 있어 주는 연습이에요.</Hint>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => go({ k: "choose" })} className="h-11 rounded-full bg-sage-50 text-[13.5px] font-bold text-sage-700">
            다른 연습
          </button>
          <Primary onClick={onClose}>마치기</Primary>
        </div>
        <Sources />
      </div>
    );
  }

  const canVoice = step.k !== "done" && step.k !== "choose";

  return (
    <motion.div className="absolute inset-0 z-[65]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-label="셀리와 마음 전하기">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[rgba(253,248,238,0.55)] via-[rgba(253,248,238,0.1)] to-[rgba(253,248,238,0.35)]" />

      <div className="absolute right-4 top-[calc(env(safe-area-inset-top)+18px)] flex gap-2">
        {canVoice && (
          <button
            type="button"
            aria-pressed={voiceOn}
            aria-label={voiceOn ? "소리 내어 말하기 끄기" : "소리 내어 말하기 켜기"}
            onClick={() => setVoiceOn((v) => !v)}
            className={`glass flex h-10 items-center gap-1 rounded-full px-3 text-[12px] font-bold ${voiceOn ? "text-[#b9727b]" : "text-ink-500"}`}
          >
            {voiceOn ? <Mic size={15} /> : <MicOff size={15} />}
            소리 내어
          </button>
        )}
        <button type="button" aria-label="연습 끝내기" onClick={onClose} className="glass grid h-10 w-10 place-items-center rounded-full text-ink-500 active:scale-90">
          <X size={18} />
        </button>
      </div>

      {/* Selly's words */}
      <div className="absolute left-4 right-4 top-[calc(env(safe-area-inset-top)+74px)]">
        <span className="relative z-10 ml-5 inline-flex items-center gap-1 rounded-full border border-white/90 bg-[#fdf3f3] px-3 py-1 text-[13px] font-bold text-[#b9727b]">셀리 ♡</span>
        <AnimatePresence mode="wait">
          <motion.p
            key={selly}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            className="relative -mt-2 block max-w-[300px] whitespace-pre-line break-keep rounded-[30px] border border-white/90 bg-[rgba(255,253,249,0.95)] px-6 pb-5 pt-6 text-[18px] font-bold leading-[1.45] text-ink-700 shadow-[0_16px_40px_-16px_rgba(110,88,60,0.45)]"
            aria-live="polite"
          >
            {selly}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* the practice */}
      <div className="absolute inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+18px)] max-h-[50%] overflow-y-auto rounded-[28px] border border-white/90 bg-[rgba(255,253,249,0.95)] p-4 shadow-[0_-10px_40px_-18px_rgba(110,88,60,0.45)]">
        <AnimatePresence mode="wait">
          <motion.div key={JSON.stringify(step)} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6, transition: { duration: 0.12 } }}>
            {panel}
          </motion.div>
        </AnimatePresence>
        {(step.k.startsWith("b-") || step.k === "done") && (
          <div className="mt-2.5 text-center">
            {help ? (
              <HelpCard />
            ) : (
              <button type="button" onClick={() => setHelp(true)} className="text-[11.5px] text-ink-300 underline underline-offset-4">
                혼자 견디기 어렵다면
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="break-keep text-center text-[12.5px] leading-relaxed text-ink-500">{children}</p>;
}

function Big({ children }: { children: React.ReactNode }) {
  return <p className="break-keep rounded-2xl bg-[#fdf3f3] px-4 py-3.5 text-center text-[19px] font-bold leading-snug text-[#9c3f4d]">{children}</p>;
}

function Primary({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="h-11 w-full rounded-full bg-gradient-to-b from-[#9cc095] to-[#7ea47a] text-[14px] font-bold text-white shadow-[0_8px_18px_-10px_rgba(90,130,85,0.8)] active:scale-[0.98]">
      {children}
    </button>
  );
}

function Phrases({ title, hint, options, onPick, big }: { title: string; hint?: string; options: string[]; onPick: (i: number) => void; big?: boolean }) {
  return (
    <div>
      <p className="mb-1 text-center text-[13px] font-bold text-ink-700">{title}</p>
      {hint && <p className="mb-2.5 text-center text-[12px] text-ink-500">{hint}</p>}
      <div className={big ? "grid grid-cols-3 gap-2" : "flex flex-col gap-1.5"}>
        {options.map((o, i) => (
          <button
            key={o}
            type="button"
            onClick={() => onPick(i)}
            className={`rounded-2xl bg-white/90 font-bold text-ink-700 shadow-[0_4px_12px_-9px_rgba(110,88,60,0.55)] active:scale-95 ${big ? "h-14 text-[16px]" : "px-4 py-3 text-left text-[14.5px]"}`}
          >
            {big ? o : `“${o}”`}
          </button>
        ))}
      </div>
    </div>
  );
}

function SayButtons({ voiceOn, onSaid, skipLabel, onSkip }: { voiceOn: boolean; onSaid: () => void; skipLabel: string; onSkip: () => void }) {
  return voiceOn ? (
    <div className="flex flex-col gap-1.5">
      <Primary onClick={onSaid}>소리 내어 말하기</Primary>
      <button type="button" onClick={onSkip} className="text-[12.5px] text-ink-500 underline underline-offset-4">
        {skipLabel}
      </button>
    </div>
  ) : (
    <Primary onClick={onSkip}>{skipLabel}</Primary>
  );
}

function Meter({ level }: { level: number }) {
  return (
    <div className="flex h-8 items-end gap-1" aria-hidden>
      {[0.2, 0.45, 0.7, 1, 0.7, 0.45, 0.2].map((k, i) => (
        <span key={i} className="w-2 rounded-full bg-[#e9a092] transition-[height] duration-75" style={{ height: `${8 + Math.min(1, level * k * 1.6) * 24}px` }} />
      ))}
    </div>
  );
}

/** Supportive touch with three slow breaths (≈ 15 s), skippable. */
function TouchStep({ onNext }: { onNext: () => void }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (n >= 3) return;
    const t = setTimeout(() => setN((x) => x + 1), 5000);
    return () => clearTimeout(t);
  }, [n]);
  return (
    <div className="flex flex-col items-center gap-3">
      <motion.div
        className="grid h-20 w-20 place-items-center rounded-full bg-[#fdf3f3] text-[30px]"
        animate={{ scale: [1, 1.18, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden
      >
        🤍
      </motion.div>
      <Hint>
        숨을 천천히 쉬며 손의 따뜻함과 가슴이 오르내리는 걸 느껴 봐요. ({Math.min(n + 1, 3)}/3번째 숨)
      </Hint>
      <details className="w-full text-[11.5px] text-ink-500">
        <summary className="cursor-pointer text-center">가슴에 손을 얹는 게 불편하다면</summary>
        <ul className="mt-1.5 list-disc space-y-0.5 pl-5">
          {TOUCH_ALTERNATIVES.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </details>
      <Primary onClick={onNext}>{n >= 3 ? "다음" : "다 느꼈어"}</Primary>
    </div>
  );
}

function Sources() {
  return (
    <details className="text-[10.5px] text-ink-300">
      <summary className="cursor-pointer text-center">
        출처 · {SC_REVIEW === "pending" ? "전문가 검토 전" : "검토 완료"}
      </summary>
      <p className="mt-1">크리스틴 네프(Kristin Neff)의 자기자비 연습을 바탕으로 했어요. 치료가 아니에요. (확인 {SC_ACCESSED})</p>
      <ul className="mt-1 space-y-1">
        {SC_SOURCES.map((s) => (
          <li key={s.url}>
            <a
              href={s.url}
              onClick={(e) => {
                e.preventDefault();
                void openExternal(s.url);
              }}
              className="underline underline-offset-2"
            >
              {s.title}
            </a>
            <q lang="en" className="block italic">
              {s.quote}
            </q>
          </li>
        ))}
      </ul>
    </details>
  );
}
