"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronLeft, X } from "lucide-react";
import { Selly } from "@/components/selly/Selly";
import { HelpCard } from "@/components/pms/HelpCard";
import {
  BACKDRAFT,
  BACKDRAFT_SOURCE,
  CRITICS,
  HUMANITY,
  LADDER,
  LOUDNESS,
  MOMENTS,
  NEEDS,
  TOUCHES,
  TOUCH_LINES,
  TOUCH_SECONDS,
  WARMTH,
  type CriticId,
  type MomentId,
  type NeedId,
  type TouchId,
} from "@/data/kindJourney";
import { FRIEND_WORDS, SC_ACCESSED, SC_SOURCES } from "@/data/selfCompassion";
import { noteActivityDone } from "@/lib/checkin/checkin";
import { useAppData } from "@/lib/data-store";
import { toKey } from "@/lib/date";
import { readGame, updateGame } from "@/lib/game/gameStore";
import { lastLadder, loudnessChange, saveKind, type KindSession } from "@/lib/kindness/journey";
import { IS_TOSS } from "@/lib/platform";
import { useTossBack } from "@/lib/platform/back";
import { useSelly } from "@/lib/selly-store";
import { playSfx } from "@/lib/sound/sfx";

type Step = "moment" | "critic" | "loud" | "label" | "friend" | "turn" | "touch-pick" | "touch" | "warmth" | "backdraft" | "humanity" | "ladder" | "say" | "need" | "after" | "done";
const STAGE: Record<Step, number> = { moment: 0, critic: 0, loud: 0, label: 0, friend: 1, turn: 1, "touch-pick": 2, touch: 2, warmth: 2, backdraft: 2, humanity: 3, ladder: 3, say: 3, need: 4, after: 4, done: 4 };
const STAGES = ["마음", "친구", "몸", "말", "필요"];

const buzz = (p: number | number[]) => {
  try {
    if ("vibrate" in navigator) navigator.vibrate(p);
  } catch {
    // not supported
  }
};

/**
 * 나에게 와닿는 자기자비 연습 (3분). Not a sentence to repeat — a short path:
 * notice the critic → borrow the kindness I'd give a friend → feel it in the body →
 * choose words that feel true right now → one small act of care.
 * Only choices and 0–3 ratings are saved; anything typed stays on screen only.
 */
export function KindJourney() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const data = useAppData();
  const { addExp, showToast, setImmersive } = useSelly();
  // a quiet, full-screen practice: no tab bar
  useEffect(() => {
    setImmersive(true);
    return () => setImmersive(false);
  }, [setImmersive]);
  const log = useMemo(() => data.kindLog ?? [], [data.kindLog]);
  const prevLadder = lastLadder(log);

  const [step, setStep] = useState<Step>("moment");
  const history = useRef<Step[]>([]);
  const [moment, setMoment] = useState<MomentId | null>(null);
  const [critic, setCritic] = useState<CriticId | null>(null);
  const [ownCritic, setOwnCritic] = useState("");
  const [loudBefore, setLoudBefore] = useState<number | null>(null);
  const [friendWords, setFriendWords] = useState<{ friend: string; self: string } | null>(null);
  const [ownFriend, setOwnFriend] = useState("");
  const [touch, setTouch] = useState<TouchId | null>(null);
  const [warmth, setWarmth] = useState<number | "hard" | null>(null);
  const [ladder, setLadder] = useState<number | null>(null);
  const [ownWords, setOwnWords] = useState("");
  const [said, setSaid] = useState(0);
  const [need, setNeed] = useState<NeedId | null>(null);
  const [saved, setSaved] = useState<KindSession | null>(null);
  const [help, setHelp] = useState(false);
  const [selly, setSelly] = useState("오늘 마음은\n어떤 순간이야?");

  const criticText = critic === "own" ? ownCritic.trim() : CRITICS.find((c) => c.id === critic)?.text ?? null;

  const go = (s: Step, line?: string) => {
    playSfx("tap");
    history.current.push(step);
    setStep(s);
    if (line) setSelly(line);
  };
  const back = () => {
    const prev = history.current.pop();
    if (prev) setStep(prev);
  };
  useTossBack(help || (step !== "moment" && step !== "done"), () => (help ? setHelp(false) : back()));

  const finish = (loudAfter?: number) => {
    const today = toKey(new Date());
    const rec = saveKind({
      date: today,
      moment: moment ?? "practice",
      ...(critic ? { critic } : {}),
      ...(loudBefore != null ? { loudBefore } : {}),
      ...(loudAfter != null ? { loudAfter } : {}),
      ...(touch ? { touch } : {}),
      ...(warmth != null ? { warmth } : {}),
      ...(ladder != null ? { ladder } : {}),
      ...(need ? { need } : {}),
    });
    // the same count as 마음 전하기 (growth once a day)
    const k = readGame().kindness ?? { total: 0, lastDate: null };
    const first = k.lastDate !== today;
    updateGame(() => ({ kindness: { total: k.total + 1, lastDate: today, dates: [...(k.dates ?? []), today].slice(-200) } }));
    noteActivityDone("kindness");
    if (first) addExp(5);
    showToast(first ? "나에게 다정한 연습 · 성장 +5" : "나에게 다정한 연습");
    playSfx("cheer");
    setSaved(rec);
    history.current = [];
    setStep("done");
    setSelly("끝까지 와 줘서 고마워.\n오늘의 너에게, 나도 다정할게.");
  };

  // ---- the touch: a slow heartbeat, a few lines, ~24 seconds ----
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (step !== "touch") return;
    const reset = setTimeout(() => setTick(0), 0);
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    const beat = setInterval(() => buzz([35, 140, 35]), 1300);
    return () => {
      clearTimeout(reset);
      clearInterval(id);
      clearInterval(beat);
    };
  }, [step]);
  useEffect(() => {
    if (step !== "touch" || tick < TOUCH_SECONDS) return;
    const t = setTimeout(() => {
      buzz(60);
      go("warmth", "조금이라도\n따뜻함이 느껴졌어?");
    }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, step]);

  const stage = STAGE[step];
  const touchInfo = TOUCHES.find((t) => t.id === touch);

  let panel: React.ReactNode = null;
  if (step === "moment") {
    panel = (
      <Col>
        {MOMENTS.map((m) => (
          <Choice
            key={m.id}
            onClick={() => {
              setMoment(m.id);
              go("critic", `${m.selly}\n\n${m.id === "practice" ? "요즘 마음속에서 자주 들리는\n목소리가 있어?" : "그럴 때 마음속에서\n어떤 말이 들려?"}`);
            }}
          >
            <span className="text-[22px]" aria-hidden>
              {m.emoji}
            </span>
            {m.label}
          </Choice>
        ))}
        <p className="mt-1 text-center text-[12px] text-ink-500">3분쯤 걸려요. 언제든 멈춰도 괜찮아요.</p>
        {prevLadder != null && <p className="text-center text-[12px] text-ink-500">지난번에 믿어졌던 말 · ‘{LADDER[prevLadder]}’</p>}
      </Col>
    );
  } else if (step === "critic") {
    panel = (
      <Col>
        <div className="grid grid-cols-2 gap-2">
          {CRITICS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setCritic(c.id);
                go("loud", "이 목소리,\n지금 얼마나 커?");
              }}
              className="min-h-12 rounded-2xl bg-white/85 px-3 py-2.5 text-left text-[13.5px] font-bold text-ink-700 shadow-[0_4px_14px_-10px_rgba(110,88,60,0.5)] active:scale-[0.98]"
            >
              “{c.text}”
            </button>
          ))}
        </div>
        <OwnInput
          placeholder="직접 써도 돼요 (저장하지 않아요)"
          value={ownCritic}
          onChange={setOwnCritic}
          onSubmit={() => {
            setCritic("own");
            go("loud", "이 목소리,\n지금 얼마나 커?");
          }}
        />
        <button
          type="button"
          onClick={() => {
            setCritic("none");
            go("touch-pick", "좋아. 그럼 몸으로\n다정함을 느껴 보자.\n어떤 게 편해?");
          }}
          className="h-11 text-[13px] text-ink-500 underline underline-offset-4"
        >
          딱히 떠오르지 않아
        </button>
      </Col>
    );
  } else if (step === "loud") {
    panel = (
      <Scale
        options={LOUDNESS}
        onPick={(v) => {
          setLoudBefore(v);
          go("label", "아, 비판하는 목소리가 왔구나.\n싸우지 말고, 이름만 붙여 두자.");
        }}
      />
    );
  } else if (step === "label") {
    panel = (
      <Col>
        <motion.div
          initial={{ opacity: 0, scale: 1.05 }}
          animate={reduce ? { opacity: 1 } : { opacity: 0.85, scale: 0.9, y: -6 }}
          transition={{ duration: 2.4, ease: "easeOut" }}
          className="mx-auto rounded-[26px] bg-[#e9e6ea] px-5 py-4 text-center"
        >
          <p className="text-[11px] font-bold text-[#7d7686]">🌀 비판의 목소리</p>
          <p className="mt-1 text-[16px] text-[#5d5866]">“{criticText}”</p>
        </motion.div>
        <p className="break-keep px-2 text-center text-[13px] leading-relaxed text-ink-500">이 목소리는 사실이 아니라, 마음이 하는 말이에요. 한 걸음 떨어져서 바라만 봐요.</p>
        <Primary
          onClick={() => {
            const self = CRITICS.find((c) => c.id === critic);
            go("friend", `소중한 친구가\n“${criticText}”\n라고 한다면, 뭐라고 해 줄래?`);
            if (self) setFriendWords(null);
          }}
        >
          응, 알아봤어
        </Primary>
      </Col>
    );
  } else if (step === "friend") {
    const preset = CRITICS.find((c) => c.id === critic);
    const options = [...(preset ? [{ friend: preset.friend, self: preset.self }] : []), ...FRIEND_WORDS.filter((w) => w.toFriend !== "충분히 잘하고 있어").slice(0, 3).map((w) => ({ friend: w.toFriend, self: w.toSelf }))];
    panel = (
      <Col>
        {options.map((o) => (
          <Choice
            key={o.friend}
            onClick={() => {
              setFriendWords(o);
              go("turn", "이번엔 그 말을\n나에게 그대로 건네 볼까?");
            }}
          >
            <span className="text-[14px] font-normal">“{o.friend}”</span>
          </Choice>
        ))}
        <OwnInput
          placeholder="내 말로 써도 돼요 (저장하지 않아요)"
          value={ownFriend}
          onChange={setOwnFriend}
          onSubmit={() => {
            setFriendWords({ friend: ownFriend.trim(), self: ownFriend.trim() });
            go("turn", "방금 친구에게 한 말,\n이번엔 나에게 그대로.");
          }}
        />
      </Col>
    );
  } else if (step === "turn") {
    panel = (
      <Col>
        <div className="rounded-[24px] bg-white/85 px-5 py-5 text-center">
          <p className="text-[11.5px] text-ink-500">친구에게 했던 말 → 나에게</p>
          <p className="mt-2 break-keep text-[18px] font-bold leading-relaxed text-ink-700">“{friendWords?.self}”</p>
        </div>
        <p className="text-center text-[12.5px] text-ink-500">친구에게 하던 목소리 그대로, 마음속으로 천천히.</p>
        <Primary onClick={() => go("touch-pick", "이제 몸으로도\n다정함을 느껴 보자.\n어떤 게 편해?")}>마음속으로 말해 봤어</Primary>
      </Col>
    );
  } else if (step === "touch-pick") {
    panel = (
      <Col>
        {TOUCHES.map((t) => (
          <Choice
            key={t.id}
            onClick={() => {
              setTouch(t.id);
              go("touch", t.guide);
            }}
          >
            <span className="text-[22px]" aria-hidden>
              {t.emoji}
            </span>
            {t.label}
            {t.id === "cup" && <span className="ml-auto text-[11px] font-normal text-ink-500">가장 가벼운 방법</span>}
          </Choice>
        ))}
        <p className="text-center text-[12px] text-ink-500">어색해도 괜찮아요. 편한 것 하나만.</p>
      </Col>
    );
  } else if (step === "touch") {
    const left = Math.max(0, TOUCH_SECONDS - tick);
    panel = (
      <Col>
        <div className="relative mx-auto grid h-40 w-40 place-items-center">
          <motion.span
            className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(246,184,196,0.55),rgba(246,184,196,0.08)_70%)]"
            animate={reduce ? undefined : { scale: [0.82, 1.08, 0.82] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <span className="relative text-[44px]" aria-hidden>
            {touchInfo?.emoji}
          </span>
        </div>
        <AnimatePresence mode="wait">
          <motion.p key={Math.min(TOUCH_LINES.length - 1, Math.floor(tick / 6))} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center text-[15px] text-ink-700">
            {TOUCH_LINES[Math.min(TOUCH_LINES.length - 1, Math.floor(tick / 6))]}
          </motion.p>
        </AnimatePresence>
        <p className="text-center text-[12px] tabular-nums text-ink-300" aria-live="off">
          {left}초 · 숨이 커질 때 들이쉬고, 작아질 때 내쉬어요
        </p>
        <button type="button" onClick={() => go("warmth", "조금이라도\n따뜻함이 느껴졌어?")} className="h-11 text-[13px] text-ink-500 underline underline-offset-4">
          여기까지 할래
        </button>
      </Col>
    );
  } else if (step === "warmth") {
    panel = (
      <Col>
        <Scale
          options={WARMTH}
          onPick={(v) => {
            setWarmth(v);
            go("humanity", v === 0 ? `괜찮아, 처음엔 대부분 그래.\n\n${HUMANITY.selly}` : HUMANITY.selly);
          }}
        />
        <button
          type="button"
          onClick={() => {
            setWarmth("hard");
            go("backdraft", "말해 줘서 고마워.\n그럴 수 있어.");
          }}
          className="h-12 rounded-2xl bg-[#f3eef6] text-[13.5px] font-bold text-[#6d5a92]"
        >
          오히려 슬퍼지거나 불편해졌어
        </button>
      </Col>
    );
  } else if (step === "backdraft") {
    panel = (
      <Col>
        <div className="rounded-[22px] bg-white/85 px-4 py-4">
          <p className="text-[14.5px] font-bold text-ink-700">{BACKDRAFT.title}</p>
          {BACKDRAFT.lines.map((l) => (
            <p key={l} className="mt-1.5 break-keep text-[13.5px] leading-relaxed text-ink-700">
              {l}
            </p>
          ))}
          <p className="mt-2 break-keep rounded-2xl bg-[#f4f1fa] px-3 py-2 text-[13px] leading-relaxed text-[#5d4d7d]">🦶 {BACKDRAFT.ground}</p>
          <details className="mt-2 text-[10.5px] text-ink-300">
            <summary>출처 · ⚠️ 전문가 검토 전</summary>
            <p className="mt-1">
              {BACKDRAFT_SOURCE.title} ({BACKDRAFT_SOURCE.url}) · 열람 {BACKDRAFT_SOURCE.accessed}
            </p>
            <p className="mt-0.5 italic">{BACKDRAFT_SOURCE.quote}</p>
          </details>
        </div>
        <Choice
          onClick={() => {
            setTouch("arm");
            go("touch", "이번엔 아주 가볍게.\n팔을 천천히 쓸어내리기만 해 볼까?");
          }}
        >
          🫱 아주 가볍게 다시 해 볼래
        </Choice>
        <Choice onClick={() => go("humanity", HUMANITY.selly)}>🌿 이 단계는 넘어갈래</Choice>
        <button type="button" onClick={() => setHelp((h) => !h)} className="h-11 rounded-2xl bg-[#fff3ee] text-[13px] font-bold text-[#9c4f3f]">
          지금 많이 힘들어
        </button>
        {help && <HelpCard lead="혼자 견디기 어려울 만큼 힘들면, 지금 바로 이야기를 들어 줄 사람이 있어요." />}
      </Col>
    );
  } else if (step === "humanity") {
    panel = (
      <Col>
        <p className="rounded-2xl bg-white/80 px-4 py-3 text-center text-[13.5px] text-ink-700">셀리: “{HUMANITY.me}”</p>
        <Primary onClick={() => go("ladder", "이제 나에게 할 말을 골라 보자.\n제일 위가 아니어도 돼.\n지금 조금이라도 믿어지는 말로.")}>응</Primary>
      </Col>
    );
  } else if (step === "ladder") {
    panel = (
      <Col>
        <ol className="flex flex-col-reverse gap-1.5" aria-label="믿어지는 만큼 고르는 말 (아래가 가장 쉬워요)">
          {LADDER.map((l, i) => (
            <li key={l}>
              <button
                type="button"
                onClick={() => {
                  setLadder(i);
                  setSaid(0);
                  go("say", "이 말을 마음속으로,\n아니면 작게 소리 내어\n천천히 세 번.");
                }}
                className="flex min-h-11 w-full items-center gap-2 rounded-2xl bg-white/85 px-3.5 py-2 text-left text-[14px] text-ink-700 shadow-[0_3px_10px_-8px_rgba(110,88,60,0.5)] active:scale-[0.98]"
                style={{ marginLeft: `${i * 4}%`, width: `${100 - i * 4}%` }}
              >
                <span className="w-5 shrink-0 text-center text-[11px] text-ink-300">{i + 1}</span>
                <span className="flex-1">{l}</span>
                {prevLadder === i && <span className="shrink-0 rounded-full bg-[#fdf3f3] px-2 py-0.5 text-[10.5px] text-[#b9727b]">지난번</span>}
              </button>
            </li>
          ))}
        </ol>
        <p className="text-center text-[11.5px] text-ink-500">아래로 갈수록 쉬운 말이에요. ‘사랑해’까지 가지 않아도 괜찮아요.</p>
      </Col>
    );
  } else if (step === "say" && ladder != null) {
    const words = ownWords.trim() || LADDER[ladder];
    panel = (
      <Col>
        <div className="rounded-[24px] bg-white/85 px-5 py-6 text-center">
          <p className="break-keep text-[20px] font-bold leading-relaxed text-ink-700">“{words}”</p>
          <div className="mt-3 flex justify-center gap-2" aria-label={`${said} / 3번`}>
            {[0, 1, 2].map((i) => (
              <span key={i} className={`h-2.5 w-2.5 rounded-full transition-colors ${i < said ? "bg-[#e79aab]" : "bg-[#eadfce]"}`} />
            ))}
          </div>
        </div>
        {said < 3 ? (
          <Primary
            onClick={() => {
              playSfx("pat");
              buzz(25);
              setSaid((n) => n + 1);
            }}
          >
            말해 봤어 ({said + 1}/3)
          </Primary>
        ) : (
          <Primary onClick={() => go("need", "마지막으로,\n지금 나에게 필요한\n작은 것 하나는 뭘까?")}>다음</Primary>
        )}
        {said >= 3 && ladder < LADDER.length - 1 && !ownWords.trim() && (
          <p className="text-center text-[12.5px] text-ink-500">
            한 칸 위도 살짝 말해 볼래? <span className="text-ink-700">“{LADDER[ladder + 1]}”</span> · 안 해도 괜찮아
          </p>
        )}
        <OwnInput placeholder="내 말로 바꿔 보기 (저장하지 않아요)" value={ownWords} onChange={setOwnWords} onSubmit={() => setSaid(0)} submitLabel="바꾸기" />
      </Col>
    );
  } else if (step === "need") {
    panel = (
      <Col>
        <div className="grid grid-cols-2 gap-2">
          {NEEDS.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => {
                setNeed(n.id);
                if (loudBefore != null) go("after", "아까 그 비판의 목소리,\n지금은 얼마나 커?");
                else finish();
              }}
              className="flex min-h-12 items-center gap-2 rounded-2xl bg-white/85 px-3 py-2.5 text-left text-[13.5px] font-bold text-ink-700 shadow-[0_4px_14px_-10px_rgba(110,88,60,0.5)] active:scale-[0.98]"
            >
              <span className="text-[20px]" aria-hidden>
                {n.emoji}
              </span>
              {n.label}
            </button>
          ))}
        </div>
        <p className="text-center text-[12px] text-ink-500">다정함은 말뿐 아니라, 나를 챙기는 작은 행동이기도 해요.</p>
      </Col>
    );
  } else if (step === "after") {
    panel = <Scale options={LOUDNESS} onPick={(v) => finish(v)} />;
  } else if (step === "done" && saved) {
    const n = NEEDS.find((x) => x.id === saved.need);
    const change = loudnessChange(log);
    panel = (
      <Col>
        <div className="rounded-[24px] bg-white/85 px-4 py-4">
          <p className="text-[12px] font-bold text-sage-700">오늘의 연습</p>
          {saved.loudBefore != null && saved.loudAfter != null && (
            <p className="mt-1.5 text-[13.5px] text-ink-700">
              🌀 비판의 목소리 <b>{LOUDNESS[saved.loudBefore].label}</b> → <b>{LOUDNESS[saved.loudAfter].label}</b>
              {saved.loudAfter > saved.loudBefore && <span className="block text-[12px] text-ink-500">더 커졌어도 괜찮아요. 오늘은 알아본 것만으로 충분해요.</span>}
            </p>
          )}
          {saved.warmth != null && <p className="mt-1 text-[13.5px] text-ink-700">🤲 따뜻함 · {saved.warmth === "hard" ? "오히려 힘들었어 (천천히 가도 돼요)" : WARMTH[saved.warmth].label}</p>}
          {saved.ladder != null && (
            <p className="mt-1 text-[13.5px] text-ink-700">
              💬 믿어졌던 말 · ‘{LADDER[saved.ladder]}’
              {prevLadder != null && prevLadder !== saved.ladder && <span className="block text-[12px] text-ink-500">지난번엔 ‘{LADDER[prevLadder]}’였어요. 오르내려도 괜찮아요.</span>}
            </p>
          )}
          {change && (
            <p className="mt-2 rounded-2xl bg-[#f4f1fa] px-3 py-2 text-[12px] leading-relaxed text-[#5d4d7d]">
              지금까지 {change.n}번 연습에서 비판의 목소리는 평균 {change.before} → {change.after} (0~3, 내 기록 기준). 연습 때문이라고 단정할 수는 없지만, 알아보는 데 도움이 될 거예요.
            </p>
          )}
        </div>
        {n && (
          <div className="rounded-2xl bg-[#fff8e3] px-4 py-3 text-[13.5px] text-[#7a5a14]">
            {n.emoji} {n.label}
            {n.href ? (
              <Link href={n.href} className="ml-2 font-bold underline underline-offset-2">
                지금 하러 가기
              </Link>
            ) : (
              <span> — 다녀와. 셀리가 여기 있을게.</span>
            )}
          </div>
        )}
        <Primary onClick={() => router.push("/")}>온실로 돌아가기</Primary>
        <details className="text-[10.5px] text-ink-300">
          <summary>이 연습의 바탕 · ⚠️ 전문가 검토 전</summary>
          <p className="mt-1">
            Kristin Neff의 연습(친구에게 하듯 · 자기자비 쉼 · 다정한 손길)을 바탕으로 했어요. 열람 {SC_ACCESSED}. ‘믿어지는 만큼 고르는 말’은 디어셀리가 만든 방식이에요. 치료나 상담을 대신하지 않아요.
          </p>
          {SC_SOURCES.slice(0, 3).map((s) => (
            <p key={s.url} className="mt-0.5">
              {s.title} ({s.url})
            </p>
          ))}
        </details>
      </Col>
    );
  }

  return (
    <main className="relative flex h-full w-full flex-col overflow-hidden bg-[linear-gradient(180deg,#fbf1f2_0%,#fbf6ec_55%,#f1f4ea_100%)]">
      <header className="flex shrink-0 items-center gap-2 px-3 pb-1 pt-[calc(env(safe-area-inset-top)+10px)]">
        {IS_TOSS || step === "moment" || step === "done" ? (
          <span className="w-11 shrink-0" aria-hidden />
        ) : (
          <button type="button" aria-label="이전 단계" onClick={back} className="glass grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink-500 active:scale-90">
            <ChevronLeft size={22} />
          </button>
        )}
        <div className="flex flex-1 flex-col items-center">
          <h1 className="text-[15px] font-bold text-ink-700">나에게 다정해지는 연습</h1>
          <div className="mt-1 flex gap-1.5" aria-label={`${STAGES[stage]} 단계 (${stage + 1} / 5)`}>
            {STAGES.map((l, i) => (
              <span key={l} className={`h-1.5 rounded-full transition-all ${i === stage ? "w-5 bg-[#e79aab]" : i < stage ? "w-1.5 bg-[#f1bcc7]" : "w-1.5 bg-[#e3dacd]"}`} />
            ))}
          </div>
        </div>
        <button type="button" aria-label="그만하기 (저장하지 않아요)" onClick={() => router.push("/")} className="glass grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink-500 active:scale-90">
          <X size={20} />
        </button>
      </header>

      <div className="flex shrink-0 items-end gap-2 px-5 pt-2">
        <div className="w-[min(26vw,15dvh,100px)] shrink-0">
          <Selly pose={step === "done" ? "love" : step === "touch" ? "relaxed" : "happy"} className="w-full" />
        </div>
        <AnimatePresence mode="wait">
          <motion.p
            key={selly}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-3 flex-1 whitespace-pre-line break-keep rounded-[22px] rounded-bl-md bg-white/90 px-4 py-3 text-[15px] leading-relaxed text-ink-700 shadow-[0_8px_24px_-14px_rgba(110,88,60,0.5)]"
            aria-live="polite"
          >
            {selly}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-3">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
            {panel}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}

function Col({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-2">{children}</div>;
}

function Choice({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="flex min-h-12 items-center gap-3 rounded-2xl bg-white/85 px-4 py-3 text-left text-[14.5px] font-bold text-ink-700 shadow-[0_4px_14px_-10px_rgba(110,88,60,0.5)] active:scale-[0.98]">
      {children}
    </button>
  );
}

function Primary({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="h-12 rounded-full bg-gradient-to-b from-[#f0a9b8] to-[#de8a9d] text-[15px] font-bold text-white shadow-[0_10px_24px_-12px_rgba(200,100,120,0.8)] active:scale-[0.98]">
      {children}
    </button>
  );
}

function Scale({ options, onPick }: { options: readonly { v: number; label: string }[]; onPick: (v: number) => void }) {
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {options.map((o) => (
        <button key={o.v} type="button" onClick={() => onPick(o.v)} className="flex h-16 flex-col items-center justify-center rounded-2xl bg-white/85 text-[13px] font-bold text-ink-700 shadow-[0_4px_14px_-10px_rgba(110,88,60,0.5)] active:scale-95">
          <span className="mb-1 flex gap-0.5" aria-hidden>
            {[0, 1, 2].map((i) => (
              <span key={i} className={`h-1.5 w-1.5 rounded-full ${i < o.v ? "bg-[#e79aab]" : "bg-[#eadfce]"}`} />
            ))}
          </span>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function OwnInput({ placeholder, value, onChange, onSubmit, submitLabel = "이걸로" }: { placeholder: string; value: string; onChange: (v: string) => void; onSubmit: () => void; submitLabel?: string }) {
  return (
    <form
      className="flex gap-1.5"
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) onSubmit();
      }}
    >
      <input
        value={value}
        maxLength={40}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-11 min-w-0 flex-1 rounded-2xl border border-[#eadfce] bg-white px-3 text-[13.5px] outline-none focus:border-[#e7aebb]"
      />
      <button type="submit" disabled={!value.trim()} className="h-11 shrink-0 rounded-2xl bg-white px-3 text-[13px] font-bold text-[#b9727b] shadow-sm disabled:opacity-40">
        {submitLabel}
      </button>
    </form>
  );
}
