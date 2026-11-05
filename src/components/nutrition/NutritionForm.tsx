"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { Check, Minus, Pencil, Plus, X } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { SproutLeafIcon } from "@/components/ui/icons";
import { DEFAULT_WATER_GOAL, NUTRIENTS, NUTRIENT_LABEL, SUPP_TIMES, WATER_CUP_ML, type NutrientId, type SuppTime } from "@/data/nutrition";
import { addWater, retireSupplement, saveSupplement, setPrefs, toggleSuppTaken, useAppData, type Supplement } from "@/lib/data-store";
import type { DateKey } from "@/lib/date";
import { useSelly } from "@/lib/selly-store";
import { playSfx } from "@/lib/sound/sfx";

/**
 * 물·영양제 — a quick daily check-in. Records only: the app never suggests a
 * supplement or a dose. Kept on this device (and in the backup file).
 */
export function NutritionForm({ date, isFuture }: { date: DateKey; isFuture: boolean }) {
  const data = useAppData();
  const { showToast } = useSelly();
  const [editing, setEditing] = useState<Supplement | "new" | null>(null);
  const goal = data.prefs.waterGoal ?? DEFAULT_WATER_GOAL;
  const cups = data.water[date] ?? 0;

  if (isFuture) return <p className="glass rounded-[22px] p-5 text-center text-[13px] text-ink-500">아직 오지 않은 날이에요.</p>;

  const active = data.supplements.filter((s) => s.active);
  // what was taken that day, including supplements stopped since
  const taken = new Set(data.suppLog[date] ?? []);
  const slots = SUPP_TIMES.map((t) => ({ ...t, items: active.filter((s) => s.times.includes(t.id) || (t.id === "morning" && !s.times.length)) })).filter((t) => t.items.length);
  const doneCount = slots.reduce((a, t) => a + t.items.filter((s) => taken.has(`${s.id}@${t.id}`)).length, 0);
  const totalCount = slots.reduce((a, t) => a + t.items.length, 0);

  const drink = (d: number) => {
    const n = addWater(date, d);
    if (d > 0) playSfx("water");
    if (d > 0 && n === goal) showToast("💧 오늘 물 목표를 채웠어요!");
  };

  return (
    <div className="flex flex-col gap-3">
      {/* water */}
      <SectionCard icon={<SproutLeafIcon />} title="물" aside={<span className="text-[11.5px] tabular-nums text-ink-500">{cups * WATER_CUP_ML} ml</span>}>
        <div className="flex flex-wrap justify-center gap-1" aria-label={`물 ${cups}컵, 목표 ${goal}컵`}>
          {Array.from({ length: Math.max(goal, cups) }, (_, i) => (
            <motion.button
              key={i}
              type="button"
              whileTap={{ scale: 0.88 }}
              // tap an empty cup: fill up to it · tap a full cup: empty from it
              onClick={() => drink((i < cups ? i : i + 1) - cups)}
              aria-label={i < cups ? `${i}컵으로 줄이기` : `${i + 1}컵으로 채우기`}
              className="grid h-11 w-[34px] place-items-center"
            >
              <Cup filled={i < cups} over={i >= goal} />
            </motion.button>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-center gap-3">
          <button type="button" aria-label="한 컵 빼기" disabled={!cups} onClick={() => drink(-1)} className="grid h-11 w-11 place-items-center rounded-full bg-white text-ink-500 shadow-sm disabled:opacity-40">
            <Minus size={18} />
          </button>
          <p className="min-w-[96px] text-center">
            <span className="text-[26px] font-bold tabular-nums text-ink-700">{cups}</span>
            <span className="text-[14px] text-ink-500"> / {goal}컵</span>
          </p>
          <button type="button" aria-label="한 컵 마셨어요" onClick={() => drink(1)} className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-b from-[#a9d4e6] to-[#7fb6d0] text-white shadow-[0_6px_14px_-8px_rgba(60,120,150,0.8)]">
            <Plus size={20} />
          </button>
        </div>
        <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[11.5px] text-ink-500">
          하루 목표
          {[6, 7, 8, 10].map((g) => (
            <button
              key={g}
              type="button"
              aria-pressed={goal === g}
              onClick={() => setPrefs({ waterGoal: g })}
              className={`rounded-full px-2 py-0.5 tabular-nums ${goal === g ? "bg-[#dcecf3] font-bold text-[#3f7590]" : "bg-white/70"}`}
            >
              {g}컵
            </button>
          ))}
        </div>
        <p className="mt-2 text-center text-[11px] text-ink-300">한 컵은 {WATER_CUP_ML} ml예요. 목표는 나에게 맞게 정해요.</p>
      </SectionCard>

      {/* supplements */}
      <SectionCard
        icon={<SproutLeafIcon />}
        title="영양제"
        aside={
          totalCount ? <span className="text-[11.5px] tabular-nums text-ink-500">{doneCount}/{totalCount}</span> : undefined
        }
      >
        {slots.length ? (
          <div className="flex flex-col gap-3">
            {slots.map((t) => (
              <div key={t.id}>
                <p className="mb-1.5 text-[12px] font-bold text-ink-500">{t.label}</p>
                <ul className="flex flex-col gap-1.5">
                  {t.items.map((s) => {
                    const key = `${s.id}@${t.id}`;
                    const on = taken.has(key);
                    return (
                      <li key={key}>
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={on}
                          onClick={() => {
                            toggleSuppTaken(date, key);
                            if (!on) playSfx("tap");
                          }}
                          className={`flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left transition ${on ? "bg-[#eef5e9]" : "bg-white/75"}`}
                        >
                          <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 ${on ? "border-sage-500 bg-sage-500 text-white" : "border-[#d9cfc2]"}`}>
                            {on && <Check size={14} strokeWidth={3} />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className={`block text-[14px] font-bold ${on ? "text-sage-700" : "text-ink-700"}`}>{s.name}</span>
                            {s.nutrients.length > 0 && <span className="block truncate text-[11px] text-ink-300">{s.nutrients.map((n) => NUTRIENT_LABEL[n]).join(" · ")}</span>}
                          </span>
                          <span className="text-[11.5px] text-ink-300">{on ? "먹었어요" : ""}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <p className="break-keep text-center text-[12.5px] leading-relaxed text-ink-500">챙겨 먹는 영양제를 등록하면, 매일 먹었는지 가볍게 체크할 수 있어요.</p>
        )}
        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
          {active.map((s) => (
            <button key={s.id} type="button" onClick={() => setEditing(s)} className="flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-1 text-[11.5px] text-ink-500">
              <Pencil size={11} /> {s.name}
            </button>
          ))}
          <button type="button" onClick={() => setEditing("new")} className="flex items-center gap-1 rounded-full bg-sage-50 px-3 py-1 text-[12px] font-bold text-sage-700">
            <Plus size={13} /> 영양제 추가
          </button>
        </div>
        <p className="mt-2.5 break-keep text-center text-[11px] leading-relaxed text-ink-300">
          셀리는 영양제를 추천하지 않아요. 새로 먹거나 바꿀 땐, 특히 다른 약을 먹고 있다면 의사·약사와 먼저 상의해요.
        </p>
      </SectionCard>

      {/* rendered on the app frame, above the bottom navigation (the page itself scrolls inside a transformed layer) */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>{editing && <SupplementEditor item={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}</AnimatePresence>,
          document.querySelector("[data-app-frame]") ?? document.body,
        )}
    </div>
  );
}

/** A small cup that fills; cups past the goal are drawn a bit lighter. */
function Cup({ filled, over }: { filled: boolean; over: boolean }) {
  return (
    <svg viewBox="0 0 28 36" className="h-9 w-7" aria-hidden>
      <path d="M4 4 H24 L21.5 32 Q21.3 34 19.3 34 H8.7 Q6.7 34 6.5 32 Z" fill="#fff" stroke={over ? "#cfe0e8" : "#a9cbdb"} strokeWidth="1.6" />
      {filled && <path d="M5.6 12 H22.4 L21.5 32 Q21.3 34 19.3 34 H8.7 Q6.7 34 6.5 32 Z" fill={over ? "#c5e2ee" : "#8ec5dc"} />}
      {filled && <path d="M8 16 Q9 14.5 10 16" stroke="#fff" strokeWidth="1.2" fill="none" strokeLinecap="round" />}
    </svg>
  );
}

function SupplementEditor({ item, onClose }: { item: Supplement | null; onClose: () => void }) {
  const [name, setName] = useState(item?.name ?? "");
  const [nutrients, setNutrients] = useState<NutrientId[]>(item?.nutrients ?? []);
  const [times, setTimes] = useState<SuppTime[]>(item?.times ?? ["morning"]);
  const { showToast } = useSelly();
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const ok = name.trim().length > 0 && times.length > 0;

  return (
    <motion.div className="absolute inset-0 z-[70] flex items-end justify-center bg-[rgba(60,45,30,0.3)]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        role="dialog"
        aria-label={item ? "영양제 고치기" : "영양제 추가"}
        initial={{ y: 40 }}
        animate={{ y: 0 }}
        exit={{ y: 40 }}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[88%] w-full max-w-[430px] overflow-y-auto rounded-t-[30px] bg-[#fdfaf3] px-5 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-4"
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[16px] font-bold text-ink-700">{item ? "영양제 고치기" : "영양제 추가"}</p>
          <button type="button" aria-label="닫기" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-white/70 text-ink-500">
            <X size={18} />
          </button>
        </div>
        <label className="block text-[12.5px] font-bold text-ink-500">
          이름
          <input
            value={name}
            maxLength={40}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 비타민D 1000IU"
            className="mt-1 h-11 w-full rounded-2xl border border-[#ece4d6] bg-white px-3.5 text-[14.5px] font-normal text-ink-700 outline-none focus:border-sage-300"
          />
        </label>
        <p className="mt-3 text-[12.5px] font-bold text-ink-500">언제 먹어요?</p>
        <div className="mt-1.5 flex gap-1.5">
          {SUPP_TIMES.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={times.includes(t.id)}
              onClick={() => setTimes((x) => toggle(x, t.id))}
              className={`h-9 flex-1 rounded-full text-[13px] ${times.includes(t.id) ? "bg-sage-500 font-bold text-white" : "bg-white text-ink-700"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-[12.5px] font-bold text-ink-500">
          들어 있는 성분 <span className="font-normal text-ink-300">(선택 · 라벨을 보고 골라요)</span>
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {NUTRIENTS.map((n) => (
            <button
              key={n.id}
              type="button"
              aria-pressed={nutrients.includes(n.id)}
              onClick={() => setNutrients((x) => toggle(x, n.id))}
              className={`h-8 rounded-full px-3 text-[12.5px] ${nutrients.includes(n.id) ? "bg-[#dcecf3] font-bold text-[#3f7590]" : "bg-white text-ink-700"}`}
            >
              {n.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-ink-300">성분은 나중에 같은 성분이 겹치는지 알려 줄 때만 써요.</p>
        <button
          type="button"
          disabled={!ok}
          onClick={() => {
            saveSupplement({ id: item?.id, name: name.trim(), nutrients, times, active: true });
            showToast(item ? "영양제를 고쳤어요" : "영양제를 등록했어요");
            onClose();
          }}
          className="mt-4 h-12 w-full rounded-full bg-gradient-to-b from-[#9cc095] to-[#7ea47a] text-[15px] font-bold text-white disabled:opacity-50"
        >
          저장하기
        </button>
        {item && (
          <button
            type="button"
            onClick={() => {
              retireSupplement(item.id);
              showToast(`${item.name}을(를) 목록에서 뺐어요`);
              onClose();
            }}
            className="mt-2 w-full py-2 text-center text-[12.5px] text-ink-300 underline underline-offset-4"
          >
            이제 안 먹어요 (목록에서 빼기)
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}
