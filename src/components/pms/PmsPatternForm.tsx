"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { SectionCard } from "@/components/ui/SectionCard";
import { SproutLeafIcon } from "@/components/ui/icons";
import { ONSET_OPTIONS, SYMPTOM_GROUPS, type OnsetId, type Score, type SymptomId } from "@/data/pmsSymptoms";
import type { PmsProfile } from "@/lib/data-store";
import { ScoreRow } from "./ScoreRow";

type Pattern = Omit<PmsProfile, "updatedAt">;

/**
 * The same questions for "평소 PMS 패턴" and "이번 주기 돌아보기":
 * each symptom 0–4 (tap again to clear = 잘 모름) and when it usually starts.
 */
export function PmsPatternForm({ initial, intro, saveLabel, onSave }: { initial?: Pattern; intro: React.ReactNode; saveLabel: string; onSave: (p: Pattern) => void }) {
  const [symptoms, setSymptoms] = useState<Pattern["symptoms"]>(initial?.symptoms ?? {});
  const [onset, setOnset] = useState<OnsetId | undefined>(initial?.onset);
  const pick = (id: SymptomId, v: Score) =>
    setSymptoms((s) => {
      const next = { ...s };
      if (next[id] === v) delete next[id];
      else next[id] = v;
      return next;
    });
  const any = Object.keys(symptoms).length > 0 || !!onset;

  return (
    <div className="flex flex-col gap-3">
      <div className="glass rounded-[22px] px-4 py-3.5 text-[13px] leading-relaxed text-ink-500">{intro}</div>

      <SectionCard icon={<SproutLeafIcon />} title="언제부터 시작돼?" aside={<span className="text-[11px] text-ink-300">생리 시작 기준</span>}>
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="증상이 시작되는 때">
          {ONSET_OPTIONS.map((o) => {
            const on = onset === o.id;
            return (
              <button
                key={o.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setOnset(on ? undefined : o.id)}
                className={`h-9 rounded-full px-3.5 text-[13px] transition active:scale-95 ${on ? "bg-sage-500 font-bold text-white" : "bg-white/80 text-ink-700 shadow-[0_3px_10px_-8px_rgba(110,88,60,0.5)]"}`}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      </SectionCard>

      {SYMPTOM_GROUPS.map((g) => (
        <SectionCard key={g.id} icon={<SproutLeafIcon />} title={`${g.label} 증상`} aside={<span className="text-[11px] tabular-nums text-ink-300">0 없음 · 4 매우 심함</span>}>
          <ul className="flex flex-col gap-1.5">
            {g.items.map((it) => (
              <ScoreRow key={it.id} label={it.label} value={symptoms[it.id as SymptomId]} onPick={(v) => pick(it.id as SymptomId, v)} />
            ))}
          </ul>
        </SectionCard>
      ))}

      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        disabled={!any}
        onClick={() => onSave({ symptoms, ...(onset ? { onset } : {}) })}
        className="mt-1 h-14 w-full rounded-full bg-gradient-to-b from-[#9cc095] to-[#7ea47a] text-[16px] font-bold text-white shadow-[0_10px_24px_-10px_rgba(90,130,85,0.8)] disabled:opacity-50"
      >
        {saveLabel}
      </motion.button>
      <p className="px-2 text-center text-[11.5px] leading-relaxed text-ink-300">
        모르는 항목은 비워 두세요. 내가 느낀 정도를 적는 거예요, 진단이 아니에요.
        <br />이 기기에 저장돼요.
      </p>
    </div>
  );
}
