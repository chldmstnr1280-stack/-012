import type { Metadata, Viewport } from "next";
import "@fontsource/gowun-dodum/400.css";
import "@fontsource/parisienne/400.css";
import "./globals.css";
import { SellyProvider } from "@/lib/selly-store";
import { MobileFrame } from "@/components/layout/MobileFrame";
import { PwaInit } from "@/components/layout/PwaInit";
import { IS_TOSS } from "@/lib/platform";

export const metadata: Metadata = {
  title: "Dear Selly · 디어셀리",
  description: "나를 돌보는, 작은 웰니스 정원 — Held, not healed.",
  applicationName: "디어셀리",
  // static file (public/) so the Toss static export works too
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "디어셀리", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f6eedb",
  // Toss review: no pinch zoom in a non-map mini-app
  ...(IS_TOSS ? { maximumScale: 1, userScalable: false } : {}),
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="antialiased">
      <body>
        {!IS_TOSS && <PwaInit />}
        <SellyProvider>
          <MobileFrame>{children}</MobileFrame>
        </SellyProvider>
      </body>
    </html>
  );
}
