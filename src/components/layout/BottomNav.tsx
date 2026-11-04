"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { CalendarDays, ChartNoAxesColumn, House, NotebookText, type LucideIcon } from "lucide-react";
import { useSelly } from "@/lib/selly-store";

const items: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "홈", icon: House },
  { href: "/record", label: "기록", icon: NotebookText },
  { href: "/calendar", label: "캘린더", icon: CalendarDays },
  { href: "/report", label: "리포트", icon: ChartNoAxesColumn },
];

export function BottomNav() {
  const pathname = usePathname();
  const { immersive } = useSelly();

  return (
    <motion.nav
      aria-label="메인 메뉴"
      initial={false}
      animate={{ y: immersive ? 120 : 0, opacity: immersive ? 0 : 1 }}
      transition={{ type: "spring", stiffness: 220, damping: 30 }}
      className="absolute inset-x-2 bottom-2 z-40 pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="flex h-[68px] items-stretch rounded-[26px] border border-white/80 bg-[rgba(253,250,244,0.93)] px-2 shadow-[0_-6px_30px_-12px_rgba(110,88,60,0.35)] backdrop-blur-xl">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className="relative flex h-full flex-col items-center justify-center gap-1"
              >
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-x-3 inset-y-2 rounded-2xl bg-sage-50"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <Icon
                  className="relative"
                  size={24}
                  strokeWidth={1.7}
                  color={active ? "#6b9868" : "#a9a196"}
                  fill={active ? "#cfe3c6" : "none"}
                />
                <span className={`relative text-[11px] ${active ? "text-sage-700" : "text-ink-300"}`}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </motion.nav>
  );
}
