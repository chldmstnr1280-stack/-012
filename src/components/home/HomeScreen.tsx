"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
import { useAmbience } from "@/lib/game/ambience";
import { plantedFlowers } from "@/lib/garden";
import { useToday } from "@/lib/date";
import { WALK_LINES } from "@/data/walkingPrompts";
import { WalkInvite } from "./WalkInvite";
import { SellyMenu, type SellyMenuAction } from "./SellyMenu";
import { SellyTalk } from "@/components/talk/SellyTalk";
import { KindnessPractice, type KindnessReaction } from "@/components/kindness/KindnessPractice";
import type { PracticeId } from "@/data/selfCompassion";
import { DecorateTray } from "./DecorateTray";
import { useSession } from "@/lib/social/useAuth";
import { markSeen, unseenGifts } from "@/lib/social/api";
import { GIFT_INFO, GIFT_MESSAGES } from "@/data/gifts";
import { CareSuggestion } from "./CareSuggestion";
import { markShown, shouldShow, suggestionFor } from "@/lib/game/careEngine";
import type { CareAction, PickedSuggestion } from "@/data/careSuggestions";
import { getData, setPrefs } from "@/lib/data-store";
import { currentTimeOfDay } from "@/lib/game/ambience";
import { playSfx } from "@/lib/sound/sfx";
import type { TalkAction } from "@/data/sellyConversations";
import { CARE_LINES, TOUCH_LINES, pick } from "@/data/sellyDialogues";
import { TopBar } from "./TopBar";
import { WeatherSheet } from "./WeatherSheet";
import { WEATHER_INFO, currentWeather, resolveWeather, useGardenWeather, type WeatherPref } from "@/lib/garden/weather";
import { WEATHER_CHANGED, weatherTouchLine } from "@/data/weatherLines";
import { todaysAsk } from "@/lib/wish/wishes";
import { LevelCard } from "./LevelCard";
import { SpeechBubble } from "./SpeechBubble";
import { ActionDock } from "./ActionDock";
import { CareSheet } from "./CareSheet";

const nowMs = () => Date.now();

type Mode = "home" | "breathing" | "talk" | "decorate" | "quiet" | "kindness";

/** 가/이 after a Korean name (이 after a final consonant). */
function josa(name: string) {
  const c = name.charCodeAt(name.length - 1);
  if (c < 0xac00 || c > 0xd7a3) return "가";
  return (c - 0xac00) % 28 ? "이" : "가";
}

export function HomeScreen() {
  const { react, completeTask, touchExp, setImmersive, showToast, breath, addExp } = useSelly();
  const [kindRecommend, setKindRecommend] = useState<PracticeId | undefined>(undefined);
  const [mode, setMode] = useState<Mode>("home");
  const modeRef = useRef<Mode>("home");
  const measureRef = useRef<() => void>(() => {});
  useEffect(() => {
    modeRef.current = mode;
    // back home: catch up on any resize that happened while breathing/talking (measure skips then)
    if (mode === "home") {
      const id = setTimeout(() => measureRef.current(), 450);
      return () => clearTimeout(id);
    }
  }, [mode]);
  const [careOpen, setCareOpen] = useState(false);
  const [weatherOpen, setWeatherOpen] = useState(false);
  /** breathing-mode caption (in the home mode Selly speaks through her own bubble) */
  const [caption, setCaption] = useState("어떤 호흡으로\n쉬어갈까요?");
  const touchIndex = useRef(0);
  const router = useRouter();
  const appData = useAppData();
  const { entries } = appData;
  const today = useToday();
  // 셀리와 소망 빌기: is there a question waiting today?
  const wishAsk = !!today && !!todaysAsk(appData.wishes ?? [], today);
  const flowers = useMemo(() => (today ? plantedFlowers(appData, today) : []), [appData, today]);
  const moodDays = Object.values(entries).filter((e) => e.mood != null || e.emotion != null).length;
  const pendingAction = useRef<string | null | undefined>(undefined);
  const breathingRef = useRef(false);
  const started = useRef(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [doorGlow, setDoorGlow] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [finds, setFinds] = useState<FindKind[]>([]);
  const [petals, setPetals] = useState(false);
  const [deco, setDeco] = useState<Record<string, string>>({});
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<PickedSuggestion | null>(null);
  const careChecked = useRef(false);
  const session = useSession();
  const giftsChecked = useRef(false);
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
      if (breathingRef.current || modeRef.current !== "home" || !dockRef.current) return;
      const m = main.getBoundingClientRect();
      const dockTop = dockRef.current.getBoundingClientRect().top - m.top;
      const L = computeLayout(m.width, m.height, dockTop - 4);
      const prev = layoutRef.current;
      if (prev && prev.w === L.w && prev.h === L.h && Math.abs(prev.oy - L.oy) < 0.5) return;
      layoutRef.current = L;
      setLayout(L);
    };
    measureRef.current = measure;
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(main);
    // the dock can move on its own (fonts, safe area), not only when the page resizes
    if (dockRef.current) ro.observe(dockRef.current);
    // Safari's toolbars change the viewport while the page is in the background or bfcache
    const again = () => requestAnimationFrame(measure);
    const onVisible = () => document.visibilityState === "visible" && again();
    window.addEventListener("resize", again);
    window.visualViewport?.addEventListener("resize", again);
    window.addEventListener("pageshow", again);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", again);
      window.visualViewport?.removeEventListener("resize", again);
      window.removeEventListener("pageshow", again);
      document.removeEventListener("visibilitychange", onVisible);
    };
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
    // a line about the weather now and then (with a cooldown), otherwise the usual ones
    brain.interact(weatherTouchLine(currentWeather(), currentTimeOfDay(), nowMs()) ?? TOUCH_LINES[touchIndex.current++ % TOUCH_LINES.length]);
  };

  // touching Selly: a little reaction + her menu
  const handleTouch = () => {
    pet();
    if (modeRef.current === "home") setMenuOpen(true);
  };

  // the menu tucks itself away if left alone
  useEffect(() => {
    if (!menuOpen) return;
    const t = setTimeout(() => setMenuOpen(false), 7000);
    return () => clearTimeout(t);
  }, [menuOpen]);

  const startDecorate = () => {
    setCareOpen(false);
    setMenuOpen(false);
    setActiveSlot(null);
    setMode("decorate");
    setImmersive(true);
  };
  const endDecorate = () => {
    setActiveSlot(null);
    setMode("home");
    setImmersive(false);
    brainRef.current.say("와, 온실이 더 예뻐졌다 ♡", 3600);
  };
  const saveDeco = (next: Record<string, string>) => {
    setDeco(next);
    updateGame(() => ({ deco: next }));
  };

  // Selly's suggestion for today: once, a little after she has said hello
  useEffect(() => {
    if (!today || !layout || careChecked.current) return;
    careChecked.current = true;
    setTimeout(() => {
      if (modeRef.current !== "home") return;
      const rule = suggestionFor(getData(), today, currentTimeOfDay());
      if (rule && shouldShow(today, rule)) {
        markShown(today, rule);
        setSuggestion(rule);
      }
    }, 6500);
  }, [today, layout]);

  // Gifts from friends: Selly tells you who came by; seeds, petals and fireflies stay in the greenhouse
  useEffect(() => {
    const uid = session?.user.id;
    if (!uid || !layout || giftsChecked.current) return;
    giftsChecked.current = true;
    (async () => {
      const gifts = await unseenGifts(uid).catch(() => []);
      if (!gifts.length) return;
      await markSeen(gifts.map((g) => g.id)).catch(() => {});
      const finds = gifts.map((g) => GIFT_INFO[g.kind]?.find).filter((f): f is FindKind => !!f);
      if (finds.length) {
        updateGame((d) => ({ finds: [...d.finds, ...finds].slice(-60) }));
        setFinds((f) => [...f, ...finds].slice(-60));
      }
      gifts.slice(0, 3).forEach((g, i) => {
        setTimeout(() => {
          if (modeRef.current !== "home") return;
          const name = g.sender?.nickname ?? "친구";
          brainRef.current.say(`${name}${josa(name)} ${GIFT_INFO[g.kind].done}!\n“${GIFT_MESSAGES[g.message] ?? ""}”`, 5200);
          react(g.kind === "water" ? "water" : g.kind === "hug" ? "pat" : "cheer");
        }, 3500 + i * 6000);
      });
      if (gifts.length > 3) setTimeout(() => showToast(`친구들이 선물을 ${gifts.length}개 보냈어요 🎁`), 3500 + 3 * 6000);
    })();
  }, [session, layout, react, showToast]);

  // a suggestion never lingers: it slips away if left alone
  useEffect(() => {
    if (!suggestion) return;
    const t = setTimeout(() => setSuggestion(null), 25000);
    return () => clearTimeout(t);
  }, [suggestion]);

  /** 조용한 온실: lower the lights, soften the music, Selly rests on the cushion. */
  const startQuiet = () => {
    setCareOpen(false);
    setMenuOpen(false);
    setMode("quiet");
    setImmersive(true);
    brainRef.current.settle("cushion");
    brainRef.current.say("쉿… 조용히 쉬자 ♡", 3200);
  };
  const endQuiet = () => {
    setMode("home");
    setImmersive(false);
    brainRef.current.release();
  };

  const handleCareAction = (a: CareAction) => {
    setSuggestion(null);
    const b = brainRef.current;
    if (a === "rest") b.rest("응, 같이 쉬자 ♡", 20000);
    else if (a === "quiet") startQuiet();
    else if (a.startsWith("breathe")) {
      setPrefs({ breathPattern: a === "breathe-long" ? "long" : a === "breathe-sleep" ? "478" : "calm", breathMinutes: 1 });
      startBreathing();
    } else if (a === "walk") setInviteOpen(true);
    else if (a === "talk") startTalk();
    else if (a === "record") router.push("/record");
    else if (a === "record-pms") router.push("/record?tab=pms");
    else if (a === "kindness") startKindness();
  };

  /** 마음 전하기 — self-compassion practice; recommends the gentle 3-step break on heavier days */
  const startKindness = () => {
    setCareOpen(false);
    setMenuOpen(false);
    setSuggestion(null);
    const d = getData();
    const t = today ? d.entries[today] : undefined;
    const heavy = !!t && ((t.mood != null && t.mood <= 2) || t.emotion === "sad" || t.emotion === "anxious");
    const comfort = !!today && (d.dayTags[today]?.tags ?? []).includes("want_comfort");
    setKindRecommend(heavy || comfort ? "break" : "words");
    setMode("kindness");
    setImmersive(true);
    brainRef.current.engage();
    brainRef.current.settle("back");
  };
  // the first-appearance effect runs once; it reaches the latest version through this ref
  const startKindnessRef = useRef(startKindness);
  useEffect(() => {
    startKindnessRef.current = startKindness;
  });
  const endKindness = useCallback(() => {
    setMode("home");
    setImmersive(false);
    brainRef.current.release();
  }, [setImmersive]);
  const kindDone = () => {
    if (!today) return;
    const k = readGame().kindness ?? { total: 0, lastDate: null };
    const first = k.lastDate !== today;
    updateGame(() => ({ kindness: { total: k.total + 1, lastDate: today, dates: [...(k.dates ?? []), today].slice(-200) } }));
    if (first) {
      addExp(5);
      showToast(`다정한 말 연습 ${k.total + 1}번째 · 성장 +5`);
    } else showToast(`다정한 말 연습 ${k.total + 1}번째`);
  };
  const kindReact = (r: KindnessReaction) => {
    if (r === "cheer") react("cheer");
    else if (r === "pat") react("pat");
    else brainRef.current.settle("back");
  };

  const startTalk = () => {
    setCareOpen(false);
    setMode("talk");
    setImmersive(true);
    brainRef.current.engage();
  };

  const endTalk = useCallback(() => {
    setMode("home");
    setImmersive(false);
    brainRef.current.release();
  }, [setImmersive]);

  /** What Selly does as the conversation goes. */
  const handleTalkAction = (a: TalkAction) => {
    const b = brainRef.current;
    if (a === "cheer") react("cheer");
    else if (a === "comfort") react("pat");
    else if (a === "rest") b.settle("cushion");
    else if (a === "nap") b.settle("cushion", true);
    else if (a === "comeClose") b.settle("close");
    else if (a === "breathe") {
      setMode("home");
      setTimeout(() => startBreathing(), 150);
    } else if (a === "kindness") {
      setMode("home");
      setTimeout(() => startKindness(), 200);
    } else if (a === "record" || a === "recordPms") {
      endTalk();
      setTimeout(() => router.push(a === "record" ? "/record" : "/record?tab=pms"), 250);
    }
  };

  const handleMenu = (a: SellyMenuAction) => {
    setMenuOpen(false);
    if (a === "talk") startTalk();
    else if (a === "pet") pet();
    else if (a === "rest") brainRef.current.rest();
    else if (a === "breathe") startBreathing();
    else if (a === "kindness") startKindness();
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

  /** the user drank a cup: Selly waters her plants too; the goal gets a little celebration */
  const handleDrink = (cups: number, goal: number) => {
    playSfx("water");
    if (cups === goal) {
      react("cheer");
      brain.interact("오늘 물 목표 달성!\n나도 촉촉해졌어 💧", 4200);
      showToast("💧 오늘 물 목표를 채웠어요!");
    } else {
      react("water");
      brain.interact(pick(["꿀꺽꿀꺽! 나도 한 모금 💧", "물 마셨구나, 잘했어!", "촉촉해지는 기분이야~", "온실도 같이 촉촉해졌어!"]), 3200);
    }
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
      setDeco(game.deco ?? {});
      if (back) {
        // back from a walk: petals drift in, Selly comes through the door and rests
        setPetals(true);
        brainRef.current.returnFromWalk(WALK_LINES.home);
        react("cheer");
        setTimeout(() => setPetals(false), 6500);
      } else if (action === "breathe") startBreathing();
      else if (action === "kind") startKindnessRef.current();
      else {
        brainRef.current.start(visit);
        react("greet");
        if (action === "care") setCareOpen(true);
        if (action === "walk") setInviteOpen(true);
        // from "☁️ 잠깐 쉬어가기" (셀리에게 징징대기): Selly sits on the cushion with you
        if (action === "rest") setTimeout(() => void brainRef.current.rest("잠깐 쉬어 가자.\n같이 쉬자 ♡", 20000), 1400);
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
  const talking = mode === "talk" || mode === "kindness";
  const decorating = mode === "decorate";
  const quiet = mode === "quiet";
  const ambience = useAmbience();
  const garden = useGardenWeather();
  /** choose the greenhouse weather; Selly notices when it actually changes */
  const pickWeather = (w: WeatherPref) => {
    playSfx("tap");
    const before = currentWeather();
    setPrefs({ weather: w });
    const after = resolveWeather(w, new Date(), garden.season);
    if (after !== before) brain.interact(WEATHER_CHANGED[after], 3200);
  };
  const tod = quiet ? "night" : ambience;

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
            tod={tod}
            weather={garden.weather}
            season={garden.season}
            flowers={flowers}
            deco={deco}
            decorating={decorating}
            activeSlot={activeSlot}
            onSlot={(id) => setActiveSlot((a) => (a === id ? null : id))}
          />
        )}

        {/* header */}
        <div className="relative h-[124px] shrink-0">
          <AnimatePresence initial={false}>
            {talking || decorating || quiet ? null : !breathing ? (
              <motion.div key="top" className="absolute inset-0 flex flex-col gap-3" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <TopBar onDecorate={startDecorate} />
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
          <AnimatePresence>
            {mode === "home" && (
              <motion.div key="pills" className="pointer-events-none absolute left-4 top-1 flex flex-col items-start gap-1.5" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                <button
                  type="button"
                  onClick={() => {
                    playSfx("tap");
                    router.push("/whine");
                  }}
                  className="glass pointer-events-auto flex flex-col items-start rounded-[18px] px-3.5 py-2 text-left active:scale-95"
                >
                  <span className="text-[13.5px] font-bold text-ink-700">🫧 셀리에게 징징대기</span>
                  <span className="text-[10.5px] text-ink-500">오늘 있었던 일, 셀리한테 다 말해!</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {mode === "home" && (
              <motion.button
                key="weather"
                type="button"
                aria-label={`온실 날씨: 지금 ${WEATHER_INFO[garden.weather].label}. 날씨·시간·계절·자연의 소리 바꾸기`}
                onClick={() => {
                  playSfx("tap");
                  setCareOpen(false);
                  setMenuOpen(false);
                  setWeatherOpen((o) => !o);
                }}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="glass pointer-events-auto absolute right-4 top-1 grid h-12 w-12 place-items-center rounded-full text-[22px] active:scale-90"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span key={garden.weather} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }} transition={{ duration: 0.25 }} aria-hidden>
                    {WEATHER_INFO[garden.weather].emoji}
                  </motion.span>
                </AnimatePresence>
              </motion.button>
            )}
          </AnimatePresence>
          {/* 셀리와 소망 빌기 — a round icon under the weather; a dot when Selly has today's question */}
          <AnimatePresence>
            {mode === "home" && (
              <motion.button
                key="wish"
                type="button"
                aria-label={wishAsk ? "셀리와 소망 빌기: 오늘의 소망 안부가 있어요" : "셀리와 소망 빌기"}
                onClick={() => {
                  playSfx("tap");
                  router.push("/wish");
                }}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="glass pointer-events-auto absolute right-4 top-[60px] grid h-12 w-12 place-items-center rounded-full text-[22px] active:scale-90"
              >
                <span aria-hidden>🌠</span>
                {wishAsk && <span aria-hidden className="absolute right-0 top-0 h-3 w-3 rounded-full bg-[#e76f86] ring-2 ring-white" />}
              </motion.button>
            )}
          </AnimatePresence>
        </section>

        {/* dock */}
        <div
          ref={dockRef}
          className={`relative shrink-0 transition-[padding] duration-500 ${breathing ? "pb-[calc(env(safe-area-inset-bottom)+28px)] pt-4" : "pb-[calc(env(safe-area-inset-bottom)+86px)] pt-1"}`}
        >
          <AnimatePresence mode="wait" initial={false}>
            {talking || decorating || quiet ? null : breathing ? (
              <motion.div key="breath" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
                <BreathingPanel onStop={() => endBreathing(false)} onComplete={(m) => endBreathing(true, m)} onPhase={onPhase} />
              </motion.div>
            ) : (
              <motion.div key="dock" className="relative" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
                <ActionDock
                  onBreathe={startBreathing}
                  onCare={() => {
                    setWeatherOpen(false);
                    setCareOpen((o) => !o);
                  }}
                />
                <WeatherSheet open={weatherOpen && mode === "home"} onClose={() => setWeatherOpen(false)} onWeather={pickWeather} />
                <CareSheet open={careOpen} onClose={() => setCareOpen(false)} onCare={handleCare} onDrink={handleDrink} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <SellyMenu open={menuOpen && mode === "home"} onPick={handleMenu} onClose={() => setMenuOpen(false)} />
      <SellyTalk open={mode === "talk"} onAction={handleTalkAction} onClose={endTalk} />
      <KindnessPractice open={mode === "kindness"} recommend={kindRecommend} onReact={kindReact} onDone={kindDone} onClose={endKindness} />
      <CareSuggestion rule={mode === "home" && !menuOpen && !inviteOpen ? suggestion : null} onAction={handleCareAction} onDismiss={() => setSuggestion(null)} />
      <AnimatePresence>
        {quiet && (
          <motion.button
            type="button"
            onClick={endQuiet}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute left-1/2 top-[calc(env(safe-area-inset-top)+20px)] z-[60] -translate-x-1/2 rounded-full border border-white/30 bg-[rgba(30,32,64,0.55)] px-4 py-2 text-[13px] text-[#e9e4f6] backdrop-blur-md"
          >
            🌙 조용한 온실 · 돌아가기
          </motion.button>
        )}
      </AnimatePresence>
      <DecorateTray
        open={decorating}
        slot={activeSlot}
        current={activeSlot ? deco[activeSlot] : undefined}
        onPick={(item) => {
          if (!activeSlot) return;
          saveDeco({ ...deco, [activeSlot]: item });
          playSfx("cheer");
        }}
        onRemove={() => {
          if (!activeSlot) return;
          const next = { ...deco };
          delete next[activeSlot];
          saveDeco(next);
        }}
        onDone={endDecorate}
      />
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
