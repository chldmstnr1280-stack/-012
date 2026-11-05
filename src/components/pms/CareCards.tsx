"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, ExternalLink, Stethoscope } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { SproutLeafIcon } from "@/components/ui/icons";
import { SEE_A_DOCTOR, SOURCES, type Source } from "@/data/careEvidence";
import { SYMPTOM_LABEL } from "@/data/pmsSymptoms";
import type { CarePick } from "@/lib/pms/care";

/**
 * Evidence-based care cards (Phase C). Content comes only from the cited
 * patient-information pages (see src/data/careEvidence.ts) and is marked as
 * awaiting clinical review.
 */
export function CareCards({ picks }: { picks: CarePick[] }) {
  const [all, setAll] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const shown = all ? picks : picks.slice(0, 3);

  return (
    <SectionCard icon={<SproutLeafIcon />} title="도움이 될 수 있는 방법" aside={<ReviewBadge />}>
      <p className="mb-2.5 text-[11.5px] leading-relaxed text-ink-500">
        의료기관의 환자용 안내문(NHS, ACOG)에 있는 내용만 옮겼어요. 사람마다 맞는 방법은 달라요.
      </p>
      <ul className="flex flex-col gap-2">
        {shown.map(({ card, matched }) => {
          const isOpen = open === card.id;
          return (
            <li key={card.id} className="overflow-hidden rounded-2xl bg-white/70">
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`care-${card.id}`}
                onClick={() => setOpen(isOpen ? null : card.id)}
                className="flex w-full items-center gap-2 px-3.5 py-3 text-left"
              >
                <span className="min-w-0 flex-1">
                  <span className="block break-keep text-[14px] font-bold leading-snug text-ink-700">{card.title}</span>
                  <span className="block break-keep text-[12px] text-ink-500">{card.summary}</span>
                  {matched.length > 0 && (
                    <span className="mt-1 inline-block rounded-full bg-[#fff1dc] px-2 py-0.5 text-[10.5px] text-[#7a5a14]">
                      내 기록: {matched.map((id) => SYMPTOM_LABEL[id]).join(", ")}
                    </span>
                  )}
                </span>
                <ChevronDown size={18} className={`shrink-0 text-ink-300 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && (
                <div id={`care-${card.id}`} className="border-t border-[#efe7da] px-3.5 pb-3.5 pt-2.5">
                  <ul className="flex flex-col gap-1.5 text-[13px] leading-relaxed text-ink-700">
                    {card.tips.map((t) => (
                      <li key={t} className="flex gap-1.5 break-keep">
                        <span className="text-sage-500">•</span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                  {card.mentionsNote && (
                    <p className="mt-2 text-[11.5px] leading-relaxed text-ink-500">
                      출처에서 언급한 효과: {card.mentionsNote}
                      {matched.length > 0 && " — 내 기록에도 있는 증상이에요. 함께 기록됐다는 뜻이지, 나에게 꼭 맞는다는 뜻은 아니에요."}
                    </p>
                  )}
                  {card.action && (
                    <Link href={card.action.href} className="mt-3 block h-10 rounded-full bg-sage-50 text-center text-[13px] font-bold leading-10 text-sage-700">
                      {card.action.label}
                    </Link>
                  )}
                  <SourceList items={card.sources} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {picks.length > 3 && (
        <button type="button" onClick={() => setAll((a) => !a)} className="mt-2 w-full py-1.5 text-center text-[12.5px] text-sage-700 underline underline-offset-4">
          {all ? "접기" : `모두 보기 (${picks.length})`}
        </button>
      )}

      <div className="mt-3 rounded-2xl bg-[#fdf3f4] px-3.5 py-3">
        <p className="flex items-center gap-1.5 text-[13px] font-bold text-[#9c3f4d]">
          <Stethoscope size={15} /> 이럴 땐 진료를 고려해 보세요
        </p>
        <ul className="mt-1 text-[12.5px] leading-relaxed text-ink-700">
          {SEE_A_DOCTOR.points.map((p) => (
            <li key={p}>· {p}</li>
          ))}
        </ul>
        <p className="mt-1 text-[11.5px] text-ink-500">{SEE_A_DOCTOR.note}</p>
        <SourceList items={SEE_A_DOCTOR.sources} />
      </div>
    </SectionCard>
  );
}

function ReviewBadge() {
  return (
    <span className="rounded-full bg-[#f1ece3] px-2 py-0.5 text-[10.5px] text-ink-500" title="한국 의료 전문가의 검토를 아직 받지 않았어요">
      전문가 검토 전
    </span>
  );
}

function SourceList({ items }: { items: { id: Source["id"]; quote: string }[] }) {
  return (
    <details className="mt-2.5 text-[11px] text-ink-500">
      <summary className="cursor-pointer select-none text-ink-500">출처 보기</summary>
      <ul className="mt-1.5 flex flex-col gap-2">
        {items.map(({ id, quote }) => {
          const s = SOURCES[id];
          return (
            <li key={id}>
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-bold text-sage-700 underline underline-offset-2">
                {s.org} — {s.title}
                <ExternalLink size={11} />
              </a>
              <span className="block text-ink-300">
                기관 검토 {s.sourceReviewed} · 확인 {s.accessed}
              </span>
              <q lang="en" className="mt-0.5 block italic leading-relaxed text-ink-500">
                {quote}
              </q>
            </li>
          );
        })}
      </ul>
    </details>
  );
}
