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
