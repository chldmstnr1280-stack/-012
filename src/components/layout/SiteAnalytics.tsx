"use client";

import { Analytics } from "@vercel/analytics/next";

/**
 * Anonymous visit counts (Vercel Web Analytics, web build only — never in Toss).
 * Only the page path is sent: query strings and hashes are removed, and no
 * records, feelings or health data ever reach it. No cookies.
 */
export function SiteAnalytics() {
  return (
    <Analytics
      beforeSend={(event) => {
        try {
          const u = new URL(event.url);
          return { ...event, url: `${u.origin}${u.pathname}` };
        } catch {
          return null;
        }
      }}
    />
  );
}
