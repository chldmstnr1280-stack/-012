import { NUTRIENT_LABEL, type NutrientId } from "@/data/nutrition";
import type { Supplement } from "@/lib/data-store";
import { hasBatchim } from "@/lib/pms/insight";

/**
 * Same nutrient in more than one product — stated as a fact with a nudge to
 * ask a pharmacist. No doses, no "too much", no advice to stop or change.
 */
export interface Overlap {
  nutrient: NutrientId;
  label: string;
  names: string[];
  /** "same": both labels list it · "multi": a multivitamin may contain it too (check the label) */
  kind: "same" | "multi";
}

/** nutrients a multivitamin commonly lists — only used to suggest checking the label */
const MULTI_MAY_HAVE: NutrientId[] = ["vitamin_d", "vitamin_b", "vitamin_c", "calcium", "magnesium", "iron", "zinc", "folate"];

export function findOverlaps(supps: Supplement[]): Overlap[] {
  const active = supps.filter((s) => s.active);
  const out: Overlap[] = [];
  const by = new Map<NutrientId, string[]>();
  for (const s of active) for (const n of s.nutrients) if (n !== "other" && n !== "multi") by.set(n, [...(by.get(n) ?? []), s.name]);
  for (const [n, names] of by) if (names.length > 1) out.push({ nutrient: n, label: NUTRIENT_LABEL[n], names, kind: "same" });

  const multis = active.filter((s) => s.nutrients.includes("multi"));
  if (multis.length) {
    // one line per product: "‘칼마디’, ‘데일리 멀티’ — 종합비타민에도 칼슘, 마그네슘이 …"
    for (const sp of active.filter((x) => !x.nutrients.includes("multi"))) {
      const ns = MULTI_MAY_HAVE.filter((n) => sp.nutrients.includes(n) && !out.some((o) => o.kind === "same" && o.nutrient === n));
      if (ns.length) out.push({ nutrient: ns[0], label: ns.map((n) => NUTRIENT_LABEL[n]).join(", "), names: [sp.name, ...multis.map((m) => m.name)], kind: "multi" });
    }
    if (multis.length > 1) out.push({ nutrient: "multi", label: NUTRIENT_LABEL.multi, names: multis.map((s) => s.name), kind: "same" });
  }
  return out;
}

const iga = (w: string) => `${w}${hasBatchim(w) ? "이" : "가"}`;

export function overlapText(o: Overlap) {
  const names = o.names.map((n) => `‘${n}’`).join(", ");
  return o.kind === "same"
    ? `${iga(o.label)} ${names}에 함께 들어 있어요.`
    : `${names} — 종합비타민에도 ${iga(o.label)} 들어 있을 수 있어요. 라벨을 확인해 보세요.`;
}

/** Questions to bring to a pharmacist or doctor (the user picks; nothing is answered by the app). */
export const CONSULT_QUESTIONS = [
  "지금 먹는 영양제를 계속 먹어도 괜찮을까요?",
  "먹고 있는 약과 함께 먹어도 괜찮을까요?",
  "겹치는 성분이 있는데, 함께 먹어도 될까요?",
  "언제(식전·식후, 아침·저녁) 먹는 게 좋을까요?",
  "최근 기록한 증상과 관련해 확인해 볼 검사가 있을까요?",
  "음식으로 챙길 수 있는 방법도 있을까요?",
] as const;
