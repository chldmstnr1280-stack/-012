"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { AXES, levelWord, type AxisKey } from "@/lib/report";
import { EnergyIcon, FocusIcon, SleepIcon, StressIcon } from "@/components/ui/icons";

const W = 300;
const H = 268;
const CX = W / 2;
const CY = 136;
const R = 84;
const SAGE = "#739a72";

const ICONS: Record<AxisKey, React.ReactNode> = {
  mood: (
    <svg viewBox="0 0 24 24" width={20} height={20} aria-hidden>
      <path d="M12 20 C5 15 2.5 12 2.5 8.4 C2.5 5.7 4.6 3.8 7.1 3.8 C9 3.8 10.9 4.9 12 6.6 C13.1 4.9 15 3.8 16.9 3.8 C19.4 3.8 21.5 5.7 21.5 8.4 C21.5 12 19 15 12 20Z" fill="#f8c7cc" stroke="#e39aa3" strokeWidth="1.4" />
    </svg>
  ),
  energy: <EnergyIcon size={20} />,
  sleep: <SleepIcon size={20} />,
  focus: <FocusIcon size={20} />,
  ease: <StressIcon size={20} />,
};

const angle = (i: number) => (-90 + i * 72) * (Math.PI / 180);
const pt = (i: number, r: number) => [CX + Math.cos(angle(i)) * r, CY + Math.sin(angle(i)) * r] as const;

/**
 * 5-axis balance (averages on a 1–5 scale). Single series → one sage hue, no legend;
 * every axis also prints its value so nothing depends on reading the shape.
 */
export function BalanceRadar({ values }: { values: Record<AxisKey, number | null> }) {
  const [active, setActive] = useState<AxisKey | null>(null);
  const missing = AXES.filter((a) => values[a.key] == null);
  const hint = missing.length ? <p className="mt-2 text-center text-[11.5px] text-ink-300">{missing.map((a) => a.label).join(" · ")}도 기록하면 밸런스가 채워져요</p> : null;

  // a radar with fewer than 3 points collapses into a line — show plain bars instead
  if (AXES.length - missing.length < 3) {
    return (
      <div>
        <ul className="flex flex-col gap-2.5">
          {AXES.map((a) => {
            const v = values[a.key];
            return (
              <li key={a.key} className="grid grid-cols-[22px_64px_1fr_30px] items-center gap-2">
                {ICONS[a.key]}
                <span className="text-[13px] text-ink-700">{a.label}</span>
                <span className="h-2.5 overflow-hidden rounded-full bg-[#efe9de]">
                  {v != null && <span className="block h-full rounded-full" style={{ width: `${(v / 5) * 100}%`, background: SAGE }} />}
                </span>
                <span className="text-right text-[12.5px] tabular-nums text-ink-500">{v == null ? "–" : v.toFixed(1)}</span>
              </li>
            );
          })}
        </ul>
        {hint}
      </div>
    );
  }
  const pts = AXES.map((a, i) => pt(i, ((values[a.key] ?? 0) / 5) * R));
  const poly = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

  return (
    <div className="relative mx-auto w-full max-w-[320px]">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible" role="img" aria-label="주요 밸런스 차트">
        <defs>
          <radialGradient id="radarGlow">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx={CX} cy={CY} r={R + 18} fill="url(#radarGlow)" />
        {[1, 2, 3, 4, 5].map((lv) => (
          <polygon
            key={lv}
            points={AXES.map((_, i) => pt(i, (lv / 5) * R).join(",")).join(" ")}
            fill="none"
            stroke="#d9d0c1"
            strokeOpacity={lv === 5 ? 0.9 : 0.5}
            strokeWidth={1}
          />
        ))}
        {AXES.map((_, i) => {
          const [x, y] = pt(i, R);
          return <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke="#d9d0c1" strokeOpacity={0.6} strokeWidth={1} />;
        })}
        <motion.polygon
          key={poly}
          points={poly}
          fill={SAGE}
          fillOpacity={0.42}
          stroke={SAGE}
          strokeWidth={2}
          strokeLinejoin="round"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        />
        {AXES.map((a, i) => {
          if (values[a.key] == null) return null;
          const [x, y] = pts[i];
          return (
            <g key={a.key}>
              <circle cx={x} cy={y} r={active === a.key ? 6 : 4.5} fill={SAGE} stroke="#fdfbf6" strokeWidth={2} />
              {/* larger hit target */}
              <circle
                cx={x}
                cy={y}
                r={16}
                fill="transparent"
                onPointerEnter={() => setActive(a.key)}
                onPointerLeave={() => setActive(null)}
                onClick={() => setActive(active === a.key ? null : a.key)}
              />
            </g>
          );
        })}
      </svg>

      {AXES.map((a, i) => {
        const [x, y] = pt(i, R + 34);
        const v = values[a.key];
        return (
          <button
            key={a.key}
            type="button"
            onClick={() => setActive(active === a.key ? null : a.key)}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
            style={{ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%` }}
          >
            {ICONS[a.key]}
            <span className="whitespace-nowrap text-[12px] text-ink-700">{a.label}</span>
            <span className="text-[11px] tabular-nums text-ink-500">{v == null ? "–" : v.toFixed(1)}</span>
          </button>
        );
      })}

      {active && values[active] != null && (
        <div className="pointer-events-none absolute left-1/2 top-[50%] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white/95 px-3 py-1.5 text-center shadow-[0_6px_18px_-8px_rgba(80,60,40,0.5)]">
          <p className="text-[12px] text-ink-500">{AXES.find((a) => a.key === active)!.label}</p>
          <p className="text-[14px] font-bold tabular-nums text-ink-700">
            {values[active]!.toFixed(1)} <span className="text-[11.5px] font-normal text-ink-500">/ 5 · {levelWord(values[active]!)}</span>
          </p>
        </div>
      )}
      {hint}
    </div>
  );
}
