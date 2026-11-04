"use client";

import Link from "next/link";
import { Bell, Settings } from "lucide-react";
import { useSelly } from "@/lib/selly-store";

export function TopBar() {
  const { showToast } = useSelly();
  return (
    <header className="flex items-center justify-between px-5">
      <h1 className="text-glow flex items-baseline font-script text-[38px] leading-none text-white">
        Dear Selly
        <svg viewBox="0 0 24 22" className="ml-1 h-[20px] w-[22px] -translate-y-0.5" aria-hidden>
          <path d="M12 19.5 C 5.5 14.5 2 11.2 2 7.4 C 2 4.6 4.2 2.5 6.9 2.5 C 8.9 2.5 10.9 3.7 12 5.6 C 13.1 3.7 15.1 2.5 17.1 2.5 C 19.8 2.5 22 4.6 22 7.4 C 22 11.2 18.5 14.5 12 19.5Z" fill="none" stroke="white" strokeWidth="1.7" />
        </svg>
        <span className="sr-only">디어셀리</span>
      </h1>
      <div className="flex items-center gap-1">
        <IconButton label="알림" onClick={() => showToast("알림 기능은 준비 중이에요")}>
          <Bell size={23} fill="white" strokeWidth={1.6} />
        </IconButton>
        <Link
          href="/settings"
          aria-label="설정"
          className="grid h-11 w-11 place-items-center rounded-full text-white drop-shadow-[0_1px_3px_rgba(90,70,50,0.45)] transition active:scale-90"
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
      className="grid h-11 w-11 place-items-center rounded-full text-white drop-shadow-[0_1px_3px_rgba(90,70,50,0.45)] transition active:scale-90"
    >
      {children}
    </button>
  );
}
