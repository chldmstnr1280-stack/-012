"use client";

import { Check, Download, Share, SquarePlus } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { promptInstall, useInstallState } from "@/lib/pwa";
import { useSelly } from "@/lib/selly-store";

export function InstallCard() {
  const state = useInstallState();
  const { showToast } = useSelly();
  if (state === "unknown") return null;

  return (
    <SectionCard
      icon={
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/icons/icon-192.png" alt="" className="h-7 w-7 rounded-lg" />
      }
      title="앱으로 설치하기"
    >
      {state === "installed" ? (
        <p className="flex items-center gap-2 text-[13.5px] text-ink-700">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-sage-500 text-white">
            <Check size={14} strokeWidth={3} />
          </span>
          홈 화면 앱으로 실행 중이에요.
        </p>
      ) : (
        <>
          <p className="text-[13px] leading-relaxed text-ink-500">
            홈 화면에 추가하면 주소창 없이 앱처럼 열리고, 인터넷이 없어도 셀리를 만날 수 있어요. 기기에 저장된 기록도 더 안전하게 지켜져요.
          </p>
          {state === "promptable" && (
            <button
              type="button"
              onClick={async () => {
                const ok = await promptInstall();
                if (ok) showToast("홈 화면에 디어셀리를 추가했어요");
              }}
              className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-[#9cc095] to-[#7ea47a] text-[14px] font-bold text-white shadow-[0_8px_20px_-10px_rgba(90,130,85,0.8)]"
            >
              <Download size={17} />
              홈 화면에 추가
            </button>
          )}
          {state === "ios" && (
            <ol className="mt-3 flex flex-col gap-2 rounded-2xl bg-white/65 p-3 text-[13px] text-ink-700">
              <li className="flex items-center gap-2">
                <b className="w-4 text-sage-700">1</b> Safari 아래쪽의 <Share size={16} className="text-[#3a82f7]" /> 공유 버튼을 눌러요
              </li>
              <li className="flex items-center gap-2">
                <b className="w-4 text-sage-700">2</b> <SquarePlus size={16} /> <b>홈 화면에 추가</b>를 골라요
              </li>
              <li className="flex items-center gap-2">
                <b className="w-4 text-sage-700">3</b> 오른쪽 위 <b>추가</b>를 누르면 끝!
              </li>
            </ol>
          )}
          {state === "other" && (
            <p className="mt-3 rounded-2xl bg-white/65 p-3 text-[12.5px] leading-relaxed text-ink-500">
              브라우저 메뉴(⋮)에서 <b className="text-ink-700">앱 설치</b> 또는 <b className="text-ink-700">홈 화면에 추가</b>를 눌러 주세요.
            </p>
          )}
        </>
      )}
    </SectionCard>
  );
}
