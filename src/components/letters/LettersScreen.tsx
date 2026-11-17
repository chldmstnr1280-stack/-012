"use client";

import { useState } from "react";
import { AnimatePresence } from "motion/react";
import { Heart, Trash2 } from "lucide-react";
import { SubPage } from "@/components/screens/SubPage";
import { LETTER_BY_ID } from "@/data/letters";
import { setPrefs, useAppData } from "@/lib/data-store";
import { formatShort } from "@/lib/date";
import { prefsOf, type LetterFreq } from "@/lib/letters/engine";
import { deleteLetter } from "@/lib/letters/client";
import { LetterView } from "./LetterView";

const FREQ: { id: LetterFreq; label: string; hint: string }[] = [
  { id: "often", label: "자주", hint: "일주일에 4~5통" },
  { id: "normal", label: "보통", hint: "3~4통" },
  { id: "rare", label: "가끔", hint: "1~2통" },
  { id: "off", label: "안 받기", hint: "" },
];

/** 편지함 — every letter Selly sent, to read again; and how letters arrive. */
export function LettersScreen() {
  const data = useAppData();
  const prefs = prefsOf(data);
  const items = [...(data.letterBox?.items ?? [])].reverse();
  const [openId, setOpenId] = useState<string | null>(null);
  const [onlyFav, setOnlyFav] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);
  const opened = items.find((l) => l.id === openId);
  const shown = onlyFav ? items.filter((l) => l.fav) : items;
  const set = (p: Partial<typeof prefs>) => setPrefs({ letters: { ...prefs, ...p } });

  return (
    <SubPage title="셀리의 편지함">
      <section className="glass rounded-[26px] p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[14px] font-bold text-ink-700">받은 편지 {items.length}통</h2>
          <button type="button" aria-pressed={onlyFav} onClick={() => setOnlyFav((v) => !v)} className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-bold ${onlyFav ? "bg-[#fbeef1] text-[#c4627a]" : "bg-white/70 text-ink-500"}`}>
            <Heart size={13} fill={onlyFav ? "#c4627a" : "none"} /> 마음에 든 편지
          </button>
        </div>
        {shown.length === 0 ? (
          <p className="mt-3 break-keep text-[13px] leading-relaxed text-ink-500">
            {onlyFav ? "♡ 표시한 편지가 아직 없어요." : prefs.freq === "off" ? "편지를 받지 않도록 해 두었어요. 아래에서 바꿀 수 있어요." : `아직 편지가 없어요. ${prefs.hour}시 이후에 온실에 들르면 셀리가 가끔 편지를 보내요.`}
          </p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {shown.map((l) => {
              const tpl = LETTER_BY_ID[l.tpl];
              if (!tpl) return null;
              return (
                <li key={l.id} className="flex items-center gap-2 rounded-2xl bg-white/80 px-3 py-2.5">
                  <button type="button" onClick={() => setOpenId(l.id)} className="min-w-0 flex-1 text-left">
                    <span className="flex items-center gap-1.5 text-[11.5px] text-ink-500">
                      {!l.read && <span className="h-2 w-2 rounded-full bg-[#e76f86]" aria-label="안 읽음" />}
                      {formatShort(l.date)}
                      {(l.card || l.pattern) && <span>· {l.pattern ? "📊" : "🔬"}</span>}
                      {l.fav && <Heart size={11} fill="#d9788d" color="#d9788d" />}
                    </span>
                    <span className="block truncate text-[13.5px] text-ink-700">{tpl.lines[0]}</span>
                  </button>
                  {confirm === l.id ? (
                    <button type="button" onClick={() => { deleteLetter(l.id); setConfirm(null); }} className="shrink-0 rounded-full bg-[#f6e3e3] px-2.5 py-1 text-[11.5px] font-bold text-[#9c3f4d]">
                      지우기
                    </button>
                  ) : (
                    <button type="button" aria-label="이 편지 지우기" onClick={() => setConfirm(l.id)} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-300">
                      <Trash2 size={14} />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="glass mt-4 rounded-[26px] p-4">
        <h2 className="text-[14px] font-bold text-ink-700">편지 받는 방법</h2>
        <p className="mt-2 text-[12px] text-ink-500">얼마나 자주</p>
        <div className="mt-1 grid grid-cols-4 gap-1.5">
          {FREQ.map((f) => (
            <button key={f.id} type="button" aria-pressed={prefs.freq === f.id} onClick={() => set({ freq: f.id })} className={`flex min-h-12 flex-col items-center justify-center rounded-2xl text-[12.5px] font-bold ${prefs.freq === f.id ? "bg-sage-500 text-white" : "bg-white text-ink-700"}`}>
              {f.label}
              {f.hint && <span className={`text-[10px] font-normal ${prefs.freq === f.id ? "text-white/80" : "text-ink-500"}`}>{f.hint}</span>}
            </button>
          ))}
        </div>
        <label className="mt-3 flex items-center justify-between text-[13px] text-ink-700">
          <span>편지가 오는 시간</span>
          <select value={prefs.hour} onChange={(e) => set({ hour: Number(e.target.value) })} className="h-10 rounded-xl border border-[#eadfce] bg-white px-2 text-[13px]">
            {[6, 9, 12, 15, 18, 20, 22].map((h) => (
              <option key={h} value={h}>
                {h}시 이후
              </option>
            ))}
          </select>
        </label>
        {(
          [
            ["cycle", "생리주기에 관한 편지", "예상 기간·시작·끝날 때"],
            ["mood", "마음 기록에 관한 편지", "힘든 날이 이어질 때, 좋은 날이 이어질 때"],
          ] as const
        ).map(([k, label, hint]) => (
          <div key={k} className="mt-3 flex items-center justify-between">
            <span>
              <span className="block text-[13px] text-ink-700">{label}</span>
              <span className="text-[11px] text-ink-500">{hint}</span>
            </span>
            <button type="button" role="switch" aria-checked={prefs[k]} aria-label={label} onClick={() => set({ [k]: !prefs[k] })} className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${prefs[k] ? "bg-sage-500" : "bg-[#d9d2c6]"}`}>
              <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-[left] ${prefs[k] ? "left-[22px]" : "left-0.5"}`} />
            </button>
          </div>
        ))}
        <p className="mt-3 text-[11px] leading-relaxed text-ink-500">
          편지는 이 기기에서 내 기록을 보고 골라요. 어떤 기록도 서버나 AI로 보내지 않아요. 내 기록에서 찾은 패턴 카드는 ‘셀리가 발견한 작은 패턴’을 끄면 오지 않아요. 지금은 앱을 열었을 때 편지가 와 있어요(알림은 아직 없어요).
        </p>
      </section>

      <AnimatePresence>{opened && <LetterView key={opened.id} letter={opened} sealed={!opened.read} onClose={() => setOpenId(null)} />}</AnimatePresence>
    </SubPage>
  );
}
