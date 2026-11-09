import { QUADRANTS, TAGS, tagsOf, type ContextTagId, type QuadrantId } from "@/data/contextTags";
import type { AppData } from "@/lib/data-store";
import type { DateKey } from "@/lib/date";

/**
 * Patterns in the day ontology over a range of days — counts only, never causes.
 *  - quadrant: days on which a feeling of each quadrant was tagged
 *  - withQuadrant: situations most often tagged on the same days as each quadrant
 *  - needs: wants tagged most often
 * Shown only when at least MIN_TAGGED days in the range carry any tag.
 */
export const MIN_TAGGED = 3;

const quadrantOf = (id: ContextTagId): QuadrantId | null => {
  const t = TAGS[id];
  if (t.dimension !== "feeling") return null;
  // a feeling with no place on the two axes (e.g. "복잡한 마음") belongs to no quadrant
  return QUADRANTS.find((q) => q.valence === t.valence && q.arousal === t.arousal)?.id ?? null;
};

export interface DayPatterns {
  taggedDays: number;
  quadrants: Record<QuadrantId, number>;
  withQuadrant: Record<QuadrantId, { id: ContextTagId; days: number }[]>;
  needs: { id: ContextTagId; days: number }[];
  states: { id: ContextTagId; days: number }[];
}

const top = (m: Map<ContextTagId, number>, n: number) =>
  [...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([id, days]) => ({ id, days }));

export function dayPatterns(data: AppData, days: DateKey[]): DayPatterns | null {
  const tagged = days.map((k) => data.dayTags[k]?.tags ?? []).filter((t) => t.length);
  if (tagged.length < MIN_TAGGED) return null;
  const situations = new Set(tagsOf("situation"));
  const quadrants = { lively: 0, easy: 0, edgy: 0, low: 0 } as Record<QuadrantId, number>;
  const co = Object.fromEntries(QUADRANTS.map((q) => [q.id, new Map<ContextTagId, number>()])) as Record<QuadrantId, Map<ContextTagId, number>>;
  const needs = new Map<ContextTagId, number>();
  const states = new Map<ContextTagId, number>();
  for (const tags of tagged) {
    const qs = new Set(tags.map(quadrantOf).filter((q): q is QuadrantId => !!q));
    for (const q of qs) {
      quadrants[q]++;
      for (const id of tags) if (situations.has(id)) co[q].set(id, (co[q].get(id) ?? 0) + 1);
    }
    for (const id of tags) {
      if (TAGS[id].dimension === "need") needs.set(id, (needs.get(id) ?? 0) + 1);
      if (TAGS[id].dimension === "state") states.set(id, (states.get(id) ?? 0) + 1);
    }
  }
  return {
    taggedDays: tagged.length,
    quadrants,
    withQuadrant: Object.fromEntries(QUADRANTS.map((q) => [q.id, top(co[q.id], 3).filter((x) => x.days >= 2)])) as DayPatterns["withQuadrant"],
    needs: top(needs, 3),
    states: top(states, 3),
  };
}
