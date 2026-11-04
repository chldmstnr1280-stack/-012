import type { Metadata, Viewport } from "next";
import "@fontsource/gowun-dodum/400.css";
import "@fontsource/parisienne/400.css";
import "./globals.css";
import { SellyProvider } from "@/lib/selly-store";
import { MobileFrame } from "@/components/layout/MobileFrame";

export const metadata: Metadata = {
  title: "Dear Selly · 디어셀리",
  description: "나를 돌보는, 작은 웰니스 정원 — Held, not healed.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f6eedb",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="antialiased">
      <body>
        <SellyProvider>
          <MobileFrame>{children}</MobileFrame>
        </SellyProvider>
      </body>
    </html>
  );
}
