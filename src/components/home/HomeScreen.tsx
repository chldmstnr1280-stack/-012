"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useTransform } from "motion/react";
import { ChevronLeft } from "lucide-react";
import { GreenhouseBackground } from "@/components/greenhouse/GreenhouseBackground";
import { Selly } from "@/components/selly/Selly";
import { BreathingSession } from "@/components/breathing/BreathingSession";
import type { BreathPhase } from "@/components/breathing/useBreathingSession";
import { useSelly, type SellyReaction } from "@/lib/selly-store";
import { TopBar } from "./TopBar";
import { LevelCard } from "./LevelCard";
import { SpeechBubble } from "./SpeechBubble";
import { ActionDock } from "./ActionDock";
import { CareSheet } from "./CareSheet";
import { GrassMound } from "./GrassMound";

const GREETING = "오늘도\n잘 쉬어가고 있지? ♡";
const TOUCH_LINES = ["헤헤, 간지러워!", "오늘 하루도\n고생 많았어 ♡", "네가 와줘서 좋아", "천천히 쉬어가도\n괜찮아"];
const CARE: Record<"water" | "sun" | "pat", { line: string; again: string }> = {
  water: { line: "시원해!\n고마워 ♡", again: "오늘은 충분히 마셨어.\n고마워!" },
  sun: { line: "따뜻하다…\n마음까지 포근해져", again: "햇살 가득 받았어.\n반짝반짝!" },
  pat: { line: "에헤헤,\n좋아 ♡", again: "또 쓰다듬어 줘서\n행복해 ♡" },
};

type Mode = "home" | "breathing";

export function HomeScreen() {
  const { react, completeTask, touchExp, setImmersive, showToast, breath } = useSelly();
  const [mode, setMode] = useState<Mode>("home");
  const [careOpen, setCareOpen] = useState(false);
  const [message, setMessage] = useState(GREETING);
  const touchIndex = useRef(0);
  const msgTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingAction = useRef<string | null | undefined>(undefined);
  const haloScale = useTransform(breath, [0, 1], [0.82, 1.12]);
  const haloOpacity = useTransform(breath, [0, 1], [0.45, 0.95]);

  const say = useCallback((text: string, resetAfter = 4200) => {
    setMessage(text);
    if (msgTimer.current) clearTimeout(msgTimer.current);
    if (resetAfter > 0) msgTimer.current = setTimeout(() => setMessage(GREETING), resetAfter);
  }, []);


  useEffect(() => () => setImmersive(false), [setImmersive]);

  const handleTouch = () => {
    react("touch");
    touchExp();
    say(TOUCH_LINES[touchIndex.current++ % TOUCH_LINES.length]);
  };

  const handleCare = (type: SellyReaction) => {
    react(type);
    if (type !== "water" && type !== "sun" && type !== "pat") return;
    const { exp } = completeTask(type);
    say(exp ? CARE[type].line : CARE[type].again);
    if (exp) showToast(`성장 +${exp}`);
  };

  const startBreathing = useCallback(() => {
    setCareOpen(false);
    setMode("breathing");
    setImmersive(true);
    say("편안한 호흡으로\n마음을 가라앉혀요.", 0);
  }, [say, setImmersive]);
  // Greeting on first visit, or jump straight into an action (?do=breathe | care) from the growth screen
  useEffect(() => {
    // read once and keep it: effects may run twice in development
    if (pendingAction.current === undefined) {
      pendingAction.current = new URLSearchParams(window.location.search).get("do");
      if (pendingAction.current) window.history.replaceState(null, "", "/");
    }
    const action = pendingAction.current;
    const t = setTimeout(() => {
      if (action === "breathe") startBreathing();
      else if (action === "care") setCareOpen(true);
      else react("greet");
    }, 650);
    return () => clearTimeout(t);
  }, [react, startBreathing]);

  const endBreathing = useCallback(
    (completed: boolean) => {
      setMode("home");
      setImmersive(false);
      breath.set(0);
      if (completed) {
        const { exp } = completeTask("breath");
        say("잘했어!\n마음이 한결 가벼워졌지? ♡", 5000);
        showToast(exp ? `1분 호흡 완료 · 성장 +${exp}` : "1분 호흡 완료 · 오늘도 숨 고르기 성공");
        setTimeout(() => react("cheer"), 300);
      } else {
        say(GREETING, 0);
      }
    },
    [completeTask, breath, react, say, setImmersive, showToast],
  );

  const onPhase = useCallback(
    (p: BreathPhase, running: boolean) => {
      if (!running) say("잠시 쉬어가도 괜찮아.\n준비되면 다시 시작해요.", 0);
      else say(p === "inhale" ? "천천히 숨을\n들이마셔요" : "부드럽게\n내쉬어요", 0);
    },
    [say],
  );

  const breathing = mode === "breathing";

  return (
    <main className="relative h-full w-full overflow-clip" style={{ ["--selly" as string]: "min(70vw, 34dvh, 276px)" }}>
      <GreenhouseBackground dim={breathing} />

      <div className="relative z-10 flex h-full flex-col pt-[calc(env(safe-area-inset-top)+18px)]">
        {/* header */}
        <div className="relative h-[124px] shrink-0">
          <AnimatePresence initial={false}>
            {!breathing ? (
              <motion.div key="top" className="absolute inset-0 flex flex-col gap-3" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <TopBar />
                <LevelCard />
              </motion.div>
            ) : (
              <motion.div key="breath-top" className="absolute inset-x-0 top-0 flex items-center justify-center px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <button type="button" aria-label="호흡 종료" onClick={() => endBreathing(false)} className="absolute left-3 grid h-11 w-11 place-items-center rounded-full text-white">
                  <ChevronLeft size={26} />
                </button>
                <h2 className="text-glow text-[20px] font-bold text-white">호흡하기</h2>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* stage */}
        <section className="relative min-h-0 flex-1" aria-label="유리온실">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2" style={{ width: "var(--selly)", height: "var(--selly)" }}>
            <GrassMound />
            <AnimatePresence>
              {breathing && (
                <motion.div
                  className="absolute left-1/2 top-[52%] aspect-square w-[150%] -translate-x-1/2 -translate-y-1/2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  <motion.div
                    className="h-full w-full rounded-full border border-white/60 bg-[radial-gradient(closest-side,rgba(255,250,232,0.55),rgba(255,244,214,0.18)_70%,rgba(255,255,255,0))] shadow-[0_0_60px_10px_rgba(255,244,210,0.35)]"
                    style={{ scale: haloScale, opacity: haloOpacity }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
            <Selly mode={breathing ? "breathing" : "idle"} onTouch={handleTouch} className="h-full w-full" />
          </div>
          <SpeechBubble
            text={message}
            className={`absolute transition-all duration-500 ${breathing ? "left-1/2 top-2 -translate-x-1/2" : "right-[18px] bottom-[calc(var(--selly)*0.9)]"}`}
          />
        </section>

        {/* dock */}
        <div className={`relative shrink-0 transition-[padding] duration-500 ${breathing ? "pb-[calc(env(safe-area-inset-bottom)+28px)] pt-4" : "pb-[calc(env(safe-area-inset-bottom)+86px)] pt-1"}`}>
          <AnimatePresence mode="wait" initial={false}>
            {breathing ? (
              <motion.div key="breath" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
                <BreathingSession onStop={() => endBreathing(false)} onComplete={() => endBreathing(true)} onPhase={onPhase} />
              </motion.div>
            ) : (
              <motion.div key="dock" className="relative" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
                <ActionDock onBreathe={startBreathing} onCare={() => setCareOpen((o) => !o)} />
                <CareSheet open={careOpen} onClose={() => setCareOpen(false)} onCare={handleCare} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
