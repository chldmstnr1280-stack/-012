"use client";

import { motion } from "motion/react";

export type BurstKind = "sparkle" | "heart" | "water" | "sun";

function Star({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full">
      <path d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0Z" fill={color} />
    </svg>
  );
}

function Heart({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full">
      <path d="M12 21 C5 15.5 1.5 12 1.5 7.8 C1.5 4.8 3.9 2.5 6.8 2.5 C8.9 2.5 10.9 3.7 12 5.5 C13.1 3.7 15.1 2.5 17.2 2.5 C20.1 2.5 22.5 4.8 22.5 7.8 C22.5 12 19 15.5 12 21Z" fill={color} />
    </svg>
  );
}

function Drop() {
  return (
    <svg viewBox="0 0 24 32" className="h-full w-full">
      <path d="M12 1 C16 9 22 15 22 21 C22 27 17.5 31 12 31 C6.5 31 2 27 2 21 C2 15 8 9 12 1Z" fill="#cfe7f4" stroke="#9cc8de" strokeWidth={1.5} />
      <ellipse cx={8.5} cy={20} rx={2.2} ry={4} fill="#fff" opacity={0.8} />
    </svg>
  );
}

/** One-shot particle burst around Selly. Re-mount with a new key to replay. */
export function SellyBurst({ kind }: { kind: BurstKind }) {
  if (kind === "water") {
    return (
      <div className="pointer-events-none absolute inset-0">
        {[-0.18, -0.06, 0.06, 0.17, 0].map((x, i) => (
          <motion.span
            key={i}
            className="absolute h-[18px] w-[13px]"
            style={{ left: `${50 + x * 100}%`, top: "-6%" }}
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: [-30, 60 + i * 6], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 0.9, delay: i * 0.12, ease: "easeIn" }}
          >
            <Drop />
          </motion.span>
        ))}
        <Sparkles count={6} colors={["#d8f0c6", "#ffffff", "#bfe2ef"]} radius={0.42} delay={0.7} />
      </div>
    );
  }
  if (kind === "sun") {
    return (
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute inset-[-10%] rounded-full bg-[radial-gradient(circle,rgba(255,236,170,0.75),rgba(255,226,150,0)_65%)]"
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: [0, 1, 0], scale: [0.7, 1.15, 1.3] }}
          transition={{ duration: 1.8, ease: "easeOut" }}
        />
        <Sparkles count={8} colors={["#ffe9a8", "#fff6d6", "#ffd98a"]} radius={0.5} />
      </div>
    );
  }
  if (kind === "heart") {
    return (
      <div className="pointer-events-none absolute inset-0">
        {[-0.22, 0.2, -0.05, 0.08].map((x, i) => (
          <motion.span
            key={i}
            className="absolute"
            style={{ left: `${50 + x * 100}%`, top: "30%", width: 14 + (i % 2) * 6, height: 14 + (i % 2) * 6 }}
            initial={{ opacity: 0, y: 0, scale: 0.4 }}
            animate={{ opacity: [0, 1, 0], y: -70 - i * 10, scale: 1, x: (i % 2 ? 1 : -1) * 10 }}
            transition={{ duration: 1.6, delay: i * 0.15, ease: "easeOut" }}
          >
            <Heart color={i % 2 ? "#f5a9b1" : "#f8c4c9"} />
          </motion.span>
        ))}
        <Sparkles count={5} colors={["#fff3d1", "#ffd7dc"]} radius={0.45} />
      </div>
    );
  }
  return <Sparkles count={8} colors={["#fff4c9", "#ffffff", "#ffe0e6", "#e5f3d4"]} radius={0.5} />;
}

function Sparkles({ count, colors, radius, delay = 0 }: { count: number; colors: string[]; radius: number; delay?: number }) {
  return (
    <div className="pointer-events-none absolute inset-0">
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 - Math.PI / 2 + (i % 2) * 0.3;
        const dist = radius * (0.85 + (i % 3) * 0.12);
        const size = 10 + (i % 3) * 5;
        return (
          <motion.span
            key={i}
            className="absolute"
            style={{ width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2 }}
            initial={{ opacity: 0, scale: 0, left: "50%", top: "55%", rotate: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0.6],
              left: `${50 + Math.cos(angle) * dist * 100}%`,
              top: `${55 + Math.sin(angle) * dist * 100}%`,
              rotate: 90,
            }}
            transition={{ duration: 1.1, delay: delay + (i % 4) * 0.05, ease: "easeOut" }}
          >
            <Star color={colors[i % colors.length]} />
          </motion.span>
        );
      })}
    </div>
  );
}
