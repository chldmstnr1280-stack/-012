"use client";

import { Selly } from "@/components/selly/Selly";
import { SubPage } from "./SubPage";

export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <SubPage title={title}>
      <div className="glass mt-6 flex flex-col items-center rounded-[30px] px-6 pb-8 pt-4 text-center">
        <Selly className="w-[180px]" />
        <p className="mt-1 text-[17px] font-bold text-ink-700">준비 중이에요</p>
        <p className="mt-2 whitespace-pre-line text-[14px] leading-relaxed text-ink-500">{description}</p>
      </div>
    </SubPage>
  );
}
