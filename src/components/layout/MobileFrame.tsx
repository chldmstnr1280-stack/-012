"use client";

import { BottomNav } from "./BottomNav";
import { Toast } from "@/components/ui/Toast";

/**
 * Mobile-first shell. On phones it fills the viewport; on larger screens the
 * app is presented inside a 390px-wide device frame so the layout stays true
 * to the mobile design.
 */
export function MobileFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-[radial-gradient(ellipse_at_top,#f7efe3,#e4dccd)] sm:py-6">
      <div
        className="relative h-dvh w-full overflow-hidden bg-cream-50 sm:h-[844px] sm:max-h-[calc(100dvh-48px)] sm:w-[390px] sm:rounded-[44px] sm:shadow-[0_30px_80px_-20px_rgba(90,70,40,0.45),0_0_0_10px_#fbf8f2,0_0_0_11px_rgba(120,100,70,0.15)]"
        style={{ minHeight: 560 }}
      >
        {children}
        <BottomNav />
        <Toast />
      </div>
    </div>
  );
}
