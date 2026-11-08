import type { TimeOfDay } from "@/lib/game/behaviorEngine";
import type { Season, Weather } from "./weather";

/**
 * The greenhouse "scene" as one value — for features that should feel the
 * weather, like the gardener grandpa's read-aloud stories (planned).
 *
 * How a story feature plugs in (not built yet):
 *   const mood = storyMoodFor(scene)        // which kind of story, how it opens
 *   const restore = duckFor(mood.duck)      // src/lib/sound/engine.ts: music + nature soften
 *   …play the voice on the "story" bus…     // tone()/AudioBufferSource → buses.story
 *   restore()                               // background comes back
 * The weather sound keeps playing underneath (rain under a rainy-day story).
 */
export interface GardenScene {
  weather: Weather;
  tod: TimeOfDay;
  season: Season;
}

export type StoryMoodId = "rainy" | "snowy" | "bedtime" | "sunny" | "cloudy" | "rainbow";

export interface StoryMood {
  id: StoryMoodId;
  /** how the gardener might open the story */
  opening: string;
  /** background level while the voice plays (0–1) */
  duck: number;
}

const MOODS: Record<StoryMoodId, StoryMood> = {
  bedtime: { id: "bedtime", opening: "잠들기 전에, 아주 조용한 이야기 하나 들려줄까.", duck: 0.25 },
  rainy: { id: "rainy", opening: "빗소리가 참 좋구나. 이 소리를 들으며 이야기 하나 해 볼까.", duck: 0.5 },
  snowy: { id: "snowy", opening: "밖엔 눈이 소복소복. 따뜻한 온실에서 겨울 이야기를 들려주마.", duck: 0.4 },
  sunny: { id: "sunny", opening: "햇살 좋은 날엔 꽃들도 이야기를 좋아한단다.", duck: 0.35 },
  cloudy: { id: "cloudy", opening: "구름이 천천히 흘러가는 날이구나. 천천히 들어 보렴.", duck: 0.35 },
  rainbow: { id: "rainbow", opening: "저 무지개 너머에 무엇이 있을지, 이야기해 줄까.", duck: 0.35 },
};

/** Night wins (a bedtime story); otherwise the weather picks the mood. */
export function storyMoodFor(scene: GardenScene): StoryMood {
  if (scene.tod === "night") return MOODS.bedtime;
  const byWeather: Record<Weather, StoryMoodId> = { rain: "rainy", snow: "snowy", clear: "sunny", cloudy: "cloudy", rainbow: "rainbow" };
  return MOODS[byWeather[scene.weather]];
}
