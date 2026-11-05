"use client";

import { Fragment } from "react";
import { useRouter } from "next/navigation";

/**
 * Next 16 keeps visited routes alive (React <Activity>). Screens that must start
 * fresh on every visit (the greenhouse, a walk) are keyed by `bfcacheId`: a new
 * push/replace navigation remounts them, browser back/forward still restores.
 */
export function FreshOnNavigate({ children }: { children: React.ReactNode }) {
  const { bfcacheId } = useRouter();
  return <Fragment key={bfcacheId}>{children}</Fragment>;
}
