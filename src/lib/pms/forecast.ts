import { onsetDays, type SymptomId } from "@/data/pmsSymptoms";
import type { CycleInfo } from "@/lib/cycle";
import type { AppData } from "@/lib/data-store";
import { addDays, type DateKey } from "@/lib/date";
import { PRE_DAYS, type PmsPattern } from "./analysis";

/**
 * Reference forecast of the next pre-period window and the symptoms that may
 * come with it — the user's own history played forward, never a diagnosis.
 *
 * Sources, best first (each part uses the best one it has):
 *   records  ≥ 2 analysed cycles of daily records
 *   recaps   per-cycle look-backs ("이번 생리 전엔 어땠어?"), latest 3
 *   profile  the usual pattern the user described up front
 * The date itself comes from the calendar-method period prediction, so it is
 * as uncertain as that (more so with irregular cycles).
 */
export type ForecastSource = "records" | "recaps" | "profile";

export const SOURCE_LABEL: Record<ForecastSource, string> = {
  records: "지난 주기 기록",
  recaps: "주기별 돌아보기",
  profile: "내가 알려 준 평소 패턴",
};

export interface PmsForecast {
  nextStart: DateKey | null;
  onset: number | null;
  onsetSource: ForecastSource | null;
  window: Set<DateKey>;
  symptoms: { id: SymptomId; score: number }[];
  symptomSource: ForecastSource | null;
  irregular: boolean;
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export function forecastPms(data: AppData, info: CycleInfo, pattern: PmsPattern): PmsForecast {
  const recaps = Object.entries(data.cycleRecaps)
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .slice(0, 3)
    .map(([, r]) => r);
  const profile = data.pmsProfile;

  // when
  let onset: number | null = null;
  let onsetSource: ForecastSource | null = null;
  if (pattern.enough && pattern.typicalOnset != null) {
    onset = Math.round(pattern.typicalOnset);
    onsetSource = "records";
  } else {
    const rs = recaps.map((r) => onsetDays(r.onset)).filter((v): v is number => v != null);
    if (rs.length) {
      onset = Math.round(median(rs));
      onsetSource = "recaps";
    } else if (onsetDays(profile?.onset) != null) {
      onset = onsetDays(profile!.onset);
      onsetSource = "profile";
    }
  }

  // what
  let symptoms: PmsForecast["symptoms"] = [];
  let symptomSource: ForecastSource | null = null;
  if (pattern.enough && pattern.repeated.length) {
    symptoms = pattern.repeated.map((r) => ({ id: r.id, score: Math.round(r.avg) }));
    symptomSource = "records";
  } else if (recaps.some((r) => Object.values(r.symptoms).some((v) => (v ?? 0) >= 1))) {
    const acc = new Map<SymptomId, number[]>();
    for (const r of recaps) for (const [id, v] of Object.entries(r.symptoms) as [SymptomId, number][]) if (v >= 1) acc.set(id, [...(acc.get(id) ?? []), v]);
    symptoms = [...acc.entries()].map(([id, vs]) => ({ id, score: Math.round(vs.reduce((a, b) => a + b, 0) / vs.length) }));
    symptomSource = "recaps";
  } else if (profile && Object.values(profile.symptoms).some((v) => (v ?? 0) >= 1)) {
    symptoms = (Object.entries(profile.symptoms) as [SymptomId, number][]).filter(([, v]) => v >= 1).map(([id, score]) => ({ id, score }));
    symptomSource = "profile";
  }
  symptoms = symptoms.sort((a, b) => b.score - a.score).slice(0, 5);

  const window = new Set<DateKey>();
  if (onset != null && info.nextStart) for (let i = Math.min(PRE_DAYS, Math.max(1, onset)); i >= 1; i--) window.add(addDays(info.nextStart, -i));

  return { nextStart: info.nextStart, onset, onsetSource, window, symptoms, symptomSource, irregular: info.irregular };
}
