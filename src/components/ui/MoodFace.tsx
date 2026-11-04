import type { Level5 } from "@/lib/data-store";

export const MOODS: { value: Level5; label: string; mouth: string }[] = [
  { value: 1, label: "힘들어요", mouth: "M-6 5 Q0 -1 6 5" },
  { value: 2, label: "그저 그래요", mouth: "M-6 3.5 Q0 1.5 6 3.5" },
  { value: 3, label: "괜찮아요", mouth: "M-6 2 Q0 5 6 2" },
  { value: 4, label: "좋아요", mouth: "M-7 1 Q0 8 7 1" },
  { value: 5, label: "최고예요", mouth: "M-7 0 Q0 10 7 0 Z" },
];

/** Soft mood face. Inactive faces are calm grey; the chosen one glows warm. */
export function MoodFace({ value, active, size = 44 }: { value: Level5; active: boolean; size?: number }) {
  const m = MOODS[value - 1];
  const sad = value <= 2;
  return (
    <svg viewBox="-22 -22 44 44" width={size} height={size} aria-hidden>
      {active && <circle r={21.5} fill="#ffd9a0" opacity={0.55} />}
      <circle r={18} fill={active ? "#ffc56f" : "#efebf0"} stroke={active ? "#fff" : "#e2dce4"} strokeWidth={active ? 2 : 1.2} />
      {sad ? (
        <>
          <path d="M-10 -4 L-4.5 -6" stroke="#6b5a4c" strokeWidth={1.5} strokeLinecap="round" />
          <path d="M10 -4 L4.5 -6" stroke="#6b5a4c" strokeWidth={1.5} strokeLinecap="round" />
          <circle cx={-6} cy={-0.5} r={1.8} fill="#6b5a4c" />
          <circle cx={6} cy={-0.5} r={1.8} fill="#6b5a4c" />
        </>
      ) : (
        <>
          <circle cx={-6} cy={-3} r={1.9} fill="#6b5a4c" />
          <circle cx={6} cy={-3} r={1.9} fill="#6b5a4c" />
        </>
      )}
      <path
        d={m.mouth}
        transform="translate(0 5)"
        stroke="#6b5a4c"
        strokeWidth={1.8}
        fill={m.mouth.endsWith("Z") ? "#c9706e" : "none"}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {(active || value >= 4) && (
        <>
          <ellipse cx={-11} cy={4} rx={3.5} ry={2} fill="#f39a9a" opacity={active ? 0.75 : 0.35} />
          <ellipse cx={11} cy={4} rx={3.5} ry={2} fill="#f39a9a" opacity={active ? 0.75 : 0.35} />
        </>
      )}
    </svg>
  );
}
