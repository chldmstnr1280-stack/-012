"use client";

import { useState } from "react";
import { addDays, formatMonthDay, fromKey, WEEKDAY_LABELS, type DateKey } from "@/lib/date";
import type { AppData, Level5 } from "@/lib/data-store";
import type { RangeKind } from "@/lib/report";
import { MoodFace, MOODS } from "@/components/ui/MoodFace";

const SAGE = "#739a72";

export function MoodFlow({ kind, days, data }: { kind: RangeKind; days: DateKey[]; data: AppData }) {
  if (kind === "week") {
    return (
      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => {
          const m = data.entries[d]?.mood;
          return (
            <div key={d} className="flex flex-col items-center gap-1" aria-label={`${formatMonthDay(d)} ${m ? MOODS[m - 1].label : "기록 없음"}`}>
              {m ? <MoodFace value={m} active size={36} /> : <span className="grid h-9 w-9 place-items-center rounded-full border-[1.5px] border-dashed border-[#ddd3c4]" />}
              <span className="text-[11px] text-ink-500">{WEEKDAY_LABELS[fromKey(d).getDay()]}</span>
            </div>
          );
        })}
      </div>
    );
  }
  return <MoodLine days={days} data={data} weekly={kind === "all" && days.length > 60} />;
}

const W = 300;
const H = 132;
const PAD = { l: 30, r: 8, t: 10, b: 22 };

function MoodLine({ days, data, weekly }: { days: DateKey[]; data: AppData; weekly: boolean }) {
  const [hover, setHover] = useState<number | null>(null);

  // points: daily, or weekly averages for long ranges
  const points: { label: string; v: number | null }[] = [];
  if (weekly) {
    for (let i = 0; i < days.length; i += 7) {
      const chunk = days.slice(i, i + 7);
      const vs = chunk.map((d) => data.entries[d]?.mood).filter((v): v is Level5 => v != null);
      points.push({ label: `${formatMonthDay(chunk[0])} 주`, v: vs.length ? vs.reduce((a, b) => a + b, 0) / vs.length : null });
    }
  } else {
    days.forEach((d) => points.push({ label: formatMonthDay(d), v: data.entries[d]?.mood ?? null }));
  }

  const iw = W - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;
  const x = (i: number) => PAD.l + (points.length === 1 ? iw / 2 : (i / (points.length - 1)) * iw);
  const y = (v: number) => PAD.t + ((5 - v) / 4) * ih;

  // break the line where a day has no record
  let d = "";
  let pen = false;
  points.forEach((p, i) => {
    if (p.v == null) {
      pen = false;
      return;
    }
    d += `${pen ? "L" : "M"}${x(i).toFixed(1)} ${y(p.v).toFixed(1)} `;
    pen = true;
  });

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const i = Math.round(((px - PAD.l) / iw) * (points.length - 1));
    setHover(Math.max(0, Math.min(points.length - 1, i)));
  };

  const h = hover != null ? points[hover] : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full touch-pan-y select-none"
        role="img"
        aria-label={weekly ? "주별 평균 기분 흐름" : "날짜별 기분 흐름"}
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={() => setHover(null)}
      >
        {[1, 3, 5].map((v) => (
          <g key={v}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} stroke="#e4dccf" strokeWidth={1} strokeDasharray={v === 3 ? "3 3" : undefined} />
            <text x={PAD.l - 6} y={y(v) + 4} textAnchor="end" fontSize={10} fill="#8a7e71">
              {v === 5 ? "최고" : v === 3 ? "보통" : "힘듦"}
            </text>
          </g>
        ))}
        <path d={d} fill="none" stroke={SAGE} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {/* a small dot per recorded point keeps short runs and gaps readable */}
        {points.map((p, i) => (p.v != null ? <circle key={i} cx={x(i)} cy={y(p.v)} r={2.6} fill={SAGE} stroke="#fdfbf6" strokeWidth={1} /> : null))}
        <text x={PAD.l} y={H - 4} fontSize={10} fill="#8a7e71">
          {points[0]?.label}
        </text>
        <text x={W - PAD.r} y={H - 4} fontSize={10} fill="#8a7e71" textAnchor="end">
          {points[points.length - 1]?.label}
        </text>
        {h && hover != null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={H - PAD.b} stroke="#b9ae9f" strokeWidth={1} />
            {h.v != null && <circle cx={x(hover)} cy={y(h.v)} r={5} fill={SAGE} stroke="#fdfbf6" strokeWidth={2} />}
          </g>
        )}
      </svg>
      {h && hover != null && (
        <div
          className="pointer-events-none absolute top-0 -translate-x-1/2 -translate-y-full rounded-lg bg-white px-2.5 py-1 text-center text-[11.5px] shadow-[0_6px_16px_-8px_rgba(80,60,40,0.5)]"
          style={{ left: `${Math.min(85, Math.max(15, (x(hover) / W) * 100))}%` }}
        >
          <span className="text-ink-500">{h.label}</span>{" "}
          <span className="font-bold text-ink-700">{h.v == null ? "기록 없음" : weekly ? `평균 ${h.v.toFixed(1)}` : MOODS[Math.round(h.v) - 1].label}</span>
        </div>
      )}
    </div>
  );
}

export function rangeLabel(days: DateKey[]) {
  if (!days.length) return "";
  return `${formatMonthDay(days[0])} – ${formatMonthDay(addDays(days[days.length - 1], 0))}`;
}
