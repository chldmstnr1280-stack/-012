"use client";

import { motion } from "motion/react";
import { useId } from "react";

export function SegmentedTabs<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  const id = useId();
  return (
    <div role="tablist" aria-label={label} className="glass flex rounded-full p-1.5">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={`relative h-10 flex-1 rounded-full text-[14.5px] transition-colors ${active ? "text-white" : "text-ink-500"}`}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-full bg-gradient-to-b from-[#9cc095] to-[#79a175] shadow-[0_6px_14px_-6px_rgba(90,130,85,0.8),inset_0_1px_0_rgba(255,255,255,0.35)]"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative font-bold">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
