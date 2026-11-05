"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronDown } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { SproutLeafIcon } from "@/components/ui/icons";
import { FOOD_GROUPS, FOOD_LABEL, MEAL_SLOTS, type FoodId, type MealSlot } from "@/data/foods";
import { setMeal, useAppData } from "@/lib/data-store";
import type { DateKey } from "@/lib/date";
import { playSfx } from "@/lib/sound/sfx";

/** 식사 — kinds of food per meal, one tap each, saved right away. No amounts, no scores. */
export function MealCard({ date }: { date: DateKey }) {
  const { meals } = useAppData();
  const day = meals[date];
  const [open, setOpen] = useState<MealSlot | null>(null);
  const recorded = MEAL_SLOTS.filter((m) => day?.[m.id]).length;

  const toggleFood = (slot: MealSlot, id: FoodId) => {
    const cur = day?.[slot];
    const foods = cur?.foods ?? [];
    const next = foods.includes(id) ? foods.filter((f) => f !== id) : [...foods, id];
    setMeal(date, slot, { foods: next });
    if (!foods.includes(id)) playSfx("tap");
  };

  return (
    <SectionCard icon={<SproutLeafIcon />} title="식사" aside={recorded ? <span className="text-[11.5px] tabular-nums text-ink-500">{recorded}/4</span> : undefined}>
      <ul className="flex flex-col gap-1.5">
        {MEAL_SLOTS.map((m) => {
          const meal = day?.[m.id];
          const isOpen = open === m.id;
          return (
            <li key={m.id} className="overflow-hidden rounded-2xl bg-white/70">
              <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : m.id)} className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left">
                <span className="text-[18px]" aria-hidden>
                  {m.emoji}
                </span>
                <span className="w-9 shrink-0 text-[14px] font-bold text-ink-700">{m.label}</span>
                <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink-500">
                  {meal?.skipped ? "걸렀어요" : meal?.foods.length ? meal.foods.map((f) => FOOD_LABEL[f]).join(", ") : <span className="text-ink-300">눌러서 기록</span>}
                </span>
                {meal && <Check size={15} className="shrink-0 text-sage-600" />}
                <ChevronDown size={16} className={`shrink-0 text-ink-300 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-[#efe7da] px-3.5 pb-3 pt-2.5">
                    {FOOD_GROUPS.map((g) => (
                      <div key={g.id} className="mb-2">
                        <p className="mb-1 text-[11px] text-ink-500">{g.label}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {g.items.map((it) => {
                            const on = !!meal?.foods.includes(it.id);
                            return (
                              <button
                                key={it.id}
                                type="button"
                                aria-pressed={on}
                                onClick={() => toggleFood(m.id, it.id)}
                                className={`h-8 rounded-full px-3 text-[12.5px] transition active:scale-95 ${on ? "bg-sage-500 font-bold text-white" : "bg-[#f6f1e8] text-ink-700"}`}
                              >
                                {it.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    {m.id !== "snack" && (
                      <button
                        type="button"
                        aria-pressed={!!meal?.skipped}
                        onClick={() => setMeal(date, m.id, meal?.skipped ? null : { foods: [], skipped: true })}
                        className={`mt-1 h-8 rounded-full px-3 text-[12.5px] ${meal?.skipped ? "bg-ink-500 font-bold text-white" : "bg-[#f6f1e8] text-ink-500"}`}
                      >
                        걸렀어요
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-center text-[11px] text-ink-300">양이나 칼로리는 적지 않아요. 무엇을 먹었는지만 가볍게 남겨요.</p>
    </SectionCard>
  );
}
