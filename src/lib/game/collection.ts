import { WALK_MISSIONS } from "@/data/walkMissions";
import { FIND_KINDS, FIND_LABEL, type FindKind, type GameData } from "./gameStore";
import type { AppData } from "@/lib/data-store";
import { addDays, fromKey, type DateKey } from "@/lib/date";

/**
 * Sticker book + this week's small goals. Collecting only: nothing is ever
 * lost, nothing resets to zero, missing a goal has no consequence.
 */

/** Monday of the week that contains `day`. */
export function weekStart(day: DateKey): DateKey {
  const dow = (fromKey(day).getDay() + 6) % 7; // Mon = 0
  return addDays(day, -dow);
}

export interface WeeklyGoal {
  id: "walk" | "kind" | "record";
  emoji: string;
  label: string;
  target: number;
  count: number;
  href: string;
}

export function weeklyGoals(data: AppData, g: GameData, today: DateKey) {
  const from = weekStart(today);
  const inWeek = (d: string) => d >= from && d <= today;
  const goals: WeeklyGoal[] = [
    { id: "walk", emoji: "👣", label: "셀리와 산책", target: 2, count: (g.walks ?? []).filter((w) => inWeek(w.date)).length, href: "/walk" },
    { id: "kind", emoji: "💗", label: "다정한 말 연습", target: 3, count: (g.kindness?.dates ?? []).filter(inWeek).length, href: "/?do=kind" },
    { id: "record", emoji: "📝", label: "하루 기록", target: 4, count: Object.keys(data.entries).filter(inWeek).length, href: "/record" },
  ];
  const allDone = goals.every((x) => x.count >= x.target);
  const claimed = (g.weeklyClaimed ?? []).includes(from);
  return { week: from, weekEnd: addDays(from, 6), goals, allDone, claimed };
}

export interface Sticker {
  id: string;
  emoji: string;
  name: string;
  /** how to get it, shown while locked */
  hint: string;
  earned: boolean;
  count?: number;
  tint: string;
}

const MILESTONES = [1, 5, 10, 30, 50, 100];

export function stickers(g: GameData) {
  const missionCounts = new Map<string, number>();
  for (const m of g.missions ?? []) missionCounts.set(m.id, (missionCounts.get(m.id) ?? 0) + 1);
  const mission: Sticker[] = WALK_MISSIONS.map((m) => ({
    id: `m-${m.id}`,
    emoji: m.emoji,
    name: m.title,
    hint: "산책 미션에서 만나요",
    earned: missionCounts.has(m.id),
    count: missionCounts.get(m.id),
    tint: { photo: "#e3f0f5", find: "#e6f2df", sense: "#f3ecfa", heart: "#fde7ea" }[m.kind],
  }));

  const kindTotal = g.kindness?.total ?? 0;
  const kindness: Sticker[] = MILESTONES.map((n) => ({
    id: `k-${n}`,
    emoji: n >= 30 ? "💖" : n >= 5 ? "💗" : "🤍",
    name: `다정한 말 ${n}번`,
    hint: `마음 전하기를 ${n}번 하면 받아요`,
    earned: kindTotal >= n,
    tint: "#fde7ea",
  }));

  const walkTotal = (g.walks ?? []).length;
  const walks: Sticker[] = MILESTONES.map((n) => ({
    id: `w-${n}`,
    emoji: n >= 30 ? "🌳" : n >= 5 ? "🌿" : "👣",
    name: `산책 ${n}번`,
    hint: `셀리와 ${n}번 산책하면 받아요`,
    earned: walkTotal >= n,
    tint: "#e6f2df",
  }));

  const findCounts = new Map<FindKind, number>();
  for (const f of g.finds) findCounts.set(f, (findCounts.get(f) ?? 0) + 1);
  const finds: Sticker[] = FIND_KINDS.map((f) => ({
    id: `f-${f}`,
    emoji: FIND_LABEL[f].emoji,
    name: FIND_LABEL[f].name,
    hint: "산책에서 발견해요",
    earned: findCounts.has(f),
    count: findCounts.get(f),
    tint: "#fff3d2",
  }));

  const weeks = (g.weeklyClaimed ?? []).length;
  const weekly: Sticker[] = [1, 4, 12, 26, 52].map((n) => ({
    id: `s-${n}`,
    emoji: "🌼",
    name: `주간 꽃도장 ${n}개`,
    hint: `이번 주 작은 목표를 ${n}주 채우면 받아요`,
    earned: weeks >= n,
    tint: "#fff3d2",
  }));

  const groups = [
    { id: "mission", title: "산책 미션", items: mission },
    { id: "kind", title: "다정한 말", items: kindness },
    { id: "walk", title: "함께 걸은 길", items: walks },
    { id: "find", title: "산책 발견물", items: finds },
    { id: "weekly", title: "주간 꽃도장", items: weekly },
  ];
  const earned = groups.reduce((a, gr) => a + gr.items.filter((s) => s.earned).length, 0);
  const total = groups.reduce((a, gr) => a + gr.items.length, 0);
  return { groups, earned, total };
}
