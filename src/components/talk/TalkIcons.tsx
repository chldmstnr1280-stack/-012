import type { TalkIcon } from "@/data/sellyConversations";
import { SunIcon, SleepIcon } from "@/components/ui/icons";

/** Small duotone icons for conversation choices (same family as the app's other icons). */
export function TalkIconView({ icon, size = 26 }: { icon: TalkIcon; size?: number }) {
  switch (icon) {
    case "sun":
      return <SunIcon size={size} />;
    case "moon":
      return <SleepIcon size={size} />;
    case "leaf":
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
          <path d="M5 19 C 3.5 11 9 4.5 19.5 4 C 20.5 14 14.5 20 5 19Z" fill="#a8cd88" stroke="#6b9660" strokeWidth="1.3" />
          <path d="M6 18 C 10 14 13.5 10.5 17 7" stroke="#eef7dc" strokeWidth="1.4" strokeLinecap="round" fill="none" />
        </svg>
      );
    case "cloud":
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
          <path d="M7 18 A4 4 0 0 1 6.5 10 A5.5 5.5 0 0 1 17 9.2 A4.4 4.4 0 0 1 17.4 18Z" fill="#e7e2f4" stroke="#a99ccc" strokeWidth="1.3" strokeLinejoin="round" />
          <ellipse cx="10" cy="12" rx="2.6" ry="1.4" fill="#fff" opacity="0.8" />
        </svg>
      );
    case "heart":
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
          <path d="M12 20 C 5 15 2.5 12 2.5 8.4 C 2.5 5.7 4.6 3.8 7.1 3.8 C 9 3.8 10.9 4.9 12 6.6 C 13.1 4.9 15 3.8 16.9 3.8 C 19.4 3.8 21.5 5.7 21.5 8.4 C 21.5 12 19 15 12 20Z" fill="#f8c7cc" stroke="#e39aa3" strokeWidth="1.3" />
        </svg>
      );
    case "wind":
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
          <circle cx="12" cy="12" r="9" fill="#e6f1ec" />
          <path d="M5 10 H14 A2.5 2.5 0 1 0 11.5 7.5 M5 14 H17 A2.5 2.5 0 1 1 14.5 16.5" stroke="#6f9a8a" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </svg>
      );
    case "pen":
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
          <path d="M5 4.5 H15 L19 8.5 V19.5 H5Z" fill="#f8efe2" stroke="#a5866a" strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M8 12 H15 M8 15 H12.5" stroke="#c4a98d" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M18.5 10.5 l2 2 -6.5 6.5 -2.7 0.7 0.7 -2.7z" fill="#c8deb8" stroke="#6f8f63" strokeWidth="1.1" strokeLinejoin="round" />
        </svg>
      );
    case "sparkle":
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
          <path d="M12 2 C13 9 15 11 22 12 C15 13 13 15 12 22 C11 15 9 13 2 12 C9 11 11 9 12 2Z" fill="#ffe7a3" stroke="#e8bf5b" strokeWidth="1.1" />
        </svg>
      );
  }
}
