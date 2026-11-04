/**
 * Duotone illustrated icons matching the reference's soft, hand-drawn style.
 * Lucide is used for the simple line icons (nav, bell, settings).
 */
type P = { className?: string; size?: number };

export function JournalIcon({ className, size = 36 }: P) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} className={className} aria-hidden>
      <rect x="9" y="5" width="22" height="30" rx="3.5" fill="#f6ecdc" stroke="#8a6f55" strokeWidth="1.6" />
      <rect x="9" y="5" width="5" height="30" rx="2" fill="#e8d6bd" stroke="#8a6f55" strokeWidth="1.6" />
      {[11, 17, 23, 29].map((y) => (
        <path key={y} d={`M7 ${y} h5`} stroke="#8a6f55" strokeWidth="1.6" strokeLinecap="round" />
      ))}
      <path d="M18 13 h9 M18 18 h9 M18 23 h6" stroke="#b49a7e" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M33.5 15 l2.5 2.5 -9 9 -3.4 0.9 0.9 -3.4z" fill="#c8deb8" stroke="#6f8f63" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

export function LotusIcon({ className, size = 46 }: P) {
  return (
    <svg viewBox="0 0 48 36" width={size} height={(size * 36) / 48} className={className} aria-hidden>
      <path d="M24 31 C 14 31 6 26 3 19 C 10 18 17 21 24 31Z" fill="#f9dfe2" stroke="#fff" strokeWidth="1.2" />
      <path d="M24 31 C 34 31 42 26 45 19 C 38 18 31 21 24 31Z" fill="#f9dfe2" stroke="#fff" strokeWidth="1.2" />
      <path d="M24 31 C 14 27 10 18 12 9 C 19 13 23 21 24 31Z" fill="#fbe8ea" stroke="#fff" strokeWidth="1.2" />
      <path d="M24 31 C 34 27 38 18 36 9 C 29 13 25 21 24 31Z" fill="#fbe8ea" stroke="#fff" strokeWidth="1.2" />
      <path d="M24 31 C 18 24 18 12 24 3 C 30 12 30 24 24 31Z" fill="#fff4f5" stroke="#fff" strokeWidth="1.2" />
      <path d="M24 9 V27" stroke="#f1c1c7" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

export function WateringCanIcon({ className, size = 38 }: P) {
  return (
    <svg viewBox="0 0 44 40" width={size} height={(size * 40) / 44} className={className} aria-hidden>
      <path d="M12 13 C 12 6 26 6 26 13" stroke="#7c6a55" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M8 14 h22 l-2 20 a3 3 0 0 1 -3 3 h-12 a3 3 0 0 1 -3 -3z" fill="#bcd6b6" stroke="#6b8c66" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M8 14 h22" stroke="#6b8c66" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M29 22 L39 12" stroke="#6b8c66" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M37 9 l5 5 -2.5 1.5 -4 -4z" fill="#a4c49d" stroke="#6b8c66" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M8 22 C 2 22 2 31 9 30" stroke="#6b8c66" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M13 18 v12" stroke="#fff" strokeOpacity="0.65" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function SunIcon({ className, size = 34 }: P) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} className={className} aria-hidden>
      {Array.from({ length: 8 }, (_, i) => (
        <path key={i} d="M20 3 v5" stroke="#f2c76a" strokeWidth="2.4" strokeLinecap="round" transform={`rotate(${i * 45} 20 20)`} />
      ))}
      <circle cx="20" cy="20" r="9" fill="#ffe4a0" stroke="#efbe5c" strokeWidth="1.6" />
      <circle cx="17" cy="17" r="2.5" fill="#fff6d6" />
    </svg>
  );
}

export function HandHeartIcon({ className, size = 34 }: P) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} className={className} aria-hidden>
      <path d="M20 33 C 10 26 5 21 5 14.5 C 5 10 8.5 7 12.5 7 C 15.6 7 18.4 8.8 20 11.5 C 21.6 8.8 24.4 7 27.5 7 C 31.5 7 35 10 35 14.5 C 35 21 30 26 20 33Z" fill="#f8c7cc" stroke="#e39aa3" strokeWidth="1.6" />
      <path d="M12 13 C 12.5 11 14 10 15.5 10" stroke="#fff" strokeOpacity="0.8" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function SproutBadgeIcon({ className, size = 30 }: P) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden>
      <path d="M16 28 V15" stroke="#6f9a62" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 16 C 8 16 5 11 6 6 C 12 6 16 9 16 16Z" fill="#a9cf87" stroke="#6f9a62" strokeWidth="1.3" />
      <path d="M16 13 C 22 13 26 9 26 4 C 20 4 16 7 16 13Z" fill="#c7e2a5" stroke="#6f9a62" strokeWidth="1.3" />
      <path d="M9 28 h14" stroke="#c9b18f" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function LeafBadgeIcon({ className, size = 28 }: P) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden>
      <path d="M6 26 C 4 14 12 5 27 5 C 28 19 20 27 6 26Z" fill="#a8cd88" stroke="#6b9660" strokeWidth="1.4" />
      <path d="M7 25 C 12 19 17 14 23 9" stroke="#eef7dc" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M13 19 l-1 -5 M17 15 l-0.5 -4.5 M15 17 l5 1 M19 13 l5 0.5" stroke="#eef7dc" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

/* ---------- Phase 2: record & cycle icons ---------- */

export function SmileIcon({ className, size = 24 }: P) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden>
      <circle cx="12" cy="12" r="9.5" fill="#ffd77e" stroke="#e8b04f" strokeWidth="1.2" />
      <circle cx="9" cy="10.5" r="1.1" fill="#7a5532" />
      <circle cx="15" cy="10.5" r="1.1" fill="#7a5532" />
      <path d="M8.5 14 Q12 17.5 15.5 14" stroke="#7a5532" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <ellipse cx="7" cy="13.5" rx="1.6" ry="1" fill="#f6a7a0" opacity="0.7" />
      <ellipse cx="17" cy="13.5" rx="1.6" ry="1" fill="#f6a7a0" opacity="0.7" />
    </svg>
  );
}

export function SproutLeafIcon({ className, size = 24 }: P) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden>
      <path d="M12 21 V12" stroke="#6f9a62" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M12 13 C 5 13 3 8 4 4 C 9 4 12 7 12 13Z" fill="#b9d89a" stroke="#6f9a62" strokeWidth="1.2" />
      <path d="M12 11 C 18 11 21 7 20 3 C 15 3 12 6 12 11Z" fill="#d5e9bd" stroke="#6f9a62" strokeWidth="1.2" />
    </svg>
  );
}

export function SneakerIcon({ className, size = 24 }: P) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden>
      <path d="M3 15.5 C 3 12 4 9 5.5 8 L 9 10 C 11 11.5 14 12.5 17 13 C 20 13.5 21 15 21 16.5 V17.5 H3Z" fill="#f6e3d8" stroke="#a37a63" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M3 17.5 H21" stroke="#a37a63" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M8.5 11 l1.2 -1.3 M10.6 12 l1.2 -1.3 M12.7 12.8 l1.2 -1.3" stroke="#a37a63" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

export function NoteIcon({ className, size = 24 }: P) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden>
      <path d="M5 4.5 H15 L19 8.5 V19.5 H5Z" fill="#f8efe2" stroke="#a5866a" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M15 4.5 V8.5 H19" fill="#ead9c2" stroke="#a5866a" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M8 12 H15 M8 15 H13" stroke="#c4a98d" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function DropIcon({ className, size = 24 }: P) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden>
      <path d="M12 3 C 15 8 18.5 11 18.5 15 C 18.5 18.6 15.6 21 12 21 C 8.4 21 5.5 18.6 5.5 15 C 5.5 11 9 8 12 3Z" fill="#ee8f99" stroke="#d76a77" strokeWidth="1.2" />
      <ellipse cx="9.6" cy="14.5" rx="1.3" ry="2.4" fill="#fff" opacity="0.7" />
    </svg>
  );
}

export function EnergyIcon({ className, size = 26 }: P) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden>
      <path d="M13.5 2.5 L5.5 13.5 H11 L10 21.5 L18.5 10 H13Z" fill="#ffd36e" stroke="#e1a63a" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

export function SleepIcon({ className, size = 26 }: P) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden>
      <path d="M15.5 3.5 A8.5 8.5 0 1 0 20.5 15 A7 7 0 0 1 15.5 3.5Z" fill="#d9d2f2" stroke="#8f7fd6" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

export function FocusIcon({ className, size = 26 }: P) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden>
      <circle cx="12" cy="13" r="7.5" fill="#fbe0e3" stroke="#d98a95" strokeWidth="1.3" />
      <path d="M12 9 V13 L14.5 15" stroke="#c46f7b" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      <path d="M4.5 6 L7 3.8 M19.5 6 L17 3.8" stroke="#d98a95" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function StressIcon({ className, size = 26 }: P) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden>
      <path d="M7 18 A4 4 0 0 1 6.5 10 A5.5 5.5 0 0 1 17 9 A4.5 4.5 0 0 1 17.5 18Z" fill="#fde3e1" stroke="#df8f8a" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M9 14 q1.5 -1.6 3 0 t3 0" stroke="#df8f8a" strokeWidth="1.3" fill="none" strokeLinecap="round" />
    </svg>
  );
}
