"use client";

import { useSyncExternalStore } from "react";
import { getData, useAppData, type Prefs } from "@/lib/data-store";
import { toKey, type DateKey } from "@/lib/date";

/**
 * The living greenhouse — weather and seasons.
 * "어떤 날씨에도 꽃은 자라고 있어." Weather never stands for a good or bad mood;
 * every weather is drawn to be lovely in its own way.
 *
 * The user picks a weather (or "auto"). Auto asks a WeatherSource; for now the
 * only source is the app's own gentle daily weather (by season), and a real
 * weather API can be added later as another source without touching the scene.
 */
export const WEATHERS = ["clear", "cloudy", "rain", "snow", "rainbow"] as const;
export type Weather = (typeof WEATHERS)[number];
export type WeatherPref = Weather | "auto";

export const SEASONS = ["spring", "summer", "autumn", "winter"] as const;
export type Season = (typeof SEASONS)[number];
export type SeasonPref = Season | "auto";

export const WEATHER_INFO: Record<Weather, { emoji: string; label: string }> = {
  clear: { emoji: "☀️", label: "맑음" },
  cloudy: { emoji: "☁️", label: "흐림" },
  rain: { emoji: "🌧️", label: "비" },
  snow: { emoji: "❄️", label: "눈" },
  rainbow: { emoji: "🌈", label: "무지개" },
};
export const SEASON_INFO: Record<Season, { emoji: string; label: string }> = {
  spring: { emoji: "🌸", label: "봄" },
  summer: { emoji: "🌿", label: "여름" },
  autumn: { emoji: "🍁", label: "가을" },
  winter: { emoji: "⛄", label: "겨울" },
};

/** Korean seasons by month: 3–5 봄, 6–8 여름, 9–11 가을, 12–2 겨울. */
export function seasonOf(d: Date): Season {
  const m = d.getMonth() + 1;
  if (m >= 3 && m <= 5) return "spring";
  if (m >= 6 && m <= 8) return "summer";
  if (m >= 9 && m <= 11) return "autumn";
  return "winter";
}

/** Where "auto" weather comes from. A real weather API can implement this later. */
export interface WeatherSource {
  id: string;
  /** null = no answer (offline, no permission…) → the next source is asked */
  weatherFor(day: DateKey, season: Season): Weather | null;
}

/** How often each weather comes on its own, by season. Snow only in winter. */
const DAILY_ODDS: Record<Season, Partial<Record<Weather, number>>> = {
  spring: { clear: 4, cloudy: 2, rain: 2, rainbow: 1 },
  summer: { clear: 4, cloudy: 1.5, rain: 3, rainbow: 1.2 },
  autumn: { clear: 4, cloudy: 3, rain: 1.5, rainbow: 0.6 },
  winter: { clear: 3, cloudy: 3, snow: 3.5, rain: 0.3, rainbow: 0.2 },
};

/** stable 0..1 from a string (same day → same weather on every device) */
function hash01(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return ((h >>> 0) % 100000) / 100000;
}

/** The app's own weather: one gentle weather per day, picked by season. */
export const dailySource: WeatherSource = {
  id: "daily",
  weatherFor(day, season) {
    const odds = Object.entries(DAILY_ODDS[season]) as [Weather, number][];
    const total = odds.reduce((a, [, v]) => a + v, 0);
    let r = hash01(`dear-selly:${day}`) * total;
    for (const [w, v] of odds) if ((r -= v) <= 0) return w;
    return "clear";
  },
};

const SOURCES: WeatherSource[] = [dailySource];

export function autoWeather(d: Date, season = seasonOf(d)): Weather {
  const day = toKey(d);
  for (const s of SOURCES) {
    const w = s.weatherFor(day, season);
    if (w) return w;
  }
  return "clear";
}

export function resolveSeason(pref: SeasonPref | undefined, d: Date): Season {
  return pref && pref !== "auto" ? pref : seasonOf(d);
}
export function resolveWeather(pref: WeatherPref | undefined, d: Date, season: Season): Weather {
  return pref && pref !== "auto" ? pref : autoWeather(d, season);
}

/** For non-React code (Selly's brain). */
export function currentWeather(now = new Date()): Weather {
  const p = getData().prefs;
  return resolveWeather(p.weather, now, resolveSeason(p.season, now));
}

// the date only matters for "auto": tick when the day changes
const listeners = new Set<() => void>();
let day = "";
let timer: ReturnType<typeof setInterval> | null = null;
function subscribe(cb: () => void) {
  listeners.add(cb);
  timer ??= setInterval(() => {
    const k = toKey(new Date());
    if (k !== day) {
      day = k;
      listeners.forEach((l) => l());
    }
  }, 60_000);
  return () => {
    listeners.delete(cb);
    if (!listeners.size && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}
const getDay = () => (day ||= toKey(new Date()));

/** The greenhouse's weather and season. "clear"/"autumn" during prerender. */
export function useGardenWeather(): { weather: Weather; season: Season; pref: WeatherPref; seasonPref: SeasonPref } {
  const { prefs } = useAppData();
  const d = useSyncExternalStore(subscribe, getDay, () => "");
  const pref = prefs.weather ?? "auto";
  const seasonPref = prefs.season ?? "auto";
  if (!d) return { weather: "clear", season: "autumn", pref, seasonPref };
  const date = new Date(`${d}T12:00:00`);
  const season = resolveSeason(seasonPref, date);
  return { weather: resolveWeather(pref, date, season), season, pref, seasonPref };
}

export const natureOn = (p: Prefs) => p.nature ?? true;
export const natureVolume = (p: Prefs) => p.natureVolume ?? 0.5;
