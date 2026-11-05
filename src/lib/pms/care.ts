import { CARE_CARDS, type CareCard } from "@/data/careEvidence";
import type { SymptomId } from "@/data/pmsSymptoms";
import type { PmsPattern } from "./analysis";

export interface CarePick {
  card: CareCard;
  /** the user's own recorded symptoms that the source names for this card */
  matched: SymptomId[];
}

/** The user's symptoms to focus on: repeated ones first, then anything recorded in analysed or current cycles. */
export function focusSymptoms(p: PmsPattern): SymptomId[] {
  const out: SymptomId[] = p.repeated.map((r) => r.id);
  for (const c of [...p.cycles, ...(p.current ? [p.current] : [])]) for (const s of c.symptoms) if (!out.includes(s.id)) out.push(s.id);
  return out;
}

/**
 * Order the cards: those whose source names one of the user's symptoms come
 * first (earlier focus symptoms weigh more); the rest keep their order.
 * Matching only re-orders — every card stays available, and no card is
 * presented as treatment for the user's case.
 */
export function pickCare(focus: SymptomId[], enough: boolean): CarePick[] {
  const weight = (id: SymptomId) => {
    const i = focus.indexOf(id);
    return i < 0 ? 0 : focus.length - i;
  };
  return CARE_CARDS.map((card, order) => {
    const matched = card.mentions.filter((id) => focus.includes(id));
    let score = matched.reduce((a, id) => a + weight(id), 0) * 10;
    if (card.id === "diary" && !enough) score += 1000; // not enough records yet → keep recording first
    return { card, matched, score, order };
  })
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .map(({ card, matched }) => ({ card, matched }));
}
