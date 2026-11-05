"use client";

import { Music2, Sparkles } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { setPrefs, useAppData } from "@/lib/data-store";
import { playSfx } from "@/lib/sound/sfx";
import { unlock } from "@/lib/sound/engine";

function Row({
  icon,
  label,
  desc,
  on,
  volume,
  onToggle,
  onVolume,
  onPreview,
}: {
  icon: React.ReactNode;
  label: string;
  desc: string;
  on: boolean;
  volume: number;
  onToggle: () => void;
  onVolume: (v: number) => void;
  onPreview?: () => void;
}) {
  return (
    <div className="rounded-2xl bg-white/65 p-3">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-sage-50 text-sage-700">{icon}</span>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-bold text-ink-700">{label}</p>
          <p className="text-[11.5px] text-ink-500">{desc}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label={label}
          onClick={onToggle}
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${on ? "bg-sage-500" : "bg-[#e5ded2]"}`}
        >
          <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-6" : "left-1"}`} />
        </button>
      </div>
      <div className={`mt-2 flex items-center gap-3 pl-12 transition-opacity ${on ? "" : "pointer-events-none opacity-40"}`}>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={Math.round(volume * 100)}
          aria-label={`${label} 볼륨`}
          onChange={(e) => onVolume(Number(e.target.value) / 100)}
          onPointerUp={onPreview}
          className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-[#e6dfd2] accent-[#739a72]"
        />
        <span className="w-9 text-right text-[12px] tabular-nums text-ink-500">{Math.round(volume * 100)}%</span>
      </div>
    </div>
  );
}

export function SoundCard() {
  const { prefs } = useAppData();
  return (
    <SectionCard icon={<Music2 size={20} className="text-sage-700" />} title="소리">
      <div className="flex flex-col gap-2">
        <Row
          icon={<Music2 size={18} />}
          label="배경 음악"
          desc="온실에 흐르는 잔잔한 오르골"
          on={prefs.music}
          volume={prefs.musicVolume}
          onToggle={() => setPrefs({ music: !prefs.music })}
          onVolume={(v) => setPrefs({ musicVolume: v })}
        />
        <Row
          icon={<Sparkles size={18} />}
          label="셀리 효과음"
          desc="쓰다듬기 · 물 주기 · 레벨업 소리"
          on={prefs.sfx}
          volume={prefs.sfxVolume}
          onToggle={() => {
            setPrefs({ sfx: !prefs.sfx });
            if (!prefs.sfx) {
              unlock();
              setTimeout(() => playSfx("touch"), 120);
            }
          }}
          onVolume={(v) => setPrefs({ sfxVolume: v })}
          onPreview={() => playSfx("touch")}
        />
      </div>
      <p className="mt-2 text-[11.5px] leading-relaxed text-ink-300">
        모든 소리는 앱 안에서 직접 만들어져요. 앱을 열고 화면을 한 번 누르면 소리가 시작돼요. 소리가 안 들리면 휴대폰 미디어 볼륨을 확인해 주세요.
      </p>
    </SectionCard>
  );
}
