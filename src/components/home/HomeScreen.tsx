"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useTransform } from "motion/react";
import { ChevronLeft } from "lucide-react";
import { GreenhouseBackground } from "@/components/greenhouse/GreenhouseBackground";
import { GreenhouseWorld } from "@/components/greenhouse/GreenhouseWorld";
import { useSellyBrain } from "@/components/selly/useSellyBrain";
import { BreathingPanel } from "@/components/breathing/BreathingPanel";
import { PHASE_LINE, type PhaseKind } from "@/lib/breathing";
import { useSelly, type SellyReaction } from "@/lib/selly-store";
import { useRouter } from "next/navigation";
import { useAppData } from "@/lib/data-store";
import type { ObjectId } from "@/data/greenhouseObjects";
import { computeLayout, type WorldLayout } from "@/lib/game/world";
import { readGame, registerVisit, updateGame, type FindKind } from "@/lib/game/gameStore";
import { WALK_LINES } from "@/data/walkingPrompts";
import { WalkInvite } from "./WalkInvite";
import { SellyMenu, type SellyMenuAction } from "./SellyMenu";
import { CARE_LINES, TOUCH_LINES } from "@/data/sellyDialogues";
import { TopBar } from "./TopBar";
import { LevelCard } from "./LevelCard";
import { SpeechBubble } from "./SpeechBubble";
import { ActionDock } from "./ActionDock";
import { CareSheet } from "./CareSheet";

type Mode = "home" | "breathing";

export function HomeScreen() {
  const { react, completeTask, touchExp, setImmersive, showToast, breath } = useSelly();
  const [mode, setMode] = useState<Mode>("home");
  const [careOpen, setCareOpen] = useState(false);
  /** breathing-mode caption (in the home mode Selly speaks through her own bubble) */
  const [caption, setCaption] = useState("어떤 호흡으로\n쉬어갈까요?");
  const touchIndex = useRef(0);
  const router = useRouter();
  const { entries } = useAppData();
  const moodDays = Object.values(entries).filter((e) => e.mood != null).length;
  const pendingAction = useRef<string | null | undefined>(undefined);
  const breathingRef = useRef(false);
  const started = useRef(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [doorGlow, setDoorGlow] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [finds, setFinds] = useState<FindKind[]>([]);
  const [petals, setPetals] = useState(false);
  const haloScale = useTransform(breath, [0, 1], [0.82, 1.12]);
  const haloOpacity = useTransform(breath, [0, 1], [0.45, 0.95]);

  // ---- world layout: the painted floor sits just above the dock ----
  const mainRef = useRef<HTMLElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<WorldLayout | null>(null);
  const layoutRef = useRef<WorldLayout | null>(null);
  useLayoutEffect(() => {
    const main = mainRef.current;
    if (!main) return;
    const measure = () => {
      // keep the world still while breathing (the dock changes height then)
      if (breathingRef.current || !dockRef.current) return;
      const m = main.getBoundingClientRect();
      const dockTop = dockRef.current.getBoundingClientRect().top - m.top;
      const L = computeLayout(m.width, m.height, dockTop - 4);
      const prev = layoutRef.current;
      if (prev && prev.w === L.w && prev.h === L.h && Math.abs(prev.oy - L.oy) < 0.5) return;
      layoutRef.current = L;
      setLayout(L);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(main);
    return () => ro.disconnect();
  }, []);

  const brain = useSellyBrain(layoutRef);
  // stable handle for callbacks/effects (the brain object itself changes with Selly's state)
  const brainRef = useRef(brain);
  useEffect(() => {
    brainRef.current = brain;
  });
  const size = layout ? Math.min(layout.w * 0.62, 250) : 240;

  useEffect(() => () => setImmersive(false), [setImmersive]);
  // transient UI must not survive the page being hidden (back/forward restores the route)
  useLayoutEffect(
    () => () => {
      setDoorGlow(false);
      setLeaving(false);
      setInviteOpen(false);
      setMenuOpen(false);
    },
    [],
  );

  const pet = () => {
    react("touch");
    touchExp();
    brain.interact(TOUCH_LINES[touchIndex.current++ % TOUCH_LINES.length]);
  };

  // touching Selly: a little reaction + her menu
  const handleTouch = () => {
    pet();
    setMenuOpen(true);
  };

  // the menu tucks itself away if left alone
  useEffect(() => {
    if (!menuOpen) return;
    const t = setTimeout(() => setMenuOpen(false), 7000);
    return () => clearTimeout(t);
  }, [menuOpen]);

  const handleMenu = (a: SellyMenuAction) => {
    setMenuOpen(false);
    if (a === "pet") pet();
    else if (a === "rest") brainRef.current.rest();
    else if (a === "breathe") startBreathing();
    else setInviteOpen(true);
  };

  /** Door → walk: Selly walks to the door, it lights up, the screen fades, then the path. */
  const startWalk = async (m: string) => {
    setInviteOpen(false);
    setLeaving(true);
    await Promise.race([brainRef.current.leave(), new Promise((r) => setTimeout(r, 3200))]);
    setDoorGlow(true);
    setTimeout(() => router.push(`/walk?m=${m}`), 900);
  };

  const handleCare = (type: SellyReaction) => {
    react(type);
    if (type !== "water" && type !== "sun" && type !== "pat") return;
    const { exp } = completeTask(type);
    brain.interact(exp ? CARE_LINES[type].first : CARE_LINES[type].again, 4200);
    if (exp) showToast(`성장 +${exp}`);
  };

  const handleObject = (id: ObjectId) => {
    const b = brainRef.current;
    if (id === "cushion") {
      b.rest();
      return;
    }
    if (id === "orb") {
      startBreathing();
      return;
    }
    // a short word from Selly, then open the page
    b.interact(id === "calendar" ? "달력 같이 볼까?" : "오늘 마음은\n어떤 색이야?", 1200);
    setTimeout(() => router.push(id === "calendar" ? "/calendar" : "/record"), 550);
  };

  const startBreathing = useCallback(() => {
    setCareOpen(false);
    breathingRef.current = true;
    setMode("breathing");
    setImmersive(true);
    setCaption("어떤 호흡으로\n쉬어갈까요?");
    const L = layoutRef.current;
    if (L) brainRef.current.setBreathing(true, { x: L.w / 2, y: L.h * 0.6 });
  }, [setImmersive]);

  // First appearance: greet (or jump into ?do=breathe | care from the growth screen)
  useEffect(() => {
    if (!layout || started.current) return;
    started.current = true;
    // read once and keep it: effects may run twice in development
    if (pendingAction.current === undefined) {
      pendingAction.current = new URLSearchParams(window.location.search).get("do");
      if (pendingAction.current) window.history.replaceState(null, "", "/");
    }
    const action = pendingAction.current;
    const visit = registerVisit();
    const game = readGame();
    const back = game.pendingReturn;
    if (back) updateGame(() => ({ pendingReturn: null }));
    // runs exactly once; not cancelled by later layout updates
    setTimeout(() => {
      setFinds(game.finds);
      if (back) {
        // back from a walk: petals drift in, Selly comes through the door and rests
        setPetals(true);
        brainRef.current.returnFromWalk(WALK_LINES.home);
        react("cheer");
        setTimeout(() => setPetals(false), 6500);
      } else if (action === "breathe") startBreathing();
      else {
        brainRef.current.start(visit);
        react("greet");
        if (action === "care") setCareOpen(true);
        if (action === "walk") setInviteOpen(true);
      }
    }, 450);
  }, [layout, react, startBreathing]);

  const endBreathing = useCallback(
    (completed: boolean, minutes = 1) => {
      breathingRef.current = false;
      setMode("home");
      setImmersive(false);
      breath.set(0);
      brainRef.current.setBreathing(false);
      if (completed) {
        const { exp } = completeTask("breath");
        setTimeout(() => brainRef.current.say("잘했어!\n마음이 한결 가벼워졌지? ♡", 5000), 1400);
        showToast(exp ? `${minutes}분 호흡 완료 · 성장 +${exp}` : `${minutes}분 호흡 완료 · 오늘도 숨 고르기 성공`);
        setTimeout(() => react("cheer"), 1500);
      }
    },
    [completeTask, breath, react, setImmersive, showToast],
  );

  const onPhase = useCallback((p: PhaseKind | "ready", running: boolean) => {
    // a late phase report after the session ended must not overwrite anything
    if (!breathingRef.current) return;
    if (p === "ready") setCaption("어떤 호흡으로\n쉬어갈까요?");
    else if (!running) setCaption("잠시 쉬어가도 괜찮아.\n준비되면 다시 시작해요.");
    else setCaption(PHASE_LINE[p]);
  }, []);

  const breathing = mode === "breathing";

  return (
    <main ref={mainRef} className="relative h-full w-full overflow-clip">
      <GreenhouseBackground dim={breathing} placement={layout ?? undefined} />

      <div className="relative z-10 flex h-full flex-col pt-[calc(env(safe-area-inset-top)+18px)]">
        {/* the living greenhouse (behind the header & dock) */}
        {layout && (
          <GreenhouseWorld
            layout={layout}
            brain={brain}
            size={size}
            breathing={breathing}
            haloScale={haloScale}
            haloOpacity={haloOpacity}
            onTouchSelly={handleTouch}
            onObject={handleObject}
            moodDays={moodDays}
            onDoor={() => setInviteOpen(true)}
            doorGlow={doorGlow}
            finds={finds}
            petals={petals}
          />
        )}

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

        {/* stage spacer; breathing caption sits at its top */}
        <section className="pointer-events-none relative min-h-0 flex-1">
          {breathing && <SpeechBubble text={caption} className="absolute left-1/2 top-2 -translate-x-1/2" />}
        </section>

        {/* dock */}
        <div
          ref={dockRef}
          className={`relative shrink-0 transition-[padding] duration-500 ${breathing ? "pb-[calc(env(safe-area-inset-bottom)+28px)] pt-4" : "pb-[calc(env(safe-area-inset-bottom)+86px)] pt-1"}`}
        >
          <AnimatePresence mode="wait" initial={false}>
            {breathing ? (
              <motion.div key="breath" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
                <BreathingPanel onStop={() => endBreathing(false)} onComplete={(m) => endBreathing(true, m)} onPhase={onPhase} />
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

      <SellyMenu open={menuOpen && !breathing} onPick={handleMenu} onClose={() => setMenuOpen(false)} />
      <WalkInvite open={inviteOpen} onPick={startWalk} onClose={() => setInviteOpen(false)} />
      {/* fade into the walking path */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[80] bg-[#fdf6e6]"
        initial={false}
        animate={{ opacity: doorGlow ? 1 : 0 }}
        transition={{ duration: 0.8, delay: doorGlow ? 0.15 : 0, ease: "easeInOut" }}
      />
      {leaving && <div className="absolute inset-0 z-[79]" aria-hidden />}
    </main>
  );
}
