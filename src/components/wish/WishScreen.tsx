"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronLeft, Plus } from "lucide-react";
import { Selly } from "@/components/selly/Selly";
import { HelpCard } from "@/components/pms/HelpCard";
import { NewWishSheet } from "./NewWishSheet";
import { WishDetail } from "./WishDetail";
import { WishStar } from "./WishStar";
import { putWish, useAppData } from "@/lib/data-store";
import { formatMonthDay, useToday } from "@/lib/date";
import { useSelly } from "@/lib/selly-store";
import { playSfx } from "@/lib/sound/sfx";
import { ANSWERS, ASK, HARD_LABEL, LINES, MAX_WISHES, REPLY, fill, type WishAnswer } from "@/data/wishes";
import { answer, canSmaller, checkedOn, daysAway, hardLately, smaller, todaysAsk, type Wish } from "@/lib/wish/wishes";

/** module-level so handlers don't look impure to the hooks linter */
const now = () => Date.now();
const anyOf = <T,>(xs: readonly T[]) => xs[Math.floor(Math.random() * xs.length)];

/** where the stars hang in the sky (index → % position) */
const SKY = [
  [24, 34],
  [68, 22],
  [50, 58],
];
const TWINKLES = [
  [8, 12],
  [16, 70],
  [33, 8],
  [44, 30],
  [58, 76],
  [80, 48],
  [90, 14],
  [72, 64],
  [12, 46],
  [94, 82],
];

type Ask = { wish: Wish; text: string } | null;
type After = { wishId: string; a: WishAnswer } | null;

/**
 * 셀리와 소망 빌기 — a night sky with up to three wish stars. Once a day Selly
 * asks about one wish's tiny step; every answer is supported and adds a light.
 * No streaks, nothing fades. Stored on this device only.
 */
export function WishScreen() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const today = useToday();
  const data = useAppData();
  const wishes = data.wishes ?? [];
  const { addExp, setImmersive } = useSelly();
  const [line, setLine] = useState<string | null>(null);
  const [ask, setAsk] = useState<Ask>(null);
  const [after, setAfter] = useState<After>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [detail, setDetail] = useState<string | null>(null);
  const [glow, setGlow] = useState<{ id: string; n: number } | null>(null);
  const started = useRef(false);

  const live = wishes.filter((w) => w.status !== "done");
  const done = wishes.filter((w) => w.status === "done");

  // full screen, like the other quiet moments (no bottom tabs)
  useEffect(() => {
    setImmersive(true);
    return () => setImmersive(false);
  }, [setImmersive]);

  // first look: greet, then ask today's one question (picked once per visit)
  useEffect(() => {
    if (!today || started.current) return;
    started.current = true;
    const list = data.wishes ?? [];
    const w = todaysAsk(list, today);
    const away = daysAway(list, today);
    const greet = !list.length ? LINES.hello : away !== null && away >= 3 ? LINES.back : null;
    // Selly speaks a moment after the sky appears
    setTimeout(() => {
      setLine(greet);
      if (w) setAsk({ wish: w, text: fill(anyOf(ASK), { step: w.step, wish: w.text }) });
      else if (list.length && !greet) setLine(anyOf(LINES.idle));
    }, 400);
  }, [today, data.wishes]);

  const reply = (w: Wish, a: WishAnswer) => {
    if (!today) return;
    playSfx(a === "did" ? "cheer" : "pat");
    const { wish, levelUp } = answer(w, a, today, now());
    putWish(wish);
    addExp(5);
    setAsk(null);
    setAfter({ wishId: w.id, a });
    setGlow({ id: w.id, n: now() });
    setLine(anyOf(REPLY[a]));
    if (levelUp) setTimeout(() => setLine(LINES.levelUp(w.kind)), 2600);
  };

  const askAbout = (w: Wish) => {
    setDetail(null);
    setAfter(null);
    setAsk({ wish: w, text: fill(anyOf(ASK), { step: w.step, wish: w.text }) });
  };

  const afterWish = after ? wishes.find((w) => w.id === after.wishId) : undefined;
  // "today is hard" again within a week → where to get help, softly
  const showHelp = !!today && after?.a === "hard" && hardLately(wishes, today);
  const opened = detail ? wishes.find((w) => w.id === detail) : undefined;

  return (
    <main className="relative flex h-full w-full flex-col overflow-y-auto overflow-x-clip bg-[linear-gradient(180deg,#1f2347_0%,#3a3a6b_45%,#6d5f8f_80%,#a88aa6_100%)] text-white">
      {/* twinkles */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-[calc(env(safe-area-inset-top)+64px)] h-[50%]">
        {TWINKLES.map(([x, y], i) => (
          <motion.span
            key={i}
            className="absolute h-1 w-1 rounded-full bg-white"
            style={{ left: `${x}%`, top: `${y}%` }}
            animate={reduce ? { opacity: 0.6 } : { opacity: [0.2, 0.9, 0.2] }}
            transition={{ duration: 2.5 + (i % 4) * 0.7, repeat: Infinity, delay: i * 0.3 }}
          />
        ))}
      </div>

      <header className="relative z-10 flex shrink-0 items-center gap-2 px-3 pb-1 pt-[calc(env(safe-area-inset-top)+10px)]">
        <button type="button" aria-label="정원으로 돌아가기" onClick={() => router.push("/")} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/15 text-white active:scale-90">
          <ChevronLeft size={22} />
        </button>
        <h1 className="min-w-0 flex-1 truncate text-center text-[16px] font-bold">셀리와 소망 빌기</h1>
        <span className="w-11" />
      </header>

      {/* the sky with wish stars */}
      <section aria-label="소망 별" className="relative mx-4 h-[230px] shrink-0">
        {live.map((w, i) => (
          <div key={w.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${SKY[i % 3][0]}%`, top: `${SKY[i % 3][1]}%` }}>
            <WishStar wish={w} pulse={glow?.id === w.id ? glow.n : 0} asked={!!today && checkedOn(w, today)} onTap={() => setDetail(w.id)} />
          </div>
        ))}
        {!live.length && <p className="absolute inset-x-0 top-[40%] text-center text-[13px] text-white/70">아직 하늘이 비어 있어. 첫 소망을 걸어 볼까?</p>}
      </section>

      {/* Selly and her words */}
      <section className="relative z-10 mx-4 flex shrink-0 items-end gap-2">
        <div className="w-[92px] shrink-0">
          <Selly pose={after?.a === "did" ? "happy" : after?.a === "hard" ? "love" : "relaxed"} className="w-full" />
        </div>
        <AnimatePresence mode="wait">
          {(ask || line) && (
            <motion.div
              key={ask ? `ask-${ask.wish.id}` : line}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              aria-live="polite"
              className="mb-6 min-w-0 flex-1 rounded-[20px] rounded-bl-md bg-[rgba(255,253,249,0.95)] px-4 py-3 text-[14px] leading-relaxed text-ink-700 shadow-[0_10px_30px_-14px_rgba(0,0,0,0.5)]"
            >
              <p className="whitespace-pre-line break-keep">{ask ? ask.text : line}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* today's answer */}
      {ask && (
        <section aria-label="오늘의 안부" className="relative z-10 mx-4 mt-1 flex flex-col gap-2">
          <div className="grid grid-cols-3 gap-2">
            {ANSWERS.map((a) => (
              <button key={a.id} type="button" onClick={() => reply(ask.wish, a.id)} className="h-12 rounded-2xl bg-white/90 px-1 text-[13px] font-bold text-ink-700 active:scale-95">
                {a.label}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => reply(ask.wish, "hard")} className="self-center rounded-full px-3 py-1.5 text-[12.5px] text-white/85 underline-offset-2 active:underline">
            {HARD_LABEL}
          </button>
        </section>
      )}

      {/* after answering */}
      {after && afterWish && (
        <section className="relative z-10 mx-4 mt-1 flex flex-wrap justify-center gap-2">
          {after.a === "not" && canSmaller(afterWish) && (
            <button
              type="button"
              onClick={() => {
                const w = smaller(afterWish, now());
                putWish(w);
                setLine(`${LINES.smaller}\n→ “${w.step}”`);
                setAfter(null);
              }}
              className="rounded-full bg-white/90 px-3.5 py-2 text-[13px] font-bold text-ink-700 active:scale-95"
            >
              🌱 한 걸음 더 작게 바꿀래
            </button>
          )}
          {after.a === "hard" && (
            <>
              <button type="button" onClick={() => router.push("/whine")} className="rounded-full bg-white/90 px-3.5 py-2 text-[13px] font-bold text-ink-700 active:scale-95">
                🫧 셀리에게 징징대기
              </button>
              <button type="button" onClick={() => router.push("/?do=rest")} className="rounded-full bg-white/90 px-3.5 py-2 text-[13px] font-bold text-ink-700 active:scale-95">
                ☁️ 잠깐 쉬어가기
              </button>
            </>
          )}
        </section>
      )}
      {showHelp && (
        <div className="relative z-10 mx-4 mt-3">
          <HelpCard lead={LINES.hardHelp} />
        </div>
      )}

      {/* make a wish */}
      <div className="relative z-10 mx-4 mt-4 flex justify-center">
        {live.length < MAX_WISHES ? (
          <button type="button" onClick={() => setNewOpen(true)} className="flex h-12 items-center gap-1.5 rounded-full bg-[linear-gradient(90deg,#ffe9a8,#ffd1dc)] px-5 text-[14.5px] font-bold text-[#5a3a2c] shadow-[0_8px_24px_-10px_rgba(255,220,150,0.8)] active:scale-95">
            <Plus size={17} /> 소망 빌기
          </button>
        ) : (
          <p className="text-center text-[12px] text-white/70">소망은 {MAX_WISHES}개까지 걸 수 있어. 하나를 이루거나 쉬게 하면 새로 빌 수 있어.</p>
        )}
      </div>

      {/* wishes that came true */}
      {done.length > 0 && (
        <section className="relative z-10 mx-4 mt-6 rounded-[22px] bg-white/10 p-4">
          <h2 className="text-[13.5px] font-bold">🏆 이룬 소망</h2>
          <ul className="mt-2 space-y-1.5">
            {done.map((w) => (
              <li key={w.id} className="flex items-center justify-between gap-2 text-[13px]">
                <span className="min-w-0 truncate">⭐ {w.text}</span>
                <span className="shrink-0 text-[11px] text-white/70">{w.doneAt ? formatMonthDay(w.doneAt) : ""}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="relative z-10 mx-6 mb-[calc(env(safe-area-inset-bottom)+20px)] mt-auto pt-8 text-center text-[10.5px] leading-relaxed text-white/60 break-keep">
        소망은 이 기기에만 저장돼요(설정의 기록 파일 내보내기에는 포함). 셀리는 치료나 상담을 대신하지 않아요. 힘든 마음이 크면 109·119가 언제든 열려 있어요.
      </p>

      <AnimatePresence>
        {newOpen && today && (
          <NewWishSheet
            today={today}
            onClose={() => setNewOpen(false)}
            onMade={(w, said) => {
              putWish(w);
              addExp(10);
              setNewOpen(false);
              setAsk(null);
              setAfter(null);
              setGlow({ id: w.id, n: now() });
              setLine(`${said}\n오늘의 한 걸음: “${w.step}”`);
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {opened && today && (
          <WishDetail
            wish={opened}
            today={today}
            onClose={() => setDetail(null)}
            onAsk={() => askAbout(opened)}
            onSay={(t) => {
              setAfter(null);
              setLine(t);
            }}
            onDone={() => addExp(20)}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
