"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Moon, X } from "lucide-react";
import { WalkingScene } from "./WalkingScene";
import { WalkingSelly } from "./WalkingSelly";
import { useWalkSession } from "@/lib/walk/useWalkSession";
import { useWakeLock } from "@/lib/walk/wakeLock";
import { WALK_LINES, type WalkTime } from "@/data/walkingPrompts";
import { currentTimeOfDay } from "@/lib/game/ambience";
import { FIND_KINDS, FIND_LABEL, readGame, updateGame, type FindKind } from "@/lib/game/gameStore";
import { addSteps } from "@/lib/data-store";
import { toKey } from "@/lib/date";
import { useSelly } from "@/lib/selly-store";
import { playSfx } from "@/lib/sound/sfx";
import { unlock } from "@/lib/sound/engine";
import { pick } from "@/data/sellyDialogues";
import { missionOfTheDay, type WalkMission } from "@/data/walkMissions";
import { savePhoto, takePhoto } from "@/lib/walk/photos";

const DURATIONS: { label: string; min: number | null }[] = [
  { label: "5분", min: 5 },
  { label: "10분", min: 10 },
  { label: "15분", min: 15 },
  { label: "자유 산책", min: null },
];

const fmt = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

/** a new mission photo record (id from the time it was taken) */
function newPhoto(mission: string, dataUrl: string) {
  const at = Date.now();
  return { id: `${at.toString(36)}-${mission}`, mission, date: toKey(new Date(at)), dataUrl, at };
}

function rollFinds(minutes: number): FindKind[] {
  const n = Math.max(1, Math.min(5, 1 + Math.floor(minutes / 4)));
  const pool = [...FIND_KINDS];
  const out: FindKind[] = [];
  for (let i = 0; i < n; i++) out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0] ?? "leaf");
  return out;
}

export function WalkScreen() {
  const router = useRouter();
  const { setImmersive, addExp, showToast } = useSelly();
  const wake = useWakeLock();
  const releaseWake = wake.release;
  const [time, setTime] = useState<WalkTime>("day");
  const [minutes, setMinutes] = useState<number | null | undefined>(undefined); // undefined = not chosen yet
  const [firstTime, setFirstTime] = useState(false);
  const [pocket, setPocket] = useState(false);
  const [line, setLine] = useState<{ id: number; text: string } | null>(null);
  const [summary, setSummary] = useState<{ minutes: number; steps: number | null; finds: FindKind[]; text: string } | null>(null);
  const lineId = useRef(0);
  // walk mission (optional): today's suggestion, can be swapped or skipped
  const [missionOffset, setMissionOffset] = useState(0);
  const [missionOff, setMissionOff] = useState(false);
  const [mission, setMission] = useState<WalkMission | null>(null);
  const [missionResult, setMissionResult] = useState<{ found: boolean; photo?: string } | null>(null);
  const [sheet, setSheet] = useState(false);
  const [shooting, setShooting] = useState(false);
  const reminded = useRef(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const cue = useCallback(() => {
    playSfx("greet");
    if ("vibrate" in navigator) navigator.vibrate(30);
  }, []);
  const s = useWalkSession(time, cue);

  const say = useCallback((text: string, ms = 4200) => {
    lineId.current += 1;
    const id = lineId.current;
    setLine({ id, text });
    if (ms) setTimeout(() => setLine((l) => (l?.id === id ? null : l)), ms);
  }, []);

  useEffect(() => {
    setImmersive(true);
    const t = setTimeout(() => {
      setTime(currentTimeOfDay());
      const q = new URLSearchParams(window.location.search).get("m");
      if (q === "free") setMinutes(null);
      else if (q && [5, 10, 15].includes(Number(q))) setMinutes(Number(q));
      setFirstTime(!readGame().walkIntroSeen);
      setMission(missionOfTheDay(toKey(new Date()), currentTimeOfDay() === "night"));
    }, 0);
    return () => {
      clearTimeout(t);
      setImmersive(false);
    };
  }, [setImmersive]);

  const begin = async () => {
    unlock();
    await wake.acquire();
    updateGame(() => ({ walkIntroSeen: true }));
    const access = await s.start(minutes ?? null);
    say(pick(WALK_LINES.start));
    if (access !== "granted") showToast("마음 산책으로 함께 걸을게요 🌿");
    if (mission && !missionOff) setTimeout(() => say(`${mission.emoji} 오늘의 미션!\n${mission.intro}`, 7000), 4600);
  };

  const shuffleMission = () => {
    const next = missionOffset + 1;
    setMissionOffset(next);
    setMission(missionOfTheDay(toKey(new Date()), time === "night", next));
    setMissionOff(false);
  };

  /** A mission is done (found or not — both count). Logged right away, growth once a day. */
  const completeMission = (found: boolean, photo?: string) => {
    if (!mission) return;
    const today = toKey(new Date());
    setMissionResult({ found, photo });
    setSheet(false);
    playSfx("cheer");
    say(found ? mission.done : mission.notFound ?? mission.done, 5000);
    const g = readGame();
    const growth = g.lastMissionGrowth !== today;
    updateGame((d) => ({
      missions: [...(d.missions ?? []), { id: mission.id, date: today, found, ...(photo ? { photo } : {}) }].slice(-100),
      lastMissionGrowth: growth ? today : d.lastMissionGrowth,
    }));
    if (growth) {
      addExp(5);
      showToast(`${mission.emoji} 미션 완료 · 성장 +5`);
    } else showToast(`${mission.emoji} 미션 완료`);
  };

  const shoot = async () => {
    if (!mission) return;
    setShooting(true);
    try {
      const dataUrl = await takePhoto();
      if (!dataUrl) return;
      const photo = newPhoto(mission.id, dataUrl);
      await savePhoto(photo);
      const id = photo.id;
      completeMission(true, id);
      setPhotoUrl(dataUrl);
    } catch {
      showToast("사진을 저장하지 못했어요");
    } finally {
      setShooting(false);
    }
  };

  // a gentle reminder about halfway (or after 4 min of a free walk), once
  const activeMission = mission && !missionOff ? mission : null;
  useEffect(() => {
    if (s.phase !== "walking" || !activeMission || missionResult || reminded.current) return;
    const at = s.targetMs ? s.targetMs * 0.45 : 240_000;
    if (s.elapsed >= at) {
      reminded.current = true;
      const t = setTimeout(() => say(`${activeMission.emoji} 미션 기억나?\n${activeMission.title}!`, 5000), 0);
      return () => clearTimeout(t);
    }
  }, [s.phase, s.elapsed, s.targetMs, activeMission, missionResult, say]);

  // prompts from the session → Selly's bubble
  useEffect(() => {
    if (!s.prompt) return;
    const t = setTimeout(() => s.dismissPrompt(), s.prompt.p.choices ? 15000 : 9000);
    return () => clearTimeout(t);
  }, [s.prompt, s]);

  // ending: Selly stops and says goodbye, then the summary is saved
  useEffect(() => {
    if (s.phase === "ending") {
      releaseWake();
      const t = setTimeout(() => {
        setPocket(false);
        say(WALK_LINES.end, 0);
      }, 0);
      if ("vibrate" in navigator) navigator.vibrate([30, 80, 30]);
      return () => clearTimeout(t);
    }
    if (s.phase === "summary" && !summary) {
      const mins = Math.max(1, Math.round(s.elapsed / 60_000));
      const finds = rollFinds(s.elapsed / 60_000);
      const steps = s.mode === "motion" && s.steps > 0 ? s.steps : null;
      const today = toKey(new Date());
      if (steps) addSteps(today, steps);
      const g = readGame();
      const growth = g.lastWalkGrowth !== today && s.elapsed >= 60_000;
      updateGame((d) => ({
        finds: [...d.finds, ...finds].slice(-60),
        pendingReturn: { finds, minutes: mins },
        lastWalkGrowth: growth ? today : d.lastWalkGrowth,
        walks: [...(d.walks ?? []), { date: today, minutes: mins }].slice(-200),
      }));
      if (growth) addExp(15);
      const t = setTimeout(() => setSummary({ minutes: mins, steps, finds, text: pick(WALK_LINES.summary) }), 0);
      return () => clearTimeout(t);
    }
  }, [s.phase, s.elapsed, s.mode, s.steps, summary, say, addExp, releaseWake]);

  const bubble = s.phase === "walking" && s.prompt ? { key: `p${s.prompt.id}`, text: s.prompt.p.text, choices: s.prompt.p.choices } : line ? { key: `l${line.id}`, text: line.text } : null;
  const remaining = s.targetMs ? s.targetMs - s.elapsed : null;

  return (
    <main className="relative h-full w-full overflow-clip bg-cream-50">
      {!pocket && (
        <WalkingScene distance={s.distance} time={time} moving={s.moving && s.phase === "walking"}>
          <WalkingSelly moving={s.moving && s.phase === "walking"} cadence={s.cadence} ended={s.phase === "ending" || s.phase === "summary"} />
          {/* Selly's bubble */}
          <div className="absolute left-[40%] z-40 -translate-x-1/2" style={{ bottom: "calc(13% + min(48vw, 30dvh, 220px) * 0.86)" }}>
            <AnimatePresence mode="wait">
              {bubble && (
                <motion.div
                  key={bubble.key}
                  initial={{ opacity: 0, y: 6, scale: 0.94 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.15 } }}
                  className="relative min-w-[150px] max-w-[250px] rounded-[22px] border border-white/90 bg-[rgba(255,253,249,0.94)] px-4 py-3 text-center text-[14.5px] leading-[1.5] text-ink-700 shadow-[0_10px_30px_-10px_rgba(110,88,60,0.4)]"
                  aria-live="polite"
                >
                  <p className="whitespace-pre-line">{bubble.text}</p>
                  {"choices" in bubble && bubble.choices && (
                    <div className="mt-2 flex justify-center gap-1.5">
                      {bubble.choices.map((c) => (
                        <button
                          key={c.label}
                          type="button"
                          onClick={() => {
                            s.dismissPrompt();
                            say(c.reply, 3200);
                          }}
                          className="rounded-full bg-sage-50 px-3 py-1.5 text-[12.5px] font-bold text-sage-700 active:scale-95"
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </WalkingScene>
      )}

      {/* walking UI */}
      {s.phase === "walking" && !pocket && (
        <div className="absolute inset-x-0 top-0 z-50 flex items-start justify-between px-3 pt-[calc(env(safe-area-inset-top)+12px)]">
          <button type="button" aria-label="산책 끝내기" onClick={s.end} className="glass grid h-11 w-11 place-items-center rounded-full text-ink-500 active:scale-90">
            <X size={20} />
          </button>
          <div className="glass flex flex-col items-center rounded-[20px] px-4 py-1.5">
            <span className="text-[20px] font-bold tabular-nums text-ink-700">{remaining != null ? fmt(remaining) : fmt(s.elapsed)}</span>
            <span className="text-[11px] text-ink-500">
              {s.mode === "motion" ? `움직임 감지 중 · 약 ${s.steps.toLocaleString("ko-KR")}걸음` : "마음 산책 중"}
            </span>
          </div>
          <button type="button" aria-label="주머니 모드" onClick={() => setPocket(true)} className="glass grid h-11 w-11 place-items-center rounded-full text-ink-500 active:scale-90">
            <Moon size={19} />
          </button>
        </div>
      )}

      {/* mission chip + sheet */}
      {s.phase === "walking" && !pocket && activeMission && (
        <button
          type="button"
          onClick={() => setSheet(true)}
          className="glass absolute bottom-[calc(env(safe-area-inset-bottom)+22px)] left-1/2 z-50 flex h-11 -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-[13.5px] font-bold text-ink-700 active:scale-95"
        >
          <span aria-hidden>{activeMission.emoji}</span>
          {activeMission.title}
          {missionResult && <span className="ml-0.5 rounded-full bg-sage-500 px-1.5 text-[11px] text-white">완료</span>}
        </button>
      )}
      <AnimatePresence>
        {sheet && activeMission && (
          <motion.section
            role="dialog"
            aria-label={`산책 미션: ${activeMission.title}`}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="absolute inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+20px)] z-[55] rounded-[28px] border border-white/80 bg-[rgba(253,250,243,0.97)] p-5 shadow-[0_20px_50px_-20px_rgba(60,40,20,0.5)]"
          >
            <button type="button" aria-label="닫기" onClick={() => setSheet(false)} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full text-ink-300 active:bg-[#f3ece2]">
              <X size={17} />
            </button>
            <p className="text-center text-[30px]" aria-hidden>
              {activeMission.emoji}
            </p>
            <p className="text-center text-[17px] font-bold text-ink-700">{activeMission.title}</p>
            <p className="mt-1.5 break-keep text-center text-[13px] leading-relaxed text-ink-500">{activeMission.guide}</p>
            {missionResult ? (
              <div className="mt-3 flex flex-col items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {photoUrl && <img src={photoUrl} alt={`${activeMission.title} 사진`} className="max-h-48 rounded-2xl object-cover shadow-sm" />}
                <p className="text-[13px] font-bold text-sage-700">미션 완료! 🎉</p>
              </div>
            ) : activeMission.kind === "photo" ? (
              <div className="mt-3 flex flex-col gap-1.5">
                <p className="rounded-2xl bg-[#fff7ea] px-3 py-2 text-center text-[12px] font-bold text-[#8a6224]">걸으면서 찍지 말고, 잠깐 멈춰 서서 찍어요</p>
                <button
                  type="button"
                  disabled={shooting}
                  onClick={shoot}
                  className="h-12 rounded-full bg-gradient-to-b from-[#9cc095] to-[#7ea47a] text-[15px] font-bold text-white disabled:opacity-60"
                >
                  📷 멈춰서 찍기
                </button>
                <button type="button" onClick={() => completeMission(false)} className="text-[12.5px] text-ink-500 underline underline-offset-4">
                  사진 없이 눈에만 담았어
                </button>
                <p className="text-center text-[11px] text-ink-300">사진은 이 기기에만 저장되고, 어디에도 보내지 않아요.</p>
              </div>
            ) : activeMission.kind === "find" ? (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => completeMission(true)} className="h-12 rounded-full bg-gradient-to-b from-[#9cc095] to-[#7ea47a] text-[14px] font-bold text-white">
                  찾았어!
                </button>
                <button type="button" onClick={() => completeMission(false)} className="h-12 rounded-full bg-white text-[14px] font-bold text-ink-500 shadow-sm">
                  오늘은 못 찾았어
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => completeMission(true)} className="mt-3 h-12 w-full rounded-full bg-gradient-to-b from-[#9cc095] to-[#7ea47a] text-[15px] font-bold text-white">
                다 했어
              </button>
            )}
          </motion.section>
        )}
      </AnimatePresence>

      {/* intro */}
      <AnimatePresence>
        {s.phase === "intro" && (
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="absolute inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+20px)] z-50 rounded-[28px] border border-white/80 bg-[rgba(253,250,243,0.95)] p-5 shadow-[0_20px_50px_-20px_rgba(60,40,20,0.5)]"
          >
            <p className="text-center text-[18px] font-bold text-ink-700">셀리와 산책할까?</p>
            {firstTime && (
              <p className="mt-3 rounded-2xl bg-[#eef5e9] px-4 py-3 text-center text-[14px] font-bold text-sage-700">걸을 때는 셀리보다 주변을 봐주세요 🌿</p>
            )}
            <div className="mt-3 grid grid-cols-4 gap-1.5" role="radiogroup" aria-label="산책 시간">
              {DURATIONS.map((d) => {
                const on = minutes === d.min;
                return (
                  <button
                    key={d.label}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setMinutes(d.min)}
                    className={`h-11 rounded-2xl text-[13px] font-bold transition ${on ? "bg-sage-500 text-white" : "bg-white text-ink-500"}`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
            {mission && (
              <div className={`mt-3 rounded-2xl px-4 py-3 ${missionOff ? "bg-white/50" : "bg-[#fff7ea]"}`}>
                <div className="flex items-center gap-2">
                  <span className="text-[22px]" aria-hidden>
                    {mission.emoji}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-bold text-[#b0813c]">오늘의 산책 미션</span>
                    <span className={`block text-[14.5px] font-bold ${missionOff ? "text-ink-300 line-through" : "text-ink-700"}`}>{mission.title}</span>
                  </span>
                </div>
                <div className="mt-2 flex gap-1.5">
                  <button type="button" onClick={shuffleMission} className="h-8 flex-1 rounded-full bg-white text-[12px] font-bold text-ink-500">
                    다른 미션
                  </button>
                  <button type="button" aria-pressed={missionOff} onClick={() => setMissionOff((o) => !o)} className="h-8 flex-1 rounded-full bg-white text-[12px] font-bold text-ink-500">
                    {missionOff ? "미션 하기" : "미션 없이 걷기"}
                  </button>
                </div>
              </div>
            )}
            <p className="mt-3 text-[12px] leading-relaxed text-ink-500">
              휴대폰 움직임으로 걸음을 대략 어림해요(정확한 만보기는 아니에요). 허용하지 않아도 <b className="text-ink-700">마음 산책</b>으로 함께 걸어요.
              {!wake.supported && " 이 기기에서는 화면이 꺼질 수 있지만, 산책 시간은 계속 흘러요."}
            </p>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => router.push("/")} className="h-12 w-[92px] rounded-full bg-white text-[14px] text-ink-500 shadow-sm">
                다음에
              </button>
              <button
                type="button"
                disabled={minutes === undefined}
                onClick={begin}
                className="h-12 flex-1 rounded-full bg-gradient-to-b from-[#9cc095] to-[#7ea47a] text-[15px] font-bold text-white shadow-[0_10px_24px_-10px_rgba(90,130,85,0.8)] disabled:opacity-50"
              >
                산책 시작
              </button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* summary */}
      <AnimatePresence>
        {summary && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+20px)] z-50 rounded-[28px] border border-white/80 bg-[rgba(253,250,243,0.96)] p-5 text-center shadow-[0_20px_50px_-20px_rgba(60,40,20,0.5)]"
          >
            <p className="text-[17px] font-bold text-ink-700">{summary.text}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-white/80 py-3">
                <p className="text-[11.5px] text-ink-500">셀리와 함께한 시간</p>
                <p className="text-[22px] font-bold tabular-nums text-ink-700">
                  {summary.minutes}
                  <span className="ml-0.5 text-[13px] font-normal">분</span>
                </p>
              </div>
              <div className="rounded-2xl bg-white/80 py-3">
                <p className="text-[11.5px] text-ink-500">{summary.steps ? "함께 걸은 걸음" : "산책 방식"}</p>
                <p className="text-[18px] font-bold tabular-nums text-ink-700">{summary.steps ? `약 ${summary.steps.toLocaleString("ko-KR")}걸음` : "마음 산책"}</p>
              </div>
            </div>
            <p className="mt-4 text-[12.5px] text-ink-500">오늘 발견한 것</p>
            <ul className="mt-2 flex flex-wrap justify-center gap-1.5">
              {summary.finds.map((f, i) => (
                <li key={i} className="rounded-full bg-white px-3 py-1.5 text-[13px] text-ink-700 shadow-sm">
                  {FIND_LABEL[f].emoji} {FIND_LABEL[f].name}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[11.5px] text-ink-300">발견한 것들은 온실에 놓아둘게요</p>
            {activeMission && (
              <div className="mt-3 flex items-center gap-3 rounded-2xl bg-[#fff7ea] px-3 py-2.5 text-left">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {photoUrl ? <img src={photoUrl} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" /> : <span className="text-[26px]">{activeMission.emoji}</span>}
                <span className="min-w-0 flex-1">
                  <span className="block text-[11px] font-bold text-[#b0813c]">오늘의 미션</span>
                  <span className="block text-[13.5px] font-bold text-ink-700">{activeMission.title}</span>
                </span>
                <span className="shrink-0 text-[12px] font-bold text-ink-500">{missionResult ? (missionResult.found ? "완료 ✓" : "완료 · 다음에 또!") : "다음 산책에서"}</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => router.push("/")}
              className="mt-4 h-12 w-full rounded-full bg-gradient-to-b from-[#9cc095] to-[#7ea47a] text-[15px] font-bold text-white shadow-[0_10px_24px_-10px_rgba(90,130,85,0.8)]"
            >
              온실로 돌아가기
            </button>
          </motion.section>
        )}
      </AnimatePresence>

      {/* pocket mode: almost black, nothing moves, just the time */}
      <AnimatePresence>
        {pocket && <PocketMode remaining={remaining} elapsed={s.elapsed} prompt={s.prompt?.p.text ?? null} onExit={() => setPocket(false)} />}
      </AnimatePresence>
    </main>
  );
}

function PocketMode({ remaining, elapsed, prompt, onExit }: { remaining: number | null; elapsed: number; prompt: string | null; onExit: () => void }) {
  const lastTap = useRef(0);
  return (
    <motion.div
      className="absolute inset-0 z-[60] flex flex-col items-center justify-end bg-[#060605] pb-[calc(env(safe-area-inset-bottom)+40px)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => {
        const now = Date.now();
        if (now - lastTap.current < 400) onExit();
        lastTap.current = now;
      }}
      role="button"
      aria-label="주머니 모드 — 두 번 탭하면 돌아가요"
    >
      {prompt && <p className="mb-6 px-10 text-center text-[13px] text-[#6f6a5e]">{prompt.replace("\n", " ")}</p>}
      <p className="text-[13px] tabular-nums text-[#5b574d]">{remaining != null ? `남은 시간 ${fmt(remaining)}` : `함께 걸은 시간 ${fmt(elapsed)}`}</p>
      <p className="mt-1 text-[11px] text-[#3e3b34]">두 번 탭하면 돌아가요</p>
    </motion.div>
  );
}
