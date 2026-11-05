"use client";

import { Phone } from "lucide-react";
import { CRISIS_LINES, SAFETY_SOURCES } from "@/data/safety";
import { openExternal } from "@/lib/platform";

/**
 * Where to reach a person right now. Shown softly — the app never asks about
 * self-harm and never judges risk; it only keeps the way to help close by.
 * ⚠️ Wording pending clinical review (see src/data/safety.ts).
 */
export function HelpCard({ lead, id }: { lead?: string; id?: string }) {
  return (
    <section id={id} aria-label="도움을 받을 수 있는 곳" className="rounded-[22px] border border-[#f0d9c8] bg-[#fffaf3] px-4 py-3.5">
      <p className="break-keep text-[13.5px] leading-relaxed text-ink-700">
        {lead ?? "마음이 너무 힘들거나 혼자 견디기 어려울 때는, 지금 바로 이야기를 들어 줄 사람이 있어요."}
      </p>
      <ul className="mt-2.5 grid grid-cols-2 gap-2">
        {CRISIS_LINES.map((l) => (
          <li key={l.number}>
            <a
              href={`tel:${l.number}`}
              onClick={(e) => {
                e.preventDefault();
                void openExternal(`tel:${l.number}`);
              }}
              className="flex h-[58px] flex-col items-center justify-center rounded-2xl bg-white text-center shadow-[0_4px_12px_-8px_rgba(110,88,60,0.45)] active:bg-[#f7efe4]"
              aria-label={`${l.name} ${l.number}에 전화하기, ${l.note}`}
            >
              <span className="flex items-center gap-1 text-[16px] font-bold tabular-nums text-[#9c3f4d]">
                <Phone size={14} /> {l.number}
              </span>
              <span className="text-[11px] text-ink-500">
                {l.name} · {l.note}
              </span>
            </a>
          </li>
        ))}
      </ul>
      <details className="mt-2 text-[10.5px] text-ink-300">
        <summary className="cursor-pointer select-none">출처</summary>
        <ul className="mt-1 flex flex-col gap-1">
          {SAFETY_SOURCES.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noopener noreferrer" onClick={(e) => { e.preventDefault(); void openExternal(s.url); }} className="underline underline-offset-2">
                {s.org} — {s.title}
              </a>{" "}
              ({s.date}, 확인 {s.accessed})
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}
