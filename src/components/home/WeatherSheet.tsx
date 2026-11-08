"use client";

import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { setPrefs, useAppData, type Prefs } from "@/lib/data-store";
import { useAmbience } from "@/lib/game/ambience";
import { SEASONS, SEASON_INFO, WEATHERS, WEATHER_INFO, natureOn, natureVolume, useGardenWeather, type SeasonPref, type WeatherPref } from "@/lib/garden/weather";
import { playSfx } from "@/lib/sound/sfx";

const TIMES: { value: Prefs["ambience"]; label: string }[] = [
  { value: "auto", label: "🔄 자동" },
  { value: "morning", label: "🌅 아침" },
  { value: "day", label: "🌤️ 낮" },
  { value: "evening", label: "🌇 저녁" },
  { value: "night", label: "🌙 밤" },
];

/** Floating panel above the dock: weather, time of day, season and nature sounds. Selly stays visible. */
export function WeatherSheet({ open, onClose, onWeather }: { open: boolean; onClose: () => void; onWeather: (w: WeatherPref) => void }) {
  const { prefs } = useAppData();
  const { weather, season, pref, seasonPref } = useGardenWeather();
  const tod = useAmbience();
  const on = natureOn(prefs);
  const vol = natureVolume(prefs);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-label="온실 날씨"
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="glass absolute inset-x-3 bottom-0 z-20 max-h-[min(52dvh,400px)] overflow-y-auto rounded-[26px] !bg-[rgba(253,250,243,0.95)] px-3 pb-3 pt-2"
        >
          <div className="flex items-center justify-between pl-1">
            <p className="text-[14.5px] font-bold text-ink-700">
              온실 날씨 <span className="ml-1 text-[11px] font-normal text-ink-500">어떤 날씨에도 꽃은 자라고 있어</span>
            </p>
            <button type="button" onClick={onClose} aria-label="닫기" className="grid h-9 w-9 place-items-center rounded-full bg-white/70 text-ink-500 active:scale-90">
              <X size={18} />
            </button>
          </div>

          <Row label="날씨">
            {WEATHERS.map((w) => (
              <Chip key={w} on={pref === w} onClick={() => onWeather(w)}>
                {WEATHER_INFO[w].emoji} {WEATHER_INFO[w].label}
              </Chip>
            ))}
            <Chip on={pref === "auto"} onClick={() => onWeather("auto")}>
              🔄 자동{pref === "auto" ? ` · ${WEATHER_INFO[weather].emoji}` : ""}
            </Chip>
          </Row>

          <Row label="시간">
            {TIMES.map((t) => (
              <Chip
                key={t.value}
                on={(prefs.ambience ?? "auto") === t.value}
                onClick={() => {
                  playSfx("tap");
                  setPrefs({ ambience: t.value });
                }}
              >
                {t.label}
                {t.value === "auto" && (prefs.ambience ?? "auto") === "auto" ? ` · ${TIMES.find((x) => x.value === tod)?.label.split(" ")[1] ?? ""}` : ""}
              </Chip>
            ))}
          </Row>

          <Row label="계절">
            {(["auto", ...SEASONS] as SeasonPref[]).map((s) => (
              <Chip
                key={s}
                on={seasonPref === s}
                onClick={() => {
                  playSfx("tap");
                  setPrefs({ season: s });
                }}
              >
                {s === "auto" ? `🔄 자동${seasonPref === "auto" ? ` · ${SEASON_INFO[season].label}` : ""}` : `${SEASON_INFO[s].emoji} ${SEASON_INFO[s].label}`}
              </Chip>
            ))}
          </Row>

          <div className="mt-2 rounded-[18px] border border-white bg-white/70 px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-[12.5px] font-bold text-ink-700">자연의 소리</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={vol}
                disabled={!on}
                onChange={(e) => setPrefs({ natureVolume: Number(e.target.value) })}
                className="h-8 min-w-0 flex-1 accent-[#7fa57a] disabled:opacity-40"
                aria-label="자연의 소리 볼륨"
              />
              <button
                type="button"
                role="switch"
                aria-checked={on}
                aria-label="자연의 소리"
                onClick={() => setPrefs({ nature: !on })}
                className={`relative h-7 w-12 rounded-full transition-colors ${on ? "bg-sage-500" : "bg-[#d9d2c6]"}`}
              >
                <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-[left] ${on ? "left-[22px]" : "left-0.5"}`} />
              </button>
            </div>
            <p className="text-[10.5px] text-ink-500">맑음 새소리 · 흐림 바람 · 비 빗소리 · 눈 겨울바람 · 밤 귀뚜라미</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-1.5 flex items-center gap-2">
      <p className="w-7 shrink-0 pl-1 text-[11.5px] font-bold text-ink-500">{label}</p>
      <div className="-mr-3 flex min-w-0 flex-1 gap-1.5 overflow-x-auto py-1 pr-3 [scrollbar-width:none]">{children}</div>
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`h-10 shrink-0 whitespace-nowrap rounded-full px-3 text-[12.5px] font-bold transition active:scale-95 ${on ? "bg-sage-500 text-white shadow-[0_4px_12px_-6px_rgba(90,130,90,0.7)]" : "bg-white text-ink-700 shadow-[0_3px_10px_-7px_rgba(110,88,60,0.5)]"}`}
    >
      {children}
    </button>
  );
}
