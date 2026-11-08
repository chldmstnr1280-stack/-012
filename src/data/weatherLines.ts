import type { TimeOfDay } from "@/lib/game/behaviorEngine";
import type { Weather } from "@/lib/garden/weather";

/**
 * What Selly says about the weather. Every weather is lovely — none of these
 * lines treat rain or grey skies as "bad". Touch lines rotate with a cooldown
 * so the same line doesn't come back soon.
 */
export const TOUCH_WEATHER: Record<Weather, string[]> = {
  clear: ["오늘은 햇살이 따뜻해!", "햇볕 쬐니까 잎이 반짝반짝해", "기지개 쭉~ 날씨 좋다!"],
  cloudy: ["구름이 천천히 움직이고 있어.", "흐린 날은 빛이 부드러워서 좋아", "구름 이불 덮은 하늘 같아"],
  rain: ["빗소리가 좋다. 조금만 더 듣고 있을까?", "톡톡, 유리에 빗방울이 노크해", "비 오는 날엔 온실이 더 포근해"],
  snow: ["우와! 눈이 내려!", "밖은 추운데 여긴 따뜻해", "저기 눈사람이 우릴 보고 있어!"],
  rainbow: ["저기 봐! 무지개야!", "비 그치고 나니까 꽃이 반짝여!", "무지개 끝엔 뭐가 있을까?"],
};

export const NIGHT_TOUCH = ["별이 반짝반짝해", "반딧불이가 놀러 왔어", "조용한 밤이다… 졸려"];

/** Selly's line when the weather is changed */
export const WEATHER_CHANGED: Record<Weather, string> = {
  clear: "햇살이다! 기지개 쭉~",
  cloudy: "구름이 놀러 왔네",
  rain: "앗, 비가 와! 창가에서 구경할래",
  snow: "눈이다!! 우와아",
  rainbow: "비가 그쳤어… 저기 봐, 무지개야!",
};

export const MORNING_WAKE = ["하암… 잘 잤어? 좋은 아침!", "으음~ 기지개 쭉! 좋은 아침이야", "햇살이 깨워 줬어. 안녕!"];

/** activity line keys → lines by weather (null → the usual lines) */
const AMBIENT_WEATHER: Partial<Record<string, Partial<Record<Weather, string[]>>>> = {
  watching: {
    clear: ["창밖에 새가 지나갔어!"],
    cloudy: ["구름 모양이 꼭 양 같아", "창밖이 차분해"],
    rain: ["빗방울이 또르르 미끄럼 타", "빗소리 들으니까 마음이 편해"],
    snow: ["눈이 소복소복 쌓이고 있어", "저 눈사람, 추울까?"],
    rainbow: ["무지개가 아직 있어!"],
  },
  cozy: {
    cloudy: ["담요 속이 제일 포근해"],
    rain: ["담요 덮고 빗소리 듣기~"],
    snow: ["담요 속은 따뜻해…", "코코아 마시고 싶다"],
  },
  rainbow: { rainbow: ["저기 봐! 무지개야!", "무지개다~! 같이 봐!"] },
  sunbathing: { clear: ["햇살이 포근해…", "광합성 중이야~"] },
};

export function ambientLine(key: string, weather: Weather, tod: TimeOfDay): string | null {
  if (tod === "night" && key === "watching" && weather !== "rain" && weather !== "snow") return "밤하늘에 별이 떴어";
  const lines = AMBIENT_WEATHER[key]?.[weather];
  return lines?.length ? lines[Math.floor(Math.random() * lines.length)] : null;
}

/** recently used touch lines (newest last) and when the last weather line was said */
const recent: string[] = [];
let lastWeatherAt = 0;
const COOLDOWN_MS = 20_000;

/**
 * A touch line for the weather, or null (then the usual touch line is used).
 * A weather line at most every 20 s, and never one of the last three.
 */
export function weatherTouchLine(weather: Weather, tod: TimeOfDay, now: number, rand = Math.random): string | null {
  if (now - lastWeatherAt < COOLDOWN_MS) return null;
  const pool = (tod === "night" && weather !== "rain" && weather !== "snow" ? NIGHT_TOUCH : TOUCH_WEATHER[weather]).filter((l) => !recent.includes(l));
  if (!pool.length) return null;
  const line = pool[Math.floor(rand() * pool.length)];
  recent.push(line);
  if (recent.length > 3) recent.shift();
  lastWeatherAt = now;
  return line;
}
