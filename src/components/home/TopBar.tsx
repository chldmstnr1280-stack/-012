"use client";

import Link from "next/link";
import { Bell, Music2, Paintbrush, Settings } from "lucide-react";
import { setPrefs, useAppData } from "@/lib/data-store";
import { useSelly } from "@/lib/selly-store";

export function TopBar({ onDecorate }: { onDecorate?: () => void }) {
  const { showToast } = useSelly();
  const { prefs } = useAppData();
  return (
    <header className="flex items-center justify-between gap-1 px-4">
      <h1 className="text-glow flex items-baseline whitespace-nowrap font-script text-[clamp(26px,8.6vw,38px)] leading-none text-white">
        Dear Selly
        <svg viewBox="0 0 24 22" className="ml-1 h-[20px] w-[22px] -translate-y-0.5" aria-hidden>
          <path d="M12 19.5 C 5.5 14.5 2 11.2 2 7.4 C 2 4.6 4.2 2.5 6.9 2.5 C 8.9 2.5 10.9 3.7 12 5.6 C 13.1 3.7 15.1 2.5 17.1 2.5 C 19.8 2.5 22 4.6 22 7.4 C 22 11.2 18.5 14.5 12 19.5Z" fill="none" stroke="white" strokeWidth="1.7" />
        </svg>
        <span className="sr-only">디어셀리</span>
      </h1>
      <div className="flex shrink-0 items-center">
        {onDecorate && (
          <IconButton label="온실 꾸미기" onClick={onDecorate}>
            <Paintbrush size={21} strokeWidth={1.9} />
          </IconButton>
        )}
        <button
          type="button"
          aria-label={prefs.music ? "배경 음악 끄기" : "배경 음악 켜기"}
          aria-pressed={prefs.music}
          onClick={() => {
            setPrefs({ music: !prefs.music });
            showToast(prefs.music ? "배경 음악을 껐어요" : "배경 음악을 켰어요 ♪");
          }}
          className="relative grid h-11 w-10 place-items-center rounded-full text-white drop-shadow-[0_1px_3px_rgba(90,70,50,0.45)] transition active:scale-90"
        >
          <Music2 size={22} strokeWidth={1.9} className={prefs.music ? "" : "opacity-60"} />
          {!prefs.music && <span aria-hidden className="absolute h-[2px] w-7 rotate-45 rounded-full bg-white" />}
        </button>
        <Link
          href="/friends"
          aria-label="친구 · 받은 선물"
          className="relative grid h-11 w-10 place-items-center rounded-full text-white drop-shadow-[0_1px_3px_rgba(90,70,50,0.45)] transition active:scale-90"
        >
          <Bell size={23} fill="white" strokeWidth={1.6} />
        </Link>
        <Link
          href="/settings"
          aria-label="설정"
          className="grid h-11 w-10 place-items-center rounded-full text-white drop-shadow-[0_1px_3px_rgba(90,70,50,0.45)] transition active:scale-90"
        >
          <Settings size={24} strokeWidth={1.9} />
        </Link>
      </div>
    </header>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid h-11 w-10 place-items-center rounded-full text-white drop-shadow-[0_1px_3px_rgba(90,70,50,0.45)] transition active:scale-90"
    >
      {children}
    </button>
  );
}
