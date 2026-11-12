"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronLeft, Phone, X } from "lucide-react";
import { Selly } from "@/components/selly/Selly";
import { HelpCard } from "@/components/pms/HelpCard";
import { StretchGuide } from "./StretchGuide";
import { BODY, BODY_SAFETY, BODY_WEATHERS, FEELINGS, INTENSITY, LINES, SITUATIONS, type BodyWeather, type Choice } from "@/data/checkin";
import type { ContextTagId } from "@/data/contextTags";
import { ACTIVITIES, LANE_INFO, respond, saveCheckIn, updateCheckIn, noteActivityDone, type ActivityId, type CheckIn, type Lane } from "@/lib/checkin/checkin";
import { setPrefs } from "@/lib/data-store";
import { updateGame, readGame } from "@/lib/game/gameStore";
import { openExternal } from "@/lib/platform";
import { IS_TOSS } from "@/lib/platform";
import { useTossBack } from "@/lib/platform/back";
import { useSelly } from "@/lib/selly-store";
import { playSfx } from "@/lib/sound/sfx";
import { toKey } from "@/lib/date";

type Step = "body" | "feel" | "situation" | "weather" | "result";
const ORDER: Step[] = ["body", "feel", "situation", "weather", "result"];
const now = () => Date.now();
const anyOf = <T,>(xs: readonly T[]) => xs[Math.floor(Math.random() * xs.length)];

/**
 * 오늘, 몸의 날씨 — body → feelings (+ how big, optional) → what happened → my weather → Selly.
 * Every step can be skipped; "그만하기" leaves without saving anything. The check-in is
 * saved only when it reaches the end, and it is rewarded the same whatever was chosen.
 */
export function CheckInFlow() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const { addExp, setImmersive } = useSelly();
  const [step, setStep] = useState<Step>("body");
  const [body, setBody] = useState<ContextTagId[]>([]);
  const [feel, setFeel] = useState<ContextTagId[]>([]);
  const [intensity, setIntensity] = useState<CheckIn["intensity"]>();
  const [sit, setSit] = useState<ContextTagId[]>([]);
  const [unsure, setUnsure] = useState<CheckIn["unsure"]>({});
  const [weather, setWeather] = useState<BodyWeather | undefined>();
  const [toGarden, setToGarden] = useState(false);
  const [saved, setSaved] = useState<CheckIn | null>(null);
  const [safety, setSafety] = useState(false);
  const [stretch, setStretch] = useState(false);
  const [more, setMore] = useState(false);
  const [nod, setNod] = useState<{ n: number; text: string }>({ n: 0, text: "" });
  const nodTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setImmersive(true);
    return () => setImmersive(false);
  }, [setImmersive]);

  const stepNo = ORDER.indexOf(step);
  const go = (s: Step) => {
    playSfx("tap");
    setStep(s);
    setMore(false);
  };
  const next = () => {
    const i = ORDER.indexOf(step);
    if (ORDER[i + 1] === "result") return finish();
    go(ORDER[i + 1]);
  };
  const back = () => {
    const i = ORDER.indexOf(step);
    if (i <= 0 || step === "result") return router.push("/");
    go(ORDER[i - 1]);
  };

  const nodAlong = () => {
    if (nodTimer.current) clearTimeout(nodTimer.current);
    setNod((x) => ({ n: x.n + 1, text: anyOf(LINES.nod) }));
    nodTimer.current = setTimeout(() => setNod((x) => ({ ...x, text: "" })), 1300);
  };
  const toggle = (list: ContextTagId[], set: (v: ContextTagId[]) => void, id: ContextTagId, key: keyof CheckIn["unsure"]) => {
    playSfx("touch");
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
    setUnsure((u) => ({ ...u, [key]: undefined }));
    if (!list.includes(id)) nodAlong();
  };
  const markUnsure = (key: keyof CheckIn["unsure"], clear: () => void) => {
    playSfx("touch");
    clear();
    setUnsure((u) => ({ ...u, [key]: u[key] ? undefined : true }));
  };

  const finish = () => {
    const r = respond({ body, feelings: feel, situations: sit, intensity: feel.length ? intensity : undefined });
    const rec = saveCheckIn({
      at: now(),
      body,
      feelings: feel,
      ...(feel.length && intensity ? { intensity } : {}),
      situations: sit,
      unsure: Object.fromEntries(Object.entries(unsure).filter(([, v]) => v)) as CheckIn["unsure"],
      ...(weather ? { weather } : {}),
      offered: r.offered,
    });
    if (weather && toGarden) setPrefs({ weather });
    // a small light in the garden — the same for every check-in, whatever was felt
    const today = toKey(new Date());
    const g = readGame().checkinLights;
    updateGame(() => ({ checkinLights: { date: today, n: Math.min(3, (g?.date === today ? g.n : 0) + 1) } }));
    addExp(5);
    playSfx("cheer");
    setSaved(rec);
    setStep("result");
  };

  const choose = (a: ActivityId) => {
    if (!saved) return;
    playSfx("tap");
    const passive = a === "rest" || a === "quiet" || a === "garden" || a === "talk";
    updateCheckIn(saved.id, { chosen: a, chosenAt: now(), ...(passive ? { done: true } : {}) });
    if (a === "stretch") return setStretch(true);
    router.push(ACTIVITIES[a].href ?? "/");
  };

  // Toss back: close an open sheet, else go to the previous step (on the first step and
  // the result, Toss's own back applies)
  useTossBack(safety || stretch || (stepNo > 0 && step !== "result"), () => {
    if (stretch) setStretch(false);
    else if (safety) setSafety(false);
    else back();
  });

  const r = saved ? respond(saved) : null;

  return (
    <main className="relative flex h-full w-full flex-col overflow-hidden bg-[linear-gradient(180deg,#f4f7ee_0%,#fbf6ec_55%,#f7ece6_100%)]">
      {/* top */}
      <header className="flex shrink-0 items-center gap-2 px-3 pb-1 pt-[calc(env(safe-area-inset-top)+10px)]">
        {/* Toss build: the Toss navigation bar's back goes to the previous step (see useTossBack) */}
        {IS_TOSS ? (
          <span className="w-11 shrink-0" aria-hidden />
        ) : (
          <button type="button" aria-label={stepNo === 0 || step === "result" ? "정원으로 돌아가기" : "이전 단계"} onClick={back} className="glass grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink-500 active:scale-90">
            <ChevronLeft size={22} />
          </button>
        )}
        <div className="flex flex-1 flex-col items-center">
          <h1 className="text-[15px] font-bold text-ink-700">오늘, 몸의 날씨</h1>
          {step !== "result" && (
            <div className="mt-1 flex gap-1.5" aria-label={`${stepNo + 1} / 4 단계`}>
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className={`h-1.5 rounded-full transition-all ${i === stepNo ? "w-5 bg-sage-500" : i < stepNo ? "w-1.5 bg-sage-300" : "w-1.5 bg-[#e3dacd]"}`} />
              ))}
            </div>
          )}
        </div>
        <button type="button" aria-label="그만하기 (저장하지 않아요)" onClick={() => router.push("/")} className="glass grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink-500 active:scale-90">
          <X size={20} />
        </button>
      </header>

      {/* Selly */}
      <div className="relative mx-auto w-[min(34vw,18dvh,130px)] shrink-0">
        <motion.div key={nod.n} animate={reduce || !nod.n ? undefined : { y: [0, -8, 0, -4, 0], rotate: [0, -4, 0] }} transition={{ duration: 0.6 }}>
          <Selly pose={step === "result" ? "happy" : "relaxed"} className="w-full" />
        </motion.div>
        <AnimatePresence>
          {nod.text && (
            <motion.span key={nod.n} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute -right-12 top-1 whitespace-nowrap rounded-full bg-white px-2.5 py-1 text-[12px] font-bold text-ink-700 shadow-[0_6px_16px_-10px_rgba(110,88,60,0.6)]" aria-hidden>
              {nod.text}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        <AnimatePresence mode="wait">
          <motion.section key={step} initial={reduce ? { opacity: 0 } : { opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={reduce ? { opacity: 0 } : { opacity: 0, x: -16 }} transition={{ duration: 0.22 }}>
            {step === "body" && (
              <>
                <Ask lines={LINES.body} />
                <Chips items={BODY} picked={body} onToggle={(id) => toggle(body, setBody, id, "body")} />
                <Unsure on={!!unsure.body} onClick={() => markUnsure("body", () => setBody([]))} />
                <button type="button" onClick={() => setSafety(true)} className="mx-auto mt-3 block text-center text-[12px] text-[#9c3f4d] underline underline-offset-2">
                  {BODY_SAFETY.link}
                </button>
              </>
            )}
            {step === "feel" && (
              <>
                <Ask lines={[LINES.feel]} />
                <Chips items={FEELINGS} picked={feel} onToggle={(id) => toggle(feel, setFeel, id, "feel")} cols={3} />
                <Unsure on={!!unsure.feel} onClick={() => markUnsure("feel", () => setFeel([]))} />
                {feel.length > 0 && <Intensity value={intensity} onChange={setIntensity} />}
              </>
            )}
            {step === "situation" && (
              <>
                <Ask lines={[LINES.situation]} note="골라도 그게 이유라는 뜻은 아니야. 그냥 함께 있었던 일." />
                <Chips items={SITUATIONS} picked={sit} onToggle={(id) => toggle(sit, setSit, id, "situation")} />
                <Unsure on={!!unsure.situation} onClick={() => markUnsure("situation", () => setSit([]))} />
              </>
            )}
            {step === "weather" && (
              <>
                <Ask lines={[LINES.weather]} note={LINES.weatherNote} />
                <div className="grid grid-cols-3 gap-2">
                  {BODY_WEATHERS.map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      aria-pressed={weather === w.id}
                      onClick={() => {
                        playSfx("touch");
                        setWeather(weather === w.id ? undefined : w.id);
                        if (weather !== w.id) nodAlong();
                      }}
                      className={`flex min-h-[84px] flex-col items-center justify-center gap-0.5 rounded-[20px] px-1 py-2 text-center transition active:scale-95 ${weather === w.id ? "bg-sage-500 text-white shadow-[0_6px_16px_-8px_rgba(90,130,90,0.8)]" : "bg-white text-ink-700 shadow-[0_4px_12px_-8px_rgba(110,88,60,0.45)]"}`}
                    >
                      <span className="text-[26px]" aria-hidden>
                        {w.emoji}
                      </span>
                      <span className="text-[13px] font-bold">{w.label}</span>
                      <span className={`text-[10.5px] leading-tight ${weather === w.id ? "text-white/85" : "text-ink-500"}`}>{w.hint}</span>
                    </button>
                  ))}
                </div>
                {weather && (
                  <label className="mt-3 flex items-center justify-center gap-2 text-[12.5px] text-ink-500">
                    <input type="checkbox" checked={toGarden} onChange={(e) => setToGarden(e.target.checked)} className="h-5 w-5 accent-[#7fa57a]" />
                    정원 날씨도 오늘 이걸로 바꿀래
                  </label>
                )}
              </>
            )}
            {step === "result" && r && saved && (
              <>
                <div className="rounded-[22px] border border-white bg-[rgba(255,253,249,0.95)] px-4 py-3 text-center shadow-[0_8px_24px_-14px_rgba(110,88,60,0.5)]" aria-live="polite">
                  <p className="break-keep text-[15.5px] font-bold leading-relaxed text-ink-700">{r.lines[0]}</p>
                  <p className="mt-0.5 break-keep text-[14px] leading-relaxed text-ink-500">{r.lines[1]}</p>
                </div>
                <Summary c={saved} />
                {r.bodySafety && (
                  <div className="mt-3 rounded-[18px] border border-[#f0d9c8] bg-[#fffaf3] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-ink-700">
                    {BODY_SAFETY.note}
                    <button type="button" onClick={() => void openExternal("tel:119")} className="ml-1 inline-flex items-center gap-1 font-bold text-[#9c3f4d] underline">
                      <Phone size={12} /> 119
                    </button>
                  </div>
                )}
                {r.heavy && (
                  <div className="mt-3">
                    <HelpCard lead="마음이 아주 크게 느껴지는 날이구나. 혼자 견디기 어려우면 지금 바로 이야기를 들어 줄 사람이 있어요." />
                  </div>
                )}
                <p className="mb-1.5 mt-4 text-center text-[12.5px] text-ink-500">원하면 하나 골라 봐. 안 골라도 괜찮아.</p>
                <div className="grid gap-2">
                  {r.offered.map((a) => (
                    <ActivityButton key={a} a={a} onClick={() => choose(a)} />
                  ))}
                </div>
                <button type="button" onClick={() => setMore((m) => !m)} className="mx-auto mt-2 block text-[12.5px] text-ink-500 underline underline-offset-2">
                  {more ? "접기" : "다른 돌봄도 볼래"}
                </button>
                {more && <AllLanes first={r.lanes} offered={r.offered} onPick={choose} />}
                <div className="mt-4 grid gap-2">
                  <button type="button" onClick={() => router.push("/")} className="h-12 rounded-2xl bg-[#f3ece2] text-[14px] font-bold text-ink-700 active:scale-95">
                    🌷 그냥 정원으로 돌아갈래
                  </button>
                  <Link href="/checkin/notes" className="py-1 text-center text-[12.5px] text-ink-500 underline underline-offset-2">
                    셀리가 발견한 작은 패턴 · 내 체크인 보기
                  </Link>
                </div>
              </>
            )}
          </motion.section>
        </AnimatePresence>
      </div>

      {step !== "result" && (
        <footer className="flex shrink-0 gap-2 border-t border-white/70 bg-[rgba(253,250,243,0.9)] px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-2.5">
          <button type="button" onClick={next} className="h-12 flex-1 rounded-2xl text-[14px] text-ink-500 active:bg-[#f3ece2]">
            건너뛰기
          </button>
          <button type="button" onClick={next} className="h-12 flex-[2] rounded-2xl bg-sage-500 text-[15px] font-bold text-white active:scale-95">
            {step === "weather" ? "다 했어" : "다음"}
          </button>
        </footer>
      )}

      {/* warning signs → medical help, not a breathing exercise */}
      <AnimatePresence>
        {safety && (
          <motion.div className="absolute inset-0 z-50 flex items-end bg-[rgba(60,45,30,0.35)]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.section role="alertdialog" aria-labelledby="body-safety" initial={{ y: 30 }} animate={{ y: 0 }} exit={{ y: 30 }} className="w-full rounded-t-[28px] bg-[#fdfaf3] px-5 pb-[calc(env(safe-area-inset-bottom)+18px)] pt-5">
              <h2 id="body-safety" className="text-[17px] font-bold text-ink-700">
                {BODY_SAFETY.title}
              </h2>
              <p className="mt-2 break-keep text-[14px] leading-relaxed text-ink-700">{BODY_SAFETY.body}</p>
              <button type="button" onClick={() => void openExternal("tel:119")} className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#c9586a] text-[16px] font-bold text-white active:scale-95">
                <Phone size={18} /> 119에 전화하기
              </button>
              <p className="mt-2 text-center text-[11.5px] text-ink-500">디어셀리는 의료 서비스가 아니어서 증상을 판단할 수 없어요.</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setSafety(false)} className="h-12 rounded-2xl bg-white text-[13.5px] font-bold text-ink-700 shadow-[0_4px_12px_-8px_rgba(110,88,60,0.45)]">
                  괜찮아, 계속할게
                </button>
                <button type="button" onClick={() => router.push("/")} className="h-12 rounded-2xl bg-white text-[13.5px] font-bold text-ink-700 shadow-[0_4px_12px_-8px_rgba(110,88,60,0.45)]">
                  그만할래
                </button>
              </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {stretch && (
          <StretchGuide
            onClose={(done) => {
              setStretch(false);
              if (done) noteActivityDone("stretch");
            }}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

function Ask({ lines, note }: { lines: string[]; note?: string }) {
  return (
    <div className="mb-3 text-center">
      {lines.map((l, i) => (
        <p key={i} className={`break-keep ${i === lines.length - 1 ? "text-[16.5px] font-bold text-ink-700" : "text-[13.5px] text-ink-500"}`}>
          {l}
        </p>
      ))}
      {note && <p className="mt-1 text-[11.5px] text-ink-500">{note}</p>}
    </div>
  );
}

function Chips({ items, picked, onToggle, cols = 2 }: { items: Choice[]; picked: ContextTagId[]; onToggle: (id: ContextTagId) => void; cols?: 2 | 3 }) {
  return (
    <div className={`grid gap-2 ${cols === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
      {items.map((it) => {
        const on = picked.includes(it.id);
        return (
          <motion.button
            key={it.id}
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(it.id)}
            whileTap={{ scale: 0.95 }}
            animate={{ scale: on ? 1.02 : 1 }}
            className={`flex min-h-[52px] items-center gap-2 rounded-[18px] px-3 py-2 text-left text-[13.5px] font-bold leading-tight transition-colors ${cols === 3 ? "flex-col justify-center gap-0.5 px-1 text-center text-[12.5px]" : ""} ${on ? "bg-sage-500 text-white shadow-[0_6px_16px_-8px_rgba(90,130,90,0.8)]" : "bg-white text-ink-700 shadow-[0_4px_12px_-8px_rgba(110,88,60,0.45)]"}`}
          >
            <span className={cols === 3 ? "text-[20px]" : "text-[19px]"} aria-hidden>
              {it.emoji}
            </span>
            <span className="break-keep">{it.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

function Unsure({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} className={`mx-auto mt-2 block h-11 rounded-full px-5 text-[13px] font-bold transition ${on ? "bg-[#e9e2f3] text-[#6d5a92]" : "bg-white/70 text-ink-500"}`}>
      🤔 잘 모르겠어
    </button>
  );
}

function Intensity({ value, onChange }: { value: CheckIn["intensity"]; onChange: (v: CheckIn["intensity"]) => void }) {
  return (
    <div className="mt-4 rounded-[20px] bg-white/70 px-3 py-3">
      <p className="text-center text-[13px] text-ink-700">
        {LINES.intensity} <span className="text-[11px] text-ink-500">(안 골라도 돼)</span>
      </p>
      <div className="mt-2 flex items-end justify-between px-1" role="radiogroup" aria-label="마음의 크기">
        {INTENSITY.map((label, i) => {
          const v = (i + 1) as NonNullable<CheckIn["intensity"]>;
          const on = value === v;
          return (
            <button key={label} type="button" role="radio" aria-checked={on} onClick={() => onChange(on ? undefined : v)} className="flex w-[18%] flex-col items-center gap-1">
              {/* circles grow — bigger is not better or worse, just bigger */}
              <span className={`rounded-full transition-colors ${on ? "bg-[#c6b3e6]" : "bg-[#efe8f6]"}`} style={{ width: 14 + i * 7, height: 14 + i * 7 }} />
              <span className={`text-[10.5px] ${on ? "font-bold text-ink-700" : "text-ink-500"}`}>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Summary({ c }: { c: CheckIn }) {
  const label = (id: ContextTagId) => [...BODY, ...FEELINGS, ...SITUATIONS].find((x) => x.id === id);
  const all = [...c.body, ...c.feelings, ...c.situations];
  const w = BODY_WEATHERS.find((x) => x.id === c.weather);
  if (!all.length && !w) return null;
  return (
    <div className="mt-2 flex flex-wrap justify-center gap-1.5" aria-label="오늘 고른 것">
      {w && <span className="rounded-full bg-white/80 px-2.5 py-1 text-[11.5px] text-ink-700">{`${w.emoji} ${w.label}`}</span>}
      {all.map((id, i) => {
        const it = label(id);
        return it ? <span key={`${id}${i}`} className="rounded-full bg-white/80 px-2.5 py-1 text-[11.5px] text-ink-700">{`${it.emoji} ${it.label}`}</span> : null;
      })}
    </div>
  );
}

function ActivityButton({ a, onClick }: { a: ActivityId; onClick: () => void }) {
  const info = ACTIVITIES[a];
  return (
    <button type="button" onClick={onClick} className="flex h-12 items-center gap-2 rounded-2xl bg-white px-4 text-left text-[14px] font-bold text-ink-700 shadow-[0_4px_12px_-8px_rgba(110,88,60,0.45)] active:scale-[0.98]">
      <span className="text-[18px]" aria-hidden>
        {info.emoji}
      </span>
      <span className="flex-1">{info.label}</span>
      <span className="text-[10.5px] font-normal text-ink-500">{LANE_INFO[info.lane].label}</span>
    </button>
  );
}

function AllLanes({ first, offered, onPick }: { first: Lane[]; offered: ActivityId[]; onPick: (a: ActivityId) => void }) {
  return (
    <div className="mt-2 grid gap-3">
      {first.map((lane) => {
        const acts = (Object.keys(ACTIVITIES) as ActivityId[]).filter((a) => ACTIVITIES[a].lane === lane && !offered.includes(a));
        if (!acts.length) return null;
        return (
          <div key={lane}>
            <p className="mb-1 pl-1 text-[12px] font-bold text-ink-500">
              {LANE_INFO[lane].label} <span className="font-normal">· {LANE_INFO[lane].hint}</span>
            </p>
            <div className="grid gap-1.5">
              {acts.map((a) => (
                <ActivityButton key={a} a={a} onClick={() => onPick(a)} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
